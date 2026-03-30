# Agents Reference

> 33 autonomous AI specialists. Each one encodes deep domain expertise — security patterns, architecture principles, testing strategies, growth playbooks — so you get senior-level output without senior-level effort.

---

## How Agents Work

Agents are autonomous specialists that Claude Code delegates to when it recognizes a task matches an agent's expertise. You don't need to invoke them directly — Claude reads your prompt, picks the right agent, and routes your request.

But you *can* invoke them directly through commands like `/forge:feature` (which orchestrates Planner → Builder → Testing → Guardian) or through the [/forge:agent-assign](../commands/agent-assign.md) command.

Every agent runs at **L1** (plugin only). Some gain enhanced capabilities at L2 (orchestrator) and L3 (dashboard).

---

## Agent Selection Guide

**"I want to build something"**
→ [Planner](planner.md) designs it, [Builder](builder.md) implements it, [Guardian](guardian.md) validates it

**"Something is broken"**
→ [Detective](detective.md) diagnoses it, [Incident Commander](incident-commander.md) triages it

**"Is my code good?"**
→ [Guardian](guardian.md) for quality gates, [Security](security.md) for vulnerabilities, [Crucible Detective](crucible-detective.md) for test quality

**"I need to launch this product"**
→ [Product Strategist](product-strategist.md) for positioning, [Growth Engine](growth-engine.md) for distribution, [Wordsmith](wordsmith.md) for copy

**"Make it faster / cleaner / better"**
→ [Performance](performance.md) for speed, [Refactor](refactor.md) for structure, [Master Architect](master-architect.md) for design

---

## All 33 Agents by Category

### Core Workflow

The engine that drives feature development. Plan → Build → Test → Ship.

| Agent | Model | One-Liner |
|-------|-------|-----------|
| [Planner](planner.md) | Sonnet | Decomposes features into architecture + task breakdown with dependencies and estimates |
| [Builder](builder.md) | Sonnet | Implements production-ready code from plans with tests and type safety |
| [Guardian](guardian.md) | Sonnet | Runs quality gates — tests, security, lint — before code ships |
| [Orchestrator](orchestrator.md) | Opus | The conductor. Coordinates all agents through the 4-option command center |

### Domain Specialists

Deep expertise in specific engineering domains. Each one knows the patterns, anti-patterns, and best practices of its field.

| Agent | Model | One-Liner |
|-------|-------|-----------|
| [Security](security.md) | Sonnet | OWASP Top 10, secrets detection, dependency scanning, CSP, auth review |
| [Testing](testing.md) | Sonnet | Test generation, coverage analysis, flaky test diagnosis, test infrastructure |
| [Performance](performance.md) | Sonnet | Profiling, bundle analysis, render optimization, memory leak detection |
| [API](api.md) | Sonnet | REST/GraphQL design, validation, middleware, OpenAPI specs |
| [Database](database.md) | Sonnet | Schema design, migrations, query optimization, indexing strategy |
| [UI](ui.md) | Sonnet | React components, responsive layouts, accessibility, design systems |
| [Refactor](refactor.md) | Sonnet | Code restructuring — extract, simplify, deduplicate — without changing behavior |
| [DevOps](devops.md) | Sonnet | Docker, CI/CD, GitHub Actions, deployment automation, monitoring |
| [Integration](integration.md) | Sonnet | External APIs, webhooks, OAuth flows, MCP servers, service connections |
| [Docs](docs.md) | Sonnet | Documentation generation — JSDoc, READMEs, API docs, changelogs |
| [Analytics](analytics.md) | Sonnet | Metrics instrumentation, usage tracking, dashboards, KPI reporting |

### Governance & Analysis

The quality conscience. These agents watch, measure, and verify.

| Agent | Model | One-Liner |
|-------|-------|-----------|
| [Detective](detective.md) | Sonnet | Sherlock for codebases — health checks, gap analysis, tech stack detection |
| [Compliance](compliance.md) | Sonnet | License auditing, GDPR, WCAG accessibility, regulatory requirements |
| [Learning](learning.md) | Sonnet | Session analysis, pattern recognition, preference capture, recommendation tuning |
| [Release Sentinel](release-sentinel.md) | Sonnet | Documentation auditing after code changes, changelog generation, stale doc detection |
| [Crucible Detective](crucible-detective.md) | Sonnet | Forensic test quality auditing — exposes hollow assertions and coverage gaming |
| [Governance Verifier](governance-verifier.md) | Sonnet | Automated response to governance concerns flagged by hooks |
| [Oracle](oracle.md) | Sonnet | Background sentinel — monitors development for scope drift and architectural violations |

### Engineering Leadership

Senior engineering perspectives encoded as agents.

| Agent | Model | One-Liner |
|-------|-------|-----------|
| [Master Architect](master-architect.md) | Sonnet | The senior architect who says "no, don't build it that way" — system design, trade-offs |
| [Design Vanguard](design-vanguard.md) | Sonnet | UI/UX specialist — design systems, accessibility, visual hierarchy, DX |
| [DX Engineer](dx-engineer.md) | Sonnet | Developer experience — CLI UX, SDK design, onboarding, error messages |
| [Incident Commander](incident-commander.md) | Sonnet | Production incident response — triage, coordination, post-mortems, runbooks |
| [QA Sentinel](qa-sentinel.md) | Sonnet | Quality assurance leadership — test strategy, coverage analysis, bug detection |

### Executive & Strategy

Business intelligence and growth, encoded as AI agents.

| Agent | Model | One-Liner |
|-------|-------|-----------|
| [CEO Loop](ceo-loop.md) | Opus | CEO Digital Twin — autonomous strategic decisions using ORBIT governance model |
| [Product Strategist](product-strategist.md) | Sonnet | Product-market fit, feature prioritization (RICE/MoSCoW), roadmaps, pricing |
| [Revenue Architect](revenue-architect.md) | Sonnet | Pricing strategy, Stripe integration, monetization design, financial modeling |
| [Growth Engine](growth-engine.md) | Sonnet | Go-to-market, Product Hunt/HN launches, content marketing, SEO, community |
| [Scout](scout.md) | Sonnet | Competitive intelligence — feature matrices, market sizing, trend monitoring |
| [Wordsmith](wordsmith.md) | Sonnet | Landing pages, README rewrites, blog posts, error messages — copy that converts |

---

## How Agents Gain Superpowers at Each Level

### L1: Vibe Coder (Plugin Only)

All 33 agents work at L1. They read your codebase, use Claude Code's tools (Read, Write, Edit, Bash, Glob, Grep), and produce results. No additional setup.

### L2: Pro Builder (+ Orchestrator)

Agents that reference orchestrator MCP tools gain coordination capabilities:
- **Task awareness**: Agents check what's been assigned, what's in progress, what's blocked
- **Knowledge persistence**: Learnings from one session inform the next (`forge_capture_knowledge` / `forge_get_knowledge`)
- **Drift detection**: Work stays aligned with your project vision (`forge_check_drift`)
- **Cross-agent coordination**: The Orchestrator agent manages handoffs between specialists

### L3: Ship Lord (+ Dashboard)

Agent activity becomes visual:
- Task boards show what each agent is working on
- Health scores update in real-time as agents complete work
- The Governance HUD displays Oracle warnings and sentinel findings
- Infinity Terminal lets you watch agent execution in a browser-based terminal

---

## Creating Custom Agents

NXTG-Forge agents are markdown files with YAML frontmatter. See the [Agent Development](../skills/agent-development.md) skill for a complete guide to creating your own.

```yaml
---
name: my-agent
description: |
  When to use this agent...
model: sonnet
tools: Glob, Grep, Read, Write, Edit, Bash
---

# My Agent System Prompt
Instructions for the agent...
```
