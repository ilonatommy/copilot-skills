---
name: skill-writer
description: A meta-skill for creating new Agent Skills. Use this skill when you need to create, structure, or write a new skill for GitHub Copilot. Helps with SKILL.md file format, YAML frontmatter, skill directory structure, writing effective instructions, and organizing skill resources.
---

# Skill Writer - Create Agent Skills

This skill helps you create well-structured Agent Skills for GitHub Copilot, VS Code, Copilot CLI, and the Copilot coding agent.

## When to Use This Skill

- Creating a new Agent Skill from scratch
- Converting existing documentation or workflows into a skill
- Improving or refactoring an existing skill
- Understanding the Agent Skills standard

## Skill Directory Structure

Each skill should follow this structure:

```
.github/skills/
└── your-skill-name/
    ├── SKILL.md           # Required: Main skill definition
    ├── scripts/           # Optional: Helper scripts
    │   └── example.sh
    ├── examples/          # Optional: Example files
    │   └── sample.md
    └── templates/         # Optional: Templates for output
        └── template.md
```

Alternative locations:
- **Project skills**: `.github/skills/` (recommended) or `.claude/skills/` (legacy)
- **Personal skills**: `~/.copilot/skills/` (recommended) or `~/.claude/skills/` (legacy)

## SKILL.md File Format

### 1. YAML Frontmatter (Required)

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: your-skill-name
description: A clear description of what this skill does and when to use it.
---
```

#### Frontmatter Rules:

| Field | Required | Rules |
|-------|----------|-------|
| `name` | Yes | Lowercase, hyphens for spaces, max 64 characters |
| `description` | Yes | What it does AND when to use it, max 1024 characters |

**Good name examples:**
- `webapp-testing`
- `api-documentation`
- `database-migration`

**Bad name examples:**
- `WebApp Testing` (no uppercase or spaces)
- `my_skill` (use hyphens, not underscores)
- `test` (too vague)

### 2. Skill Body (Instructions)

After the frontmatter, write clear markdown instructions covering:

1. **Purpose** - What this skill accomplishes
2. **When to Use** - Specific triggers and use cases
3. **Step-by-Step Procedures** - Detailed workflows
4. **Examples** - Input/output samples
5. **Resource References** - Links to included files

## Writing Effective Instructions

### Be Specific and Actionable

❌ **Bad**: "Help with testing"

✅ **Good**: "When the user asks to create tests for a React component, generate Jest test files that cover: rendering, user interactions, edge cases, and accessibility."

### Use Clear Section Headers

```markdown
## Prerequisites
- Node.js 18+
- Jest installed

## Step-by-Step Process
1. Analyze the component props
2. Create test file with naming convention: `ComponentName.test.tsx`
3. Write test cases for each prop variation
```

### Include Examples

```markdown
## Example

**User Request**: "Create tests for the Button component"

**Expected Output**:
- File: `Button.test.tsx`
- Coverage: onClick handler, disabled state, loading state
```

### Reference Resources with Relative Paths

```markdown
See the [test template](./templates/test-template.js) for the base structure.
Run the [setup script](./scripts/setup.sh) before testing.
```

## Description Writing Guidelines

The `description` field is critical - it determines when Copilot loads your skill.

### Include Both WHAT and WHEN

```yaml
description: Generates comprehensive API documentation from TypeScript interfaces. Use when documenting REST APIs, creating OpenAPI specs, or generating client SDK documentation.
```

### Be Keyword-Rich

Include terms users might say:
- Action verbs: "create", "generate", "debug", "test", "deploy"
- Domain terms: "React", "database", "CI/CD", "authentication"
- Task types: "migration", "refactoring", "optimization"

## Skill Template

Use this template to create new skills:

```markdown
---
name: your-skill-name
description: [What it does]. Use when [specific scenarios where this skill applies].
---

# [Skill Title]

Brief overview of what this skill helps accomplish.

## When to Use This Skill

- Scenario 1
- Scenario 2
- Scenario 3

## Prerequisites

- Requirement 1
- Requirement 2

## Step-by-Step Process

### Step 1: [First Step]
Detailed instructions...

### Step 2: [Second Step]
Detailed instructions...

## Examples

### Example 1: [Scenario Name]

**Input**: Description of what the user provides

**Output**: Description of what the skill produces

## Resources

- [Resource Name](./path/to/resource.ext) - Description
- [Another Resource](./path/to/another.ext) - Description

## Best Practices

- Best practice 1
- Best practice 2

## Common Issues

### Issue 1
**Problem**: Description
**Solution**: How to fix it
```

## Progressive Loading Optimization

Skills use three-level loading for efficiency:

1. **Level 1 (Always loaded)**: Only `name` and `description` from frontmatter
2. **Level 2 (On match)**: Full `SKILL.md` body when description matches user request
3. **Level 3 (On demand)**: Additional files only when referenced

### Optimization Tips:

- Keep frontmatter description comprehensive but under 1024 characters
- Put most critical instructions at the top of the body
- Use separate files for large code examples or templates
- Reference files with relative paths: `[script](./scripts/run.sh)`

## Checklist for New Skills

Before publishing your skill, verify:

- [ ] `name` is lowercase with hyphens, max 64 chars
- [ ] `description` explains WHAT and WHEN, max 1024 chars
- [ ] Instructions are clear and actionable
- [ ] Examples demonstrate expected input/output
- [ ] All referenced files exist in the skill directory
- [ ] Relative paths are correct
- [ ] No sensitive information (API keys, passwords)
- [ ] Tested with actual prompts that should trigger it

## Example: Creating a Code Review Skill

Here's a complete example of creating a skill:

### Directory Structure
```
.github/skills/code-review/
├── SKILL.md
├── checklists/
│   ├── security.md
│   └── performance.md
└── templates/
    └── review-comment.md
```

### SKILL.md Content
```markdown
---
name: code-review
description: Performs thorough code reviews with security, performance, and maintainability checks. Use when reviewing pull requests, auditing code quality, or preparing code for production.
---

# Code Review Skill

Guides comprehensive code review following industry best practices.

## When to Use

- Reviewing a pull request
- Auditing existing code
- Pre-merge quality checks

## Review Process

### 1. Security Review
Check the [security checklist](./checklists/security.md) for:
- Input validation
- Authentication/Authorization
- Data sanitization

### 2. Performance Review  
Check the [performance checklist](./checklists/performance.md) for:
- N+1 queries
- Memory leaks
- Unnecessary re-renders

### 3. Generate Feedback
Use the [review template](./templates/review-comment.md) to structure feedback.
```

## Related Resources

- [Agent Skills Standard](https://agentskills.io/)
- [Reference Skills Repository](https://github.com/anthropics/skills)
- [Awesome Copilot Collection](https://github.com/github/awesome-copilot)
