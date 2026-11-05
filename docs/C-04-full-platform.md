# Full Platform — L3 Ship Lord

L2 gives you multi-tool orchestration from the terminal. L3 adds a **visual web dashboard** — a 0-100 health score, a command center, and the Infinity Terminal, a browser-based terminal whose shell keeps running if the tab closes or the network drops.

## When You Need This

You need L3 when the terminal alone isn't enough:

- **Visual oversight** — you want the health score and governance state in a browser instead of reading CLI output
- **Sessions that survive a closed tab** — you start a long-running command, close the tab or lose the network, and reopen the page within 5 minutes to the same shell. Restarting the forge-ui server ends it
- **Team dashboard** — multiple people need to see the same project state in a browser
- **Multi-device workflow** — open the dashboard from another device on your network (opt-in; see below)

If the TUI dashboard (`forge dashboard --pty`) covers your needs, stay on [L2](C-03-upgrade-to-pro-builder.md). L3 is for when you want a persistent visual layer.

## Install

```bash
git clone --branch v3.5.4 https://github.com/nxtg-ai/forge-ui
cd forge-ui
npm install
npm run dev
```

This starts two services:

| Port | Service |
|------|---------|
| 5050 | Vite UI (your browser connects here) |
| 5051 | Express API + WebSocket + PTY bridge |

Open **http://localhost:5050** in your browser. The dashboard asks for this install's access token the first time: run `npx tsx src/server/auth/print-auth-url.ts` in the forge-ui folder and open the link it prints.

> **Other devices**: both servers listen on `127.0.0.1` only. To open the dashboard from another device, set `FORGE_UI_HOST=0.0.0.0` and set `ALLOWED_ORIGINS` to the full list of origins you will open it from; every request still needs the token. See "Sign-in and network access" in the [forge-ui README](https://github.com/nxtg-ai/forge-ui/tree/v3.5.4#sign-in-and-network-access).

<!-- VISUAL: D-03 — forge-dashboard-web.gif -->

## What You Get Over L2

| Capability | L2 (Orchestrator) | L3 (+ Web Dashboard) |
|-----------|:-:|:-:|
| Health score | CLI grade (A-F) | 0-100 score in the browser |
| Terminal sessions | Tied to your terminal window | Infinity Terminal — survives a closed tab or a network drop |
| Multi-device access | No | Opt-in (`FORGE_UI_HOST` + `ALLOWED_ORIGINS` + access token) |
| Engagement modes | No | Yes — CEO, VP, Engineer, Builder, Founder views |
| Architecture decisions | No | ADR view with impact analysis |
| Command execution | CLI only | Browser command center + keyboard shortcuts |

## Key Features

**Web Dashboard** — Five views (Dashboard, Vision, Terminal, Command, Architect) with a governance sidebar showing the 0-100 health score.

**Infinity Terminal** — A full terminal in your browser powered by xterm.js and a server-side PTY bridge. If you close the tab or lose the network, the shell keeps running: reopen the page within 5 minutes and you are back in the same shell, and up to about 100 KB of the output from while you were away is replayed. Restarting the forge-ui server ends the shell. No tmux or Zellij required — persistence is built into the PTY bridge.

**Health score** — The right sidebar shows a 0-100 health score for the folder forge-ui runs from. It comes from the orchestrator when that is installed, otherwise from the plugin's governance health, otherwise from a local estimate labelled as one.

## How It Connects

The web dashboard is a **separate product** from the L2 TUI dashboard. They are completely independent:

- `forge dashboard --pty` = L2 TUI dashboard (runs in your terminal, part of the orchestrator binary)
- `npm run dev` in forge-ui = L3 web dashboard (runs in your browser, separate React application)

The L1 plugin's `/nxtg-forge:dashboard` command does not start the web dashboard: it writes a static HTML health snapshot. Run forge-ui with `npm run dev` — no plugin required.

The web dashboard gets its health score from the `forge` binary when it is installed. The architecture is one-directional: the UI reads and displays; policy decisions are made by Forge's other tools.

## Next Steps

- [Dashboard Guide](C-08-dashboard-guide.md) — Complete walkthrough of every view, engagement mode, and the Infinity Terminal
- [Troubleshooting](C-15-troubleshooting.md) — Connection issues, port conflicts, WSL2 networking
