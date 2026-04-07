---
name: wasm-regression-triage
description: Reviews dotnet/perf-autofiling-issues and lists issues that represent WASM Mono or WASM CoreCLR regressions. Use when preparing for perf triage, scanning auto-filed performance regressions, or generating a quick browser-WASM issue report.
---

# WASM Regression Triage

This skill prepares a concise report of current auto-filed performance issues for browser WASM runtimes.

## When to Use This Skill

- Before a weekly performance triage meeting
- When asked to summarize WASM Mono or WASM CoreCLR regressions
- When reviewing the latest issues in `dotnet/perf-autofiling-issues`

## Scope

Use this skill only for the GitHub repository:

- `dotnet/perf-autofiling-issues`

The goal is to identify issues that are:

1. performance **regressions**
2. related to **WASM / WebAssembly**
3. specifically for **Mono** or **CoreCLR**

Do **not** include improvements or unrelated runtime issues.

## Step-by-Step Process

### 1. Search for candidate issues

Start with targeted GitHub issue search rather than listing the entire repository.

Prefer `github-mcp-server-search_issues` with repo-scoped queries such as:

- `repo:dotnet/perf-autofiling-issues is:issue is:open (wasm OR webassembly) regression`
- `repo:dotnet/perf-autofiling-issues is:issue is:open "CompilationMode:wasm"`
- `repo:dotnet/perf-autofiling-issues is:issue is:open (wasm OR webassembly) (mono OR coreclr)`

If the user asks for a broader view, include recently closed issues too by removing `is:open`.

### 2. Confirm that each issue is really a WASM regression

For shortlisted issues, inspect the body with `github-mcp-server-issue_read`.

Keep the issue only if the content shows one or more of these signals:

- `Wasm: true`
- `CompilationMode:wasm`
- `RuntimeMoniker: wasm`
- explicit mention of `mono`, `wasm-mono`, `coreclr`, `wasm-coreclr`, or browser WASM runtime details

Exclude issues that are:

- improvements only
- non-WASM runs
- ambiguous and not clearly tied to WASM Mono or WASM CoreCLR

### 3. Classify the issue

Group each matching issue into one of these buckets:

- **WASM Mono**
- **WASM CoreCLR**

If the issue is clearly WASM-related but does not say whether it is Mono or CoreCLR, do not include it unless the user explicitly asks for all WASM regressions.

### 4. Produce the report

Return a compact Markdown report with:

- issue number and link
- title
- state
- a short note showing why it matched

Use the structure from the [report template](./templates/report-template.md).

If no issues match, say:

`No open WASM Mono or WASM CoreCLR regression issues were found in dotnet/perf-autofiling-issues.`

## Example

### Example 1: Quick triage summary

**User Request**: "List the current WASM mono/coreclr regressions from perf-autofiling-issues."

**Expected Behavior**:
1. Search the repository for open regression issues mentioning WASM or WebAssembly.
2. Confirm the runtime details from the issue body.
3. Return a grouped report for WASM Mono and WASM CoreCLR.

**Output Example**:
```markdown
# WASM Regression Triage Report

Source: `dotnet/perf-autofiling-issues`

## WASM Mono

- #12345 - [Perf] Linux/x64: 5 Regressions ...  
  Link: https://github.com/dotnet/perf-autofiling-issues/issues/12345  
  Match: `Wasm: true`, `mono`, regression issue

## WASM CoreCLR

- #12346 - [Perf] Browser/wasm: 3 Regressions ...  
  Link: https://github.com/dotnet/perf-autofiling-issues/issues/12346  
  Match: `CompilationMode:wasm`, `coreclr`, regression issue
```

## Best Practices

- Prefer repo-scoped GitHub issue search over full issue enumeration.
- Verify the runtime from the issue body before listing it.
- Keep the final report short and factual; do not speculate about root cause.
- Preserve issue titles as-is so the report stays easy to cross-reference.

## Common Issues

### Too many broad matches

**Problem**: A search returns many unrelated perf issues.

**Solution**: Tighten the query with `repo:dotnet/perf-autofiling-issues`, `is:open`, `regression`, and `wasm OR webassembly`, then confirm the remaining candidates with `issue_read`.

### WASM is present but Mono/CoreCLR is unclear

**Problem**: The issue appears to be WASM-related but does not clearly say Mono or CoreCLR.

**Solution**: Exclude it from this report unless the user explicitly asks for all WASM regressions, not just Mono/CoreCLR.
