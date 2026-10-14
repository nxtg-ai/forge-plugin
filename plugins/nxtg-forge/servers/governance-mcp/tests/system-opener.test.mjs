// forge_open_dashboard opens the file with the platform's own opener, not the `open` npm package
// (DIRECTIVE-NXTG-20261014-01: the server has no runtime dependencies, so nothing is installed on first launch).
import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { systemOpener, openWithSystem } from '../tools.mjs';

const SERVER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A spawn stand-in that records its call and emits `spawn` or `error` like a real ChildProcess.
function fakeSpawn(event, err) {
  const calls = [];
  const fn = (cmd, args, opts) => {
    const child = new EventEmitter();
    child.unrefCalled = false;
    child.unref = () => { child.unrefCalled = true; };
    calls.push({ cmd, args, opts, child });
    setImmediate(() => (event === 'spawn' ? child.emit('spawn') : child.emit('error', err)));
    return child;
  };
  return { fn, calls };
}

describe('system opener for forge_open_dashboard', () => {
  it('picks xdg-open on Linux, open on macOS and start on Windows', () => {
    expect(systemOpener('/tmp/d.html', 'linux')).toEqual({ cmd: 'xdg-open', args: ['/tmp/d.html'] });
    expect(systemOpener('/tmp/d.html', 'darwin')).toEqual({ cmd: 'open', args: ['/tmp/d.html'] });
    expect(systemOpener('C:\\t\\d.html', 'win32')).toEqual({ cmd: 'cmd', args: ['/c', 'start', '""', 'C:\\t\\d.html'] });
  });
  it('launches detached with no stdio (nothing reaches the MCP stdout) and resolves true once it started', async () => {
    const { fn, calls } = fakeSpawn('spawn');
    await expect(openWithSystem('/tmp/d.html', { platform: 'linux', spawnFn: fn })).resolves.toBe(true);
    expect(calls[0]).toMatchObject({ cmd: 'xdg-open', args: ['/tmp/d.html'], opts: { detached: true, stdio: 'ignore' } });
    expect(calls[0].child.unrefCalled).toBe(true);
  });
  it('resolves false, never throws, when the opener is missing', async () => {
    const { fn } = fakeSpawn('error', Object.assign(new Error('spawn xdg-open ENOENT'), { code: 'ENOENT' }));
    await expect(openWithSystem('/tmp/d.html', { platform: 'linux', spawnFn: fn })).resolves.toBe(false);
    const throwing = () => { throw new Error('EACCES'); };
    await expect(openWithSystem('/tmp/d.html', { platform: 'linux', spawnFn: throwing })).resolves.toBe(false);
  });
  it('with the real spawn, a command that does not exist resolves false', async () => {
    await expect(openWithSystem('/tmp/d.html', { platform: 'linux', spawnFn: (c, a, o) => spawn('forge-no-such-opener-xyz', a, o) })).resolves.toBe(false);
  });
  it('tools.mjs no longer imports the `open` package', () => {
    const src = readFileSync(join(SERVER_DIR, 'tools.mjs'), 'utf8');
    expect(src).not.toMatch(/import\(\s*["']open["']\s*\)/);
    expect(src).not.toMatch(/from\s+["']open["']/);
  });
});
