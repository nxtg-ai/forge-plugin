# Health Scoring Guide

Forge assigns your project a health score from 0 to 100. The plugin also shows it as a letter grade. The orchestrator's score reflects problems such as missing specs, failed or stuck tasks, and drift from your plan.

## Checking Your Score

**L1 (plugin)**:
```
/nxtg-forge:status
```

**L2 (orchestrator)**:
```bash
forge doctor
```

`forge status` shows no health score. The two scores measure different things; see [Plugin vs. Orchestrator Health](#plugin-vs-orchestrator-health).

## The Letter Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90-100 | Project is well-governed. Spec exists, tasks are tracked, no critical issues. |
| **B** | 80-89 | Minor gaps. A few warnings but nothing blocking. |
| **C** | 70-79 | Needs attention. Critical findings or significant drift detected. |
| **D** | 60-69 | Serious problems. Multiple critical issues or heavy drift. |
| **F** | 0-59 | Project governance is broken. Immediate remediation needed. |

## How the Score is Calculated

The orchestrator's score (`forge_get_health`) starts at 100 and deducts for problems found:

| Finding Severity | Deduction | Example |
|-----------------|-----------|---------|
| **Critical** | -20 points | No `.forge/` directory, missing `state.json`, a pending task that depends on a task that does not exist |
| **Warning** | -5 points | No SPEC.md, no README, missing `events.jsonl`, an orphaned file lock, a task assigned or in progress for over 24h, failed tasks (one finding however many fail) |
| **Info** | 0 points | No plan, no tasks, task progress, every knowledge-base finding (no score impact) |

**Drift penalty**: If Forge detects that your work has drifted from your spec, an additional penalty applies:
- `drift_score * 30` points deducted
- Drift of 0.0 (no drift) = 0 penalty
- Drift of 0.5 (moderate) = -15 points
- Drift of 1.0 (severe) = -30 points

The score is clamped between 0 and 100.

### Example Calculations

| Scenario | Findings | Score |
|----------|----------|-------|
| Clean project (spec + README + tasks + knowledge), no drift | 0 critical, 0 warning | 100 (A) |
| Missing spec and README | 0 critical, 2 warning | 90 (A) |
| No `.forge/`, no spec, no README | 1 critical, 2 warning | 70 (C) |
| No `.forge/`, no README, moderate drift (0.5) | 1 critical, 1 warning, drift 0.5 | 60 (D) |
| 3 critical issues | 3 critical, 0 warning | 40 (F) |

## What Gets Checked

The governance checker examines 5 dimensions:

### 1. Documentation
- Is there a SPEC.md? (Warning if not)
- Is there a README? (Warning if not)
- Is there a plan, and is every task done? (Info)

### 2. Architecture
- Does `.forge/` exist? (Critical if not)
- Are `state.json` (Critical) and `events.jsonl` (Warning) there?
- Are there tasks (Info if none), and any orphaned file locks (Warning)?

### 3. Task Health
- Has a task been assigned or in progress for over 24h? (Warning)
- Does a pending task depend on a missing task? (Critical)
- Are any tasks failed? (one Warning)
- Progress (Info)

### 4. Knowledge Base
- Has the project captured any knowledge (decisions, learnings, research, patterns)?
- Every knowledge finding is Info, not a deduction.

### 5. Drift Detection
- Compares completed tasks against SPEC.md (or `.forge/plan.md` when there is no SPEC.md)
- Uses the configured AI brain (OpenAI or rule-based) to assess alignment
- Drift score of 0.0 = perfect alignment, 1.0 = completely diverged

## Improving Your Score

| Problem | Grade Impact | Fix |
|---------|-------------|-----|
| No spec file | Warning (-5) | Create a SPEC.md describing your project goals |
| No README | Warning (-5) | Add a README.md |
| Failed tasks | One Warning (-5), however many fail | Review and retry or reassign failed tasks |
| No `.forge/` | Critical (-20) | Run `forge init` |
| Heavy drift | Up to -30 | Bring the work back in line with the spec, or update your spec to reflect intentional changes |
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
