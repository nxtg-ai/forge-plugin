// MCP conformance of governance-mcp's own stdio JSON-RPC loop (DIRECTIVE-NXTG-20261014-01). The server no
// longer uses the MCP SDK at runtime, so the SDK's client is the judge here, not the loop's own assumptions.
// The raw-protocol cases cover what the SDK client does not exercise: notifications, unknown methods,
// malformed JSON, id types, version negotiation and stdout purity.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, PROTOCOL_VERSIONS } from '../index.mjs';

const SERVER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const START = join(SERVER_DIR, 'start.sh');
let proj;

beforeAll(() => { proj = mkdtempSync(join(tmpdir(), 'forge-mcp-conf-')); });
afterAll(() => rmSync(proj, { recursive: true, force: true }));

// Send raw lines, close stdin, and collect every stdout line and stderr.
function raw(lines) {
  return new Promise((done) => {
    const c = spawn('bash', [START], { cwd: proj, env: { ...process.env, FORGE_PROJECT_ROOT: proj, FORGE_TEST_MODE: '' }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { err += d; });
    c.on('close', (code) => {
      const frames = out.split('\n').filter(Boolean);
      done({ code, frames, replies: frames.map((l) => JSON.parse(l)), stderr: err });
    });
    c.stdin.end(lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n');
  });
}
const init = (id, protocolVersion = '2025-11-25') => ({ jsonrpc: '2.0', id, method: 'initialize', params: { protocolVersion, capabilities: {}, clientInfo: { name: 't', version: '1' } } });
const byId = (r, id) => r.replies.find((m) => m.id === id);

describe('governance-mcp speaks MCP to the SDK client', () => {
  let client;
  beforeAll(async () => {
    client = new Client({ name: 'conformance', version: '1.0.0' }, { capabilities: {} });
    await client.connect(new StdioClientTransport({ command: 'bash', args: [START], cwd: proj, env: { ...process.env, FORGE_PROJECT_ROOT: proj, FORGE_TEST_MODE: '' }, stderr: 'pipe' }));
  }, 15000);
  afterAll(async () => { await client?.close(); });

  it('initialize: negotiates the SDK client\'s latest protocol version and reports tools capability and server info', () => {
    expect(client.getServerVersion()).toMatchObject({ name: 'forge-governance' });
    expect(client.getServerCapabilities()).toEqual({ tools: {} });
    expect(PROTOCOL_VERSIONS).toContain(LATEST_PROTOCOL_VERSION);
    expect(PROTOCOL_VERSIONS).toEqual(SUPPORTED_PROTOCOL_VERSIONS);
  });
  it('tools/list returns all 8 governance tools with their schemas', async () => {
    const { tools } = await client.listTools();
    expect(tools).toEqual(TOOLS);
  });
  it('tools/call runs a tool and returns MCP text content', async () => {
    const r = await client.callTool({ name: 'forge_list_checkpoints', arguments: {} });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].type).toBe('text');
    expect(() => JSON.parse(r.content[0].text)).not.toThrow();
  });
  it('tools/call of an unknown tool returns isError content, not a protocol error', async () => {
    const r = await client.callTool({ name: 'forge_no_such_tool', arguments: {} });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toBe('Unknown tool: forge_no_such_tool');
  });
  it('ping', async () => {
    await expect(client.ping()).resolves.toEqual({});
  });
});

describe('governance-mcp raw protocol', () => {
  it('protocol version: a supported one is echoed, an unknown one gets the server\'s latest', async () => {
    const r = await raw([init(1, '2024-11-05'), init(2, '2099-01-01')]);
    expect(byId(r, 1).result.protocolVersion).toBe('2024-11-05');
    expect(byId(r, 2).result.protocolVersion).toBe(PROTOCOL_VERSIONS[0]);
  });
  it('notifications get no reply, and responses from the client get none either', async () => {
    const r = await raw([
      init(1),
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 9 } },
      { jsonrpc: '2.0', method: 'notifications/roots/list_changed' },
      { jsonrpc: '2.0', id: 'c1', result: {} },
      { jsonrpc: '2.0', id: 2, method: 'ping' },
    ]);
    expect(r.replies.map((m) => m.id).sort()).toEqual([1, 2]);
  });
  it('an unknown method (Claude Code\'s server/discover probe) gets -32601', async () => {
    const r = await raw([{ jsonrpc: '2.0', id: 'server-discover-probe-1', method: 'server/discover', params: {} }]);
    expect(r.replies).toEqual([{ jsonrpc: '2.0', id: 'server-discover-probe-1', error: { code: -32601, message: 'Method not found' } }]);
  });
  it('malformed JSON gets -32700 with id null, and the loop keeps answering', async () => {
    const r = await raw(['{"jsonrpc":"2.0","id":1,"method":', { jsonrpc: '2.0', id: 2, method: 'ping' }]);
    expect(r.replies).toContainEqual({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    expect(byId(r, 2)).toEqual({ jsonrpc: '2.0', id: 2, result: {} });
  });
  it('string and numeric ids are echoed unchanged', async () => {
    const r = await raw([{ jsonrpc: '2.0', id: 'abc-1', method: 'ping' }, { jsonrpc: '2.0', id: 0, method: 'ping' }, { jsonrpc: '2.0', id: 42, method: 'tools/list' }]);
    expect(byId(r, 'abc-1').result).toEqual({});
    expect(byId(r, 0).result).toEqual({});
    expect(byId(r, 42).result.tools).toHaveLength(8);
  });
  it('stdout carries only JSON-RPC frames, also while tools run; the process exits 0 when stdin ends', async () => {
    const calls = ['forge_get_governance_health', 'forge_get_git_status', 'forge_get_code_metrics', 'forge_security_scan', 'forge_list_checkpoints', 'forge_get_governance_state']
      .map((name, i) => ({ jsonrpc: '2.0', id: 10 + i, method: 'tools/call', params: { name, arguments: {} } }));
    const r = await raw([init(1), { jsonrpc: '2.0', method: 'notifications/initialized' }, ...calls]);
    expect(r.code).toBe(0);
    for (const f of r.frames) expect(JSON.parse(f), f.slice(0, 80)).toMatchObject({ jsonrpc: '2.0' });
    expect(r.replies.map((m) => m.id).sort((a, b) => a - b)).toEqual([1, 10, 11, 12, 13, 14, 15]);
  }, 30000);
  it('every reply is flushed before exit when stdin closes right after the last request (Opus seat 1, MEDIUM)', async () => {
    // 3000 tools/list replies are about 7 MB, far past one pipe buffer; process.exit() on stdin end used to cut them.
    const n = 3000;
    const r = await raw(Array.from({ length: n }, (_, i) => ({ jsonrpc: '2.0', id: i + 1, method: 'tools/list' })));
    expect(r.code).toBe(0);
    expect(r.replies).toHaveLength(n);
    expect(r.replies.every((m) => m.result?.tools?.length === 8)).toBe(true);
  }, 60000);
  it('no code path writes to stdout except the protocol loop (console.log / process.stdout)', () => {
    for (const f of ['index.mjs', 'tools.mjs']) {
      const src = readFileSync(join(SERVER_DIR, f), 'utf8');
      expect(src.match(/console\.log\(/g), f).toBeNull();
      // index.mjs: serve()'s default output, and the empty write that flushes replies before exit.
      expect((src.match(/process\.stdout/g) ?? []).length, f).toBe(f === 'index.mjs' ? 2 : 0);
      if (f === 'index.mjs') expect(src).toMatch(/process\.stdout\.write\("", \(\) => process\.exit\(0\)\)/);
    }
  });
});
