---
name: wasm-performance
description: Set up and run .NET WASM micro-benchmarks locally using the same CI scripts that the dotnet/performance pipeline uses. Use when investigating WASM performance regressions, running browser-wasm benchmarks, building runtime with WASM support, patching BenchmarkDotNet for new .NET versions, or reproducing CI benchmark results locally.
---

# WASM Performance Investigation Setup

Set up and run .NET WASM micro-benchmarks locally using the same CI scripts that the dotnet/performance pipeline uses. This skill covers building the runtime with WASM support, configuring the performance repo, optionally patching BenchmarkDotNet for newest .NET versions, and executing benchmarks.

## Prerequisites

| Requirement | Details |
|---|---|
| OS | Linux (Ubuntu preferred) |
| Repos | `dotnet/runtime` cloned to `/workspaces/runtime` |
| Disk | ~30 GB free (runtime build artifacts are large) |
| Time | Phase 1 build takes 30-60 min; subsequent phases are fast |

The workspace should already have the `dotnet/runtime` repo. The `dotnet/performance` and `dotnet/BenchmarkDotNet` repos will be cloned as needed.

## Inputs

The user should provide (or you should ask for) these values:

| Parameter | Example | Required | Description |
|---|---|---|---|
| `RUNTIME_REPO` | `/workspaces/runtime` | Yes | Path to dotnet/runtime checkout |
| `PERF_REPO` | `/workspaces/performance` | Yes | Path to dotnet/performance checkout (will clone if missing) |
| `TARGET_TFM` | `net11.0` | Yes | Target framework moniker to benchmark |
| `BENCHMARK_FILTER` | `System.Tests.Perf_Boolean.Parse` | Yes | BDN filter expression for which benchmarks to run |
| `BDN_EXTRA_ARGS` | `--iterationCount 1 --warmupCount 0` | No | Extra BDN arguments (useful for quick smoke tests) |
| `NEED_LOCAL_BDN` | `true`/`false` | No | Whether to build BDN from source (required for .NET versions not yet supported by released BDN) |
| `BDN_REPO` | `/workspaces/bdn-local` | No | Path to dotnet/BenchmarkDotNet checkout (if building locally) |
| `KEEP_FILES` | `true`/`false` | No | Pass `--keepFiles` to preserve generated projects for debugging |

## Phases

Execute the phases below **in order**. Each phase has verification steps — do not proceed until verification passes.

---

### Phase 1: Build Runtime with WASM Support

**Goal:** Produce a local .NET SDK with WASM workloads installed + NuGet packages for the dev runtime version.

```bash
cd $RUNTIME_REPO

# Build mono + libs + host + packs for browser-wasm (30-60 min)
./build.sh -s mono+libs+host+packs -c Release

# Install WASM workload into the local SDK
./dotnet.sh build \
    -p:TargetOS=browser -p:TargetArchitecture=wasm \
    -p:Configuration=Release -p:RuntimeFlavor=Mono \
    /t:InstallWorkloadUsingArtifacts \
    ./src/mono/wasm/Wasm.Build.Tests/Wasm.Build.Tests.csproj
```

**Verification — all must pass:**

```bash
# 1. SDK exists and runs
$RUNTIME_REPO/artifacts/bin/dotnet-latest/dotnet --version

# 2. WASM workloads are installed
$RUNTIME_REPO/artifacts/bin/dotnet-latest/dotnet workload list
# Expected: wasm-tools, wasm-experimental listed

# 3. Required NuGet packages exist
ls $RUNTIME_REPO/artifacts/packages/Release/Shipping/ | grep -E "(App\.Ref|Mono\.browser-wasm)"
# Expected: Microsoft.NETCore.App.Ref.*.nupkg and Microsoft.NETCore.App.Runtime.Mono.browser-wasm.*.nupkg
```

**Artifacts produced:**
- `$RUNTIME_REPO/artifacts/bin/dotnet-latest/` — SDK with WASM workloads
- `$RUNTIME_REPO/artifacts/packages/Release/Shipping/` — NuGet packages including:
  - `Microsoft.NETCore.App.Ref.<version>.nupkg` (targeting pack)
  - `Microsoft.NETCore.App.Runtime.Mono.browser-wasm.<version>.nupkg` (runtime pack)
  - `Microsoft.NET.Sdk.WebAssembly.Pack.*.nupkg` (WebAssembly SDK)

---

### Phase 2: Set Up Performance Repo

**Goal:** Clone dotnet/performance and configure NuGet sources to find the locally-built runtime packages.

```bash
# Clone if not present
if [ ! -d "$PERF_REPO" ]; then
    git clone https://github.com/dotnet/performance.git $PERF_REPO
fi
cd $PERF_REPO

# Add local runtime packages as a NuGet source
# (BDN generates projects that reference Microsoft.NETCore.App.Ref at the dev version —
#  this package only exists in your local build artifacts, not in any public feed)
dotnet nuget add source $RUNTIME_REPO/artifacts/packages/Release/Shipping --name local-runtime-packages
```

**Verification:**

```bash
cd $PERF_REPO && dotnet nuget list source | grep -i local-runtime
# Expected: "local-runtime-packages" source listed and enabled
```

> **Why this matters:** Without this source, restore will fail with `NU1102: Unable to find Microsoft.NETCore.App.Ref <version>`.

---

### Phase 3: (Conditional) Build BenchmarkDotNet from Source

**When needed:** The released BDN on public feeds doesn't support the target .NET version. This is common when benchmarking a .NET version that is still in development. Symptoms:

- `Assembly weaving failed... unsupported .NET or .NET Core version X.0` — AsmResolver in BDN's weaver doesn't know the TFM
- `Benchmarked method does not have MethodImplOptions.NoInlining` — weaver silently failed, so BDN refuses to run

**Skip this phase** if benchmarks work without it (try Phase 4 first and come back here on failure).

#### 3a. Clone and Patch BDN

```bash
if [ ! -d "$BDN_REPO" ]; then
    git clone https://github.com/dotnet/BenchmarkDotNet.git $BDN_REPO
fi
cd $BDN_REPO
```

#### 3b. Fix AsmResolver for Newest .NET Versions

AsmResolver has hardcoded version switches. The nightly feed has fixes for newer versions.

> **Quick Option for net11 support:** A ready-to-use patch file is available in this skill directory: `use-asmresolver-nightly.patch`. Apply it from the BDN repo root with:
> ```bash
> git apply /path/to/use-asmresolver-nightly.patch
> ```
> This patch performs all three steps below automatically (adds nightly feed, updates AsmResolver version, and increments WeaverVersionSuffix).

1. **Add nightly feed** — ensure `NuGet.Config` in `$BDN_REPO` has:
   ```xml
   <add key="asmresolver-nightly" value="https://nuget.washi.dev/v3/index.json" />
   ```

2. **Update AsmResolver version** in `src/BenchmarkDotNet.Weaver/BenchmarkDotNet.Weaver.csproj`:
   ```xml
   <PackageReference Include="AsmResolver.DotNet" Version="6.0.0-development.358" PrivateAssets="all" />
   ```
   (Check https://nuget.washi.dev for the latest nightly version if `358` is stale.)

3. **Increment `WeaverVersionSuffix`** in `build/common.props` — change the numeric suffix (e.g., `-1` → `-2`) so the new weaver DLL gets embedded into the Annotations package.

#### 3c. Build and Pack BDN

```bash
cd $BDN_REPO
./build/build.sh pack
```

**Verification:**

```bash
ls $BDN_REPO/artifacts/*.nupkg | head -5
# Expected: BenchmarkDotNet.0.16.0-develop.nupkg (or similar)
```

#### 3d. Wire Local BDN into Performance Repo

```bash
cd $PERF_REPO

# Add BDN artifacts as NuGet source
dotnet nuget add source $BDN_REPO/artifacts --name bdn-local-build

# Update performance repo to reference the local BDN version
# Read the version from the built nupkg filename:
BDN_VERSION=$(ls $BDN_REPO/artifacts/BenchmarkDotNet.*.nupkg | head -1 | sed 's/.*BenchmarkDotNet\.\(.*\)\.nupkg/\1/')
sed -i "s|<BenchmarkDotNetVersion>.*</BenchmarkDotNetVersion>|<BenchmarkDotNetVersion>${BDN_VERSION}</BenchmarkDotNetVersion>|" eng/Versions.props

# Clear cached BDN packages so the new ones are picked up
rm -rf ~/.nuget/packages/benchmarkdotnet*
```

**Verification:**

```bash
grep BenchmarkDotNetVersion $PERF_REPO/eng/Versions.props
# Expected: <BenchmarkDotNetVersion>0.16.0-develop</BenchmarkDotNetVersion> (matches built version)

dotnet nuget list source | grep bdn-local
# Expected: bdn-local-build source listed
```

---

### Phase 4: Run Benchmarks

**Goal:** Execute benchmarks using the same Python script CI uses.

```bash
cd $PERF_REPO

python3 scripts/benchmarks_ci.py \
    --csproj src/benchmarks/micro/MicroBenchmarks.csproj \
    --incremental no \
    --architecture x64 \
    -f $TARGET_TFM \
    --dotnet-path $RUNTIME_REPO/artifacts/bin/dotnet-latest \
    --wasm \
    --filter "$BENCHMARK_FILTER" \
    --bdn-arguments "$BDN_EXTRA_ARGS"
```

Add `--keepFiles` if you want to inspect generated BDN projects after the run.

**What the script does automatically:**
- Sets `DOTNET_ROOT` and `PATH` to the local SDK
- Sets `PERFLAB_TARGET_FRAMEWORKS=$TARGET_TFM`
- Sets `DOTNET_CLI_TELEMETRY_OPTOUT=1` and `DOTNET_MULTILEVEL_LOOKUP=0`
- Restores with correct package paths
- Builds with `/p:BuildingForWasm=true`
- Runs BDN with `--runtimes wasmnet<version>` (mapped from TFM)

**Verification:** The script exits 0 and benchmark results appear in the terminal output and in `$PERF_REPO/BenchmarkDotNet.Artifacts/`.

---

## Troubleshooting Guide

Use this table to diagnose common failures. Match the error text and apply the fix.

| Error / Symptom | Cause | Fix |
|---|---|---|
| `NU1102: Unable to find Microsoft.NETCore.App.Ref <version>` | Local runtime packages NuGet source is missing | Run `dotnet nuget add source $RUNTIME_REPO/artifacts/packages/Release/Shipping --name local-runtime-packages` in `$PERF_REPO` |
| `NETSDK1112: The runtime pack ... was not found` | WASM workload not installed or NuGet source missing | Re-run the workload install step in Phase 1; verify NuGet source in Phase 2 |
| `PermissionError: [Errno 1] Operation not permitted: ... chmod` | SDK on a filesystem that doesn't support chmod (e.g., Windows mount) | Copy SDK to a native Linux path: `cp -r $RUNTIME_REPO/artifacts/bin/dotnet-latest /tmp/dotnet-latest` and use `/tmp/dotnet-latest` as `--dotnet-path` |
| Wrong TFM restored / built | `PERFLAB_TARGET_FRAMEWORKS` not set | The `benchmarks_ci.py` script sets this automatically. If running manually, `export PERFLAB_TARGET_FRAMEWORKS=$TARGET_TFM` |
| Old packages cached | NuGet cache has stale packages from a previous build | `rm -rf ~/.nuget/packages/microsoft.netcore.app*` and retry |
| `Assembly weaving failed... unsupported .NET or .NET Core version X.0` | AsmResolver in BDN doesn't support the target .NET version | Apply Phase 3 (build BDN from source with nightly AsmResolver) |
| `Benchmarked method does not have MethodImplOptions.NoInlining` | Same as above — weaver silently failed | Apply Phase 3; also `rm -rf ~/.nuget/packages/benchmarkdotnet*` to clear cache |
| `DllGatherer.csproj` restore fails with missing packages | BDN-generated project can't find runtime packs | Ensure `local-runtime-packages` NuGet source is configured (Phase 2) — it's needed for both the main build AND the BDN-generated projects |
| Build hangs or OOMs | Runtime build is resource-intensive | Use `./build.sh -s mono+libs+host+packs -c Release /p:UseMonoRuntime=true` or limit parallelism with `/maxcpucount:4` |

## How CI Differs from Local

Understanding CI vs local helps debug discrepancies:

| Aspect | CI Pipeline | Local (this skill) |
|---|---|---|
| Runtime artifacts | Downloaded from Azure Pipeline artifact drop | Built locally via `./build.sh` |
| NuGet packages | Copied to `built-nugets/` folder as a source | `dotnet nuget add source` pointing at `artifacts/packages/Release/Shipping` |
| BenchmarkDotNet | Custom version from `benchmark-dotnet-prerelease` feed | Same feed, or locally-built BDN (Phase 3) |
| SDK | Extracted from pipeline with workloads pre-installed | Built and workload installed via `InstallWorkloadUsingArtifacts` target |
| Environment | Helix agents | Dev container / local machine |

## Quick Smoke Test

For a fast end-to-end validation, use a trivial benchmark with minimal iterations:

```bash
python3 scripts/benchmarks_ci.py \
    --csproj src/benchmarks/micro/MicroBenchmarks.csproj \
    --incremental no \
    --architecture x64 \
    -f net11.0 \
    --dotnet-path /workspaces/runtime/artifacts/bin/dotnet-latest \
    --wasm \
    --filter "System.Tests.Perf_Boolean.Parse" \
    --bdn-arguments "--iterationCount 1 --warmupCount 0"
```

This runs a single boolean-parsing benchmark with 1 iteration and no warmup — completes in minutes and validates the entire pipeline.

## Key Files Reference

| File | Repo | Purpose |
|---|---|---|
| `scripts/benchmarks_ci.py` | performance | Main entry point — orchestrates restore, build, and run |
| `scripts/micro_benchmarks.py` | performance | Build/run logic, WASM runtime mapping |
| `scripts/dotnet.py` | performance | SDK setup, `DOTNET_ROOT` configuration |
| `eng/Versions.props` | performance | BDN version and other package versions |
| `NuGet.config` | performance | Package source configuration |
| `src/BenchmarkDotNet.Weaver/BenchmarkDotNet.Weaver.csproj` | BenchmarkDotNet | AsmResolver dependency (patch for new .NET versions) |
| `build/common.props` | BenchmarkDotNet | `WeaverVersionSuffix` — increment when patching weaver |
| `src/mono/wasm/Wasm.Build.Tests/Wasm.Build.Tests.csproj` | runtime | Target for `InstallWorkloadUsingArtifacts` |
