# Scenarios, Conflicts & Recovery

Detailed reference for [../SKILL.md](../SKILL.md) (Git Workflow). Conflict resolution, common
scenarios, troubleshooting, config, and a command quick reference.

> Environment note: the Claude Code Bash sandbox does **not** support interactive flags
> (`git rebase -i`, `git add -i`). Use the non-interactive equivalents shown below.

## Resolving conflicts

Prevent them by rebasing frequently and keeping branches short-lived (merge within 1–3 days).
When a rebase hits a conflict:

```bash
git rebase origin/main
# CONFLICT (content): Merge conflict in src/auth/middleware.mjs

# 1. Open each conflicted file, find the markers:
#    <<<<<<< HEAD           (current main)
#    =======
#    >>>>>>> feat/...        (your branch)
# 2. Resolve (keep one side, combine, or rewrite), remove the markers.

git add src/auth/middleware.mjs      # stage each resolved file
git rebase --continue                # repeat until done
git push --force-with-lease          # reconcile the rewritten branch
```

If the conflict is too tangled: `git rebase --abort` returns you cleanly to the pre-rebase
state. Then consider breaking the feature into smaller pieces or refactoring the conflicting
code on its own branch first.

## Common scenarios

### 1. Update a feature branch with latest main

```bash
git checkout feat/my-feature
git fetch origin
git rebase origin/main            # preferred — linear history
git push --force-with-lease
```

### 2. Accidentally committed to main

```bash
# Not pushed yet:
git reset HEAD~1                  # undo commit, keep changes in working tree
git checkout -b feat/my-feature
git add <paths> && git commit -m "feat: ..."
git push -u origin feat/my-feature

# Already pushed (coordinate with the team):
git revert <commit-sha>          # additive revert — does NOT rewrite public history
git push
```

### 3. Update a commit message

```bash
git commit --amend               # rewrites the tip commit
# If already pushed: git push --force-with-lease  (avoid if others have pulled it)
```

### 4. Split a large commit (non-interactive)

```bash
git reset HEAD~1                 # uncommit, keep changes staged-less
git add src/auth/models.mjs      && git commit -m "feat: add user model"
git add src/auth/middleware.mjs  && git commit -m "feat: add auth middleware"
git add tests/                   && git commit -m "test: add auth tests"
```

### 5. Cherry-pick a specific commit

```bash
git log feat/other-feature       # find the sha
git cherry-pick <commit-sha>     # resolve conflicts if any, then git cherry-pick --continue
```

## Troubleshooting

### Detached HEAD

```bash
git checkout -b recover-branch   # keep the state on a new branch
# or discard and return: git checkout main
```

### Recover an accidentally deleted branch

```bash
git reflog                       # find the last commit sha of the branch
git checkout -b recovered-branch <commit-sha>
```

### Large file committed by mistake

```bash
# git-filter-repo is the modern, recommended tool (filter-branch is deprecated & slow):
git filter-repo --path large-file.bin --invert-paths
# or BFG Repo-Cleaner:
bfg --delete-files large-file.bin
```

### Undo the last commit

```bash
git reset --soft HEAD~1          # keep changes staged
git reset --hard HEAD~1          # discard changes (destructive)
git revert HEAD                  # safe revert if already pushed
```

## Recommended git config

```bash
git config --global pull.rebase true        # rebase instead of merge on pull
git config --global rebase.autoStash true   # auto-stash/unstash around rebase
git config --global fetch.prune true        # drop deleted remote branches on fetch
git config --global init.defaultBranch main
git config --global color.ui auto
```

Useful aliases:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --all'
```

## Command quick reference

```bash
# Status / info
git status
git log --oneline --graph
git branch --all

# Branch
git checkout -b feat/new-feature
git checkout main

# Stage / commit
git add <paths>                  # explicit paths, never -A / .
git commit -m "message"
git commit --amend

# Sync
git fetch origin
git pull origin main
git push -u origin feat/branch
git push --force-with-lease      # after rebase; never bare --force to a shared branch

# Rebase
git rebase origin/main
git rebase --continue
git rebase --abort

# Clean up
git branch -d feat/branch
git push origin --delete feat/branch

# Stash
git stash
git stash pop
git stash list
```
