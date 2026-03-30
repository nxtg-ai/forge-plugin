# Analytics

> Instruments your application with meaningful metrics -- performance timing, usage tracking, quality KPIs, and developer experience measurements that drive decisions with data, not guesses.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Haiku |

---

## What It Does

The Analytics agent turns "I think the app is slow" into "agent.execution p95 is 340ms, up 45% from last week." It instruments code with metrics that matter: performance timing (bootstrap, API latency, build duration), quality indicators (test pass rate, type violations, security issues), usage patterns (feature adoption, command frequency, session duration), and developer experience measurements (time to first interaction, task completion rate, context restoration success).

What separates this agent from "add console.time everywhere" is its focus on actionable insights. Every metric it tracks is tied to a decision. Bootstrap time under 30 seconds? Good, no action needed. Over 30 seconds? Investigate which initialization step is the bottleneck. Test pass rate at 100%? Good. Dropped to 95%? Identify and fix the failing tests. The Analytics agent does not collect data for its own sake -- it collects data that tells you when something needs attention and where to look.

The agent also understands the difference between snapshots and trends. A single measurement of 28-second bootstrap time means little. Bootstrap time trending upward over three weeks means something is getting heavier and needs investigation. The Analytics agent structures its reports around trends and direction, not just current values, because trends are what drive smart engineering decisions.

## When to Use It

- **When you need to understand usage patterns**: When you want data on which features are used most, how long sessions last, or which agents get invoked the most frequently.
- **When you need to track a new metric**: When a performance budget, quality target, or business KPI needs to be instrumented and monitored over time.
- **When preparing a report**: When you need a structured snapshot of performance, quality, and usage metrics for a release review, sprint retrospective, or stakeholder update.
- **When investigating a trend**: When you suspect performance is degrading, adoption is stalling, or error rates are climbing, and need data to confirm or refute.

Do not use the Analytics agent for fixing performance issues (use Performance), diagnosing bugs (use Detective), or building dashboard UI components (use UI). Analytics instruments and reports; other agents act on the findings.

## How It Works

The Analytics agent operates in two modes:

**Instrumentation Mode:**
1. Identifies measurement points in the codebase (function entry/exit, API handlers, lifecycle hooks)
2. Adds lightweight timing, counting, and gauge instrumentation
3. Uses a consistent metrics API pattern: `metrics.startTimer()`, `metrics.increment()`, `metrics.gauge()`
4. Tags measurements with context (agent name, endpoint, status code) for dimensional analysis
5. Ensures instrumentation has negligible performance overhead

**Reporting Mode:**
1. Collects current metric values from the instrumentation layer
2. Compares against defined targets/budgets
3. Formats a structured report with current value, target, and status (pass/warning/fail)
4. Highlights trends: improving, stable, or degrading
5. Recommends actions for metrics that miss targets

Key metrics tracked:

| Category | Metrics |
|----------|---------|
| Performance | Bootstrap time, API p50/p95/p99, bundle size, memory peak, WebSocket throughput |
| Quality | Test pass rate, type violations, security issues, build success rate, error rate |
| Usage | Agent invocations by type, feature adoption, session duration, command frequency |
| Developer Experience | Time to first interaction, task completion rate, recommendation acceptance rate |

## Examples

### Example 1: Instrumenting Agent Execution Timing

```
User: "Track how long each agent takes to complete tasks"

Analytics:
  - Identifies: Agent execution entry points in orchestrator
  - Adds instrumentation:
    const timer = metrics.startTimer('agent.execution');
    await agent.run(task);
    timer.end({ agent: agent.name, status: 'success' });
  - Tags: agent name, task type, completion status
  - Enables: p50/p95/p99 breakdown by agent type
  - Result: Can now answer "which agent is slowest?" and "is agent latency trending up?"
```

### Example 2: Generating a Performance Report

```
User: "Show me the current performance metrics"

Analytics:
  - Collects current values from instrumentation:
    Bootstrap Time    28s    (target: <30s)    PASS
    API p95           180ms  (target: <500ms)  PASS
    Bundle Size       142KB  (target: <200KB)  PASS
    Memory Peak       67MB   (target: <100MB)  PASS
  - Trends:
    Bundle size: +12KB this week (chart.js dependency added)
    API p95: stable at 180ms (no change)
  - Quality:
    Test Pass Rate    100%   (357/357)         PASS
    Type Violations   3      (target: 0)       FAIL
    Security Issues   0                        PASS
  - Recommends: Fix 3 type violations (types target is zero tolerance)
  - Result: Actionable metrics report with one clear remediation item
```

### Example 3: Feature Adoption Analysis

```
User: "Which features are used most?"

Analytics:
  - Collects invocation counts over last 30 days:
    /forge:status         342 invocations   (most used)
    /forge:feature        187 invocations
    Health Check (Opt 4)  156 invocations
    Continue (Opt 1)      134 invocations
    Soundboard (Opt 3)    89 invocations
    /forge:test           67 invocations
  - Insights:
    - Status is the dominant workflow (2x feature development)
    - Soundboard underused -- consider promoting it in command center
    - Test command low -- may indicate testing is happening through Guardian instead
  - Result: Usage data that informs product priorities and UX improvements
```

## Power Use Cases

**Budget Enforcement**: Set performance budgets (bundle < 200KB, API p95 < 500ms, bootstrap < 30s) and run the Analytics agent after each feature addition. If a feature pushes a metric over budget, you catch it immediately instead of discovering the degradation weeks later.

**Release Decision Support**: Before tagging a release, run the Analytics agent to generate a metrics snapshot. If all targets pass and trends are stable or improving, the release has data-backed confidence. If any metric is degrading, you know what to fix first.

**Developer Experience Optimization**: Track meta-metrics about the development experience itself: how long does context restoration take? What percentage of agent recommendations are accepted? Where do developers get stuck? This data drives improvements to the Forge system itself.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Performance** | Analytics instruments the metrics; Performance diagnoses and fixes the bottlenecks when metrics miss targets. |
| **Detective** | Detective's health check uses Analytics metrics as inputs for the overall health score calculation. |
| **Guardian** | Guardian can check Analytics metrics as part of the quality gate -- flag releases where key metrics regressed. |
| **/forge:report** | The `/forge:report` command generates a snapshot using Analytics data for stakeholder communication. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Metrics instrumentation patterns. Structured reporting with targets and trends. Performance, quality, usage, and DX metric categories. Budget-based alerting. |
| **L2 Pro Builder** | Metrics stored via `forge_capture_knowledge` for cross-session trend analysis. Historical metrics recalled via `forge_get_knowledge`. |
| **L3 Ship Lord** | Metrics dashboards rendered in forge-ui with trend charts, budget indicators, and real-time updates via WebSocket. |

## Tips & Gotchas

- **Do**: Tie every metric to a decision. If you cannot explain what action a metric's value would trigger, do not track it.
- **Don't**: Instrument everything. Excessive metrics create noise and overhead. Track the 10-15 metrics that matter most.
- **Do**: Focus on trends, not snapshots. A single measurement is an anecdote. A trend over three weeks is data.
- **Don't**: Collect personally identifiable information in analytics. Session IDs and agent names are fine; usernames and file contents are not.
- **Do**: Include targets in every report. A number without a target is meaningless. "API p95: 180ms" says nothing. "API p95: 180ms (target: <500ms) PASS" says everything.

---

*See also: [Performance](performance.md) | [Detective](detective.md) | [/forge:report](../commands/report.md)*
