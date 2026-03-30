# /forge:deploy

> Deploy with comprehensive pre-flight validation -- type checking, tests, security audit, build verification, and git cleanliness -- before executing the deployment.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Quality & Testing |
| **Syntax** | `/forge:deploy [--validate-only] [--dry-run] [--skip-tests]` |

---

## What It Does

`/forge:deploy` is the safety-first deployment command. Before any deployment action occurs, it runs a five-point pre-flight validation: TypeScript compilation, full test suite, security audit, git cleanliness check, and production build. Each check produces a PASS or FAIL result, and the overall verdict is READY or NOT READY. If any check fails, deployment is blocked with specific guidance on what to fix.

When all checks pass and you confirm, the command creates a pre-deployment checkpoint (so you can roll back), executes the build, and runs your project's deploy script. If no deploy script exists in `package.json`, it suggests common deployment targets: Vercel, Netlify, Docker, or custom SCP. After deployment, it shows the version, commit hash, branch, and checkpoint ID for rollback.

Without this command, deployment is a manual checklist: run tests, check types, audit dependencies, verify git is clean, build, deploy, hope nothing was missed. `/forge:deploy` enforces the checklist programmatically and creates an automatic rollback point.

## Syntax & Options

```
/forge:deploy [--validate-only] [--dry-run] [--skip-tests]
```

| Option | Description |
|--------|------------|
| `--validate-only` | Run all pre-deployment checks without deploying. Useful as a CI gate. |
| `--dry-run` | Show what would happen at each step without executing any actions |
| `--skip-tests` | Skip the test suite execution (not recommended; the command warns you) |

## When to Use It

- **Before any production deployment**: Run the full pipeline to catch issues before they reach users.
- **As a CI validation gate**: Use `--validate-only` to run all checks without deploying, suitable for pull request checks.
- **After a sprint of changes**: When you have accumulated multiple commits and want to deploy with confidence.

For just running tests, use `/forge:test`. For just checking project health, use `/forge:status`.

## Examples

### Example 1: Full Deployment Pipeline

```
/forge:deploy
```

```
PRE-DEPLOYMENT VALIDATION
===========================

  TypeScript:  PASS
  Tests:       PASS - 47/47 passing
  Security:    WARN - 2 moderate vulnerabilities
  Git:         CLEAN
  Build:       PASS

  Overall: READY

All checks passing. Ready to deploy.
```

After confirmation, it creates a checkpoint, builds, and deploys.

### Example 2: Validation Only

```
/forge:deploy --validate-only
```

Runs all five checks and reports results without deploying. Stops after the validation summary.

### Example 3: Failed Validation

```
/forge:deploy
```

```
PRE-DEPLOYMENT VALIDATION
===========================

  TypeScript:  FAIL - 3 errors
  Tests:       FAIL - 2/47 failing
  Security:    PASS
  Git:         DIRTY - 5 uncommitted
  Build:       FAIL

  Overall: NOT READY

Deployment blocked:
  - 3 TypeScript errors
  - 2 failing tests
  - 5 uncommitted files

Fix these issues before deploying:
  /forge:test    Fix failing tests
  /forge:optimize  Address code issues
```

## Power Use Cases

Chain `/forge:checkpoint save pre-deploy` then `/forge:deploy` to create a named checkpoint before the deployment's automatic checkpoint. This gives you two rollback points: one at your explicit save and one at the deployment start.

Use `--validate-only` in a pre-push hook script to enforce deployment readiness before code leaves your machine.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:test** | Deploy runs tests internally; use test for standalone debugging |
| **/forge:checkpoint** | Automatic pre-deploy checkpoint enables rollback via `/forge:restore` |
| **/forge:restore** | Roll back to the pre-deploy checkpoint if the deployment causes issues |
| **/forge:status** | Verify health metrics after deployment |
| **devops agent** | For complex deployment configurations, assign the devops agent |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full pre-flight validation, build, and deploy with automatic checkpointing |
| **L2 Pro Builder** | Deployment events recorded in orchestrator audit trail; drift check run post-deploy |
| **L3 Ship Lord** | Deployment status and history visible in the forge-ui dashboard |

## Tips & Gotchas

- The deploy command looks for a `"deploy"` script in `package.json`. If none exists, it shows you how to add one for common platforms.
- The automatic checkpoint is named `pre-deploy-{timestamp}`. Use `/forge:restore pre-deploy-{timestamp}` to roll back.
- `--skip-tests` is available but explicitly discouraged. The command warns you when you use it.
- Security warnings (moderate vulnerabilities) do not block deployment by default, but critical and high vulnerabilities do.

---

*See also: [test](../commands/test.md) | [checkpoint](../commands/checkpoint.md) | [restore](../commands/restore.md)*
