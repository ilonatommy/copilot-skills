# Code Review Checklist

Use this checklist to ensure comprehensive PR reviews.

## Problem Alignment

- [ ] PR title clearly describes the change
- [ ] PR description explains the problem and solution
- [ ] The change actually solves the stated issue
- [ ] All requirements from the issue are addressed
- [ ] All cases from issue discussion are covered
- [ ] Scope matches the issue (no over/under-engineering)
- [ ] No unrelated changes mixed in

## Code Quality

### Readability
- [ ] Code is self-documenting with clear names
- [ ] Complex logic has explanatory comments
- [ ] No confusing or misleading variable names
- [ ] Consistent naming conventions used

### Design
- [ ] Single Responsibility Principle followed
- [ ] No unnecessary abstraction layers
- [ ] Follows existing patterns in the codebase
- [ ] Changes are in the right location/file
- [ ] Appropriate encapsulation

### Simplicity
- [ ] Could this be done simpler?
- [ ] No premature optimization
- [ ] No over-engineering
- [ ] DRY principle followed (no duplication)

### Maintainability
- [ ] Easy to modify in the future
- [ ] No magic numbers/strings
- [ ] Configuration externalized where appropriate
- [ ] Dependencies are appropriate

## Security

- [ ] User input is validated
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities  
- [ ] No command injection risks
- [ ] Proper authentication checks
- [ ] Proper authorization checks
- [ ] Sensitive data not logged
- [ ] Sensitive data not exposed in errors
- [ ] No hardcoded secrets/credentials
- [ ] Dependencies don't have known vulnerabilities
- [ ] HTTPS/secure communication used
- [ ] Rate limiting considered (if applicable)

## Error Handling

- [ ] Errors are caught and handled appropriately
- [ ] Meaningful error messages
- [ ] No swallowed exceptions
- [ ] Cleanup happens in finally/using blocks
- [ ] User-facing errors are user-friendly
- [ ] Technical details not exposed to users

## Edge Cases

- [ ] Null/empty inputs handled
- [ ] Boundary values handled
- [ ] Invalid input handled gracefully
- [ ] Large inputs handled (no overflow/timeout)
- [ ] Concurrent access considered
- [ ] Network failure scenarios handled
- [ ] Partial failure scenarios handled

## Testing

- [ ] Unit tests added/updated
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases
- [ ] Tests are readable and maintainable
- [ ] Tests actually verify the right behavior
- [ ] Integration tests where appropriate
- [ ] No flaky tests introduced

## Performance

- [ ] No obvious performance issues
- [ ] No N+1 query problems
- [ ] Appropriate caching considered
- [ ] No memory leaks
- [ ] Async used appropriately
- [ ] No unnecessary allocations in hot paths

## Documentation

- [ ] Public APIs documented
- [ ] Breaking changes documented
- [ ] README updated if needed
- [ ] Migration guide provided if needed
- [ ] Changelog updated

## Duplication & Consistency

- [ ] No reimplementation of existing functionality
- [ ] Reuses existing utilities/helpers
- [ ] Consistent with similar features in codebase
- [ ] For ASP.NET: Compared MVC vs Blazor implementation
- [ ] Follows established patterns

## Final Checks

- [ ] Build passes
- [ ] All tests pass
- [ ] No new warnings introduced
- [ ] Code formatted correctly
- [ ] No debug code left in
- [ ] No commented-out code
- [ ] Feature flags used if needed
