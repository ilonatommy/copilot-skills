---
name: personal-review-preferences
description: Applies my personal, repository-aware review preferences alongside an appropriate review skill. Use when reviewing PRs, local diffs, tests, skills, or evals, proposing review comments, or re-reviewing updated changes. This is a preference layer, not a standalone review procedure.
---

# Personal review preferences

An initial, deliberately small review contract. Apply the shared preferences and the matching repository notes; refine them when I give explicit feedback.

## Work alongside other review skills

- Identify the target repository from trusted session metadata or Git remotes, not just the current directory name. Match forks by their verified upstream repository.
- Use the review skill appropriate to the repository and requested scope; keep its evidence-gathering and validation procedure. This skill adds preferences, not another review pass.
- Do not invoke every available review skill, add reviewers, or start a multi-agent workflow just because this layer is loaded.
- Follow applicable repository instructions and my current request. If a preference conflicts with them, explain the conflict rather than silently overriding them.
- Review and explain first. Do not treat a review request or a follow-up question as permission to edit, execute PR code, run tests, post comments, resolve threads, approve, commit, or push. Follow any separately authorized execution scope.

## Shared review contract

- Lead with material correctness issues. Separate demonstrated defects from hypotheses, optional coverage improvements, and polish. Do not turn an initial version into a request for a mature framework.
- For each finding, identify the exact file and relevant lines, the violated requirement or existing contract, a concrete triggering sequence, and the observable consequence. Trace relevant helpers and lifecycle behavior before concluding that a check or operation is missing.
- Explain findings in simple English. Distinguish what the code actually does from what you infer about the author's intent. If evidence is insufficient, say what remains unverified.
- Check existing feedback and the latest revision. On re-review, distinguish resolved, still-valid, and new findings; do not repeat stale findings.
- When I challenge a finding, reassess it against the source and requirement. Withdraw it when unsupported; do not merely defend it or agree with me without evidence.
- When proposing a fix, show a minimal unified diff and where it belongs. Prefer one authoritative rule or shared fix over duplicated instructions, extra abstractions, or scenario-specific workarounds. Minimal must still fully address the issue.
- Keep generated outputs separate from their source of truth. Explain whether a correction belongs in the generator skill, shared infrastructure, or generated code before proposing edits.
- When I ask for a review comment, provide a concise proposed comment and its exact placement. Do not publish it without authorization.

## Repository-specific notes

### dotnet/aspnetcore-scenario-tests

- Review scenario behavior against the actual manual or accessibility requirement and the complete inherited harness, not just the visible assertions or a passing result.
- For asynchronous UI checks, distinguish the intermediate state from the intended final state. Verify that scans and assertions complete while the popup, populated items, or other relevant state still exists.
- Distinguish product failures, harness defects, generator instructions, and fidelity-record problems. Do not demand shared-infrastructure changes merely to satisfy a mistaken grading interpretation.
- Prefer a reusable skill or infrastructure correction when generated scenarios share the problem. Avoid overfitting a general instruction to one scenario, and state whether regeneration or evidence refresh is actually needed.

### dotnet/aspnetcore

- Assess whether the change fixes the reported user-visible behavior, not a nearby issue. A regression test must exercise that same failure, not just a related prepend/append case or an eventually correct final state.
- For transient browser bugs, ask for evidence of the relevant state transition; a successful final snapshot alone may miss the regression. If validation was authorized, distinguish reproduction in a sample from reproduction in the real consumer.
- For skill and eval PRs, prioritize concrete incorrect guidance and whether the eval proves the claimed improvement. Respect an explicitly initial-version scope; do not invent future implementation defects from ambiguous prose.

### Other repositories

Use the shared contract and the repository's own review guidance. Do not carry scenario-test-specific assumptions into unrelated repositories.

## Example

Request: "Review this scenario-tests PR using my personal review preferences and the appropriate review skill. Proposals only."

Expected response: supported findings with exact locations, plain-English failure sequences, and concise comment proposals; identify whether any suggested fix belongs in the skill or harness. No edits, test execution, or GitHub publication.
