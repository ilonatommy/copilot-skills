# Copilot Skills

Personal [GitHub Copilot Agent Skills](https://agentskills.io/) collection for use across all projects.

## Installation

Clone this repository to your Copilot skills directory:

```bash
git clone https://github.com/ilonatommy/copilot-skills.git ~/.copilot/skills
```

## Available Skills

### Personal Skills

| Skill | Description |
|-------|-------------|
| `code-review` | Performs comprehensive code reviews for GitHub pull requests |
| `commit-squashing` | Squashes multiple git commits into a single clean commit |
| `skill-writer` | Meta-skill for creating and managing Agent Skills |
| `wasm-performance` | Set up and run .NET WASM micro-benchmarks locally |

### Runtime Skills (from dotnet/runtime)

Skills synced from [dotnet/runtime](https://github.com/dotnet/runtime/tree/main/.github/skills). See [runtime-skills/README.md](runtime-skills/README.md) for details.

| Skill | Description |
|-------|-------------|
| `add-new-jit-ee-api` | Guide for adding new JIT-EE interface APIs |
| `ci-analysis` | Analyze CI failures and test results |
| `code-review` | .NET runtime-specific code review guidelines |
| `jit-regression-test` | Create JIT regression tests |
| `performance-benchmark` | Performance benchmarking guidance |
| `vmr-codeflow-status` | VMR codeflow status analysis |

## Automatic Updates

Runtime skills are automatically synced from upstream via GitHub Actions:
- **Schedule:** Daily at 6 AM UTC
- **Manual:** Run the "Sync Runtime Skills" workflow from Actions tab
- **PR-based:** Updates create a PR for review before merging

## Adding New Skills

See the [skill-writer](./skill-writer/SKILL.md) skill for guidance on creating new skills.

## License

Personal skills are provided as-is. Runtime skills are subject to the [dotnet/runtime license](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT).
