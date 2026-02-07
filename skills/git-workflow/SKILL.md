---
name: Git Workflow
description: Defines git workflow patterns including branching strategy, commit conventions, and PR practices.
---

# Git Workflow and Branching Strategy

## Overview

NXTG-Forge follows a **trunk-based development** approach with short-lived feature branches. This workflow emphasizes continuous integration, small frequent commits, and maintaining a deployable main branch.

## Branch Strategy

### Main Branch (`main`)

- **Always deployable**: Every commit on main should be production-ready
- **Protected**: Requires pull requests and passing CI checks
- **Source of truth**: All feature branches originate from main

### Feature Branches

- **Short-lived**: Typically 1-3 days
- **Single purpose**: One feature or fix per branch
- **Naming convention**: `feat/description`, `fix/description`, `refactor/description`

```bash
# Feature branch examples
feat/user-authentication
feat/payment-integration
fix/login-validation-bug
refactor/clean-architecture-migration
docs/api-documentation
```

### No Long-Lived Branches

We **do not** use:

- `develop` branch
- `release` branches
- `hotfix` branches (fix directly from main)

---

## Workflow Steps

### 1. Start New Work

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/user-authentication

# 3. Verify branch
git branch --show-current
# Output: feat/user-authentication
```

### 2. Make Changes

```bash
# 1. Work on feature
# Edit files...

# 2. Check status frequently
git status

# 3. Stage changes
git add forge/auth/
git add tests/unit/test_auth.py

# 4. Commit with descriptive message
git commit -m "Add JWT authentication middleware

- Implement JWT token validation
- Add token expiration checking
- Create authentication decorator
- Add unit tests for middleware

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. Keep Branch Updated

```bash
# Rebase frequently to stay current
git fetch origin
git rebase origin/main

# If conflicts occur
# 1. Resolve conflicts in files
# 2. Stage resolved files
git add <resolved-files>
# 3. Continue rebase
git rebase --continue
```

### 4. Push Changes

```bash
# First push (set upstream)
git push -u origin feat/user-authentication

# Subsequent pushes
git push

# Force push after rebase (use with caution)
git push --force-with-lease
```

### 5. Create Pull Request

```bash
# Using GitHub CLI
gh pr create \
  --title "Add user authentication" \
  --body "$(cat <<'EOF'
## Summary
- Implements JWT-based authentication
- Adds authentication middleware
- Includes comprehensive tests

## Test Plan
- [x] Unit tests for JWT validation
- [x] Integration tests for auth flow
- [x] Manual testing with Postman

🤖 Generated with Claude Code
EOF
)"

# OR create via GitHub web interface
```

### 6. Code Review and Merge

```bash
# After approval, merge via GitHub UI
# OR use CLI
gh pr merge --squash

# Delete feature branch
git branch -d feat/user-authentication
git push origin --delete feat/user-authentication
```

---

## Commit Message Guidelines

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code restructuring (no behavior change)
- **docs**: Documentation changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **style**: Code style changes (formatting, no logic change)

### Examples

#### Good Commit Messages

```
feat: Add user authentication system

Implement JWT-based authentication:
- JWT token generation and validation
- Authentication middleware for FastAPI
- User login/logout endpoints
- Password hashing with bcrypt

Tests include unit tests for token validation and
integration tests for auth flow.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

```
fix: Correct validation error in user registration

The email validation was rejecting valid emails with
plus signs (e.g., user+tag@example.com). Updated regex
to comply with RFC 5322.

Fixes #123

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

```
refactor: Extract database connection to separate module

Move database connection logic from main.py to
infrastructure/database.py for better separation of
concerns and testability.

No behavior changes.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Poor Commit Messages

```
fix: bug          # Too vague
wip               # Work in progress shouldn't be committed
update code       # Not descriptive
asdf              # Meaningless
```

### Commit Frequency

**DO**:

- Commit after completing a logical unit of work
- Commit when tests pass
- Commit before switching contexts
- Commit at end of work session

**DON'T**:

- Commit broken code
- Commit commented-out code
- Commit with failing tests
- Commit large unrelated changes together

---

## Pull Request Guidelines

### PR Title

Use same format as commit messages:

```
feat: Add user authentication system
fix: Correct email validation in registration
refactor: Extract database connection logic
docs: Update API documentation for v2
```

### PR Description Template

```markdown
## Summary
<!-- 1-3 bullet points describing the changes -->
- Implements JWT-based authentication
- Adds login/logout endpoints
- Includes middleware for route protection

## Motivation
<!-- Why is this change needed? What problem does it solve? -->
Users need a secure way to authenticate and access protected
resources. Current system has no authentication mechanism.

## Changes
<!-- Detailed list of changes made -->
- Added JWT token generation in `auth/jwt.py`
- Created authentication middleware in `auth/middleware.py`
- Implemented login/logout endpoints in `api/auth.py`
- Added user model with password hashing
- Created authentication tests

## Test Plan
<!-- How was this tested? -->
- [x] Unit tests for JWT token validation
- [x] Unit tests for password hashing
- [x] Integration tests for login/logout flow
- [x] Manual testing with Postman
- [x] Tested edge cases (expired tokens, invalid passwords)

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] No linting errors
- [x] Follows Clean Architecture
- [x] Backward compatible

🤖 Generated with Claude Code
```

### PR Size Guidelines

- **Small PR**: < 200 lines changed (preferred)
- **Medium PR**: 200-500 lines changed (acceptable)
- **Large PR**: > 500 lines changed (break into smaller PRs)

**Benefits of small PRs**:

- Faster reviews
- Easier to understand
- Less risk of conflicts
- Quicker feedback loop

### Review Process

1. **Self-review**: Review your own PR first
2. **CI checks**: Ensure all CI checks pass
3. **Request review**: Tag appropriate reviewers
4. **Address feedback**: Respond to all comments
5. **Approval**: Get at least one approval
6. **Merge**: Squash and merge to main

---

## Merge Strategies

### Squash and Merge (Default)

Combines all commits into a single commit on main:

```bash
# Feature branch commits:
# - Add user model
# - Add authentication
# - Fix linting errors
# - Address review feedback

# After squash merge:
# feat: Add user authentication system
```

**Advantages**:

- Clean linear history
- Easy to revert entire feature
- Hides work-in-progress commits

**Use when**:

- Multiple commits in feature branch
- Want clean history on main

### Rebase and Merge

Replays commits onto main:

```bash
# Maintains individual commits but rebases them
git rebase origin/main
git push --force-with-lease
```

**Advantages**:

- Preserves commit history
- Shows incremental progress
- Better for debugging with git bisect

**Use when**:

- Commits are already well-organized
- Want to preserve detailed history

### Never Use: Merge Commit

Creates merge commit:

```bash
# DON'T DO THIS
git merge feat/my-feature
```

**Why avoid**:

- Creates merge commits that clutter history
- Makes history harder to follow
- Complicates git bisect

---

## Handling Conflicts

### Prevention

```bash
# Rebase frequently to avoid large conflicts
git fetch origin
git rebase origin/main

# Keep branches short-lived
# Merge within 1-3 days of creation
```

### Resolution

```bash
# 1. Start rebase
git rebase origin/main

# 2. Git shows conflicts
# CONFLICT (content): Merge conflict in forge/auth/middleware.py

# 3. Open conflicted files
# Look for conflict markers:
<<<<<<< HEAD
# Current main branch code
=======
# Your feature branch code
>>>>>>> feat/user-authentication

# 4. Resolve conflicts (keep one, combine, or rewrite)

# 5. Stage resolved files
git add forge/auth/middleware.py

# 6. Continue rebase
git rebase --continue

# 7. Push (force with lease for safety)
git push --force-with-lease
```

### Abort if Needed

```bash
# If conflicts are too complex, abort and retry
git rebase --abort

# Consider alternative approaches:
# - Break feature into smaller pieces
# - Coordinate with other developers
# - Refactor conflicting code first
```

---

## Git Hooks

NXTG-Forge uses git hooks for automation (see `.claude/hooks/`):

### Pre-commit Hook

Runs before each commit:

- Formats code with Black
- Runs linting (Ruff)
- Checks type hints (MyPy)
- Validates commit message format

### Post-commit Hook

Runs after each commit:

- Updates state.json
- Logs commit to session tracking

### Pre-push Hook

Runs before push:

- Runs tests
- Checks coverage threshold
- Validates no secrets committed

---

## Common Scenarios

### Scenario 1: Update Feature Branch with Latest Main

```bash
# Option A: Rebase (preferred)
git checkout feat/my-feature
git fetch origin
git rebase origin/main
git push --force-with-lease

# Option B: Merge (if rebase is problematic)
git checkout feat/my-feature
git merge origin/main
git push
```

### Scenario 2: Accidentally Committed to Main

```bash
# If not pushed yet
git reset HEAD~1              # Undo commit, keep changes
git checkout -b feat/my-feature  # Create feature branch
git add .
git commit -m "..."
git push -u origin feat/my-feature

# If already pushed (coordinate with team)
git revert <commit-hash>      # Create revert commit
git push
```

### Scenario 3: Need to Update Commit Message

```bash
# If not pushed yet
git commit --amend

# If already pushed (avoid if others pulled)
git commit --amend
git push --force-with-lease
```

### Scenario 4: Split Large Commit

```bash
# Reset to before commit
git reset HEAD~1

# Stage and commit in pieces
git add forge/auth/models.py
git commit -m "Add user model"

git add forge/auth/middleware.py
git commit -m "Add authentication middleware"

git add tests/
git commit -m "Add authentication tests"
```

### Scenario 5: Cherry-pick Specific Commit

```bash
# Get commit hash from another branch
git log feat/other-feature

# Cherry-pick to current branch
git cherry-pick <commit-hash>

# Resolve conflicts if any
```

---

## Best Practices

### DO

✅ **Commit early, commit often**: Small, frequent commits
✅ **Write descriptive messages**: Explain why, not just what
✅ **Rebase before merging**: Keep history clean
✅ **Review your own PRs**: Catch issues before others
✅ **Keep branches short-lived**: Merge within days
✅ **Test before committing**: Ensure tests pass
✅ **Use meaningful branch names**: Clear purpose
✅ **Squash WIP commits**: Clean up before merge

### DON'T

❌ **Commit broken code**: Always ensure code works
❌ **Push directly to main**: Always use pull requests
❌ **Force push to main**: Never rewrite public history
❌ **Commit secrets**: Use environment variables
❌ **Leave commented code**: Remove or uncomment
❌ **Create long-lived branches**: Increases conflicts
❌ **Skip code review**: Even small changes need review
❌ **Ignore CI failures**: Fix before merging

---

## Git Configuration

### Recommended Git Config

```bash
# User info
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Editor
git config --global core.editor "code --wait"

# Default branch
git config --global init.defaultBranch main

# Rebase on pull
git config --global pull.rebase true

# Auto-stash during rebase
git config --global rebase.autoStash true

# Prune on fetch
git config --global fetch.prune true

# Colored output
git config --global color.ui auto
```

### Aliases

```bash
# Useful shortcuts
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --all'
```

---

## Troubleshooting

### Problem: Detached HEAD

```bash
# Create branch from current state
git checkout -b recover-branch

# Or discard changes and return to branch
git checkout main
```

### Problem: Accidentally Deleted Branch

```bash
# Find commit hash
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

### Problem: Large Files Committed

```bash
# Remove from history (careful!)
git filter-branch --tree-filter 'rm -f large-file.bin' HEAD

# Or use BFG Repo-Cleaner (faster)
bfg --delete-files large-file.bin
```

### Problem: Need to Undo Last Commit

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit
git reset --hard HEAD~1

# Create revert commit (if pushed)
git revert HEAD
```

---

## Quick Reference

### Essential Commands

```bash
# Status and info
git status
git log --oneline --graph
git branch --all
git remote -v

# Create and switch branches
git checkout -b feat/new-feature
git checkout main

# Staging and committing
git add <files>
git commit -m "message"
git commit --amend

# Syncing with remote
git fetch origin
git pull origin main
git push origin feat/branch
git push --force-with-lease

# Rebasing
git rebase origin/main
git rebase --continue
git rebase --abort

# Cleaning up
git branch -d feat/branch
git push origin --delete feat/branch
git clean -fd

# Stashing
git stash
git stash pop
git stash list
```

---

## Integration with Claude Code

### Automatic Commit Messages

Claude Code generates commit messages automatically:

```
feat: Add user authentication system

- Implement JWT token generation and validation
- Add authentication middleware for FastAPI
- Create login/logout endpoints
- Add password hashing with bcrypt
- Include comprehensive unit and integration tests

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Git Hooks Integration

NXTG-Forge hooks (`.claude/hooks/`) integrate with git workflow:

- **Pre-task**: Validates git status, warns of uncommitted changes
- **Post-task**: Suggests creating commits for completed work
- **On-file-change**: Tracks changes, updates state
- **On-error**: Suggests checkpoints before major fixes

---

**Last Updated**: 2026-01-06
**Version**: 1.0.0
**Workflow**: Trunk-Based Development
**Merge Strategy**: Squash and Merge
