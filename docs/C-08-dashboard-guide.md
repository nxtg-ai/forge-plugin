# Dashboard Guide — forge-ui

> **Level**: L3 Ship Lord | **Requires**: forge-orchestrator running, forge-ui v3.1.0+

The forge-ui dashboard is your project's single pane of glass. Health scores, agent activity, an embedded terminal, and a command center — all in one browser window. Sessions survive close, disconnect, and device switches. You start a long task on your laptop, close the tab, and pick it up on your phone. The session is still there.

---

## Quick Start

```bash
# From the forge-ui directory
cd ~/projects/NXTG-Forge/v3
npm run dev
```

Open **http://localhost:5050** in your browser. That's it.

The dev server starts two services:
- **Port 5050** — Vite UI (your browser talks here)
- **Port 5051** — API server + WebSocket + terminal bridge

> **Running on WSL2?** See [Multi-Device Setup](#multi-device-setup-wsl2) to access from Windows or other devices.

---

## What You're Looking At

When you first load the dashboard, you'll see:

- **Left sidebar** — Project selector, navigation between views
- **Main panel** — The active view (Dashboard, Vision, Terminal, Command, Architect)
- **Right sidebar** — Governance HUD: real-time quality check status, health grade, active agents
- **Top bar** — Engagement mode selector, connection status indicator

The connection indicator shows **Connected** (green dot) when the WebSocket link to the API server is live. If it shows **Disconnected**, see [Troubleshooting](C-15-troubleshooting.md).

---

## The Five Views

### Dashboard

Your project's heartbeat. Shows:

| Section | What It Shows |
|---------|---------------|
| Mission Statement | Your project's north star from `.forge/SPEC.md` |
| Project Progress | Phase indicators: Planning → Build → Verify → Fix → Complete |
| System Health | Percentage score with status message |
| Agent Activity | Which agents are running, their current task, blocked status |
| Quick Actions | One-click access to common commands (Status, New Feature, Run Tests, Deploy) |

**Sub-tabs** inside Dashboard:
- **Overview** — Mission + Progress + Health + Activity (default)
- **Agents** — Agent Collaboration Network: active, thinking, blocked counts
- **Activity** — Live event feed with All/Important/Errors filters

### Vision

Shows the strategic goals driving your project — read from `.forge/SPEC.md` if you have one. Useful for checking that what your agents are building aligns with what you intended.

- North Star vision statement
- Strategic goals with progress bars
- Constraints and boundaries
- Alignment checker sidebar

### Terminal

The **Infinity Terminal** — a full browser-based terminal that persists across browser close, network drops, and device switches.

See [Infinity Terminal](#infinity-terminal) for complete usage.

### Command

Execute Forge commands from the browser. Commands are grouped by category:

| Group | Commands |
|-------|---------|
| **Forge** | frg-status, frg-sync, frg-test, frg-deploy, frg-gap-analysis |
| **Analyze** | analyze-types, analyze-lint, analyze-bundle, analyze-security, analyze-dependencies |
| **Test** | test-coverage |
| **Git** | git-status, git-diff |
| **Deploy** | verify-production |

Click a command button to execute it. Output appears in the Execution Queue panel on the right.

**Command Palette** — Press `Ctrl+K` to open the quick command search:
- Type to filter commands
- Keyboard shortcuts: `s`=Status, `f`=Feature, `g`=Gap Analysis, `t`=Tests, `c`=Checkpoint, `d`=Deploy
- Press `Esc` to close

### Architect

Architecture Decision Records (ADRs) for your project. Create and approve decisions that get broadcast to all connected agents.

- Browse past architecture decisions
- Create new proposals (title, description, rationale, impact)
- Approve pending proposals
- Impact Analysis sidebar shows related decisions

---

## Engagement Modes

The mode selector (top-right of the header) filters what you see based on your role. Five modes:

| Mode | Who It's For | What You See |
|------|--------------|--------------|
| **CEO** | Executives | Health grade, progress summary, critical blockers only. Autonomous — agents decide and execute. |
| **VP** | Strategic leads | Strategic context + recent decisions + top 3 blockers |
| **Engineer** | Developers | Full agent activity + technical details (default) |
| **Builder** | Implementation focus | Implementation tasks + all task details |
| **Founder** | Full access | Everything visible, no filters |

Your selected mode persists across browser sessions (stored in `localStorage`). Switch mode at any time — takes effect immediately.

---

## Infinity Terminal

The terminal inside your dashboard. Start a `forge` command, close the browser, reopen it later — the session is still running.

### Starting a Terminal Session

1. Click the **Terminal** tab
2. The terminal connects automatically and shows your shell prompt
3. Run any command: `forge status`, `forge dashboard`, or any shell command

### How Persistence Works

```
Browser (xterm.js) → WebSocket → PTY Bridge → Shell process
                          ↓
               Session state stored in memory
               Session ID: "default-session"
               Auto-reconnect on browser reopen
```

The terminal does **not** require Zellij or tmux — persistence is built into the PTY bridge. Zellij is an optional enhancement for local terminal use, not a dependency.

### Multiple Devices

Open the same URL on another device (see [Multi-Device Setup](#multi-device-setup-wsl2)) — you're looking at the same session. Type in one browser, see it in the other.

---

## Project / Runspace Switcher

The left sidebar shows all projects forge-ui knows about. Click a project to switch context — the Dashboard, Vision, and Command views all update to show that project's data.

Projects are discovered by querying the forge-orchestrator's MCP server. If a project isn't showing up, run `forge init` in that project directory first.

---

## Governance HUD

The right sidebar is the Governance HUD — always visible. It shows real-time quality check status.

| Section | What It Shows |
|---------|---------------|
| Health Grade | A through F score across 8 quality dimensions |
| Active Agents | Count of running agents |
| Blocking Decisions | Decisions awaiting approval that block task completion |
| Memory Insights | Recent learnings captured from agent runs |
| Worker Pool Metrics | Agent pool utilization |

The HUD updates automatically when the forge-orchestrator detects state changes.

---

## Multi-Device Setup (WSL2)

Running forge-ui inside WSL2 and want to access from Windows or your phone?

**Step 1: Check your WSL2 IP**
```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
# Example: 192.168.1.206
```

**Step 2: Add Windows Firewall rule** (run in PowerShell as Administrator)
```powershell
New-NetFirewallRule `
  -DisplayName "NXTG Forge Dashboard" `
  -Direction Inbound `
  -LocalPort 5050,5051 `
  -Protocol TCP `
  -Action Allow
```

**Step 3: Access from other devices**
```
http://192.168.1.206:5050
```

The UI uses Vite's proxy, so all `/api` and `/ws` requests are automatically forwarded to the API server. No configuration needed.

> **Do NOT set `VITE_API_URL` or `VITE_WS_URL` in `.env`** — hardcoding localhost breaks multi-device access. Relative URLs through the Vite proxy work for all devices automatically.

---

## WebSocket API

The forge-ui API server exposes a WebSocket endpoint for real-time updates. The Vite dev proxy forwards `/ws` to `ws://localhost:5051/ws`.

### Connection

```
ws://localhost:5051/ws?token=<token>
```

**Authentication**: Every connection requires a token passed as a query parameter. Connections without a valid token are rejected immediately.

**Origin allowlist** (configurable via `ALLOWED_ORIGINS` env var):
```
http://localhost:5050
http://127.0.0.1:5050
http://localhost:5173
```

### Message Format

All messages (both directions) use JSON:

```json
{
  "type": "event.name",
  "payload": { },
  "timestamp": "2026-03-08T22:00:00.000Z"
}
```

### Server → Client Events

These events are broadcast to all connected clients when state changes:

| Event | When | Payload |
|-------|------|---------|
| `state.update` | On connect + any state change | Full project state object |
| `governance.update` | Forge governance state changes | Governance state object |
| `command.result` | After `command.execute` request | `{ output, success, correlationId }` |
| `pong` | In response to `ping` | `{ timestamp }` |
| `error` | Auth failure or invalid message | `{ error: "message" }` |

**On connect**, the server immediately sends a `state.update` message with the current full state — no need to make an HTTP request to bootstrap.

### Client → Server Messages

| Message | Action | Response |
|---------|--------|----------|
| `ping` | Heartbeat keepalive | Server replies `pong` |
| `state.update` | Update project state | Broadcasts updated state to all clients |
| `command.execute` | Run a forge command | Server replies `command.result` to requesting client only |

**Example — ping/pong:**
```javascript
const ws = new WebSocket('ws://localhost:5051/ws?token=your-token');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'pong') {
    console.log('Server alive, latency:', Date.now() - msg.payload.timestamp);
  }
};
```

**Example — execute a command:**
```javascript
const correlationId = crypto.randomUUID();

ws.send(JSON.stringify({
  type: 'command.execute',
  payload: 'frg-status',
  correlationId,
}));

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'command.result' && msg.correlationId === correlationId) {
    console.log(msg.payload.output);
  }
};
```

**Example — subscribe to governance updates:**
```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'state.update':
      updateDashboard(msg.payload);
      break;
    case 'governance.update':
      updateGovernanceHUD(msg.payload);
      break;
  }
};
```

### Terminal WebSocket (PTY Bridge)

The Infinity Terminal uses a **separate** WebSocket path:

```
ws://localhost:5051/terminal?sessionId=<id>&runspaceId=<id>
```

This path connects directly to a PTY (pseudo-terminal) process. Messages are raw terminal data (binary), not JSON. The xterm.js client in the browser handles rendering automatically.

---

## REST API Quick Reference

The API server also exposes HTTP endpoints (proxied via Vite to `/api`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check — returns `{ status: "healthy" }` |
| `/api/governance/state` | GET | Current governance state |
| `/api/governance/config` | GET | Governance configuration |
| `/api/governance/blockers` | GET | Blocking decisions list |
| `/api/governance/validate` | GET | Run governance validation |
| `/api/commands/` | GET | List registered commands |
| `/api/commands/execute` | POST | Execute a command: `{ command: "frg-status" }` |
| `/api/forge/health` | GET | Forge orchestrator connection health |
| `/api/forge/detect` | GET | Detect forge project in current directory |
| `/api/forge/status` | GET | Project task board status |
| `/api/state` | GET | Full dashboard state |

---

## Port Reference

| Port | Service | Bound To |
|------|---------|---------|
| 5050 | Vite Dev Server (UI) | 0.0.0.0 (all interfaces) |
| 5051 | API Server + WebSocket + PTY Bridge | 0.0.0.0 (all interfaces) |

Both ports bind to `0.0.0.0` so they're reachable from any device on the network — that's what makes multi-device access work without extra configuration.

---

## Next Steps

- **Troubleshooting**: [C-15-troubleshooting.md](C-15-troubleshooting.md)
- **MCP Tools Reference**: [C-12-mcp-tools.md](C-12-mcp-tools.md)
