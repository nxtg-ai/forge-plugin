#!/usr/bin/env node
// The orchestrator line in /nxtg-forge:status, decided by code (DIRECTIVE-NXTG-20261013-20, alpha run 4 F-N).
// In run 3 and run 4 the model got the same `forge_get_state` error and the same status.md text, and printed
// different lines. So the model no longer decides: this script starts the same launcher Claude Code starts
// (servers/orchestrator-mcp/start.sh), asks it over MCP for its tools and for forge_get_state, and maps
// those results to one exact line. The command prints the line as given.
//
//   node orchestrator-status.mjs [--project <dir>]   ->   orchestrator=<state>\nline=<line>
//
// States: not_installed (no forge_get_state tool: the launcher's stand-in, or no server), not_initialized
// (the tool says the project is not initialized), connected (the tool returned state), and error (the tool
// exists but failed for another reason, or did not answer). The --json "orchestrator" value is the state.
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export const LINES = {
  not_installed: '○ **Not connected** — add multi-agent orchestration: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`, then start a new Claude Code session',
  not_initialized: '◐ **Connected; not initialized here** — run `forge init` in this project',
  connected: '● **Connected**',
  error: '◐ **Connected; state unavailable** — `forge_get_state` failed: ',
};
// The orchestrator's not-initialized message, e.g. "Forge is not initialized. Run `forge init` in this project first."
const NOT_INITIALIZED = /\bnot initiali[sz]ed\b/i;

// Pure: tool names from tools/list, and the forge_get_state result ({ isError, text }) or null if the call
// never returned. Returns { state, line }.
export function classify({ tools, getState }) {
  if (!Array.isArray(tools) || !tools.includes('forge_get_state')) return { state: 'not_installed', line: LINES.not_installed };
  if (!getState) return { state: 'error', line: `${LINES.error}no answer` };
  const text = String(getState.text ?? '').trim();
  if (getState.isError) {
    if (NOT_INITIALIZED.test(text)) return { state: 'not_initialized', line: LINES.not_initialized };
    return { state: 'error', line: `${LINES.error}${text.split('\n')[0].slice(0, 160) || 'no message'}` };
  }
  return { state: 'connected', line: LINES.connected };
}

// The text of a tools/call reply, whether the failure came as an MCP tool error or a JSON-RPC error.
export function toolResult(reply) {
  if (!reply) return null;
  if (reply.error) return { isError: true, text: String(reply.error.message ?? '') };
  const r = reply.result ?? {};
  const text = (Array.isArray(r.content) ? r.content : []).filter((c) => c?.type === 'text').map((c) => c.text).join('\n');
  return { isError: r.isError === true, text };
}

// Starts the launcher and asks it, over MCP stdio, for tools/list and forge_get_state.
export function probe({ root, launcher, timeoutMs = 8000 }) {
  return new Promise((done) => {
    const child = spawn('bash', [launcher], { cwd: root, env: { ...process.env, FORGE_PROJECT_ROOT: root }, stdio: ['pipe', 'pipe', 'ignore'] });
    const replies = new Map();
    let buf = '';
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      const list = replies.get(2)?.result?.tools;
      done({ tools: Array.isArray(list) ? list.map((t) => t.name) : [], getState: toolResult(replies.get(3)) });
    };
    const timer = setTimeout(finish, timeoutMs);
    const send = (m) => { try { child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...m })}\n`); } catch { /* exited */ } };
    child.on('error', finish);
    child.stdin.on('error', () => {}); // a launcher that exits at once must not crash the probe
    child.on('exit', finish);
    child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const lineText = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(lineText); } catch { continue; }
        if (m.id === undefined) continue;
        replies.set(m.id, m);
        if (m.id === 1) {
          send({ method: 'notifications/initialized' });
          send({ id: 2, method: 'tools/list', params: {} });
        } else if (m.id === 2) {
          const names = (m.result?.tools ?? []).map((t) => t.name);
          if (names.includes('forge_get_state')) send({ id: 3, method: 'tools/call', params: { name: 'forge_get_state', arguments: {} } });
          else finish();
        } else if (m.id === 3) finish();
      }
    });
    send({ id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'nxtg-forge-status', version: '1' } } });
  });
}

async function main(argv) {
  const i = argv.indexOf('--project');
  const root = resolve(i >= 0 ? argv[i + 1] : (process.env.CLAUDE_PROJECT_DIR || process.cwd()));
  const launcher = process.env.FORGE_ORCHESTRATOR_LAUNCHER
    || join(dirname(fileURLToPath(import.meta.url)), '..', 'servers', 'orchestrator-mcp', 'start.sh');
  const { state, line } = classify(await probe({ root, launcher }));
  process.stdout.write(`orchestrator=${state}\nline=${line}\n`);
  return 0;
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(fileURLToPath(import.meta.url))) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });
