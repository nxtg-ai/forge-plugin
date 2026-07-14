# Commit Messages & Pull Requests

Detailed reference for [../SKILL.md](../SKILL.md) (Git Workflow). Conventions for commit
messages, PR structure, and merge strategy.

## Commit message format

```
<type>: <subject>

<body — explain WHY, not just what>

<footer — issue refs, trailers per repo convention>
```

### Types

| Type | Use for | SemVer effect (if repo follows conventional commits) |
|---|---|---|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `refactor` | Restructuring, no behavior change | — |
| `docs` | Documentation only | — |
| `test` | Adding/updating tests | — |
| `chore` | Maintenance (deps, tooling) | — |
| `perf` | Performance improvement | PATCH |
| `style` | Formatting only, no logic change | — |

### Good example

```
feat: add user authentication system

Implement JWT-based authentication:
- token generation and validation
- auth middleware for protected routes
- login/logout endpoints
- password hashing with a vetted KDF

Tests cover token validation (unit) and the full auth flow (integration).

Fixes #123
```

Note: **no boilerplate co-author trailer** — add trailers only if the target repo's convention
requires them (each NXTG repo defines its own; do not paste a generic one in).

### Poor examples (avoid)

```
fix: bug          # too vague — what bug?
wip               # WIP shouldn't be committed to a shared branch
update code       # not descriptive
asdf              # meaningless
```

### Commit frequency

**DO** commit after a logical unit of work, when tests pass, before switching context, and at
end of session. **DON'T** commit broken code, commented-out code, failing tests, or large
unrelated changes lumped together.

Stage explicit paths (`git add src/auth/ tests/auth.test.mjs`) — never `git add -A` / `git add .`,
which sweeps in unrelated dirty files and risks committing secrets or build artifacts.

## Pull requests

### PR title

Same format as commit subjects: `feat: add user authentication system`,
`fix: correct email validation in registration`.

### PR description template

```markdown
## Summary
<!-- 1–3 bullets: what changed -->
- Implements JWT-based authentication
- Adds login/logout endpoints + route-protection middleware

## Motivation
<!-- why is this needed? what problem does it solve? -->

## Changes
<!-- detailed list, file-level where useful -->

## Test Plan
- [x] Unit tests for token validation
- [x] Integration tests for login/logout
- [x] Edge cases: expired tokens, invalid passwords

## Checklist
- [x] Tests added/updated (count never decreases)
- [x] Docs updated
- [x] No lint errors
- [x] Backward compatible
```

### PR size

- **Small** (<200 lines) — preferred, fastest review.
- **Medium** (200–500 lines) — acceptable.
- **Large** (>500 lines) — break into smaller PRs.

Small PRs review faster, are easier to understand, conflict less, and give quicker feedback.

### Review process

1. Self-review your own diff first. 2. Ensure CI is green. 3. Request reviewers.
4. Address every comment. 5. Get at least one approval. 6. Squash-merge to main.

## Merge strategies

### Squash and merge (default)

Collapses all branch commits into one on `main`.

- **Pros:** clean linear history, whole feature reverts as one commit, hides WIP noise.
- **Use when:** the branch has multiple/WIP commits and you want tidy history (the common case).

### Rebase and merge

Replays the branch's individual commits onto `main`.

```bash
git fetch origin && git rebase origin/main
git push --force-with-lease
```

- **Pros:** preserves curated commit history, better `git bisect` granularity.
- **Use when:** commits are already well-organized and individually meaningful.

### Merge commit — never

```bash
git merge feat/my-feature   # DON'T do this into main
```

Creates a merge commit that clutters history, obscures the timeline, and complicates
`git bisect`. Avoid it entirely for feature integration.
