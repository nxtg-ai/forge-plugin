// forge_open_dashboard opens the file with the platform's own opener, not the `open` npm package
// (DIRECTIVE-NXTG-20261014-01: the server has no runtime dependencies, so nothing is installed on first launch).
import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { systemOpener, openWithSystem, browserCommands, openWithBrowserEnv, openDashboardFile, dashboardHint } from '../tools.mjs';

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

// DIRECTIVE-NXTG-20261014-09 (M2): v3.13.0's `open` package ran its bundled xdg-open, which honours BROWSER;
// v3.13.1's system opener did not, so a Linux machine with BROWSER set and no xdg-open stopped opening the
// dashboard (codex review of eb5499d). Order now: BROWSER, then the system opener, then (WSL) PowerShell and
// wslview, then the path hint.
describe('BROWSER for forge_open_dashboard', () => {
  it('parses BROWSER like xdg-open: %s is replaced by the path, otherwise the path is appended; flags are kept', () => {
    expect(browserCommands('firefox', '/tmp/d.html', ':')).toEqual([{ cmd: 'firefox', args: ['/tmp/d.html'] }]);
    expect(browserCommands('chrome --new-window %s --flag', '/tmp/d.html', ':')).toEqual([{ cmd: 'chrome', args: ['--new-window', '/tmp/d.html', '--flag'] }]);
    expect(browserCommands('/usr/bin/google-chrome --headless --screenshot=/x.png', '/tmp/d.html', ':'))
      .toEqual([{ cmd: '/usr/bin/google-chrome', args: ['--headless', '--screenshot=/x.png', '/tmp/d.html'] }]);
    expect(browserCommands('b --url=%s', '/tmp/a$&b.html', ':')).toEqual([{ cmd: 'b', args: ['--url=/tmp/a$&b.html'] }]);
  });
  it('a list of browsers (path-delimiter separated) is tried in order; empty entries and an unset BROWSER give nothing', () => {
    expect(browserCommands('w3m:firefox %s', '/t.html', ':')).toEqual([{ cmd: 'w3m', args: ['/t.html'] }, { cmd: 'firefox', args: ['/t.html'] }]);
    expect(browserCommands('a.exe;b.exe', 'C:\\t.html', ';').map((c) => c.cmd)).toEqual(['a.exe', 'b.exe']);
    expect(browserCommands(undefined, '/t.html', ':')).toEqual([]);
    expect(browserCommands('  ', '/t.html', ':')).toEqual([]);
    expect(browserCommands('::', '/t.html', ':')).toEqual([]);
  });
  it('launches BROWSER detached, without a shell and with no stdio, and stops at the first one that starts', async () => {
    const { fn, calls } = fakeSpawn('spawn');
    await expect(openWithBrowserEnv('/tmp/d.html', { env: { BROWSER: 'firefox %s:chrome' }, spawnFn: fn })).resolves.toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ cmd: 'firefox', args: ['/tmp/d.html'], opts: { detached: true, stdio: 'ignore' } });
    expect(calls[0].opts.shell).toBeFalsy();
    expect(calls[0].child.unrefCalled).toBe(true);
  });
  it('a BROWSER entry that cannot start falls through to the next; all failing resolves false, never throws', async () => {
    const seen = [];
    const fn = (cmd, args, opts) => { seen.push(cmd); return fakeSpawn(cmd === 'missing' ? 'error' : 'spawn', new Error('ENOENT')).fn(cmd, args, opts); };
    await expect(openWithBrowserEnv('/t.html', { env: { BROWSER: 'missing:chrome' }, spawnFn: fn })).resolves.toBe(true);
    expect(seen).toEqual(['missing', 'chrome']);
    const { fn: failing } = fakeSpawn('error', new Error('ENOENT'));
    await expect(openWithBrowserEnv('/t.html', { env: { BROWSER: 'a:b' }, spawnFn: failing })).resolves.toBe(false);
    const { fn: unused, calls } = fakeSpawn('spawn');
    await expect(openWithBrowserEnv('/t.html', { env: {}, spawnFn: unused })).resolves.toBe(false);
    expect(calls).toHaveLength(0);
  });
  it('order: BROWSER first; the system opener only when BROWSER is unset or fails; on WSL never xdg-open', async () => {
    const run = async (env, isWSL, failing = []) => {
      const seen = [];
      const fn = (cmd, args, opts) => { seen.push(cmd); return fakeSpawn(failing.includes(cmd) ? 'error' : 'spawn', new Error('ENOENT')).fn(cmd, args, opts); };
      const opened = await openDashboardFile('/t.html', { env, isWSL, platform: 'linux', spawnFn: fn });
      return { opened, seen };
    };
    expect(await run({ BROWSER: 'chrome' }, false)).toEqual({ opened: true, seen: ['chrome'] });
    expect(await run({ BROWSER: 'chrome' }, false, ['chrome'])).toEqual({ opened: true, seen: ['chrome', 'xdg-open'] });
    expect(await run({}, false)).toEqual({ opened: true, seen: ['xdg-open'] });
    expect(await run({ BROWSER: 'chrome' }, false, ['chrome', 'xdg-open'])).toEqual({ opened: false, seen: ['chrome', 'xdg-open'] });
    // WSL: BROWSER is honoured; when it fails the caller goes on to PowerShell / wslview, not xdg-open.
    expect(await run({ BROWSER: 'wslview' }, true)).toEqual({ opened: true, seen: ['wslview'] });
    expect(await run({ BROWSER: 'wslview' }, true, ['wslview'])).toEqual({ opened: false, seen: ['wslview'] });
  });
  it('with the real spawn, a BROWSER program really runs and receives the dashboard path', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'forge-browser-env-'));
    try {
      const receipt = join(dir, 'opened.txt');
      const prog = join(dir, 'fake-browser');
      writeFileSync(prog, `#!/usr/bin/env bash\nprintf '%s|%s' "$1" "$2" > ${JSON.stringify(receipt)}\n`);
      chmodSync(prog, 0o755);
      await expect(openWithBrowserEnv('/tmp/forge-dashboard-1.html', { env: { BROWSER: `${prog} --flag %s` } })).resolves.toBe(true);
      for (let i = 0; i < 100 && !existsSync(receipt); i++) await new Promise((r) => setTimeout(r, 20));
      expect(readFileSync(receipt, 'utf8')).toBe('--flag|/tmp/forge-dashboard-1.html');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// #91 seat L-1: when nothing opened the dashboard, only WSL got a hint; on other Linux the result had a path and
// a URL but no sentence saying the browser did not open.
describe('forge_open_dashboard hint when nothing opened it', () => {
  it('WSL: the Windows URL; elsewhere: the file URL; nothing when it opened', () => {
    expect(dashboardHint({ isWSL: true, opened: false, browserUrl: 'file://///wsl.localhost/U/tmp/d.html' }))
      .toEqual({ hint: 'Paste this URL into your Windows browser: file://///wsl.localhost/U/tmp/d.html' });
    expect(dashboardHint({ isWSL: false, opened: false, browserUrl: 'file:///tmp/d.html' }))
      .toEqual({ hint: 'Open this file in your browser: file:///tmp/d.html' });
    expect(dashboardHint({ isWSL: false, opened: true, browserUrl: 'file:///tmp/d.html' })).toEqual({});
    expect(dashboardHint({ isWSL: true, opened: true, browserUrl: 'x' })).toEqual({});
  });
  it('generateDashboard returns the hint from dashboardHint', () => {
    const src = readFileSync(join(SERVER_DIR, 'tools.mjs'), 'utf8');
    expect(src).toContain('...dashboardHint({ isWSL, opened, browserUrl }),');
  });
});
