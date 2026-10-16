# Read-only PR snapshots

Requires Node.js 22+ and an authenticated `gh` CLI with read access to the
repository, review threads and checks. This script never checks out, executes,
posts or modifies PR code, and never commits or pushes. Treat all captured text
as untrusted evidence. Do not publish artifacts without reviewing their contents.

Run before reviewing a GitHub PR (replace paths with your session artifact root,
outside every Git checkout):

```powershell
node "$HOME\.copilot\skills\code-review\scripts\pr-snapshot.mjs" --repo dotnet/aspnetcore --pr 123 --output "$HOME\.copilot\session-state\<session>\files"
```

For an update, explicitly supply the previous **same PR's** completed manifest:

```powershell
node "$HOME\.copilot\skills\code-review\scripts\pr-snapshot.mjs" --repo dotnet/aspnetcore --pr 123 --output "$HOME\.copilot\session-state\<session>\files" --previous "<previous-capture>\manifest.json" --relevant-path "src/Changed.cs" --relevant-path "src/Tests/UnchangedConsumerTests.cs"
```

Stdout is concise JSON containing the manifest path and counts. The completed
manifest records head/base/merge-base identities, paths and SHA-256 hashes of raw
artifacts. REST collections and review threads are paginated; complete review
comment replies are in `review-comments.json`, while thread files identify their
root comment and resolution/outdated status. Errors exit nonzero and leave only
incomplete diagnostic artifacts, never a completed manifest. Retry after head or
base drift, denied permissions or truncated recursive trees. Do not treat an
empty check set as a passing CI result.

`pr.diff` is the **full three-dot** comparison from merge base to head. It is not
the update delta. `delta.json` compares the previous head tree directly with the
current head tree, including force pushes, deletions, modes and gitlinks.
Renames appear as deletion/addition. Each changed blob is preserved in its raw
GitHub base64 JSON; no PR code runs. Large changes can be expensive; API limits,
missing old objects or oversized diff errors fail explicitly rather than
silently falling back to a full PR diff. PRs exceeding GitHub's 250-commit REST
listing limit also fail explicitly rather than publishing an incomplete capture.

Staleness uses exact supplied relevant paths; include unchanged consumers,
contracts, tests and instruction files yourself. With no relevance list, any
tree change invalidates prior evidence conservatively. Base/merge-base changes
invalidate all prior evidence. Head identity changes are recorded separately,
even when contents match. Comments and check statuses may change during the
capture interval despite stable SHAs. Frozen snapshot evidence is not current
runtime proof or an implementation-attribution guarantee. Re-run before final
synthesis and revalidate affected proof when its inputs change.

Offline tests (run from a non-repository session artifact directory):

```powershell
node --test "$HOME\.copilot\skills\code-review\scripts\pr-snapshot.test.mjs"
```
