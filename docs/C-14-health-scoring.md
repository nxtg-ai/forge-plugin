# Health Scoring Guide

Forge assigns your project a health score from 0 to 100, displayed as a letter grade. The score reflects real problems — missing specs, empty task boards, failed tasks, drift from your plan.

## Checking Your Score

**L1 (plugin)**:
```
/forge:status
```

**L2 (orchestrator)**:
```bash
forge status
```

Both show the same health dimensions. The orchestrator's score includes task and drift data that the plugin doesn't have access to.

## The Letter Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90-100 | Project is well-governed. Spec exists, tasks are tracked, no critical issues. |
| **B** | 80-89 | Minor gaps. A few warnings but nothing blocking. |
| **C** | 70-79 | Needs attention. Critical findings or significant drift detected. |
| **D** | 60-69 | Serious problems. Multiple critical issues or heavy drift. |
| **F** | 0-59 | Project governance is broken. Immediate remediation needed. |

## How the Score is Calculated

The score starts at 100 and deducts for problems found:

| Finding Severity | Deduction | Example |
|-----------------|-----------|---------|
| **Critical** | -20 points | No `.forge/` directory, no spec file, failed tasks |
| **Warning** | -5 points | Missing README, no knowledge entries, empty task board |
| **Info** | 0 points | Suggestions and observations (no score impact) |

**Drift penalty**: If Forge detects that your work has drifted from your spec, an additional penalty applies:
- `drift_score * 30` points deducted
- Drift of 0.0 (no drift) = 0 penalty
- Drift of 0.5 (moderate) = -15 points
- Drift of 1.0 (severe) = -30 points

The score is clamped between 0 and 100.

### Example Calculations

| Scenario | Findings | Score |
|----------|----------|-------|
| Clean project (spec + README + tasks + knowledge) | 0 critical, 0 warning | 100 (A) |
| Missing spec and README | 0 critical, 2 warning | 90 (A) |
| No `.forge/` directory | 1 critical, 2 warning | 70 (C) |
| No `.forge/` + moderate drift (0.5) | 1 critical, 2 warning, drift 0.5 | 55 (F) |
| 3 critical issues | 3 critical, 0 warning | 40 (F) |

## What Gets Checked

The governance checker examines 5 dimensions:

### 1. Project Structure
- Does `.forge/` exist and contain valid state?
- Is there a SPEC.md or equivalent vision document?
- Is there a README.md?

### 2. Task Health
- Are there tasks in the plan?
- Are any tasks in a failed state?
- Is the task board empty?

### 3. Knowledge Base
- Has the project captured any knowledge (decisions, learnings, patterns)?
- An empty knowledge base is an Info finding, not a deduction.

### 4. Drift Detection
- Compares current task progress against the original spec
- Uses the configured AI brain (OpenAI or rule-based) to assess alignment
- Drift score of 0.0 = perfect alignment, 1.0 = completely diverged

### 5. Agent Activity
- Are agents making progress?
- Are there stale assignments (tasks assigned but not started)?

## Improving Your Score

| Problem | Grade Impact | Fix |
|---------|-------------|-----|
| No spec file | Warning (-5) | Create a SPEC.md describing your project goals |
| No README | Warning (-5) | Add a README.md |
| Failed tasks | Warning per failure (-5) | Review and retry or reassign failed tasks |
| No `.forge/` | Critical (-20) | Run `forge init` |
| Heavy drift | Up to -30 | Run `forge sync` to reconcile, or update your spec to reflect intentional changes |
| Empty knowledge | Info (0) | Use `forge_capture_knowledge` to record decisions and learnings |

## Plugin vs. Orchestrator Health

The plugin's governance-mcp server (L1) and the orchestrator's health check (L2) measure different things:

| Dimension | Plugin (L1) | Orchestrator (L2) |
|-----------|:-:|:-:|
| Git status | Yes | No |
| Test file ratio | Yes | No |
| Security scan | Yes | No |
| Code metrics | Yes | No |
| Task health | No | Yes |
| File locking | No | Yes |
| Drift detection | No | Yes |
| Knowledge base | No | Yes |
| Spec compliance | No | Yes |

The plugin focuses on code quality indicators visible from the filesystem. The orchestrator focuses on project governance state in `.forge/`. Both are valid — they measure different aspects of project health.
