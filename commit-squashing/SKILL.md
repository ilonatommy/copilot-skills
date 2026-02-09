---
name: commit-squashing
description: Squashes multiple git commits into a single commit with a clean message. Use when cleaning up commit history, combining WIP commits, preparing branches for merge, tidying feature branches, or when asked to squash, combine, or consolidate commits.
---

# Commit Squashing Skill

Helps squash multiple git commits into a single, well-structured commit to maintain a clean git history.

## When to Use This Skill

- Cleaning up a feature branch before merging to main
- Combining multiple WIP/fix commits into one logical commit
- Preparing a pull request with clean commit history
- User explicitly asks to "squash", "combine", or "consolidate" commits

## Prerequisites

- Git installed and available in PATH
- Working directory is a git repository
- Commits to squash are on the current branch

## Step-by-Step Process

### Step 1: Analyze Current Commit History

First, review the commits that will be squashed:

```powershell
# Show last N commits with summary
git log --oneline -n 10

# Show with more detail
git log --pretty=format:"%h %s%n%b" -n 10
```

### Step 2: Determine Squash Strategy

Choose the appropriate method based on the situation:

| Scenario | Method |
|----------|--------|
| Squash last N commits | Interactive rebase: `git rebase -i HEAD~N` |
| Squash into specific commit | Interactive rebase to that commit |
| Squash all commits on branch | Soft reset + recommit |
| Squash before merge (PR) | Merge with `--squash` flag |

### Step 3: Execute the Squash

#### Method A: Interactive Rebase (Most Flexible)

```powershell
# Replace N with number of commits to squash
git rebase -i HEAD~N
```

In the editor that opens:
1. Keep `pick` for the first (oldest) commit
2. Change `pick` to `squash` (or `s`) for commits to combine
3. Save and close
4. Edit the combined commit message when prompted

#### Method B: Soft Reset (Quick for All Branch Commits)

```powershell
# Find the commit to reset to (usually branch point)
git merge-base main HEAD

# Soft reset preserving changes
git reset --soft <commit-hash>

# Create new squashed commit
git commit -m "feat: your squashed commit message"
```

#### Method C: Merge Squash (For PRs)

```powershell
# From the target branch (e.g., main)
git merge --squash feature-branch
git commit -m "feat: merged feature with squashed commits"
```

### Step 4: Craft a Good Commit Message

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat(auth): implement OAuth2 login flow

- Add OAuth2 provider configuration
- Create login/callback endpoints  
- Implement token refresh logic
- Add user session management

Closes #123
```

### Step 5: Force Push (If Needed)

If commits were already pushed, force push is required:

```powershell
# Force push with lease (safer)
git push --force-with-lease

# Or standard force push
git push --force
```

> ⚠️ **Warning**: Only force push on branches where you're the sole contributor, or coordinate with your team.

## Examples

### Example 1: Squash Last 3 Commits

**Situation**: You made 3 commits for one feature:
- `abc123 wip: started login form`
- `def456 fix: typo in validation`
- `ghi789 done: login form complete`

**Commands**:
```powershell
git rebase -i HEAD~3
# Change to: pick abc123, squash def456, squash ghi789
# Save and write new message
```

**Result**: Single commit with clean message.

### Example 2: Squash Feature Branch Before PR

**Situation**: Feature branch has 10 messy commits, need to squash before merging to main.

**Commands**:
```powershell
# Find where branch diverged
git merge-base main feature-branch
# Returns: 1a2b3c4

# Soft reset
git reset --soft 1a2b3c4

# Create clean commit
git commit -m "feat(dashboard): add analytics dashboard

- Implement chart components
- Add data fetching hooks
- Create dashboard layout
- Add unit tests"

# Force push
git push --force-with-lease
```

### Example 3: Undo a Bad Squash

**Situation**: Squash went wrong, need to recover.

**Commands**:
```powershell
# Find the commit before rebase in reflog
git reflog

# Reset to that state
git reset --hard HEAD@{n}
```

## Best Practices

- **Always backup first**: Create a temporary branch before squashing
- **Use `--force-with-lease`**: Safer than `--force`, prevents overwriting others' work
- **Write meaningful messages**: The squashed commit message should describe the full change
- **Squash before PR review**: Don't squash during review (loses review context)
- **Don't squash shared history**: Never rewrite commits others have based work on

## Common Issues

### Issue 1: Rebase Conflicts
**Problem**: Conflicts appear during interactive rebase
**Solution**: 
```powershell
# Resolve conflicts in files, then:
git add .
git rebase --continue
# Or abort and try different approach:
git rebase --abort
```

### Issue 2: Lost Commits After Squash
**Problem**: Can't find original commits
**Solution**: Use `git reflog` to find and recover them

### Issue 3: Push Rejected After Squash
**Problem**: Remote rejects push because history diverged
**Solution**: Use `git push --force-with-lease` (only on your own branches!)

## Quick Reference

| Action | Command |
|--------|---------|
| View commits | `git log --oneline -n 10` |
| Interactive rebase | `git rebase -i HEAD~N` |
| Soft reset | `git reset --soft <commit>` |
| Find branch point | `git merge-base main HEAD` |
| Force push safely | `git push --force-with-lease` |
| Undo rebase | `git reset --hard HEAD@{1}` |
| Check reflog | `git reflog` |
