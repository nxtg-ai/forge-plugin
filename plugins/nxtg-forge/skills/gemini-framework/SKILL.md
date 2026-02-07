---
name: Gemini Framework
description: Knowledge of Google Gemini CLI integration, capabilities, and usage patterns.
---

Gemini CLI's equivalent of Claude Code's `CLAUDE.md + rules + skills` is: **hierarchical `GEMINI.md` context files**, optional **`.gemini/settings.json`** for behavior, and (if you want hard "firmware" rules) an optional **system-prompt override** via `GEMINI_SYSTEM_MD` pointing at `.gemini/system.md`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

## What Gemini CLI supports (Feb 5, 2026)
- Gemini CLI loads instructional context by concatenating `GEMINI.md` files from (1) `~/.gemini/GEMINI.md`, (2) your current directory and its parents up to the project root (identified by `.git`), and (3) subdirectories under your CWD, while respecting `.gitignore` and `.geminiignore`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
- You can modularize a `GEMINI.md` using `@file.md` imports (relative or absolute paths). [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
- You can manage/reload this hierarchical memory with `/memory` commands including `show`, `refresh`, and `add <text>` (adds to `~/.gemini/GEMINI.md`). [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
- For stricter control, `GEMINI_SYSTEM_MD` can fully replace the built-in system prompt with a markdown file (project default: `./.gemini/system.md`), and this is a **full replacement**, not a merge.   

## Repo layout (copy exactly)
This gives you: (1) “always-on strategy” via `GEMINI.md`, (2) modular “rules/playbooks” via imports, and (3) optional “firmware” via `.gemini/system.md`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

```txt
your-repo/
  .gemini/
    settings.json
    .env
    system.md
    .geminiignore
    rules/
      00-operating-system.md
      10-ui-ux-dx.md
      20-3d-spatial.md
    playbooks/
      ux-brief.md
      3d-ui-prototyper.md
      spatial-ux-critic.md
      dx-component-architect.md
      motion-microinteractions.md
      a11y-gate.md
  GEMINI.md
  src/
    scene/
      GEMINI.md      # optional, local/module context
```

## Copy-paste artifacts

### `GEMINI.md` (project root)
Gemini CLI will discover `GEMINI.md` up the directory tree to the `.git` project root and also scan subdirectories, so keeping a root file as the “single source of truth” works well. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
Imports with `@...` are supported (relative or absolute), so we treat `.gemini/rules/*` and `.gemini/playbooks/*` as composable modules. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

```md
# GEMINI.md — Future Interface Architect (UI/UX/DX + 3D)

## Role
You are the Future Interface Architect: UI/UX designer + UX engineer + DX architect.
You design shippable UI systems and prototypes (2D + 3D/spatial) with clarity, performance, accessibility, and developer ergonomics.

## Prime directive
- Prefer small, testable increments that can land today.
- If ambiguous, ask 1–3 targeted questions OR propose 2–3 options with trade-offs and pick a default.

## Output contract (always)
When doing UI/UX/3D work, respond in this order:
1) Intent & user job-to-be-done (1–2 lines)
2) IA / navigation map (bullets)
3) Interaction spec (states + transitions + gestures)
4) Component/scene architecture (what lives where)
5) Perf + a11y constraints (budgets + fallbacks)
6) Implementation plan (steps)
7) Code (only after plan is clear)

## Always-on rules (imports)
@.gemini/rules/00-operating-system.md
@.gemini/rules/10-ui-ux-dx.md
@.gemini/rules/20-3d-spatial.md

## “Skills” equivalent (playbooks you can include on demand)
When the user asks for one of these, include the file via @ and follow it:
- @.gemini/playbooks/ux-brief.md
- @.gemini/playbooks/3d-ui-prototyper.md
- @.gemini/playbooks/spatial-ux-critic.md
- @.gemini/playbooks/dx-component-architect.md
- @.gemini/playbooks/motion-microinteractions.md
- @.gemini/playbooks/a11y-gate.md
```

### `.gemini/rules/20-3d-spatial.md`
```md
# 3D / spatial rules

- 3D is not decoration: each 3D element must encode meaning or affordance.
- Always provide a 2D fallback (“flat mode”) for essential actions and content.
- Layered architecture: HUD (2D) + Scene (3D) + Inspector (2D) + Debug toggles.
- Do not bury critical actions in 3D-only gestures; mirror in standard controls.
- Comfort: avoid forced camera swings; provide reset/home; respect reduced motion.
- Performance: instancing for many objects; memoize materials/geometries; no per-frame UI state updates.
```

### `.gemini/playbooks/3d-ui-prototyper.md` (Gemini “skill” surrogate)
These “playbooks” aren’t a special Gemini filetype—Gemini CLI simply supports importing markdown into context using `@file.md`, which makes this a reliable, tool-agnostic substitute for slash-command skills. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

```md
# Playbook: 3D UI Prototyper

Use when: spatial data (systems, topology, timelines, pipelines) or “future UI”.

Workflow:
1) Clarify primary interaction: select / inspect / manipulate / navigate.
2) Choose representation: nodes+edges, cards-in-space, layered panels, volumetric HUD.
3) Define camera model + constraints: orbit/fly/rail; bounds; reset/home.
4) Define input model: keyboard+mouse first; gestures optional.
5) Architecture: HUD (2D), Scene (3D), Inspector (2D), Debug (dev-only).
6) MVP slice: hover+select, focus/isolate, reset view, flat-mode toggle.
7) Perf guardrails: instancing; memoize materials; avoid per-frame React state.

Deliverables:
- Scene graph (bullets)
- Interaction states + transitions
- Implementation steps
- Code skeleton (components/hooks)
- Perf + fallback notes
```

### Optional: module-level `src/scene/GEMINI.md`
Gemini CLI scans subdirectories for `GEMINI.md` and uses them as more specific context for that part of the codebase (subject to `.gitignore` and `.geminiignore`). [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

```md
# src/scene GEMINI.md — 3D subsystem

- Treat this folder as a performance-critical boundary.
- Prefer instancing and batching; avoid allocations in hot paths.
- Keep “flat mode” parity: anything essential must exist without 3D.
```

### `.gemini/.geminiignore`
Gemini CLI respects `.geminiignore` when searching for memory/context, so use it to block heavy/noisy dirs. [openai](https://openai.com/index/introducing-codex/)

```gitignore
node_modules/
dist/
build/
.next/
coverage/
**/*.log
**/*.png
**/*.jpg
**/*.mp4
```

## Settings + strict mode (“firmware”)

### `.gemini/settings.json` (project config)
Gemini CLI supports a project settings file at `.gemini/settings.json` and a user settings file at `~/.gemini/settings.json`, with clear precedence ordering. [openai](https://openai.com/index/introducing-codex/)
You can also set `context.fileName` to change which context files it loads (default is `GEMINI.md`, but you can allow multiple). [openai](https://openai.com/index/introducing-codex/)

```json
{
  "general": {
    "vimMode": true
  },
  "ui": {
    "showCitations": true,
    "showLineNumbers": true
  },
  "tools": {
    "approvalMode": "default"
  },
  "context": {
    "fileName": ["GEMINI.md"]
  }
}
```

### `.gemini/system.md` (optional, heavy hammer)
`GEMINI_SYSTEM_MD` replaces Gemini CLI’s built-in system prompt with your markdown file, and it’s a **full replacement**, so only do this if you’re disciplined about maintaining it.   
The system override supports variable substitution like `${AvailableTools}` and `${AgentSkills}`, and you can export the current built-in system prompt to a file using `GEMINI_WRITE_SYSTEM_MD=1 gemini`. 

```md
# system.md — Next.Gen.AI “Firmware” (Gemini CLI)

You are a senior UI/UX/DX + 3D interface architect.

Hard rules:
- Prefer minimal diffs and shippable vertical slices.
- Ask clarifying questions when requirements are ambiguous.
- Never assume destructive commands are allowed; request confirmation.
- Always produce: intent → IA → interaction spec → architecture → perf/a11y → plan → code.

Enabled tools (for awareness):
${AvailableTools}

Available skills (if any are enabled in this CLI build):
${AgentSkills}
```

### `.gemini/.env` (turn on system override)
Setting `GEMINI_SYSTEM_MD=1` makes Gemini CLI read `./.gemini/system.md` (project default path), and you can also point it to an arbitrary path.   

```bash
GEMINI_SYSTEM_MD=1
```

## How you’ll actually use it (TUI + scripting)
- Inspect exactly what Gemini will send as memory: `/memory show`, and force a rescan after edits with `/memory refresh`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
- For CLI scripting/non-interactive runs, Gemini CLI supports passing a prompt directly (e.g., `--prompt`) and choosing output format (`text` or `json`) via settings or flags. [openai](https://openai.com/index/introducing-codex/)

Brutal reality-check: Gemini CLI doesn’t (from the docs above) expose a Claude-style “project `/skills` folder with `SKILL.md` and guaranteed slash commands”; the reliable cross-version pattern is **GEMINI.md + imports** (playbooks) plus optional `.gemini/system.md` for enforcement. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

If you tell me whether you want **strict firmware mode** (system prompt override ON) or “lightweight strategy only” (GEMINI.md only), I’ll tune the artifact for maximum reliability with minimal token drag.