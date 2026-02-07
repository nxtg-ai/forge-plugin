---
description: "Deploy with pre-flight validation and safety checks"
---

# NXTG-Forge Deploy

You are the **Deployment Manager** - validate and deploy the application with comprehensive safety checks.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Interactive deployment with full validation
- `--validate-only`: Run pre-deployment checks only, don't deploy
- `--dry-run`: Show what would happen without executing
- `--skip-tests`: Skip test execution (not recommended)

## Step 1: Pre-Deployment Validation

Run all checks and report status:

### 1a. TypeScript Check
```bash
npx tsc --noEmit 2>&1
```

### 1b. Test Suite
```bash
npx vitest run --reporter=verbose 2>&1
```

### 1c. Security Audit
```bash
npm audit 2>/dev/null
```

### 1d. Git Status
```bash
git status --porcelain
git log --oneline -1
```

### 1e. Build Check
```bash
npm run build 2>&1
```

Display validation results:
```
PRE-DEPLOYMENT VALIDATION
===========================

  TypeScript:  {PASS / FAIL - N errors}
  Tests:       {PASS / FAIL - N/M passing}
  Security:    {PASS / WARN - N vulnerabilities}
  Git:         {CLEAN / DIRTY - N uncommitted}
  Build:       {PASS / FAIL}

  Overall: {READY / NOT READY}
```

### If `--validate-only`, stop here.

## Step 2: Deployment Decision

If any checks failed:
```
Deployment blocked:
  - {list of failed checks}

Fix these issues before deploying:
  /frg-test    Fix failing tests
  /frg-optimize  Address code issues
```

If all checks pass, ask user to confirm:
```
All checks passing. Ready to deploy.

Deploy now? This will:
  1. Build the project
  2. Run the deploy script (if configured)
  3. Create a deployment checkpoint

Proceed?
```

Use AskUserQuestion for confirmation.

## Step 3: Deploy

1. Create pre-deploy checkpoint:
```bash
mkdir -p .claude/checkpoints
```
Save checkpoint with ID `pre-deploy-{timestamp}`.

2. Build:
```bash
npm run build 2>&1
```

3. Deploy (project-specific):
```bash
# Check for deploy script in package.json
npm run deploy 2>/dev/null || echo "No deploy script found"
```

If no deploy script exists, inform user and suggest options:
```
No deploy script found in package.json.

To add one, add to package.json scripts:
  "deploy": "your-deploy-command"

Common deploy targets:
  - Vercel: npx vercel --prod
  - Netlify: npx netlify deploy --prod
  - Docker: docker build -t app . && docker push app
  - Custom: scp -r dist/ server:/path/
```

## Step 4: Post-Deploy Verification

After deployment:
```
DEPLOYMENT COMPLETE
=====================
  Version: {package version}
  Commit: {git hash}
  Branch: {git branch}
  Checkpoint: pre-deploy-{timestamp}

  Rollback: /frg-restore pre-deploy-{timestamp}
```

## Error Handling

If build or deploy fails:
```
Deployment failed at: {stage}
Error: {error message}

Recovery:
  1. Check the error above
  2. Restore checkpoint: /frg-restore pre-deploy-{timestamp}
  3. Fix the issue
  4. Try again: /frg-deploy
```
