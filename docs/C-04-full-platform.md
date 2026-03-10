# Full Platform — L3 Ship Lord

L2 gives you multi-tool orchestration from the terminal. L3 adds a **visual web dashboard** — real-time health graphs, an agent activity feed, and the Infinity Terminal, a browser-based terminal where sessions survive browser close, network drops, and device switches. This is mission control.

## When You Need This

You need L3 when the terminal alone isn't enough:

- **Visual oversight** — you want to see agent activity, health trends, and task progress at a glance instead of reading CLI output
- **Sessions that never die** — you start a long-running task, close your laptop, and pick it up from your phone. The session is still there
- **Team dashboard** — multiple people need to see the same project state in a browser
- **Multi-device workflow** — monitor builds from your phone while your workstation runs agents

If the TUI dashboard (`forge dashboard --pty`) covers your needs, stay on [L2](C-03-upgrade-to-pro-builder.md). L3 is for when you want a persistent visual layer.

## Install

```bash
git clone https://github.com/nxtg-ai/forge-ui
cd forge-ui
npm install
npm run dev
```

This starts two services:

| Port | Service |
|------|---------|
| 5050 | Vite UI (your browser connects here) |
| 5051 | Express API + WebSocket + PTY bridge |

Open **http://localhost:5050** in your browser.

> **WSL2 users**: `localhost` only works from within WSL. To access from Windows or other devices on your network, use your WSL2 machine's IP address (run `ip addr show eth0` to find it). See the [Dashboard Guide](C-08-dashboard-guide.md#multi-device-setup-wsl2) for firewall setup.

<!-- VISUAL: D-03 — forge-dashboard-web.gif -->

## What You Get Over L2

| Capability | L2 (Orchestrator) | L3 (+ Web Dashboard) |
|-----------|:-:|:-:|
| Task board | TUI text output | Visual web UI with filters |
| Agent activity | Event log in TUI | Real-time activity feed in browser |
| Health score | CLI grade (A-F) | Governance HUD with trend graphs |
| Terminal sessions | Tied to your terminal window | Infinity Terminal — survives browser close |
| Multi-device access | No | Yes — phone, tablet, remote machine |
| Engagement modes | No | Yes — CEO, VP, Engineer, Builder, Founder views |
| Architecture decisions | No | ADR view with impact analysis |
| Command execution | CLI only | Browser command center + keyboard shortcuts |

## Key Features

**Web Dashboard** — Five views (Dashboard, Vision, Terminal, Command, Architect) with a governance HUD sidebar showing real-time health grade, active agents, and blocking decisions.

**Infinity Terminal** — A full terminal in your browser powered by xterm.js and a server-side PTY bridge. Sessions persist for 5 minutes after you close the browser tab. Reopen the tab and you're right where you left off. No tmux or Zellij required — persistence is built into the PTY bridge.

**Real-Time Health HUD** — The right sidebar always shows your project's health grade (A through F across 8 quality dimensions), active agent count, blocking decisions, and memory insights. Updates automatically via WebSocket.

**Agent Activity Feed** — Watch Claude Code, Codex CLI, and Gemini CLI coordinate in real time: task claims, file lock acquisitions, knowledge captures, and governance events. Filter by All, Important, or Errors.

## How It Connects

The web dashboard is a **separate product** from the L2 TUI dashboard. They are completely independent:

- `forge dashboard --pty` = L2 TUI dashboard (runs in your terminal, part of the orchestrator binary)
- `npm run dev` in forge-ui = L3 web dashboard (runs in your browser, separate React application)

From the L1 plugin, the `/forge:dashboard` command can launch the web dashboard. Or run it standalone with `npm run dev` — no plugin required.

The web dashboard reads state from the forge-orchestrator via its API. The architecture is one-directional: the UI reads and displays, the orchestrator makes decisions.

## Next Steps

- [Dashboard Guide](C-08-dashboard-guide.md) — Complete walkthrough of every view, engagement mode, and the Infinity Terminal
- [Troubleshooting](C-15-troubleshooting.md) — Connection issues, port conflicts, WSL2 networking
