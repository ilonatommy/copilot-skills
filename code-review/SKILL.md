---
name: code-review
description: Performs comprehensive code reviews for GitHub pull requests. Use when reviewing PRs, checking if a PR fixes an issue, analyzing code changes, or when given a GitHub PR URL (github.com/.../pull/...). Evaluates problem alignment, code quality, security threats, alternative approaches, edge cases, and identifies duplicate/existing implementations.
---

# Code Review Skill

Performs thorough, structured code reviews for GitHub pull requests with focus on problem-solving effectiveness, security, and code quality.

## When to Use This Skill

- User provides a GitHub PR URL for review
- User asks to review a pull request or code change
- User wants to verify if a PR fixes a specific issue
- User asks about security implications of a change
- User wants alternative approaches to a fix

## Input Format

The user will typically provide:
1. **PR URL** (required): `https://github.com/{owner}/{repo}/pull/{number}`
2. **Issue URL** (optional): `https://github.com/{owner}/{repo}/issues/{number}`
3. **Additional context** (optional): What to focus on, concerns, etc.

## Review Process

### Step 1: Gather Information

Use GitHub MCP tools to fetch all relevant data:

```
1. Parse the PR URL to extract: owner, repo, pull_number
2. Parse the Issue URL (if provided) to extract: owner, repo, issue_number
```

**Fetch PR Data:**
- Get pull request details (title, body, author, state, base/head)
- Get pull request diff/files changed
- Get pull request comments and review comments
- Get commits in the pull request

**Fetch Issue Data (if provided):**
- Get issue details (title, body, labels, state)
- Get issue comments (the full discussion)
- Check for linked issues or references

**Fetch Repository Context:**
- Search for similar implementations in the codebase
- Check if feature exists in related areas (e.g., MVC vs Blazor)
- Look for existing patterns that should be followed

### Step 2: Analyze Against Review Criteria

Evaluate the PR against each of these categories:

#### 2.1 Problem Alignment
- Does the PR actually solve the problem stated in the issue?
- Are ALL cases mentioned in the issue discussion addressed?
- Does the PR scope match the issue scope (not under/over-engineering)?
- Are there requirements in comments that were missed?

#### 2.2 Code Quality & Design
- Does the change make logical sense?
- Is the code readable and maintainable?
- Does it follow existing patterns in the codebase?
- What code should be refactored?
- Can the fix be done simpler?
- Is there unnecessary complexity?

#### 2.3 Security Analysis
- What security threats could this PR introduce?
- Input validation: Is user input properly sanitized?
- Authentication/Authorization: Any bypasses possible?
- Data exposure: Could sensitive data leak?
- Injection risks: SQL, XSS, command injection?
- Dependencies: Any vulnerable packages added?

#### 2.4 Alternative Approaches
- What other ways could this issue be fixed?
- What are the trade-offs of each approach?
- Is the PR's approach the best one? Why or why not?
- Are there simpler solutions that were overlooked?

#### 2.5 Edge Cases & Completeness
- Are all use cases covered?
- What edge cases might fail?
- Error handling: What happens when things go wrong?
- Boundary conditions: Empty inputs, null values, max limits?
- Concurrency: Thread safety issues?

#### 2.6 Duplication & Consistency
- Does this re-implement something that already exists?
- Is there similar functionality elsewhere that should be reused?
- **For ASP.NET Core**: Does this feature exist in MVC? How does the Blazor implementation compare?
- Are there patterns in the codebase that should be followed?
- Is the implementation consistent with similar features?

#### 2.7 Testing
- Are there adequate unit tests?
- Are edge cases tested?
- Integration tests where needed?
- Are tests actually testing the right things?

### Step 3: Generate Review Report

Structure the output using the [review report template](./templates/review-report.md).

## Review Report Format

Present findings in this structure:

```markdown
# Code Review: PR #{number}

## Summary
[One paragraph executive summary of the PR and overall assessment]

## Problem Alignment ✅/⚠️/❌
[Does the PR solve the issue? Missing requirements?]

## Code Quality
### What Works Well 👍
- [Positive observations]

### Concerns 🔍
- [Issues that should be addressed]

### Suggestions for Improvement 💡
- [Refactoring opportunities, simplifications]

## Security Analysis 🔒
[Security threats and mitigations]

## Alternative Approaches
| Approach | Pros | Cons |
|----------|------|------|
| Current PR | ... | ... |
| Alternative 1 | ... | ... |

## Edge Cases
- [ ] Case 1: [covered/not covered]
- [ ] Case 2: [covered/not covered]

## Duplication Check
[Existing implementations, MVC vs Blazor comparison if applicable]

## Final Verdict
[APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

### Must Fix 🔴
- [Blocking issues]

### Should Fix 🟡  
- [Important but not blocking]

### Consider 🟢
- [Nice to have]
```

## Examples

### Example 1: Basic PR Review

**User Input:**
> Review this PR: https://github.com/dotnet/aspnetcore/pull/65306
> It's supposed to fix: https://github.com/dotnet/aspnetcore/issues/49683

**Agent Actions:**
1. Extract: owner=dotnet, repo=aspnetcore, pull_number=65306, issue_number=49683
2. Fetch PR #65306 details, diff, and comments
3. Fetch Issue #49683 details and all comments
4. Search codebase for related implementations
5. Analyze against all criteria
6. Generate structured review report

### Example 2: Security-Focused Review

**User Input:**
> Review https://github.com/myorg/api/pull/123 with focus on security

**Agent Actions:**
1. Fetch PR data
2. Prioritize security analysis section
3. Check for auth, input validation, data exposure
4. Generate report with expanded security section

## Checklist Reference

See [review-checklist.md](./checklists/review-checklist.md) for detailed checklist.
See [security-checklist.md](./checklists/security-checklist.md) for security-specific checks.

## Important Notes

- Always read the FULL issue discussion, not just the issue body
- Check linked issues and references for additional context
- For ASP.NET Core repos, always compare MVC and Blazor implementations
- Consider the PR in context of the broader architecture
- Be constructive - suggest improvements, don't just criticize
