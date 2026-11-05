# Agents & Skills Reference

## 33 Specialized Agents

> For detailed per-agent documentation, see [docs/agents/](agents/README.md).

Forge agents are autonomous AI specialists. Each handles a specific domain. Claude Code selects the right agent based on your request, or you can invoke them directly through commands.

### Core Workflow Agents

| Agent | Model | When to Use |
|-------|-------|------------|
| **planner** | opus | Feature planning, architecture design, task breakdown. Use when you need to decompose complex work into manageable tasks with dependencies and estimates. |
| **builder** | sonnet | Feature implementation, working code, refactoring, test generation. Invoked after a plan is approved or when specific implementation is needed. |
| **guardian** | sonnet | Quality assurance, testing, security validation. Use after implementation is complete, when pre-commit quality gates need to run, or for code review. |
| **orchestrator** | opus | Multi-agent coordination. Activates the Forge developer experience — context restoration, feature planning, soundboard discussions, health checks. |

### Domain Specialists

| Agent | Model | When to Use |
|-------|-------|------------|
| **security** | sonnet | Vulnerability scanning, OWASP Top 10 checks, secrets detection, auth/authz code review, CSP configuration, remediation guidance. |
| **testing** | sonnet | Test generation, coverage analysis, test infrastructure. Creates unit/integration/e2e tests, analyzes gaps, fixes flaky tests. |
| **performance** | sonnet | Profiling, bundle analysis, optimization. Identifies bottlenecks, reduces bundle size, optimizes renders, benchmarks. |
| **api** | sonnet | REST endpoint design, request/response handlers, validation, middleware, external API integration, OpenAPI specs. |
| **database** | sonnet | Schema design, migration creation, query optimization, data modeling, indexing strategy, troubleshooting. |
| **ui** | sonnet | React components, responsive layouts, design system, animations, accessibility, UI performance. |
| **refactor** | sonnet | Code restructuring without behavior change. Extract functions, reduce complexity, eliminate duplication, apply patterns. |
| **devops** | sonnet | Docker, GitHub Actions, environment config, server setup, monitoring, deployment automation. |
| **integration** | sonnet | External service connections. GitHub API, Sentry, webhooks, OAuth, MCP servers, service-to-service. |

### Governance & Analysis Agents

| Agent | Model | When to Use |
|-------|-------|------------|
| **detective** | sonnet | Project analysis, health checks, tech stack detection, gap analysis, code quality assessment, architectural review. "What's wrong with this codebase?" |
| **analytics** | sonnet | Metrics tracking, data analysis, reporting. Implementing analytics events, building dashboards, tracking KPIs. |
| **compliance** | sonnet | Regulatory compliance, license auditing, GDPR/privacy, accessibility (WCAG), export controls. |
| **docs** | sonnet | Documentation generation, README creation, API docs, changelog maintenance, stale doc detection. |
| **learning** | sonnet | Session analysis, pattern recognition, workflow optimization. Learns from past sessions to improve recommendations. |

### Specialized System Agents

| Agent | Model | When to Use |
|-------|-------|------------|
| **release-sentinel** | opus | Documentation auditing after code changes, release preparation, changelog generation, stale section detection. |
| **crucible-detective** | sonnet | Test-quality review (optional, no accuracy claim). Looks for hollow assertions, coverage gaming, mock proliferation, dead tests. Use before release gates or during spot audits. |
| **governance-verifier** | sonnet | Automated verification for governance concerns flagged by hooks. Responds to quality check results. |
| **oracle** | sonnet | Proactive governance sentinel for autonomous development. Monitors changes against project scope and architectural constraints. |

### Executive Agent

| Agent | Model | When to Use |
|-------|-------|------------|
| **nxtg-ceo-loop** | opus | CEO Digital Twin for autonomous strategic decisions. Product direction, architecture decisions, resource allocation, risk assessment. Only escalates CRITICAL decisions to humans. |

### Additional Specialists

| Agent | Model | When to Use |
|-------|-------|------------|
| **design-vanguard** | opus | UI/UX design and frontend implementation: components, responsive layouts, design systems, animations, accessibility audits, design critiques. |
| **dx-engineer** | sonnet | Developer experience: CLI UX audits, SDK API design review, onboarding, error message quality, installation experience. |
| **growth-engine** | sonnet | Growth strategy, go-to-market planning, content marketing, SEO, community building, developer relations. |
| **incident-commander** | opus | Incident triage and coordination when something breaks in production, plus post-incident reviews and runbooks. |
| **master-architect** | opus | System design, architecture review, design pattern selection, API design, technical debt assessment. |
| **product-strategist** | opus | Product strategy, market positioning, feature prioritization, user personas, product metrics. |
| **qa-sentinel** | sonnet | Test strategy and quality architecture (not test generation): CRUCIBLE gates, mutation and property-based testing targets, flaky-test diagnosis. |
| **revenue-architect** | opus | Pricing strategy, monetization design, Stripe integration, revenue modeling. |
| **scout** | sonnet | Competitive intelligence and market analysis: competitor feature matrices, market sizing, technology trends. |
| **wordsmith** | sonnet | Writing, rewriting or reviewing content: landing page copy, blog posts, READMEs, docs, error messages, changelogs. |

---

## 27 Knowledge Skills

Skills are contextual knowledge documents that Claude Code loads automatically when relevant. They encode patterns, conventions, and best practices so agents make informed decisions without being told the same things repeatedly.

### Core Skills

| Skill | What It Provides |
|-------|-----------------|
| **core-nxtg-forge** | Forge-specific conventions, MCP tool usage, governance patterns |

### Domain Knowledge

| Skill | What It Provides |
|-------|-----------------|
| **architecture** | System design patterns, component relationships, data flow |
| **coding-standards** | Language-specific conventions, formatting, documentation standards |
| **documentation** | Doc structure, API documentation patterns, README conventions |
| **owasp-security** | OWASP vulnerability detection and remediation, plus why a Forge security guard blocked a call |
| **testing** | Test framework usage, assertion patterns, coverage tools |

### Framework Skills

| Skill | What It Provides |
|-------|-----------------|
| **claude-code-framework** | Claude Code capabilities, tool usage, agent patterns |
| **codex-framework** | Codex CLI conventions, task mode, AGENTS.md format |
| **gemini-framework** | Gemini CLI conventions, GEMINI.md format |

### Workflow Skills

| Skill | What It Provides |
|-------|-----------------|
| **dev-environment-patterns** | Environment setup, toolchain configuration, CI/CD patterns |
| **git-workflow** | Branching strategy, commit conventions, PR patterns |
| **runtime-validation** | Input validation, error boundaries, runtime safety patterns |
| **parallel-execution** | Plan Mode and Agent Teams (parallel subagents via the Task tool) |

### Performance & Debugging

| Skill | What It Provides |
|-------|-----------------|
| **optimization** | Performance profiling, bundle optimization, caching strategies |
| **browser-debugging** | DevTools usage, network analysis, rendering profiling |

### Knowledge & Learning

| Skill | What It Provides |
|-------|-----------------|
| **skill-development** | How to create new skills, skill structure, progressive disclosure |
| **domain-knowledge** | Project-specific domain concepts, business rules |
| **verify-governance** | Governance verification patterns, health score interpretation |

### Governance

| Skill | What It Provides |
|-------|-----------------|
| **ceo-loop** | The CEO Decision Loop ORBIT protocol, preloaded into the nxtg-ceo-loop agent |
| **crucible-audit** | An optional test-quality review prompt (no accuracy claim): hollow assertions, coverage-omit gaming, mock proliferation, dead tests |

### Agent Role Skills

| Skill | What It Provides |
|-------|-----------------|
| **agent-lead-architect** | System design leadership, architecture decisions, trade-off analysis |
| **agent-backend-master** | Backend implementation patterns, API design, data layer |
| **agent-cli-artisan** | CLI tool design, argument parsing, terminal UX |
| **agent-platform-builder** | Platform engineering, infrastructure, deployment |
| **agent-qa-sentinel** | Quality assurance leadership, test strategy, coverage analysis |
| **agent-development** | Agent creation patterns, system prompt design |
| **agent-integration-specialist** | Service integration patterns, API connections, webhooks |

## How Skills Work

Skills load automatically based on context. When you're working on tests, the testing skills activate. When you're building an API, the API and backend skills activate. You don't need to invoke them manually.

Each skill has a `SKILL.md` with YAML frontmatter describing when it's relevant and markdown content providing the knowledge. Claude Code matches your current task context against skill descriptions and loads the most relevant ones.
