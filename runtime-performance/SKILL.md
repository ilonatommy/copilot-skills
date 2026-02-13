```skill
---
name: runtime-performance
description: Set up and run .NET micro-benchmarks locally using the same CI scripts that the dotnet/performance pipeline uses. Supports both CoreCLR and WASM (Mono) runtimes. Use when investigating performance regressions, running micro-benchmarks, building the runtime for benchmarking, patching BenchmarkDotNet for new .NET versions, or reproducing CI benchmark results locally.
---

# Runtime Performance Investigation Setup

Set up and run .NET micro-benchmarks locally using the same CI scripts that the dotnet/performance pipeline uses. This skill supports two runtime flavors — **CoreCLR** and **WASM (Mono)** — selected via the `RUNTIME_FLAVOR` parameter. It covers building the runtime, configuring the performance repo, optionally patching BenchmarkDotNet for newest .NET versions, and executing benchmarks.

## Prerequisites

| Requirement | Details |
|---|---|
| OS | Linux (Ubuntu preferred) |
| Repos | `dotnet/runtime` cloned to `/workspaces/runtime` |
| Disk | ~20 GB free (CoreCLR) or ~30 GB (WASM) |
| Time | Phase 1: 15-30 min (CoreCLR) or 30-60 min (WASM); subsequent phases are fast |

The workspace should already have the `dotnet/runtime` repo. The `dotnet/performance` and `dotnet/BenchmarkDotNet` repos will be cloned as needed.

## Inputs

The user should provide (or you should ask for) these values:

| Parameter | Example | Required | Description |
|---|---|---|---|
| `RUNTIME_FLAVOR` | `coreclr` or `wasm` | Yes | Which runtime to benchmark |
| `RUNTIME_REPO` | `/workspaces/runtime` | Yes | Path to dotnet/runtime checkout |
| `PERF_REPO` | `/workspaces/performance` | Yes | Path to dotnet/performance checkout (will clone if missing) |
| `TARGET_TFM` | `net11.0` | Yes | Target framework moniker to benchmark |
| `BENCHMARK_FILTER` | `System.Tests.Perf_Boolean.Parse` | Yes | BDN filter expression for which benchmarks to run |
| `ARCHITECTURE` | `x64` | No | Target architecture (default: `x64`; also `arm64`) |
| `BDN_EXTRA_ARGS` | `--iterationCount 1 --warmupCount 0` | No | Extra BDN arguments (useful for quick smoke tests) |
| `NEED_LOCAL_BDN` | `true`/`false` | No | Whether to build BDN from source (required for .NET versions not yet supported by released BDN) |
| `BDN_REPO` | `/workspaces/bdn-local` | No | Path to dotnet/BenchmarkDotNet checkout (if building locally) |
| `KEEP_FILES` | `true`/`false` | No | Pass `--keepFiles` to preserve generated projects for debugging |

## Phases

Execute the phases below **in order**. Each phase has verification steps — do not proceed until verification passes.

---

### Phase 1: Build the Runtime

---

#### If `RUNTIME_FLAVOR=coreclr`

**Goal:** Build the CoreCLR runtime and libraries, then generate `Core_Root` — a flat directory containing `corerun` and all required framework libraries.

##### 1a. Build CoreCLR + Libraries

```bash
cd $RUNTIME_REPO

# Build CoreCLR + libs in Release (15-30 min)
./build.sh clr+libs -c Release
```

This is the same command CI uses (see `eng/pipelines/performance/templates/perf-coreclr-build-jobs.yml`).

##### 1b. Generate Core_Root Layout

```bash
cd $RUNTIME_REPO

# Generate Core_Root — assembles corerun + all framework DLLs into one directory
./src/tests/build.sh release $ARCHITECTURE generatelayoutonly /p:LibrariesConfiguration=Release
```

**Verification — all must pass:**

```bash
# 1. corerun binary exists
CORE_ROOT=$RUNTIME_REPO/artifacts/tests/coreclr/linux.$ARCHITECTURE.Release/Tests/Core_Root
ls -la $CORE_ROOT/corerun
# Expected: executable file

# 2. Core libraries are present
ls $CORE_ROOT/System.Private.CoreLib.dll $CORE_ROOT/System.Runtime.dll
# Expected: both files exist

# 3. corerun is functional
$CORE_ROOT/corerun --help
# Expected: prints usage/help
```

**Artifacts produced:**
- `$RUNTIME_REPO/artifacts/tests/coreclr/linux.$ARCHITECTURE.Release/Tests/Core_Root/` — directory containing:
  - `corerun` — the CoreCLR host executable
  - `System.Private.CoreLib.dll` and all framework libraries
  - `libcoreclr.so` — the runtime itself

> **Alternative path (testhost):** A `corerun` is also available at
> `$RUNTIME_REPO/artifacts/bin/testhost/$TARGET_TFM-linux-Release-$ARCHITECTURE/shared/Microsoft.NETCore.App/<version>/corerun`
> after `./build.sh clr+libs -c Release`. However, `Core_Root` is the path CI uses and is recommended.

---

#### If `RUNTIME_FLAVOR=wasm`

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

**Goal:** Clone dotnet/performance and (for WASM only) configure NuGet sources.

```bash
# Clone if not present
if [ ! -d "$PERF_REPO" ]; then
    git clone https://github.com/dotnet/performance.git $PERF_REPO
fi
```

#### WASM only — add local NuGet source

```bash
cd $PERF_REPO

# Add local runtime packages as a NuGet source
# (BDN generates projects that reference Microsoft.NETCore.App.Ref at the dev version —
#  this package only exists in your local build artifacts, not in any public feed)
dotnet nuget add source $RUNTIME_REPO/artifacts/packages/Release/Shipping --name local-runtime-packages
```

> **Why WASM needs this but CoreCLR doesn't:** WASM benchmarks use `--dotnet-path` with an SDK that needs NuGet package resolution for runtime packs. CoreCLR benchmarks use `--corerun` which loads libraries directly from Core_Root — no NuGet involved.

**Verification:**

```bash
# Both flavors:
ls $PERF_REPO/scripts/benchmarks_ci.py
# Expected: file exists

# WASM only:
cd $PERF_REPO && dotnet nuget list source | grep -i local-runtime
# Expected: "local-runtime-packages" source listed and enabled
```

---

### Phase 3: (Conditional) Build BenchmarkDotNet from Source

> This phase is identical for both runtime flavors.

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

---

#### If `RUNTIME_FLAVOR=coreclr`

**Goal:** Execute benchmarks with `--corerun` pointing to the locally-built CoreCLR.

```bash
cd $PERF_REPO

CORE_ROOT=$RUNTIME_REPO/artifacts/tests/coreclr/linux.$ARCHITECTURE.Release/Tests/Core_Root

python3 scripts/benchmarks_ci.py \
    --csproj src/benchmarks/micro/MicroBenchmarks.csproj \
    --incremental no \
    --architecture $ARCHITECTURE \
    -f $TARGET_TFM \
    --corerun $CORE_ROOT/corerun \
    --filter "$BENCHMARK_FILTER" \
    --bdn-arguments "$BDN_EXTRA_ARGS"
```

**What `--coreRun` does in BDN:**
- BDN generates a boilerplate project, builds it with the system `dotnet` SDK, then runs the resulting assembly using the provided `corerun` executable
- `corerun` loads `System.Private.CoreLib.dll` and other framework libraries from its own directory (Core_Root)
- This means your benchmarks run against **your locally-built CoreCLR and libraries**

**Confirm CoreCLR was used (not Mono):**
```bash
# 1. Check the BDN report — should show "RyuJIT" (CoreCLR's JIT), not "Mono JIT"
#    and "Toolchain=CoreRun" with a dev version like "11.0.0-dev"
grep -E "Job-|Toolchain" $PERF_REPO/artifacts/bin/MicroBenchmarks/Release/$TARGET_TFM/BenchmarkDotNet.Artifacts/results/*-report-github.md

# 2. Verify Core_Root contains CoreCLR native libs (not Mono)
ls $CORE_ROOT/libcoreclr.so $CORE_ROOT/libclrjit.so    # should exist
ls $CORE_ROOT/libmonosgen-2.0.so 2>/dev/null            # should NOT exist
```

---

#### If `RUNTIME_FLAVOR=wasm`

**Goal:** Execute benchmarks using the local SDK with WASM workloads.

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

**What the script does automatically:**
- Sets `DOTNET_ROOT` and `PATH` to the local SDK
- Restores with correct package paths
- Builds with `/p:BuildingForWasm=true`
- Runs BDN with `--runtimes wasmnet<version>` (mapped from TFM)

---

#### Both flavors

Add `--keepFiles` if you want to inspect generated BDN projects after the run.

**What the script does automatically (both flavors):**
- Sets `PERFLAB_TARGET_FRAMEWORKS=$TARGET_TFM`
- Sets `DOTNET_CLI_TELEMETRY_OPTOUT=1` and `DOTNET_MULTILEVEL_LOOKUP=0`
- Restores and builds `MicroBenchmarks.csproj`

**Verification:** The script exits 0 and benchmark results appear in the terminal output and in `$PERF_REPO/artifacts/bin/MicroBenchmarks/Release/$TARGET_TFM/BenchmarkDotNet.Artifacts/results/`.

---

## Comparing Two Builds (A/B Testing) — CoreCLR only

A common scenario is comparing two CoreCLR builds (e.g., before/after a change). BDN's `--coreRun` accepts multiple paths:

```bash
# Build baseline (e.g., main branch)
cd $RUNTIME_REPO && git checkout main
./build.sh clr+libs -c Release
./src/tests/build.sh release x64 generatelayoutonly /p:LibrariesConfiguration=Release
cp -r artifacts/tests/coreclr/linux.x64.Release/Tests/Core_Root /tmp/core_root_baseline

# Build your change
cd $RUNTIME_REPO && git checkout my-feature-branch
./build.sh clr+libs -c Release
./src/tests/build.sh release x64 generatelayoutonly /p:LibrariesConfiguration=Release

# Run both in one benchmark invocation — BDN will compare them
cd $PERF_REPO
python3 scripts/benchmarks_ci.py \
    --csproj src/benchmarks/micro/MicroBenchmarks.csproj \
    --incremental no \
    --architecture x64 \
    -f $TARGET_TFM \
    --corerun /tmp/core_root_baseline/corerun $RUNTIME_REPO/artifacts/tests/coreclr/linux.x64.Release/Tests/Core_Root/corerun \
    --filter "$BENCHMARK_FILTER"
```

BDN will label these as `Job-0` and `Job-1` in results and show a comparison table.

---

## Environment Variables for CoreCLR Tuning

These optional environment variables control CoreCLR behavior during benchmarks:

| Variable | Value | Effect |
|---|---|---|
| `DOTNET_ReadyToRun` | `0` | Disable ReadyToRun (pre-compiled) images, forcing JIT compilation |
| `DOTNET_TieredCompilation` | `0` | Disable tiered compilation — all methods are compiled at Tier 1 |
| `DOTNET_TC_QuickJit` | `0` | Disable Quick JIT (Tier 0), use full optimization from the start |
| `DOTNET_JitDisasm` | `MethodName` | Dump JIT disassembly for specified methods (diagnostic) |
| `DOTNET_GCgen0size` | `<bytes>` | Override Gen 0 GC budget |

Set these before the `python3 scripts/benchmarks_ci.py` command, or pass them via `--bdn-arguments "--envVars DOTNET_TieredCompilation:0"`.

---

## Troubleshooting Guide

Use this table to diagnose common failures. Match the error text and apply the fix.

| Error / Symptom | Applies to | Cause | Fix |
|---|---|---|---|
| `corerun: No such file or directory` | CoreCLR | Core_Root not generated or wrong architecture | Re-run Phase 1b (`generatelayoutonly`); verify `$ARCHITECTURE` matches your build |
| `System.IO.FileNotFoundException: ... System.Private.CoreLib.dll` | CoreCLR | `corerun` can't find framework libraries | Ensure `corerun` is in Core_Root with co-located DLLs, not the raw `artifacts/bin/coreclr/` path |
| `NU1102: Unable to find Microsoft.NETCore.App.Ref <version>` | WASM | Local runtime packages NuGet source is missing | Run `dotnet nuget add source $RUNTIME_REPO/artifacts/packages/Release/Shipping --name local-runtime-packages` in `$PERF_REPO` |
| `NETSDK1112: The runtime pack ... was not found` | WASM | WASM workload not installed or NuGet source missing | Re-run the workload install step in Phase 1; verify NuGet source in Phase 2 |
| `DllGatherer.csproj` restore fails with missing packages | WASM | BDN-generated project can't find runtime packs | Ensure `local-runtime-packages` NuGet source is configured (Phase 2) |
| `PermissionError: [Errno 1] Operation not permitted: ... chmod` | Both | SDK on a filesystem that doesn't support chmod (e.g., Windows mount) | Copy artifacts to a native Linux path: `cp -r <artifacts> /tmp/<target>` and point there |
| Wrong TFM restored / built | Both | `PERFLAB_TARGET_FRAMEWORKS` not set | The `benchmarks_ci.py` script sets this automatically. If running manually, `export PERFLAB_TARGET_FRAMEWORKS=$TARGET_TFM` |
| Old packages cached | Both | NuGet cache has stale packages from a previous build | `rm -rf ~/.nuget/packages/microsoft.netcore.app*` and retry |
| `Assembly weaving failed... unsupported .NET or .NET Core version X.0` | Both | AsmResolver in BDN doesn't support the target .NET version | Apply Phase 3 (build BDN from source with nightly AsmResolver) |
| `Benchmarked method does not have MethodImplOptions.NoInlining` | Both | Weaver silently failed (same root cause as above) | Apply Phase 3; also `rm -rf ~/.nuget/packages/benchmarkdotnet*` to clear cache |
| Build hangs or OOMs | Both | Runtime build is resource-intensive | Limit parallelism with `/maxcpucount:4` |
| `generatelayoutonly` fails with missing libs | CoreCLR | Libs not built or Configuration mismatch | Ensure `./build.sh clr+libs -c Release` completed first; pass `/p:LibrariesConfiguration=Release` |
| Benchmark results don't reflect code changes | CoreCLR | Stale Core_Root from previous build | Re-run both Phase 1a and Phase 1b after code changes |

## How CI Differs from Local

| Aspect | CI Pipeline | Local (this skill) |
|---|---|---|
| Runtime artifacts | Downloaded from Azure Pipeline artifact drop | Built locally via `./build.sh` |
| CoreCLR Core_Root | `build_coreroot_payload()` in `scripts/build_runtime_payload.py` | `src/tests/build.sh generatelayoutonly` |
| WASM SDK + packages | Pipeline artifact with workloads pre-installed | Built + `InstallWorkloadUsingArtifacts` |
| WASM NuGet packages | Copied to `built-nugets/` folder as a source | `dotnet nuget add source` pointing at `artifacts/packages/Release/Shipping` |
| BenchmarkDotNet | Custom version from `benchmark-dotnet-prerelease` feed | Same feed, or locally-built BDN (Phase 3) |
| Benchmark execution | Helix agents, `--coreRun` (CoreCLR) or `--wasm` (WASM) | Same flags, local machine |
| Environment | Helix agents (dedicated hardware) | Dev container / local machine |

## Quick Smoke Tests

For a fast end-to-end validation, use a trivial benchmark with minimal iterations.

### CoreCLR smoke test

```bash
cd $PERF_REPO

python3 scripts/benchmarks_ci.py \
    --csproj src/benchmarks/micro/MicroBenchmarks.csproj \
    --incremental no \
    --architecture x64 \
    -f net11.0 \
    --corerun /workspaces/runtime/artifacts/tests/coreclr/linux.x64.Release/Tests/Core_Root/corerun \
    --filter "System.Tests.Perf_Boolean.Parse" \
    --bdn-arguments "--iterationCount 1 --warmupCount 0"
```

### WASM smoke test

```bash
cd $PERF_REPO

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

Both run a single boolean-parsing benchmark with 1 iteration and no warmup — completes in minutes and validates the entire pipeline.

## Key Files Reference

| File | Repo | Used by | Purpose |
|---|---|---|---|
| `scripts/benchmarks_ci.py` | performance | Both | Main entry point — orchestrates restore, build, and run |
| `scripts/micro_benchmarks.py` | performance | Both | Build/run logic, `--corerun` and WASM runtime mapping |
| `scripts/build_runtime_payload.py` | performance | CoreCLR | CI helper that generates Core_Root payloads |
| `scripts/benchmarks_local.py` | performance | CoreCLR | Local benchmarking helper with `CoreRun` run type |
| `scripts/dotnet.py` | performance | WASM | SDK setup, `DOTNET_ROOT` configuration |
| `eng/Versions.props` | performance | Both | BDN version and other package versions |
| `NuGet.config` | performance | Both | Package source configuration |
| `src/tests/build.sh` | runtime | CoreCLR | `generatelayoutonly` generates Core_Root |
| `src/mono/wasm/Wasm.Build.Tests/Wasm.Build.Tests.csproj` | runtime | WASM | Target for `InstallWorkloadUsingArtifacts` |
| `src/BenchmarkDotNet.Weaver/BenchmarkDotNet.Weaver.csproj` | BenchmarkDotNet | Both | AsmResolver dependency (patch for new .NET versions) |
| `build/common.props` | BenchmarkDotNet | Both | `WeaverVersionSuffix` — increment when patching weaver |
```
