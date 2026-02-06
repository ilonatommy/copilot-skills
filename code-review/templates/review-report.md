# Code Review: PR #{{PR_NUMBER}}

**Repository:** {{OWNER}}/{{REPO}}  
**PR Title:** {{PR_TITLE}}  
**Author:** @{{PR_AUTHOR}}  
**Related Issue:** {{ISSUE_URL}} (if applicable)  
**Review Date:** {{DATE}}

---

## Summary

{{One paragraph executive summary: What does this PR do? What's the overall assessment? Is it ready to merge?}}

---

## Problem Alignment {{STATUS_EMOJI}}

### Issue Requirements
{{List the requirements from the issue}}

### Coverage Analysis
| Requirement | Status | Notes |
|-------------|--------|-------|
| Requirement 1 | ✅/❌ | {{notes}} |
| Requirement 2 | ✅/❌ | {{notes}} |

### Discussion Points Addressed
{{Were all points from the issue discussion covered?}}

**Verdict:** {{Does the PR fully solve the issue?}}

---

## Code Quality

### What Works Well 👍
- {{Positive observation 1}}
- {{Positive observation 2}}

### Concerns 🔍
- {{Concern 1}}
- {{Concern 2}}

### Refactoring Opportunities
- {{Code that should be refactored and why}}

### Simplification Suggestions
- {{How could this be done simpler?}}

---

## Security Analysis 🔒

### Threat Assessment
| Threat | Risk Level | Present? | Mitigation |
|--------|------------|----------|------------|
| Input validation bypass | High/Med/Low | Yes/No | {{mitigation}} |
| Injection (SQL/XSS/Cmd) | High/Med/Low | Yes/No | {{mitigation}} |
| Auth/Authz bypass | High/Med/Low | Yes/No | {{mitigation}} |
| Data exposure | High/Med/Low | Yes/No | {{mitigation}} |
| Denial of service | High/Med/Low | Yes/No | {{mitigation}} |

### Security Recommendations
- {{Recommendation 1}}
- {{Recommendation 2}}

---

## Alternative Approaches

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Current PR** | {{description}} | {{pros}} | {{cons}} |
| Alternative 1 | {{description}} | {{pros}} | {{cons}} |
| Alternative 2 | {{description}} | {{pros}} | {{cons}} |

**Recommendation:** {{Which approach is best and why?}}

---

## Edge Cases & Completeness

### Edge Cases Analysis
| Case | Covered? | Notes |
|------|----------|-------|
| Null/empty input | ✅/❌ | {{notes}} |
| Very large input | ✅/❌ | {{notes}} |
| Invalid format | ✅/❌ | {{notes}} |
| Concurrent access | ✅/❌ | {{notes}} |
| Network failure | ✅/❌ | {{notes}} |
| {{Custom case}} | ✅/❌ | {{notes}} |

### Missing Scenarios
- {{Scenario not handled}}

---

## Duplication & Consistency Check

### Existing Implementations
{{Does this functionality already exist somewhere in the codebase?}}

### MVC vs Blazor Comparison (if applicable)
| Aspect | MVC Implementation | Blazor Implementation (this PR) | Consistent? |
|--------|-------------------|--------------------------------|-------------|
| Approach | {{description}} | {{description}} | Yes/No |
| API surface | {{description}} | {{description}} | Yes/No |
| Behavior | {{description}} | {{description}} | Yes/No |

**Why different (if applicable):** {{Explanation for differences}}

### Pattern Consistency
{{Does this follow established patterns in the codebase?}}

---

## Testing Assessment

### Test Coverage
- [ ] Unit tests present
- [ ] Happy path covered
- [ ] Error cases covered  
- [ ] Edge cases covered
- [ ] Integration tests (if needed)

### Missing Tests
- {{Test case that should be added}}

---

## Final Verdict

### Overall Assessment: {{APPROVE / REQUEST CHANGES / NEEDS DISCUSSION}}

### Must Fix 🔴
{{Blocking issues that prevent merge}}
1. {{Issue 1}}
2. {{Issue 2}}

### Should Fix 🟡
{{Important issues that should be addressed}}
1. {{Issue 1}}
2. {{Issue 2}}

### Consider 🟢
{{Nice-to-have improvements}}
1. {{Suggestion 1}}
2. {{Suggestion 2}}

### Praise ⭐
{{What was done particularly well}}
- {{Positive 1}}
- {{Positive 2}}

---

## Questions for Author

1. {{Question about design decision}}
2. {{Question about specific code}}

---

*Review generated using code-review skill*
