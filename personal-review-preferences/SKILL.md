---
name: personal-review-preferences
description: Applies my personal, repository-aware review and investigation preferences alongside an appropriate specialist skill. Use when reviewing PRs, local diffs, tests, skills, or evals, proposing review comments, re-reviewing changes, or investigating regressions and CI failures. This is a preference layer, not a standalone procedure.
---

# Personal review preferences

An initial, deliberately small review contract. Apply the shared preferences and the matching repository notes; refine them when I give explicit feedback.

## Work alongside other review skills

- Identify the target repository from trusted session metadata or Git remotes, not just the current directory name. Match forks by their verified upstream repository.
- Use the review skill appropriate to the repository and requested scope; keep its evidence-gathering and validation procedure. This skill adds preferences, not another review pass.
- Do not invoke every available review skill, add reviewers, or start a multi-agent workflow just because this layer is loaded.
- Default to one reviewer in the current session. Reserve a deep or multi-model review for an explicit request; otherwise investigate only concrete unresolved findings rather than multiplying the whole review.
- Follow applicable repository instructions and my current request. If a preference conflicts with them, explain the conflict rather than silently overriding them.
- Distinguish review, investigation, and fixing. A source-only review stays source-only; an investigation may need execution as described below. A follow-up question does not itself expand the task into implementing a fix. Do not post comments, resolve threads, approve, commit, or push without authorization.

## Shared review contract

- Lead with material correctness issues. Separate demonstrated defects from hypotheses, optional coverage improvements, and polish. Do not turn an initial version into a request for a mature framework.
- For each finding, identify the exact file and relevant lines, the violated requirement or existing contract, a concrete triggering sequence, and the observable consequence. Trace relevant helpers and lifecycle behavior before concluding that a check or operation is missing.
- Explain findings in simple English. Distinguish what the code actually does from what you infer about the author's intent. If evidence is insufficient, say what remains unverified.
- Check existing feedback and the latest revision. On re-review, distinguish resolved, still-valid, and new findings; do not repeat stale findings.
- When I challenge a finding, reassess it against the source and requirement. Withdraw it when unsupported; do not merely defend it or agree with me without evidence.
- When proposing a fix, show a minimal unified diff and where it belongs. Prefer one authoritative rule or shared fix over duplicated instructions, extra abstractions, or scenario-specific workarounds. Minimal must still fully address the issue.
- Keep generated outputs separate from their source of truth. Explain whether a correction belongs in the generator skill, shared infrastructure, or generated code before proposing edits.
- When I ask for a review comment, provide a concise proposed comment and its exact placement. Do not publish it without authorization.

## Investigation preferences

- Gather evidence before settling on a cause or implementing a fix. An investigation can include building and running a repro app, targeted tests, and small experimental changes needed to test a hypothesis, within applicable permissions and repository rules. Do not require separate approval for every routine investigative step, but respect explicit source-only or no-execution requests.
- Keep experiments isolated and distinguish them from a proposed production fix. Preserve user changes, record what an experiment changed, and remove only your own temporary changes when finished unless I ask to keep the repro.
- For "why did this start failing?", compare the last passing and first failing evidence: relevant code/configuration changes, SDK and package versions, build identity, feeds, and actual restore sources where available. Do not infer a package's source merely from the configured feed list.
- Separate confirmed facts, hypotheses, and missing evidence. State what each experiment establishes and what would disprove the leading explanation; report uncertainty rather than substituting a plausible story for a demonstrated cause.
- For a long investigation, keep a compact working record of the reported symptom, confirmed facts, remaining hypotheses, next discriminating experiment, and evidence paths. Keep it in session context or existing session state, not a new repository document or user-maintained checklist. Update it at meaningful decision points; before another build or experiment, identify what its result will distinguish. Do not require approval for each checkpoint.
- Reuse captured logs and completed build/test evidence when the relevant source, build identity, configuration, and environment still match; check freshness and rerun when a relevant input changed, evidence is incomplete, or repeatability is the question. Search saved logs for focused excerpts instead of repeatedly collecting full output, and use the existing run rather than starting a duplicate. Re-read unchanged source when a specific unresolved question needs it, not merely to regain orientation.
- Define the current phase's completion condition from the request: reproduce the exact symptom, establish the passing/failing difference, or prove the regression test catches that same bug. Stop when that condition is met; record nearby issues separately rather than silently expanding scope. Continue related investigation when needed to meet the condition, and explain genuine blockers instead of substituting a different outcome.
- Do not routinely split sessions, compact context, switch models, or add watchers as a cost-saving ritual. Preserve useful context and cache reuse; suggest a smaller model only for a separable mechanical task when it is available and suitable, not for the hard reasoning in an ongoing investigation.

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

Request: "Review this scenario-tests PR using my personal review preferences and the appropriate review skill. Source-only; proposals only."

Expected response: supported findings with exact locations, plain-English failure sequences, and concise comment proposals; identify whether any suggested fix belongs in the skill or harness. No edits, test execution, or GitHub publication.
