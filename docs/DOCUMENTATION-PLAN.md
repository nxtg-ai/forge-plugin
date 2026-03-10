# Forge Documentation Plan — Unified User Experience

> **Owner**: Forge Program Lead (FPL)
> **Date**: 2026-03-08
> **Status**: APPROVED (Asif directive)
> **Framework**: Mintlify (recommended — used by Anthropic, Stripe, Vercel)

---

## 1. Problem Statement

Forge has **133 markdown files** across 3 repos and an ecosystem directory, totaling 4,500+ lines. The content is rich but **fragmented, duplicated, and developer-facing**. No unified user documentation exists. Users reverse-engineer the product from scattered READMEs, internal contracts, and CLAUDE.md files.

**Key gaps identified:**
- No published docs site (forge.nxtg.ai/docs has no content)
- L1→L2→L3 progression exists in contracts but not in user-facing docs
- 17 MCP tools (8 plugin + 9 orchestrator) have no consolidated reference
- No troubleshooting guide, no error message explanations
- UAT friction data exists but doesn't feed into user docs
- Marketing materials (Twitter, HN) are incomplete drafts
- Terminology inconsistency: "governance" means 3 different things across docs

---

## 2. Documentation Architecture

```
forge.nxtg.ai/docs/
├── Getting Started/
│   ├── What is Forge?                   ← Problem-driven, not feature-driven
│   ├── Quick Start (L1 — 60 seconds)   ← Plugin install → first command
│   ├── Upgrade to Pro Builder (L2)      ← When & why to add orchestrator
│   └── Full Platform (L3)              ← When & why to add dashboard
│
├── Guides/
│   ├── Your First Governed Project      ← Step-by-step with screenshots
│   ├── Multi-Agent Orchestration        ← TUI dashboard, agent dispatch
│   ├── AI Brain Configuration           ← rule-based vs openai, API keys
│   ├── Knowledge Capture & Learning     ← How agents share learnings
│   ├── Drift Detection                  ← Spec gap analysis
│   ├── Health Scoring                   ← What the grades mean, how to improve
│   ├── Security Scanning               ← What's checked, how to remediate
│   └── Multi-Device Setup (WSL2)       ← Vite proxy, mobile access
│
├── Reference/
│   ├── CLI Commands                     ← forge init/plan/run/status/config/dashboard/mcp
│   ├── 21 Slash Commands               ← /forge:init, /forge:status, etc.
│   ├── 22 Agents                        ← When to use each, what they do
│   ├── 29 Skills                        ← Auto-loaded contextual knowledge
│   ├── MCP Tools (17)                   ← Input/output schemas, examples
│   ├── Configuration                    ← .forge/state.json, brain, scheduler
│   └── File Structure                   ← .forge/ directory explained
│
├── Concepts/
│   ├── The Three Levels                 ← L1 Vibe Coder / L2 Pro Builder / L3 Ship Lord
│   ├── Governance Model                 ← What governance means in Forge context
│   ├── Task Lifecycle                   ← Pending→InProgress→Completed, phases
│   ├── The Lego Snap (MCP)             ← How plugin + orchestrator connect
│   └── Tool-Agnostic Design            ← Claude/Codex/Gemini adapters
│
├── Troubleshooting/
│   ├── Common Issues                    ← Top 10 from UAT friction data
│   ├── Error Messages                   ← Every user-facing error explained
│   ├── MCP Connection Issues            ← Server not starting, tool not found
│   └── Pro Subscription Setup           ← CLI login prerequisite for dashboard
│
└── API/
    ├── MCP Protocol                     ← JSON-RPC 2.0, stdio transport
    ├── Plugin MCP Server (8 tools)      ← Node.js governance tools
    └── Orchestrator MCP Server (10 tools) ← Rust task/knowledge tools
```

---

## 3. Content Principles (from SOTA Research)

Studied: **Stripe** (gold standard), **Vercel** (Next.js docs), **Supabase** (hub-and-spoke), **Tailwind CSS** (utility-first reference), **Railway** (speed-to-value), **Cursor** (AI-native), **Linear** (polished minimalism).

### Principles We Adopt

| Principle | Source | How We Apply |
|-----------|--------|-------------|
| **Speed to value** | Railway, Stripe | First code example within 30 seconds of landing on docs |
| **Problem-driven entry** | Stripe | "How do I..." questions, not feature lists |
| **Hub-and-spoke reference** | Supabase, Tailwind | One page per CLI command/MCP tool/agent, all linked from index |
| **Graduated complexity** | Vercel | L1 Quick Start → L2 Guide → L3 Full Platform |
| **Production-ready examples** | Stripe | Every example is copy-pasteable and works |
| **Role-based paths** | Linear | Solo dev (L1), team lead (L2), platform eng (L3) |
| **Interactive demos** | Cursor | Embedded terminal recordings (asciicast) |

### Voice & Terminology

| Term | User-Facing | Internal Only |
|------|------------|---------------|
| Health Score | "Project Health" (A-F grade) | governance health composite |
| Knowledge | "Captured Learnings" | knowledge/ directory |
| Drift | "Spec Gaps" | drift detection |
| Governance | "Quality Checks" (user context) | ASIF governance (internal) |
| MCP | "Integration Protocol" (first mention), then MCP | stdio JSON-RPC |

---

## 4. Canonical Onboarding Flow

This is the **single source of truth** for the user journey. All docs, demos, GIFs, and marketing must follow this exact sequence:

### L1 → L2 Flow
```bash
# Step 1: Install the plugin (L1 — Vibe Coder)
claude plugin marketplace add nxtg-ai/forge-plugin
claude plugin install forge

# Step 2: Install the orchestrator (L2 — Pro Builder)
brew install nxtg-ai/tap/forge
# or: curl -fsSL https://forge.nxtg.ai/install.sh | sh

# Step 3: Initialize your project
forge init

# Step 4: Configure the AI brain (MUST be before plan)
forge config brain openai
# → Enter your OpenAI API key when prompted

# Step 5: Generate tasks from your project
forge plan --generate

# Step 6: See the task board
forge status

# Step 7: Launch the TUI dashboard (piped text output)
forge dashboard

# Step 7b: Or launch with Stargate PTY mode (native agent TUIs)
forge dashboard --pty
```

### Pro Subscription Prerequisite (L3)
If using Claude/Codex/Gemini Pro subscriptions with `forge dashboard`:
```bash
# Log into each CLI tool first (one-time)
claude          # → authenticate
codex           # → authenticate
gemini          # → authenticate
# Then close and run:
forge dashboard --pty
```

---

## 5. Asif's Visual Deliverables

These are assets FPL cannot create — they require Asif's creative direction, recording environment (CLX9), or design tools.

### Priority 1: Demo GIFs (for docs + marketing)

| # | Asset | Scene | Duration | Where Used |
|---|-------|-------|----------|-----------|
| D-01 | `forge-init-to-status.gif` | `forge init && forge config brain openai && forge plan --generate && forge status` | 12-15s | Quick Start, README, Product Hunt |
| D-02 | `forge-dashboard-pty.gif` | `forge dashboard --pty` — Stargate mode with 2-3 agents running in native PTY panes | 15-20s | Multi-Agent Guide, README |
| D-03 | `forge-dashboard-web.gif` | Web dashboard — health score, governance HUD, agent activity feed | 10-15s | L3 Quick Start, Product Hunt |
| D-04 | `infinity-terminal.gif` | Open terminal tab, close browser, reopen → session persists | 10s | Concepts/Infinity Terminal |
| D-05 | `mcp-tools-live.gif` | Claude Code calling `forge_get_tasks` → `forge_claim_task` → `forge_complete_task` | 15s | MCP Reference, Product Hunt |
| D-06 | `file-locking.gif` | Two agents claim overlapping files → lock prevents conflict | 10s | Concepts/Task Lifecycle |
| D-07 | `health-score.gif` | `forge status` showing health grade, then `/forge:status` in Claude Code showing same grade | 8s | Health Scoring Guide |

### Priority 2: Architecture Diagrams

| # | Asset | Content | Format | Where Used |
|---|-------|---------|--------|-----------|
| A-01 | `three-levels.svg` | L1/L2/L3 progression diagram — what you get at each level, how they connect | SVG | What is Forge?, Getting Started |
| A-02 | `lego-snap.svg` | Plugin ↔ Orchestrator MCP connection diagram, both MCP servers, tool flow | SVG | Concepts/The Lego Snap |
| A-03 | `task-lifecycle.svg` | Pending → Assigned → InProgress → Completed/Failed, with phases (Build/Verify/Fix) | SVG | Concepts/Task Lifecycle |
| A-04 | `adapter-pattern.svg` | Claude/Codex/Gemini behind the adapter interface, showing config files written | SVG | Concepts/Tool-Agnostic Design |
| A-05 | `forge-directory.svg` | `.forge/` directory tree with annotations for each file/folder | SVG | Reference/File Structure |

### Priority 3: Hero Images & Marketing

| # | Asset | Content | Format | Where Used |
|---|-------|---------|--------|-----------|
| H-01 | `hero-dashboard.png` | Polished screenshot of web dashboard with real data (dark mode) | PNG 1200x630 | docs landing, Product Hunt, Twitter |
| H-02 | `hero-tui.png` | Polished screenshot of TUI dashboard with agent PTY panes | PNG 1200x630 | README, docs landing |
| H-03 | `og-image.png` | Open Graph image (Forge logo + tagline + dashboard preview) | PNG 1200x630 | Social sharing meta tag |

### Priority 4: Video Demos

| # | Asset | Content | Duration | Where Used |
|---|-------|---------|----------|-----------|
| V-01 | `forge-2min-demo.mp4` | Full zero-to-dashboard flow: install → init → config → plan → status → dashboard → agents running | 2 min | YouTube embed, Product Hunt, docs |
| V-02 | `forge-mcp-explained.mp4` | Visual explanation of how MCP connects the pieces, with live demo | 90s | Concepts/The Lego Snap, YouTube |

### Summary: Asif's Deliverable Count

| Category | Count | Estimated Total Time |
|----------|-------|---------------------|
| Demo GIFs | 7 | ~2 hours (recording + editing) |
| Architecture Diagrams | 5 | ~3 hours (design) |
| Hero Images | 3 | ~1 hour (screenshot + polish) |
| Video Demos | 2 | ~3 hours (recording + editing) |
| **Total** | **17 assets** | **~9 hours** |

---

## 6. Content I (FPL) Will Produce

These are text-heavy documentation pages that FPL writes. They reference Asif's visual assets by placeholder (`![D-01](assets/forge-init-to-status.gif)`).

| # | Page | Source Material | Est. Lines |
|---|------|----------------|-----------|
| C-01 | What is Forge? | READMEs, LAUNCH.md, UAT friction data | 80 |
| C-02 | Quick Start (L1) | Plugin README, install command | 60 |
| C-03 | Upgrade to Pro Builder (L2) | Orchestrator README, install.sh | 80 |
| C-04 | Full Platform (L3) | v3 README, WSL2 proxy setup | 60 |
| C-05 | Your First Governed Project | UAT-Guide Tests 1-2, demo flow | 150 |
| C-06 | Multi-Agent Orchestration | SPEC.md, adapter docs, dashboard | 120 |
| C-07 | AI Brain Configuration | config.rs, brain module docs | 80 |
| C-08 | CLI Command Reference | main.rs clap definitions, all subcommands | 200 |
| C-09 | 21 Slash Commands Reference | command markdown files | 150 |
| C-10 | 22 Agents Reference | agent markdown files | 200 |
| C-11 | MCP Tools Reference (17) | dependency-map.md, tools.rs, tools.mjs | 250 |
| C-12 | The Three Levels (Concept) | dx-journeys.md, terminology.md | 100 |
| C-13 | Troubleshooting | UAT friction data, actual-human-uat notes | 120 |
| C-14 | Health Scoring Guide | governance.rs, tools.mjs health score | 80 |
| C-15 | Pro Subscription Setup | Asif's CLX9 testing notes | 40 |

**Total**: ~1,770 lines of documentation across 15 pages.

---

## 7. Consolidation & Retirement Plan

| Current File | Action | Rationale |
|-------------|--------|-----------|
| `/UAT-Guide.md` + `/ecosystem/forge/UAT-GUIDE.md` | Merge → `/docs/internal/UAT-GUIDE.md` | Two copies, neither complete |
| `/ecosystem/forge/launch-posts/twitter-thread.md` | Finalize, move to marketing/ | Incomplete draft |
| `/ecosystem/forge/launch-posts/hackernews-post.md` | Finalize, move to marketing/ | Incomplete draft |
| `/LAUNCH.md` | Update with correct demo flow, keep as staging doc | Wrong command sequence (now fixed) |
| `/ecosystem/forge/actual-human-uat-FUCK.md` | Extract friction items → Troubleshooting page, then archive | Raw data, not publishable |

---

## 8. Timeline

| Phase | Deliverable | Owner | Duration |
|-------|------------|-------|----------|
| **Phase 1** | Docs site scaffold (Mintlify + forge.nxtg.ai/docs) | FPL | Day 1 |
| **Phase 2** | Quick Start + Getting Started (C-01 through C-04) | FPL | Day 1-2 |
| **Phase 3** | Demo GIFs D-01 through D-03 (critical path) | **Asif** | Day 1-2 |
| **Phase 4** | Reference pages (C-08 through C-11) | FPL | Day 2-3 |
| **Phase 5** | Architecture diagrams A-01 through A-05 | **Asif** | Day 2-3 |
| **Phase 6** | Concept pages + Troubleshooting (C-12 through C-15) | FPL | Day 3-4 |
| **Phase 7** | Remaining GIFs D-04 through D-07 + Hero images | **Asif** | Day 3-4 |
| **Phase 8** | Video demos V-01, V-02 | **Asif** | Day 4-5 |
| **Phase 9** | Final review, cross-link, publish | FPL + Asif | Day 5 |

---

## 9. CoS Tracking Request

**To**: NXTG-AI CoS (Wolf) + CLX9 Sr. CoS (Emma)

Asif has committed to producing **17 visual assets** (7 GIFs, 5 diagrams, 3 images, 2 videos) to complete the Forge documentation. Estimated time: ~9 hours.

**Please track Asif on these deliverables.** Per his direct instruction: "when you let the CoS know, they will hound me every hour until it's done."

Deliverable tracking IDs: D-01 through D-07, A-01 through A-05, H-01 through H-03, V-01 through V-02.

Priority order:
1. **D-01** (init-to-status GIF) — blocks Quick Start page
2. **A-01** (three-levels diagram) — blocks "What is Forge?" page
3. **H-01** (hero dashboard screenshot) — blocks docs landing page
4. **V-01** (2-min demo video) — blocks Product Hunt launch
