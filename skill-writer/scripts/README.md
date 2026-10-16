# Scoped pre-sync skill validation

Requires Node.js 22+ and the pinned `yaml` parser in this directory. Run
`npm ci --ignore-scripts` here if the dependency is missing. No approximate YAML
fallback is used: unavailable dependencies are a validation blocker.
The lockfile records this machine's configured Microsoft public npm mirror.
Installing on another machine requires access to that registry (or deliberately
regenerating the lock against an approved reachable registry).

Validate only the edited skill directories/files, including helper resources:

```powershell
node "$HOME\.copilot\skills\skill-writer\scripts\validate-skills.mjs" --root "$HOME\.copilot\skills\code-review" --root "$HOME\.copilot\skills\skill-writer" --discover
```

Or select changed tracked/staged/untracked files and their owning skills:

```powershell
node "$HOME\.copilot\skills\skill-writer\scripts\validate-skills.mjs" --changed "$HOME\.copilot\skills"
```

`--root` can be repeated; directories are recursively scanned for `SKILL.md`.
Duplicate names are checked **across exactly the selected files/roots**, not the
entire installation. `--changed` includes all current changes, including
pre-existing ones; prefer explicit roots when the worktree is shared/dirty.
Deleted skill files are not validated. There is no baseline writing, staging,
commit, push or discovery-configuration modification.

Checks include real YAML parsing (and duplicate mapping keys), required string
metadata with 64/1024-character limits, lowercase hyphenated names, duplicate
skill names, and existing local inline/image/reference-style Markdown resources.
Fenced examples, inline code spans, external URI schemes and anchor-only links are excluded.
This is a bounded Markdown link scanner, not a full CommonMark renderer: unusual
escaped/nested link syntax, HTML links and bare code-formatted paths require
manual review. Existing resource symlinks are followed; contents and anchors are
not validated.

`--discover` explicitly runs `copilot skill list --json` and requires each
selected name's **enabled, canonical SKILL.md path** to match. A shadowing copy
with the same name fails. Unrelated CLI parse diagnostics remain visible but
do not invalidate a selected skill that actually resolves at its exact path.
Missing CLI, nonzero exit, unsupported JSON or mismatched discovery is a failure,
not a successful skipped check. Without `--discover`, no discovery is claimed.
This does not prove prompt activation or instruction quality.

Current installation caveat: discovery resolves `code-review` and `skill-writer`
to copies under `Blazor-Playground\ilonatommy`, not the top-level tracked skills.
Path-aware validation therefore intentionally fails these top-level targets
until the owner resolves that configuration/duplicate-copy issue. Do not silently
validate the wrong copy or repair unrelated skills. The currently active copies
also reference these shared helpers, without duplicating their implementations.
Validate that active set separately (selecting both copies together must honestly
fail duplicate-name checks):

```powershell
node "$HOME\.copilot\skills\skill-writer\scripts\validate-skills.mjs" --root "$HOME\.copilot\skills\Blazor-Playground\ilonatommy\code-review" --root "$HOME\.copilot\skills\Blazor-Playground\ilonatommy\skill-writer" --root "$HOME\.copilot\skills\aspnetcore-pr-review" --discover
```

Offline tests:

```powershell
node --test "$HOME\.copilot\skills\skill-writer\scripts\validate-skills.test.mjs"
```
