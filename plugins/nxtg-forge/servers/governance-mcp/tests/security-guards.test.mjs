// The 4 blocking security guards must never allow a call because jq is missing (alpha run 1, F-E).
// Each case runs in three arms, each with a PATH holding only the listed tools:
//   jq   — jq + awk: the normal path, behavior unchanged
//   awk  — no jq (the clean ubuntu:24.04 case, the mutant arm): known-bad input is still blocked
//   none — no jq, no awk: the input cannot be read, so every call is blocked (fail closed)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOKS = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'hooks', 'scripts');
const LIB = join(HOOKS, 'security-lib-json.sh');

// `type -P` resolves the binary even when the shell has an alias or function of the same name.
const bin = (cmd) => spawnSync('bash', ['-c', `type -P ${cmd}`], { encoding: 'utf8' }).stdout.trim();
const BASE = ['bash', 'cat', 'grep', 'tr', 'basename', 'dirname', 'sed', 'head'];
const HAS_JQ = bin('jq') !== '';

let root;
const arms = {};
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forge-guards-'));
  const make = (name, tools) => {
    const dir = join(root, name);
    mkdirSync(dir);
    for (const t of tools) symlinkSync(bin(t), join(dir, t));
    arms[name] = dir;
  };
  if (HAS_JQ) make('jq', [...BASE, 'awk', 'jq']);
  make('awk', [...BASE, 'awk']);
  make('none', BASE);
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

function guard(name, input, arm) {
  return spawnSync(arms.bash ?? bin('bash'), [join(HOOKS, `security-${name}.sh`)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: arms[arm], HOME: root },
    timeout: 10000,
  });
}

const BAD = [
  ['command-guard', { tool_name: 'Bash', tool_input: { command: 'rm -rf /' } }],
  ['command-guard', { tool_name: 'Bash', tool_input: { command: 'echo "hi" && cd x\nrm -rf /' } }],
  ['secret-shield', { tool_name: 'Read', tool_input: { file_path: '/home/u/.ssh/id_rsa' } }],
  ['secret-shield', { tool_name: 'Edit', tool_input: { file_path: '/repo/.env', new_string: 'A=1' } }],
  ['injection-guard', { tool_name: 'Write', tool_input: { file_path: 'x.py', content: 'x = eval(input())\n' } }],
  ['sql-guard', { tool_name: 'Write', tool_input: { file_path: 'q.py', content: 'cur.execute("SELECT * FROM users WHERE id=" + uid)\n' } }],
];
const GOOD = [
  ['command-guard', { tool_name: 'Bash', tool_input: { command: 'ls -la "my dir"' } }],
  ['secret-shield', { tool_name: 'Read', tool_input: { file_path: '/repo/src/app.js' } }],
  ['injection-guard', { tool_name: 'Write', tool_input: { file_path: 'x.py', content: 'print(1)\n' } }],
  ['sql-guard', { tool_name: 'Write', tool_input: { file_path: 'q.py', content: 'cur.execute("SELECT * FROM users WHERE id=%s", (uid,))\n' } }],
];

describe.each(HAS_JQ ? ['jq', 'awk', 'none'] : ['awk', 'none'])('guards, arm=%s', (arm) => {
  it.each(BAD)('%s blocks known-bad input', (name, input) => {
    const r = guard(name, input, arm);
    expect(r.status).toBe(2);
  });

  it.each(GOOD)('%s: known-good input', (name, input) => {
    const r = guard(name, input, arm);
    if (arm === 'none') {
      expect(r.status).toBe(2); // cannot read the input, so it blocks and says why
      expect(r.stderr).toContain('could not read the tool input');
    } else {
      expect(r.status).toBe(0);
    }
  });
});

describe('security_json_field: the awk decoder reads what jq reads', () => {
  const read = (json, path, arm) =>
    spawnSync(bin('bash'), ['-c', `source "${LIB}"; security_json_field "$1" "$2"`, '_', json, path], {
      encoding: 'utf8',
      env: { PATH: arms[arm] },
    });

  const VALUES = [
    'plain',
    'quote " backslash \\ slash /',
    'tabs\tand\nnewlines\r\n',
    'unicode \u0001 ctl and é non-ascii',
    'looks like a key: "command": "rm -rf /"',
    '',
  ];

  it.each(VALUES)('decodes %j like jq does', (value) => {
    const json = JSON.stringify({ tool_name: 'Bash', tool_input: { description: 'x "command": "no"', command: value } });
    // Compare what a guard sees: `VALUE=$(...)` drops trailing newlines in both paths.
    const seen = (s) => s.replace(/\n+$/, '');
    const viaAwk = read(json, 'tool_input.command', 'awk');
    expect(viaAwk.status).toBe(0);
    expect(seen(viaAwk.stdout)).toBe(seen(value));
    if (HAS_JQ) expect(seen(viaAwk.stdout)).toBe(seen(read(json, 'tool_input.command', 'jq').stdout));
  });

  it('an absent key reads as empty, not as an error', () => {
    const r = read('{"tool_name":"Bash","tool_input":{}}', 'tool_input.command', 'awk');
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it('a string that never closes is an error (the guard then blocks)', () => {
    const r = read('{"tool_input":{"command":"rm -rf /', 'tool_input.command', 'awk');
    expect(r.status).toBe(3);
  });

  it('no jq and no awk is an error', () => {
    const r = read('{"tool_input":{"command":"ls"}}', 'tool_input.command', 'none');
    expect(r.status).toBe(3);
  });
});
