# Skill Creation Checklist

Use this checklist when creating or reviewing an Agent Skill.

## Required Elements

### Frontmatter
- [ ] `name` field is present
- [ ] `name` is lowercase (no uppercase letters)
- [ ] `name` uses hyphens for word separation (no spaces or underscores)
- [ ] `name` is 64 characters or fewer
- [ ] `name` is descriptive and unique
- [ ] `description` field is present
- [ ] `description` explains WHAT the skill does
- [ ] `description` explains WHEN to use the skill
- [ ] `description` is 1024 characters or fewer
- [ ] `description` includes relevant keywords users might say

### Instructions Body
- [ ] Clear title/heading at the top
- [ ] Overview section explaining the skill's purpose
- [ ] "When to Use" section with specific scenarios
- [ ] Step-by-step procedures are numbered and clear
- [ ] Instructions are actionable (not vague)
- [ ] Technical terms are explained when necessary

### Examples
- [ ] At least one complete example is provided
- [ ] Examples show expected input
- [ ] Examples show expected output
- [ ] Examples are realistic and useful

## Optional but Recommended

### Resources
- [ ] Helper scripts are in `./scripts/` directory
- [ ] Templates are in `./templates/` directory
- [ ] Examples are in `./examples/` directory
- [ ] All file references use relative paths
- [ ] All referenced files actually exist

### Quality
- [ ] Best practices section included
- [ ] Common issues/troubleshooting section included
- [ ] Prerequisites clearly listed
- [ ] No hardcoded paths or environment-specific values
- [ ] No sensitive information (API keys, passwords, tokens)

## Testing

- [ ] Tested with prompts that SHOULD trigger the skill
- [ ] Verified skill DOESN'T trigger for unrelated prompts
- [ ] Instructions produce correct/useful output
- [ ] All referenced files are accessible
- [ ] Scripts (if any) execute without errors

## Final Review

- [ ] Spell-checked all content
- [ ] Markdown renders correctly
- [ ] Links work properly
- [ ] Consistent formatting throughout
- [ ] Ready for team/public use
