# Example Skills for Reference

This document provides complete, ready-to-use skill examples for common use cases.

---

## Example 1: Unit Testing Skill

```markdown
---
name: unit-testing
description: Generates comprehensive unit tests for JavaScript/TypeScript code. Use when creating tests, adding test coverage, writing Jest or Vitest tests, or testing React components.
---

# Unit Testing Skill

Generates well-structured unit tests following testing best practices.

## When to Use

- Creating new test files for existing code
- Adding test coverage to untested functions
- Testing React/Vue/Angular components
- Writing Jest, Vitest, or Mocha tests

## Testing Philosophy

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Arrange-Act-Assert** - Structure every test clearly
3. **One assertion per test** - Keep tests focused and readable
4. **Descriptive names** - Test names should explain the scenario

## Process

### Step 1: Analyze the Code
- Identify public functions/methods
- List input parameters and return types
- Note edge cases and error conditions

### Step 2: Create Test File
- Name: `{FileName}.test.{ext}` or `{FileName}.spec.{ext}`
- Location: Same directory or `__tests__/` folder

### Step 3: Write Test Cases
Cover these scenarios:
- Happy path (expected inputs)
- Edge cases (empty, null, undefined)
- Error conditions
- Boundary values

## Example

**For this function:**
```typescript
function calculateDiscount(price: number, percentage: number): number {
  if (price < 0 || percentage < 0 || percentage > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - percentage / 100);
}
```

**Generate these tests:**
```typescript
describe('calculateDiscount', () => {
  it('should calculate correct discount for valid inputs', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  it('should return original price when percentage is 0', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('should return 0 when percentage is 100', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('should throw error for negative price', () => {
    expect(() => calculateDiscount(-10, 20)).toThrow('Invalid input');
  });

  it('should throw error for percentage over 100', () => {
    expect(() => calculateDiscount(100, 150)).toThrow('Invalid input');
  });
});
```
```

---

## Example 2: API Documentation Skill

```markdown
---
name: api-documentation
description: Generates REST API documentation from code. Use when documenting endpoints, creating OpenAPI specs, writing API guides, or generating Swagger documentation.
---

# API Documentation Skill

Creates comprehensive API documentation from source code.

## When to Use

- Documenting REST API endpoints
- Generating OpenAPI/Swagger specs
- Creating developer guides for APIs
- Updating existing API docs

## Documentation Structure

Every endpoint should document:
1. HTTP method and path
2. Description of purpose
3. Request parameters (path, query, body)
4. Response format and status codes
5. Example requests and responses
6. Error conditions

## Process

### Step 1: Identify Endpoints
Scan for route definitions:
- Express: `app.get()`, `router.post()`
- FastAPI: `@app.get()`, `@router.post()`
- ASP.NET: `[HttpGet]`, `[HttpPost]`

### Step 2: Extract Details
For each endpoint, gather:
- Route pattern and parameters
- Request body schema
- Response schema
- Authentication requirements
- Rate limits (if any)

### Step 3: Generate Documentation
Use this template for each endpoint:

```markdown
## [METHOD] /path/{param}

Brief description of what this endpoint does.

### Parameters

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| param | path | string | Yes | Description |

### Request Body

```json
{
  "field": "type - description"
}
```

### Response

**200 OK**
```json
{
  "result": "value"
}
```

### Errors

| Status | Description |
|--------|-------------|
| 400 | Bad request - invalid input |
| 404 | Resource not found |
```
```

---

## Example 3: Database Migration Skill

```markdown
---
name: database-migration
description: Creates and manages database migrations for schema changes. Use when modifying database tables, adding columns, creating indexes, or handling data migrations.
---

# Database Migration Skill

Guides safe database schema migrations with rollback support.

## When to Use

- Adding new tables or columns
- Modifying existing schema
- Creating or dropping indexes
- Migrating data between schemas

## Safety Principles

1. **Always reversible** - Every migration needs a rollback
2. **Small increments** - One logical change per migration
3. **Test first** - Run on staging before production
4. **Backup data** - Always have a recovery plan

## Process

### Step 1: Plan the Change
- What schema changes are needed?
- What's the rollback strategy?
- Any data transformations required?

### Step 2: Create Migration File
Naming: `{timestamp}_{description}.{ext}`
Example: `20240115143022_add_user_email_column.sql`

### Step 3: Write Up Migration
```sql
-- Up Migration
ALTER TABLE users ADD COLUMN email VARCHAR(255);
CREATE INDEX idx_users_email ON users(email);
```

### Step 4: Write Down Migration
```sql
-- Down Migration  
DROP INDEX idx_users_email;
ALTER TABLE users DROP COLUMN email;
```

### Step 5: Test
1. Run migration on empty database
2. Run migration on copy of production data
3. Verify rollback works
4. Check query performance

## Common Patterns

### Adding a NOT NULL column
```sql
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Step 2: Backfill data
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 3: Add constraint
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```
```

---

## Example 4: Code Review Skill

```markdown
---
name: code-review
description: Performs thorough code reviews checking security, performance, and maintainability. Use when reviewing pull requests, auditing code quality, or preparing code for production deployment.
---

# Code Review Skill

Comprehensive code review following industry best practices.

## When to Use

- Reviewing pull requests
- Auditing existing codebases
- Pre-deployment quality checks
- Mentoring team members

## Review Categories

### 1. Security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication checks
- [ ] Sensitive data handling

### 2. Performance
- [ ] N+1 query problems
- [ ] Unnecessary computations
- [ ] Memory leaks
- [ ] Caching opportunities

### 3. Maintainability
- [ ] Clear naming conventions
- [ ] Single responsibility
- [ ] DRY principle
- [ ] Adequate comments

### 4. Testing
- [ ] Unit test coverage
- [ ] Edge cases handled
- [ ] Integration tests where needed

## Feedback Format

Structure feedback as:

```markdown
## Summary
[Overall assessment - 1-2 sentences]

## Must Fix 🔴
- [Critical issues that block merge]

## Should Fix 🟡
- [Important improvements]

## Consider 🟢
- [Nice-to-have suggestions]

## Praise ⭐
- [What was done well]
```
```

---

Use these examples as reference when creating your own skills!
