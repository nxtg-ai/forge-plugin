---
name: Git Workflow
description: >
  Trunk-based git workflow for NXTG-Forge — branching strategy, commit conventions,
  PR practices, rebase/conflict resolution, and how the plugin's own hooks guard git
  operations. Use when creating a feature branch, writing a commit message or PR,
  rebasing onto main, resolving merge conflicts, choosing a merge strategy, recovering
  from a bad commit/reset/detached HEAD, or when a git push is blocked by a security hook.
when_to_use: >
  "how do I branch", "commit message format", "open a PR", "rebase onto main",
  "fix merge conflict", "squash vs rebase merge", "undo my last commit", "force push",
  "my push got blocked", "recover a deleted branch", "detached HEAD", "cherry-pick".
allowed-tools: Bash(git *), Bash(gh *)
---

# Git Workflow and Branching Strategy

NXTG-Forge uses **trunk-based development**: `main` stays always-deployable, work happens
on short-lived feature branches, and changes land via squash-merged PRs. This SKILL.md is
the lean operating guide; deep tables (commit/PR conventions, recovery recipes) live in the
linked reference files.

## Branch strategy

- **`main`** — always deployable, protected, requires PR + passing CI. Single source of truth.
- **Feature branches** — short-lived (1–3 days), single-purpose, named `type/description`:
  `feat/user-authentication`, `fix/login-validation-bug`, `refactor/state-migration`,
  `docs/api-guide`, `chore/dep-bump`.
- **No long-lived branches** — no `develop`, no `release/*`, no `hotfix/*`. Fix directly
  from `main` on a `fix/*` branch. (Reversing this needs an ADR.)

## The core loop

```bash
# 1. Branch off fresh main
git checkout main && git pull origin main
git checkout -b feat/user-authentication

# 2. Work → stage EXPLICIT paths (never `git add -A` / `git add .`) → commit
git add src/auth/ tests/auth.test.mjs
git commit -m "feat: add JWT auth middleware"

# 3. Stay current — rebase, don't merge main in
git fetch origin && git rebase origin/main

# 4. Push (first push sets upstream)
git push -u origin feat/user-authentication      # later pushes: git push
git push --force-with-lease                        # ONLY after a rebase, never plain --force

# 5. Open PR
gh pr create --title "feat: add user authentication" --body "$(cat <<'EOF'
## Summary
- JWT-based authentication middleware + login/logout endpoints
## Test Plan
- [x] Unit tests for token validation
- [x] Integration test for the auth flow
EOF
)"

# 6. After approval + green CI
gh pr merge --squash --delete-branch
```

Stage explicit paths, not `git add -A` — it sweeps in unrelated dirty files and secrets.
Rebase (not merge-from-main) keeps history linear. Push new work with `-u`; after a rebase
that rewrote your branch, reconcile the remote with `--force-with-lease` (safe: it refuses if
someone else pushed). See [reference/commit-and-pr.md](reference/commit-and-pr.md) for the
full commit-type list, PR template, size guidance, and merge-strategy trade-offs.

## Merge strategy

**Squash and merge is the default** — collapses WIP commits into one clean commit on `main`,
so the whole feature reverts as a unit. Use **rebase and merge** only when the branch's
commits are already well-curated and worth preserving individually. **Never** create a merge
commit (`git merge feat/x` into main) — it clutters history and complicates `git bisect`.

## When something goes wrong

The high-frequency recoveries — undo last commit, committed to main by accident, amend a
message, split a commit, cherry-pick, detached HEAD, recover a deleted branch, purge a large
file — are in [reference/scenarios-and-recovery.md](reference/scenarios-and-recovery.md).
Quick reflexes:

- **Undo last commit, keep changes:** `git reset --soft HEAD~1`
- **Already pushed?** Don't rewrite public history — `git revert <sha>` instead.
- **Rebase gone bad:** `git rebase --abort` returns you to the pre-rebase state.

## Gotchas

Real, non-obvious traps specific to this repo and the Claude Code environment:

- **The plugin's own security hook BLOCKS force-push to main.** `hooks/scripts/security-command-guard.sh`
  (PreToolUse on Bash) exits 2 — denying the tool call — on any `git push --force … main`/`master`.
  It also blocks `git reset --hard origin/*`. Push force-updates to a *branch* with
  `--force-with-lease`; stash or `git reset --soft` instead of `--hard origin/…`.
- **A quiet working tree is NOT a clean one.** The `pre-task.sh` uncommitted-changes advisory
  fires only at **>10 dirty files OR a tracked file modified >30 min ago** — small, fresh
  changes are treated as sync noise and stay silent. Absence of the warning ≠ nothing to commit;
  run `git status` yourself.
- **Interactive rebase/add don't work here.** The Claude Code Bash environment does not support
  `-i` (`git rebase -i`, `git add -i`). Use non-interactive equivalents: `git reset HEAD~N`
  + re-commit to split, `git commit --amend` for the tip, explicit `git rebase --onto`.
- **Don't hardcode a `Co-Authored-By` trailer.** Commit trailers are a per-repo convention, not
  a git requirement — follow the target repo's canon (each NXTG repo defines its own). Never
  paste a boilerplate co-author line into a repo that doesn't use it.
- **Stop-hook nudges are advisory, not gates.** `post-task.sh` (checkpoint/smaller-commit hints)
  and `smoke-test-reminder.sh` (test-after-server-change reminder) run on Stop and never block a
  commit or push — they're prompts, so acting on them is on you.
- **`--force-with-lease`, never bare `--force`.** Lease refuses the push if the remote moved
  since your last fetch, catching the case where a teammate pushed to your branch. Bare `--force`
  silently clobbers it.

## Forge integration

Git behavior is shaped by the plugin's Claude Code lifecycle hooks (`hooks/scripts/`), NOT by
classic `.git/hooks` pre-commit scripts:

| Hook (trigger) | Git-relevant effect |
|---|---|
| `security-command-guard.sh` (PreToolUse: Bash) | **Blocks** force-push to main/master and `git reset --hard origin/*` (exit 2 = deny) |
| `pre-task.sh` (UserPromptSubmit) | Advisory: warns of uncommitted changes past the >10-file / >30-min threshold; posts branch + dirty count to session tracking |
| `post-task.sh` (Stop) | Advisory: suggests `/forge:checkpoint` after major work, hints at smaller commits |
| `smoke-test-reminder.sh` (Stop) | Advisory: reminds you to smoke-test after editing server/test files |

`/forge:checkpoint` and `/forge:restore` provide governance-state snapshots that complement
git — use them at milestone boundaries, not as a replacement for commits.

## Additional resources

- [reference/commit-and-pr.md](reference/commit-and-pr.md) — commit message format + type
  glossary, good/poor examples, commit-frequency rules, PR title/description template, PR size
  guidance, review process, and the squash-vs-rebase-vs-merge-commit trade-off in full.
- [reference/scenarios-and-recovery.md](reference/scenarios-and-recovery.md) — conflict
  resolution walkthrough, the five common scenarios (update branch, accidental main commit,
  amend message, split commit, cherry-pick), troubleshooting (detached HEAD, deleted branch,
  large files, undo commit), recommended `git config`, and the essential-command quick reference.
