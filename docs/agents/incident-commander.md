# Incident Commander

> The calm in the storm -- a crisis response specialist that brings Google SRE structure to chaos, classifies severity in seconds, and ensures every incident leaves the system stronger than before.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Engineering Leadership |
| **Model** | Opus |

---

## What It Does

The Incident Commander takes command when things break. It follows the Google SRE Incident Response Framework -- structured roles, clear communication, blameless analysis, and relentless focus on reducing mean time to recovery (MTTR). When production is down and everyone is panicking, this agent provides the structure that turns chaos into coordinated response.

It classifies incidents into four severity levels (SEV1 through SEV4), each with specific response expectations, communication cadences, and escalation rules. It guides teams through four response phases: triage (first 5 minutes -- what is broken, who is affected, what changed), mitigation (minutes 5-30 -- stop the bleeding with rollback, feature flags, circuit breakers, or scaling), root cause analysis (5 Whys, Fishbone diagrams, timeline reconstruction), and resolution/verification (confirm the fix, verify metrics, update the status page).

Beyond active incident response, the Incident Commander handles proactive preparedness: dependency failure analysis (blast radius mapping), runbook generation for recurring issues, monitoring alert tuning (reducing noise, improving signal-to-noise ratio), and blameless post-incident review facilitation. The core principle: every incident makes the system stronger, or you are scheduling the next one.

## When to Use It

- **Active production incident**: When APIs are returning 500s, error rates are spiking, deployments caused regressions, or users cannot access the product.
- **Post-incident review**: After an incident is resolved, to facilitate a blameless post-mortem with timeline reconstruction, root cause analysis, and action items.
- **Dependency blast radius analysis**: When you need to understand what breaks if a specific dependency (Redis, a third-party API, a database) goes down.
- **Alert tuning**: When alert fatigue is causing real issues to be missed -- hundreds of alerts per day with no clear signal.
- **Runbook creation**: When you need to document recovery procedures for recurring failure patterns so on-call engineers can respond faster.

Do not use this agent for performance optimization (use the Performance agent) or security vulnerability scanning (use the Security agent). The Incident Commander handles crisis response, not prevention.

## How It Works

**For Active Incidents**:
1. Gathers context from logs, git history, deployment records, and monitoring output.
2. Classifies severity using the SEV1-4 framework with specific indicator thresholds.
3. Generates status page and internal communication templates appropriate to the severity level.
4. Spawns parallel investigation tasks: check logs/errors, review recent deploys, check dependency health.
5. Recommends mitigation options (rollback, feature flag, circuit breaker, scale, restart) ranked by safety and speed.
6. Guides resolution, verifies metrics recovery, and generates post-incident artifacts.

**For Post-Incident Reviews**:
1. Reconstructs the timeline from logs, git history, and metrics.
2. Performs 5 Whys or Fishbone analysis to find the root cause.
3. Generates a blameless post-mortem document with impact quantification, timeline, and lessons learned.
4. Proposes action items with owners, deadlines, and priority levels.

## Examples

### Example 1: Triaging a Production API Outage

```
User: "Our API is throwing 500s, users can't log in"

Incident Commander:
  - Triage checklist:
    What: Login endpoint returning 500
    Who: All users attempting to authenticate
    When: Started ~15 min ago, correlates with v2.4.1 deploy
    Changed: Deploy v2.4.1 completed 20 min ago
    Trending: Error rate stable at 47%
  - Severity: SEV1 (>50% error rate on critical path)
  - Immediate recommendation: Rollback v2.4.1
    git revert HEAD (prefer revert over reset)
  - Communication: Status page template generated
  - Result: Rollback deployed, error rate returns to baseline
    in 3 minutes. Post-mortem scheduled.
```

### Example 2: Blameless Post-Mortem Facilitation

```
User: "Run a post-mortem on last week's database outage"

Incident Commander:
  - Reconstructs timeline from git log and monitoring
  - Runs 5 Whys:
    Why 1: Database queries timing out
    Why 2: New query without an index on 10M row table
    Why 3: Migration tested on dev DB with 100 rows
    Why 4: No performance testing gate for migrations
    Why 5: No production-scale test data in CI
  - Root cause: Missing performance testing gate
  - Generates post-mortem document with:
    - Impact: 47 min outage, 12K users affected, $2.3K revenue
    - What went well: detection in 3 min, rollback in 8 min
    - What to improve: migration testing, alerting lag
    - Action items: Add migration perf test (P0, due next sprint)
  - Result: Complete post-mortem with owned, deadlined action items.
```

### Example 3: Dependency Blast Radius Analysis

```
User: "What happens if Redis goes down?"

Incident Commander:
  - Discovers Redis connections in 4 services via code search
  - Maps dependency graph:
    Redis down -> session service fails -> auth fails
    Redis down -> rate limiter fails -> API unprotected
    Redis down -> cache miss -> DB load spikes 8x
  - Existing protections: circuit breaker on session (YES),
    rate limiter fallback (NO), cache fallback (NO)
  - Recommends:
    1. Add rate limiter fallback to in-memory (P0, 2 days)
    2. Add cache graceful degradation with stale reads (P1, 3 days)
    3. Redis Sentinel for automatic failover (P2, 1 week)
  - Result: Complete blast radius map with cascading failure
    paths and prioritized mitigation plan.
```

## Power Use Cases

**Runbook Library Generation**: After resolving incidents, the Incident Commander generates runbooks for each recurring pattern. Each runbook includes: trigger (what alert fires), symptoms (what to look for), exact diagnosis commands, step-by-step resolution, verification commands, and escalation procedures. Over time, this builds a library that reduces MTTR for known patterns to minutes.

**Alert Noise Reduction**: The agent analyzes alert history to identify anti-patterns: alerts on individual errors instead of error rates, static thresholds that false-positive during traffic spikes, alerts without runbooks (on-call does not know what to do), and duplicate alerts for the same incident. It recommends a three-tier alert hierarchy: page (wake someone), notify (Slack during business hours), and log (dashboard only, review weekly).

**Data Recovery Coordination**: For data corruption or loss incidents, the Incident Commander follows a strict safety checklist: stop processes that might overwrite further, snapshot current state (even if corrupted), identify the last good backup, estimate the data loss window, and restore to staging first -- never directly to production.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Master Architect** | Architect designs for resilience; Incident Commander responds when resilience fails |
| **QA Sentinel** | QA Sentinel prevents incidents through test strategy; Incident Commander handles what gets through |
| **Oracle** | Oracle detects drift that may cause future incidents; Incident Commander handles current ones |
| **DevOps agent** | DevOps handles deployment infrastructure; Incident Commander handles deployment failures |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | SEV classification, incident response framework, post-mortem facilitation, blast radius analysis, runbook generation, alert tuning |
| **L2 Pro Builder** | + `forge_capture_knowledge` records incident learnings; `forge_get_knowledge` recalls past incident patterns and resolutions |
| **L3 Ship Lord** | + Dashboard panel showing incident history, MTTR trends, runbook library, and alert quality metrics |

## Tips & Gotchas

- **Do**: Mitigate first, investigate second. Stop the bleeding before finding the bullet.
- **Do**: Classify severity UP when in doubt. You can always downgrade; upgrading after delay costs time.
- **Don't**: Blame individuals in post-mortems. Systems failed, not people. If a person made an error, the system allowed it to have impact.
- **Don't**: Keep restarting a service that does not recover after a restart. Escalate instead of hoping the third restart works.

---

*See also: [master-architect](master-architect.md), [qa-sentinel](qa-sentinel.md)*
