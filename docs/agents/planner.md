# Planner

> Transforms vague feature ideas into structured, executable implementation plans with dependency graphs, risk analysis, and phased rollout strategies.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core Workflow |
| **Model** | Sonnet |

---

## What It Does

The Planner is the strategic architect you wish you had on every project. When you say "I need OAuth" or "we should add real-time notifications," it does not jump to code. Instead, it runs a five-phase planning framework: requirements gathering, architecture design, task breakdown, risk analysis, and implementation strategy. Each phase produces concrete artifacts -- not handwavy recommendations, but actual plan files written to `.claude/plans/` with YAML frontmatter, dependency graphs, and time estimates.

What makes the Planner valuable is what it encodes about good software planning. It enforces SOLID principles in every architecture it designs. It recommends clean architecture layers (Interface, Application, Domain, Infrastructure) with dependencies flowing inward. It insists on test strategies alongside implementation plans -- not as an afterthought, but as first-class tasks with coverage targets. It knows that a "simple" feature like user preferences actually involves schema design, migration strategy, API endpoints, validation, and frontend state management.

Without the Planner, you either start coding immediately and discover architectural problems mid-sprint, or you spend an hour sketching in a notebook that nobody references again. The Planner produces living documents that track progress, record decisions, and serve as contracts between you and the agents that execute the work.

## When to Use It

- **Starting a new feature from scratch**: When you have an idea but no clear path from concept to production, the Planner decomposes it into a plan with task dependencies, time estimates, and risk mitigations.
- **Facing a complex refactoring**: When your database layer is tangled or your monolith needs breaking apart, the Planner creates a current-state analysis, target-state design, and a step-by-step transformation path with rollback strategies.
- **Deciding between architectural approaches**: When you need to choose between PostgreSQL and MongoDB, REST and GraphQL, or monolith and microservices, the Planner presents explicit trade-offs and recommends based on your project's constraints.
- **Breaking down an epic into sprint-sized tasks**: When a feature is too large for a single session, the Planner creates phased milestones with testable outcomes at each checkpoint.

Do not use the Planner for quick bug fixes (use Detective), writing actual code (use Builder via the Planner's delegation), or running quality checks (use Guardian).

## How It Works

When invoked, the Planner follows a strict five-phase protocol:

1. **Requirements Gathering** -- Asks clarifying questions: What problem does this solve? Who are the users? What are the constraints? It listens for implicit needs beyond what you stated.

2. **Architecture Design** -- Models domain entities and relationships. Designs API contracts with request/response schemas. Recommends technology choices with alternatives and reasoning. Follows clean architecture with layered dependency rules.

3. **Task Breakdown** -- Decomposes work into atomic, independently testable tasks. Each task has explicit dependencies, complexity ratings (Low/Medium/High), and subtask checklists. Tasks are ordered so nothing starts before its dependencies are complete.

4. **Risk Analysis** -- Identifies potential blockers with probability and impact ratings. Attaches mitigation strategies to each risk. Flags hard dependencies on external services or team decisions.

5. **Implementation Strategy** -- Organizes tasks into phases (Foundation, Feature Complete, Polish) with testable milestones. Writes the complete plan to `.claude/plans/{slug}.md`.

When orchestrator MCP tools are available (L2), it reads existing plans via `forge_get_plan`, checks the task board via `forge_get_tasks`, recalls past decisions via `forge_get_knowledge`, verifies alignment via `forge_check_drift`, and records architecture decisions via `forge_capture_knowledge`.

After you approve a plan, the Planner delegates execution -- spawning Builder and Testing agents in parallel with strict file-boundary contracts, then running Guardian for quality gates.

## Examples

### Example 1: Planning an OAuth2 Feature

```
User: "I need to add OAuth2 authentication to my API"

Planner:
  - Asks: "Which providers? Google, GitHub, or custom? Do you need refresh tokens? What's the session strategy?"
  - Designs: Domain model (User, Session, OAuthToken), API endpoints (POST /auth/login, GET /auth/callback, POST /auth/refresh)
  - Breaks down: 8 tasks across 3 phases -- token handling, session management, middleware, tests
  - Writes plan to: .claude/plans/oauth2-authentication.md
  - Result: A 45-line plan file with YAML frontmatter, task dependencies, and 12-hour estimate
```

### Example 2: Refactoring a Monolithic Service

```
User: "Our activity-service.ts is 800 lines and does everything"

Planner:
  - Analyzes: Reads the file, identifies 5 distinct responsibilities mixed together
  - Designs target state: ActivityService, NotificationService, MetricsService, WebSocketManager, ActivityRepository
  - Maps dependencies: Notification depends on Activity, Metrics depends on both
  - Creates rollback strategy: Extract one service at a time, run tests after each extraction
  - Result: Phased refactoring plan with green-test checkpoints between each extraction
```

### Example 3: Multi-Domain Feature Design

```
User: "Build a real-time analytics dashboard with historical data"

Planner:
  - Identifies domains: Database (schema), API (endpoints), UI (components), Performance (real-time)
  - Designs: Event sourcing schema, aggregation queries, WebSocket push, React virtualized table
  - Routes specialists: database agent for schema, api agent for endpoints, ui agent for components
  - Phases: Schema + API first, then UI, then performance optimization
  - Result: Plan with 14 tasks across 4 phases, domain specialists pre-assigned
```

## Power Use Cases

**Parallel Agent Delegation**: After plan approval, the Planner spawns Builder and Testing agents simultaneously with non-overlapping file boundaries. Builder writes `src/*.ts`, Testing writes `src/__tests__/*.test.ts`. No merge conflicts, true parallel execution. This cuts implementation time roughly in half.

**Domain-Aware Specialist Routing**: The Planner knows which specialist agent handles which concern. A feature touching the database gets the Database agent queued after Builder. An API feature gets the API agent. Compliance-sensitive features get the Compliance agent in the quality gate phase. You do not need to know which agents exist -- the Planner routes for you.

**Checkpoint-Based Refactoring**: For large refactors, the Planner creates plans where each phase ends with a "tests pass" milestone. If phase 3 breaks something, you roll back to the phase 2 checkpoint without losing all progress. This is particularly valuable for extracting services from monoliths.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Guardian** | Planner creates the plan, Guardian validates the result. After Builder and Testing complete, Guardian runs the quality gate to verify tests pass, types check, and security is clean. |
| **Builder** | Planner delegates implementation to Builder with precise file boundaries and spec references. Builder executes without architectural ambiguity. |
| **Testing** | Planner spawns Testing in parallel with Builder. Testing writes tests from the same spec, ensuring coverage from day one. |
| **Detective** | When planning a refactor, Planner can invoke Detective first to analyze current code health, then design improvements based on real data. |
| **/forge:feature** | The `/forge:feature` command is the typical entry point that activates the Planner through the Orchestrator. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full planning framework with five phases. Plans written to `.claude/plans/`. Agent delegation via Task tool. Architecture design with SOLID principles. Risk analysis and phased implementation strategies. |
| **L2 Pro Builder** | Reads existing master plan via `forge_get_plan` to avoid duplicate work. Checks current task board via `forge_get_tasks`. Recalls past architecture decisions via `forge_get_knowledge`. Verifies plan alignment with project vision via `forge_check_drift`. Records new decisions via `forge_capture_knowledge`. |
| **L3 Ship Lord** | Plan progress and task status visible in the forge-ui dashboard. Task board renders pending/active/completed tasks from the orchestrator state. |

## Tips & Gotchas

- **Do**: Let the Planner ask its clarifying questions before rushing to implementation. The requirements phase catches 80% of mid-sprint surprises.
- **Don't**: Skip plan approval. The Planner will present a plan and wait for your explicit "yes" before writing anything. This is a feature, not friction.
- **Do**: Use the Planner for refactoring, not just new features. Its current-state/target-state analysis with rollback strategies makes large restructurings safe.
- **Don't**: Ask the Planner to write implementation code. It designs and delegates. If you want code, approve the plan and let it spawn Builder.

---

*See also: [Guardian](guardian.md) | [Orchestrator](orchestrator.md) | [/forge:feature](../commands/feature.md)*
