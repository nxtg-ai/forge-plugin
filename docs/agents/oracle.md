# Oracle

> The silent sentinel watching every code change -- validating scope, detecting architectural drift, and ensuring what you build stays aligned with what you said you would build.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Sonnet |

---

## What It Does

The Oracle is NXTG-Forge's proactive governance sentinel. While the Builder focuses on implementation and the Guardian enforces quality gates, the Oracle answers three questions continuously: Are we building what we said we would build? Is the implementation diverging from the stated direction? Does this change violate our governance rules?

It operates as a non-blocking advisor, never halting development. It reads the current directive from `.claude/governance.json`, analyzes code changes in real-time, and writes structured findings to the sentinel log. When a developer modifying an OAuth2 authentication system also edits a database schema file, the Oracle notes the scope expansion without stopping work. The developer sees the insight and decides whether it is intentional scope growth or accidental creep.

The Oracle thinks in three dimensions: scope validation (are the changed files within the stated workstream boundaries?), drift detection (is the implementation approach diverging from the architectural vision?), and governance compliance (does this change violate any established rules, like "all external API calls must use retry logic"?). Each finding is tagged with confidence -- high confidence findings are clear violations with concrete evidence, medium confidence findings require human judgment, and low confidence findings are not reported at all to reduce noise.

## When to Use It

- **Autonomous development monitoring**: During YOLO or semi-autonomous development, the Oracle runs in parallel with the Builder, providing continuous governance oversight without interrupting the build process.
- **Pre-commit governance check**: Before committing changes, invoke the Oracle to validate all staged changes against the current directive and governance rules.
- **Scope creep detection**: When a task seems to be growing beyond its original scope, the Oracle can identify exactly which file changes are outside the stated boundaries.
- **Architecture drift analysis**: After a period of rapid development, run the Oracle to check whether the codebase has drifted from its stated architectural vision (modular, loosely coupled, etc.).

Do not use the Oracle for quality gate enforcement (that is the Guardian) or forensic test auditing (that is the CRUCIBLE Detective). The Oracle asks "are we building the right thing?" while the Guardian asks "are we building the thing right?"

## How It Works

1. **State Reading**: Reads `.claude/governance.json` for the current directive, vision statements, and workstream boundaries.
2. **Change Analysis**: Analyzes code changes via git diff or file change events, identifying modified files and their scope.
3. **Scope Mapping**: Compares each changed file path against the stated workstream boundaries. Files outside the boundary are flagged.
4. **Drift Detection**: Compares implementation patterns (imports, module coupling, dependency direction) against stated architectural principles.
5. **Finding Generation**: Produces structured findings with type (INFO/WARN/CRITICAL), category (scope/drift/governance), and confidence level.
6. **Sentinel Log Output**: Writes findings to the sentinel log as structured JSON for consumption by the Governance HUD and other agents.

## Examples

### Example 1: Scope Validation During Auth Implementation

```
User: (Builder modifies src/auth/login.ts and src/database/users.sql)

Oracle:
  - Reads directive: "Implement OAuth2 authentication"
  - src/auth/login.ts: IN SCOPE (auth implementation)
  - src/database/users.sql: OUT OF SCOPE (database layer)
  - Finding: WARN / scope
  - Message: "Scope expansion: Database schema modifications
    detected during auth implementation"
  - Suggestion: "Consider creating a separate database migration
    workstream"
```

### Example 2: Architecture Drift Detection

```
User: "Run governance validation on my changes"

Oracle:
  - Vision: "Modular, loosely-coupled microservices"
  - Detection: New service directly imports database models from
    another service
  - Blast radius: 4 other services depend on the imported module
  - Finding: WARN / drift
  - Message: "Architecture drift: Tight coupling detected between
    user-service and billing-service via shared database models"
  - Suggestion: "Communicate via API or events instead of direct
    model imports"
```

### Example 3: Governance Rule Violation

```
User: (Builder adds a new fetch() call to an external API)

Oracle:
  - Rule: "All external API calls must use retry logic"
  - Detection: New fetch() call at src/services/payment.ts:45
    without retry wrapper
  - Finding: WARN / governance
  - Message: "Governance violation: External API call lacks retry
    policy"
  - Suggestion: "Wrap with the retryWithBackoff utility from
    src/utils/retry.ts"
```

## Power Use Cases

**Real-Time Monitoring in Autonomous Mode**: When the Builder operates autonomously, the Oracle runs in parallel as a background monitor. Every file edit triggers a scope check. The Oracle does not stop the Builder, but it creates a log of all scope expansions and drift events that the developer can review before committing.

**Progressive Analysis Depth**: The Oracle starts simple -- scope validation only -- and deepens analysis when violations are found. A clean scope check takes milliseconds. A scope violation triggers blast radius estimation (checking which other files import the changed module). This progressive approach keeps overhead near zero for clean work while providing deep insight when needed.

**Vision Alignment Audits**: Before a major release, run the Oracle against the full git diff since the last release. It produces a comprehensive alignment report showing where the codebase has grown beyond its stated architectural vision, giving the team a clear picture of accumulated drift.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Builder agent** | Oracle monitors in parallel while Builder implements -- non-blocking oversight |
| **Guardian agent** | Oracle checks strategic alignment; Guardian checks technical quality. Together: "right thing, built right" |
| **Governance Verifier** | Oracle provides ongoing monitoring; Verifier adjudicates specific flagged concerns |
| **/forge:status** | Oracle findings surface in the governance status display |
| **/forge:compliance** | Full compliance check includes Oracle's scope and drift analysis |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Scope validation, drift detection, governance compliance checks, sentinel log output |
| **L2 Pro Builder** | + `forge_check_drift` for orchestrator-level drift detection; `forge_get_state` for real-time governance context |
| **L3 Ship Lord** | + Dashboard Governance HUD with real-time Oracle feed, scope violation history, and drift trend visualization |

## Tips & Gotchas

- **Do**: Keep your `.claude/governance.json` directive current -- the Oracle is only as good as the directive it validates against.
- **Do**: Review WARN-level findings before committing. They often catch legitimate scope creep that is easy to miss when you are deep in implementation.
- **Don't**: Ignore repeated scope expansion warnings -- they are early signals of a task that needs to be split into multiple workstreams.
- **Don't**: Expect the Oracle to catch code quality issues -- it monitors strategic alignment, not code correctness.

---

*See also: [governance-verifier](governance-verifier.md), [crucible-detective](crucible-detective.md)*
