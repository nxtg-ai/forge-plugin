# Git Workflow

> Defines the trunk-based development workflow, conventional commit format, PR practices, merge strategies, and conflict resolution patterns that agents follow for all version control operations.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Workflow |

---

## What It Provides

This skill encodes a complete git workflow: trunk-based development with short-lived feature branches, conventional commit message format, PR title and description templates, squash-and-merge as the default merge strategy, conflict resolution procedures, git hook integration, and common scenario playbooks (accidentally committed to main, need to split a large commit, cherry-pick from another branch). It covers the full lifecycle from creating a feature branch to merging and cleaning up.

Without this skill, agents produce inconsistent commit messages ("update stuff", "fix bug", "wip"), create long-lived branches that accumulate merge conflicts, skip PR descriptions, and use merge commits that clutter history. The skill enforces a disciplined workflow that produces a clean, linear, bisectable git history with meaningful commit messages that automated tools can parse for changelog generation.

The knowledge is both prescriptive (follow these conventions) and practical (here is what to do when you accidentally committed to main, when you need to update a pushed commit message, when conflicts are too complex to resolve). It includes recommended git configuration (pull.rebase, rebase.autoStash, fetch.prune) and useful aliases.

## When It Activates

- When creating branches, commits, or pull requests
- When resolving merge conflicts or rebasing branches
- When setting up git hooks or CI workflows
- When recovering from git mistakes (wrong branch, bad commit, lost branch)

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Trunk-Based Development

Main branch is always deployable, protected, and the source of truth. Feature branches are short-lived (1-3 days), single-purpose, and named by convention (`feat/`, `fix/`, `refactor/`, `docs/`). No develop branch, no release branches, no long-lived branches. Hotfixes go directly from main. This model reduces merge conflicts, simplifies CI, and ensures every developer is working against a recent, stable baseline.

### Conventional Commit Messages

Format: `<type>: <subject>` with optional body and footer. Types: feat, fix, refactor, docs, test, chore, perf, style. The subject explains what changed and why. The body provides detail. The footer references issues. This convention enables automated changelog generation, semantic versioning, and meaningful `git log` output. The skill includes explicit anti-patterns: "update stuff", "wip", "asdf", "fix bug" -- vague messages that provide zero information to future developers.

### Commit Discipline

Commit after completing a logical unit of work, when tests pass, before switching contexts, and at end of session. Never commit broken code, commented-out code, failing tests, or large unrelated changes together. This discipline ensures every commit is a safe point to revert to and that `git bisect` can identify exactly which change introduced a bug.

### Squash and Merge

The default merge strategy combines all feature branch commits into a single commit on main. A feature branch with five intermediate commits ("add model", "fix typo", "add tests", "fix linting", "address review") becomes a single clean commit ("feat: Add user authentication system"). This produces a linear history where each commit on main represents a complete, reviewed feature. The skill also covers when rebase-and-merge is appropriate (when commits are already well-organized) and why merge commits should be avoided (they clutter history and complicate bisect).

### Conflict Resolution Playbook

Prevent conflicts by rebasing frequently and keeping branches short-lived. When conflicts occur: start rebase, open conflicted files, look for conflict markers, resolve (keep one side, combine, or rewrite), stage resolved files, continue rebase. If conflicts are too complex, abort and consider breaking the feature into smaller pieces or coordinating with the conflicting developer. Force push after rebase uses `--force-with-lease` (not `--force`) for safety.

### Recovery Scenarios

Five detailed playbooks: accidentally committed to main (reset if not pushed, revert if pushed), need to update commit message (amend if not pushed, amend + force-with-lease if pushed), split a large commit (reset HEAD~1, stage and commit in pieces), cherry-pick from another branch, and recover a deleted branch (find hash in reflog, recreate branch). These scenarios cover the most common git mistakes developers make.

## How to Leverage It

The skill activates automatically during git operations. When agents create commits, they follow the conventional format. When they create PRs, they use the description template. When they encounter conflicts during rebase, they follow the resolution procedure.

### Example: Feature Branch Workflow

```
User: "Implement user authentication and create a PR"

What happens: The skill activates and the agent creates a feature branch
(feat/user-authentication), makes focused commits with conventional messages,
creates a PR with the full description template (Summary, Motivation, Changes,
Test Plan, Checklist), and recommends squash-and-merge.
```

## Power Applications

The git hook integration ties this workflow to NXTG-Forge's quality system. Pre-commit hooks run formatters and linters. Pre-push hooks run tests and check for secrets. Post-commit hooks update state.json. This automation ensures that every commit meets quality standards without manual checks.

The recommended git configuration (pull.rebase, rebase.autoStash, fetch.prune) prevents common workflow problems: pull.rebase avoids unnecessary merge commits, autoStash handles dirty working directories during rebase, and fetch.prune cleans up deleted remote branches locally.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **coding-standards** | Commit message format defined in coding standards, enforced here |
| **documentation** | Changelog generation depends on conventional commits defined here |
| **claude-code-best-practices** | Claude Code workflow patterns that integrate with this git workflow |

## Tips

- Branch lifetime is the strongest predictor of merge conflict severity. Keep branches under 3 days.
- Conventional commits are not optional. Automated changelog generation and semantic versioning depend on them.

---

*See also: [coding-standards](coding-standards.md) | [documentation](documentation.md)*
