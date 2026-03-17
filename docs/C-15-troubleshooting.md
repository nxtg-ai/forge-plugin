# Troubleshooting

Common issues and fixes for forge-ui, the forge CLI, and the plugin. If something isn't working, it's probably one of these.

---

## Dashboard Issues

### Dashboard won't load — blank page or "Cannot connect"

**Symptom**: `http://localhost:5050` shows a blank page, connection refused error, or the page never finishes loading.

**Fix**:
```bash
cd ~/projects/NXTG-Forge/v3
npm run dev
```

Both services must be running: Vite UI on port 5050 and the API server on port 5051. The `npm run dev` command starts both.

Check what's actually running:
```bash
ss -tlnp | grep 505
```

Expected output:
```
LISTEN 0.0.0.0:5050   # Vite UI
LISTEN 0.0.0.0:5051   # API server
```

If port 5051 is missing, the API server failed to start. Check for TypeScript errors:
```bash
npx tsx src/server/api-server.ts
```

---

### Dashboard loads but shows "Disconnected"

**Symptom**: The UI loads but the top-right indicator shows "Disconnected" (red or grey dot). The Dashboard tab shows no data.

**Cause**: The WebSocket connection from the browser to `ws://localhost:5051/ws` failed.

**Fix 1 — Check the API server is running:**
```bash
curl http://localhost:5051/api/health
# Expected: {"status":"healthy"}
```

**Fix 2 — Check for origin mismatch:**
The WebSocket server only accepts connections from allowlisted origins. If you're accessing on a non-standard port or custom URL, the server will reject the connection.

Default allowed origins:
- `http://localhost:5050`
- `http://127.0.0.1:5050`
- `http://localhost:5173`

To allow additional origins, set `ALLOWED_ORIGINS` in your `.env`:
```bash
ALLOWED_ORIGINS=http://192.168.1.206:5050,http://localhost:5050
```

**Fix 3 — Check for a firewall block (WSL2):**
See [Can't access from other devices (WSL2)](#cant-access-from-other-devices-wsl2) below.

---

### No governance data — HUD shows empty or placeholder values

**Symptom**: The Governance HUD in the right sidebar shows dashes, zeros, or "No data available".

**Cause**: The forge-orchestrator isn't running in your project, or forge-ui can't find `.forge/state.json`.

**Fix**:
```bash
# In your project directory
forge init          # Creates .forge/ if missing
forge plan --generate  # Generates tasks and state
```

Then verify:
```bash
forge status        # Should show task board
```

If the orchestrator is running but the HUD is still empty, check `GET /api/governance/state`:
```bash
curl http://localhost:5051/api/governance/state
```

---

### Command palette backdrop stuck (cosmetic)

**Symptom**: After closing the command palette with `Esc`, a dark overlay remains and blocks clicks on the Governance HUD.

**Fix**: Click anywhere in the main content area to dismiss the overlay.

**Status**: Known cosmetic issue (P2). Workaround is effective.

---

## Terminal Issues

### Infinity Terminal shows blank / never connects

**Symptom**: The Terminal tab loads but the terminal area is blank, or it keeps showing "Connecting..."

**Fix 1 — Confirm the PTY bridge is running:**
```bash
curl http://localhost:5051/api/health
```

If this fails, the API server isn't running. See [Dashboard won't load](#dashboard-wont-load--blank-page-or-cannot-connect).

**Fix 2 — Check node-pty is installed:**
```bash
ls node_modules/node-pty
```

If missing:
```bash
npm install
```

**Fix 3 — WSL2 shell detection:**
The PTY bridge tries to detect your shell from `SHELL` environment variable, defaulting to `bash`. If you're using `zsh` or `fish`, set it explicitly:
```bash
# In .env
SHELL=/usr/bin/zsh
```

---

### Terminal session lost after browser refresh

**Symptom**: Refreshing the browser starts a new terminal session instead of reconnecting to the existing one.

**Cause**: The session ID wasn't preserved across the navigation. The Infinity Terminal connects using a session ID stored in the browser.

**Fix**: The session ID is stored in `sessionStorage` per tab. Use the same tab (don't close and reopen — just refresh). If you need to close and reopen:
1. Note the session ID shown in the terminal header
2. When you reopen, the `useSessionPersistence` hook automatically attempts reconnection using the stored ID

**Background**: Sessions persist as long as the API server process is running. If you restart `npm run dev`, all sessions are cleared (they lived in memory).

---

### Terminal input not responding / keys not registering

**Symptom**: The terminal appears connected but keystrokes don't appear or commands don't execute.

**Fix 1 — Click inside the terminal pane** to ensure it has focus. xterm.js requires explicit focus.

**Fix 2 — Check PTY process is alive:**
```bash
ps aux | grep pty
```

**Fix 3 — Resize the window.** Sometimes xterm.js and the PTY disagree about terminal dimensions after a resize. Drag the panel border slightly to trigger a SIGWINCH.

---

## Multi-Device / Remote Access Issues

### Can't access from other devices (WSL2)

**Symptom**: `http://192.168.1.206:5050` times out when accessed from Windows, phone, or another machine.

**Root cause**: Windows Firewall blocks inbound connections to WSL2, even though WSL2 binds to `0.0.0.0`.

**Fix — Add a Windows Firewall rule** (PowerShell as Administrator):
```powershell
New-NetFirewallRule `
  -DisplayName "NXTG Forge Dashboard" `
  -Direction Inbound `
  -LocalPort 5050,5051 `
  -Protocol TCP `
  -Action Allow
```

Find your WSL2 IP:
```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
```

Then access via `http://<wsl2-ip>:5050` from any device on the same network.

---

### Dashboard loads but WebSocket disconnects on non-localhost access

**Symptom**: Dashboard loads from a remote device, but shows "Disconnected" immediately.

**Root cause**: The remote origin isn't in the WebSocket allowlist.

**Fix**: Set `ALLOWED_ORIGINS` in `v3/.env` before starting the dev server:
```bash
# v3/.env
ALLOWED_ORIGINS=http://192.168.1.206:5050,http://localhost:5050,http://127.0.0.1:5050
```

Restart `npm run dev` after changing `.env`.

---

### `VITE_API_URL` set — breaks multi-device access

**Symptom**: Dashboard works on localhost but API calls fail from other devices (wrong hostname in requests).

**Root cause**: A `VITE_API_URL` or `VITE_WS_URL` environment variable is hardcoding `localhost` into the client bundle.

**Fix**: Remove these from `.env`:
```bash
# WRONG — do not set these
# VITE_API_URL=http://localhost:5051
# VITE_WS_URL=ws://localhost:5051

# Correct: leave unset. Vite proxy handles routing automatically.
```

The UI uses relative URLs (`/api/...`) which Vite proxies to the API server. This works from any device because the browser resolves them relative to whatever host it loaded the page from.

---

## CLI / Orchestrator Issues

### `forge` runs the wrong binary (Python collision)

**Symptom**: Running `forge` gives a Python error or unexpected output about "forge-alchemy" or similar Python tools.

**Root cause**: `pip install forge` installs a Python `forge` binary to `~/.local/bin/`, which may appear before `~/.cargo/bin/` in your PATH.

**Fix — Check PATH order:**
```bash
which forge
# Should be: ~/.cargo/bin/forge (or ~/.local/bin/forge-orca if using the dev binary)
```

**Fix — Reorder PATH** (add to `~/.bashrc` or `~/.zshrc`):
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

**Fix — Use the explicit path:**
```bash
~/.cargo/bin/forge status
```

**Fix — Uninstall the Python package:**
```bash
pip uninstall forge
```

---

### `forge init` fails — "not a git repository"

**Symptom**: `forge init` exits with an error about git.

**Fix**:
```bash
git init
forge init
```

Forge requires a git repository. If you're starting a brand new project, initialize git first.

---

### `forge plan --generate` produces shallow tasks with no file assignments

**Symptom**: The generated plan has 15-20 generic tasks like "Implement core functionality" with no specific files, no dependencies, and no acceptance criteria.

**Root cause**: The AI brain is set to `rule-based` (the free heuristic mode). This mode produces shallow plans by design.

**Fix**: Switch to the OpenAI brain for quality task decomposition:
```bash
forge config brain openai
# Enter your OpenAI API key when prompted
forge plan --generate
```

The OpenAI brain produces tasks with:
- Specific file assignments (`locked_files`)
- Dependency chains (`depends_on`)
- Measurable acceptance criteria
- Agent assignments (claude/codex/gemini per role)

---

### `forge dashboard` — agents not launching / PTY errors

**Symptom**: The TUI dashboard starts but agent PTY panes show errors or never connect.

**Fix 1 — Log in to each AI tool first (one-time setup):**
```bash
claude   # → authenticate with Anthropic
codex    # → authenticate with OpenAI
gemini   # → authenticate with Google
```

Then restart:
```bash
forge dashboard --pty
```

**Fix 2 — Check the tool is in PATH:**
```bash
which claude
which codex
which gemini
```

If any are missing, install them:
- Claude Code: `npm install -g @anthropic-ai/claude-code`
- Codex CLI: `npm install -g @openai/codex`
- Gemini CLI: `npm install -g @google/gemini-cli`

---

### MCP server not starting / "tool not found" in Claude Code

**Symptom**: Claude Code shows "forge_get_tasks not found" or the forge MCP tools are unavailable.

**Fix 1 — Check `.mcp.json` is in your project root:**
```json
{
  "mcpServers": {
    "forge": {
      "command": "forge",
      "args": ["mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

**Fix 2 — Test the MCP server directly:**
```bash
echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | forge mcp
```

Expected: a JSON response with `serverInfo` containing `"name":"forge-orchestrator"`.

**Fix 3 — Confirm `forge init` was run** in the project directory. The MCP server needs `.forge/state.json` to exist.

**Fix 4 — Check forge binary is in PATH for Claude Code:**
```bash
which forge
```

Claude Code spawns the MCP server using the PATH it inherits. If forge isn't findable, the server won't start. Add an absolute path in `.mcp.json` if needed:
```json
{
  "mcpServers": {
    "forge": {
      "command": "/home/username/.cargo/bin/forge",
      "args": ["mcp"]
    }
  }
}
```

---

## Plugin Issues

### `/forge:status` command not found

**Symptom**: Typing `/forge:status` in Claude Code gives "command not found" or similar.

**Fix**: The forge plugin must be installed in Claude Code:
```bash
claude plugin marketplace add nxtg-ai/forge-plugin
claude plugin install forge
```

After installation, restart Claude Code and the commands will be available.

---

### Plugin commands run but produce no output

**Symptom**: Running a plugin command completes but shows blank output or generic placeholder text.

**Root cause**: The MCP server isn't connected, so the plugin falls back to placeholder responses.

**Fix**: Ensure the forge MCP server is configured in `.mcp.json` (see [MCP server not starting](#mcp-server-not-starting--tool-not-found-in-claude-code) above) and that `forge init` has been run in the current project.

---

## Coverage / CI Issues

### Branch coverage below threshold

**Symptom**: CI fails with `Coverage for branches (X%) does not meet global threshold (75%)`.

**Fix**: Add branch-covering tests for the lowest-coverage files. Find them:
```bash
npm run test:coverage 2>&1 | grep -E "^\s+\S+\.ts" | sort -t'|' -k3 -n | head -10
```

Files at 0% branch coverage almost always have untested error paths. The `error instanceof Error ? error.message : "Unknown error"` pattern in catch blocks is the most common culprit — test it with both an `Error` instance and a non-Error throw.

Do **not** lower the threshold to fix this. Add real tests.

---

## Getting More Help

- **GitHub Issues**: https://github.com/nxtg-ai/forge-ui/issues
- **Discord**: https://discord.gg/nxtg-ai (coming soon)
- **Docs**: https://forge.nxtg.ai/forge/docs

When filing a bug report, include:
1. `forge --version` output
2. Node.js version: `node --version`
3. OS: WSL2/Linux/macOS
4. The full error message (not a screenshot — paste the text)
5. Steps to reproduce
