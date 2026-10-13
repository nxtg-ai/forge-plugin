// /nxtg-forge:feature's step routing (DIRECTIVE-NXTG-20261013-05). At v3.11.0, Step 4's approve
// branch said "Proceed to Step 5", which jumped over Step 4.2 (create and claim the orchestrator
// task); and under `claude -p` there is no one to confirm with. feature-task.test.mjs drives the
// helper directly, so it cannot see the routing. This test reads the command text.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FEATURE_MD = join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'), 'commands', 'feature.md');
const TASK_STEP = 4.2;

// { "1": "...body...", "4": "...", "4.2": "...", ... } from the `## Step N:` headings.
function sections(md) {
  const out = {};
  const re = /^## Step (\d+(?:\.\d+)?):[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/gm;
  for (const m of md.replace(/\r\n/g, '\n').matchAll(re)) out[m[1]] = m[2];
  return out;
}
// Each "Proceed to / Go back to / continue to / move to Step N" is an edge to N.
const edges = (body) => [...body.matchAll(/\b(?:Proceed|Go back|[Cc]ontinue|[Mm]ove) to Step (\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));

export function routingProblems(md) {
  const s = sections(md);
  const problems = [];
  if (!s['4'] || !s[String(TASK_STEP)]) return ['Step 4 or Step 4.2 is missing'];
  for (const [step, body] of Object.entries(s)) {
    if (Number(step) >= TASK_STEP) continue;
    for (const to of edges(body)) {
      if (to > TASK_STEP) problems.push(`Step ${step} routes to Step ${to}, over Step ${TASK_STEP}`);
    }
  }
  const fwd = edges(s['4']).filter((n) => n > 4);
  if (!fwd.length || fwd.some((n) => n !== TASK_STEP)) problems.push(`Step 4 forward edges are [${fwd}], not only ${TASK_STEP}`);
  const approve = s['4'].split('\n').find((l) => /Looks good/.test(l)) ?? '';
  if (!edges(approve).includes(TASK_STEP)) problems.push(`approve branch does not go to Step ${TASK_STEP}: ${approve.trim()}`);
  const nonInteractive = s['4'].split('\n').find((l) => /no one can be asked/i.test(l)) ?? '';
  if (!/do not stop/i.test(nonInteractive) || !edges(nonInteractive).includes(TASK_STEP)) {
    problems.push('Step 4 has no non-interactive branch that proceeds to Step 4.2 without stopping');
  }
  if (!/required whenever the orchestrator tools/i.test(s[String(TASK_STEP)])) problems.push('Step 4.2 is not required when the orchestrator tools are present');
  if (!edges(s[String(TASK_STEP)]).includes(4.5)) problems.push('Step 4.2 does not continue to Step 4.5');
  if (!/no one can be asked/i.test(s['1'] ?? '') || !/do not stop/i.test(s['1'] ?? '')) problems.push('Step 1 stops when no one can be asked');
  return problems;
}

describe('/nxtg-forge:feature routing', () => {
  const md = readFileSync(FEATURE_MD, 'utf8');

  it('no branch before Step 4.2 skips it, approved or non-interactive', () => {
    expect(routingProblems(md)).toEqual([]);
  });

  it('catches the v3.11.0 text: approve -> Step 5', () => {
    const v3110 = md.replace('"Looks good, start implementing" -> Proceed to Step 4.2', '"Looks good, start implementing" -> Proceed to Step 5');
    expect(v3110).not.toBe(md);
    expect(routingProblems(v3110)).toContain('Step 4 routes to Step 5, over Step 4.2');
  });

  it('catches a missing non-interactive branch', () => {
    const noBranch = md.replace(/^If no one can be asked[^\n]*Proceed to Step 4\.2\.\r?\n/m, '');
    expect(noBranch).not.toBe(md);
    expect(routingProblems(noBranch)).toContain('Step 4 has no non-interactive branch that proceeds to Step 4.2 without stopping');
  });

  it('catches Step 4.2 made optional', () => {
    const optional = md.replace('This step is required whenever the orchestrator tools', 'This step is optional when the orchestrator tools');
    expect(optional).not.toBe(md);
    expect(routingProblems(optional)).toContain('Step 4.2 is not required when the orchestrator tools are present');
  });
});

// DIRECTIVE-NXTG-20261013-10: the completing agent is recorded from an explicit argument, never
// inferred from the claimer. Every completion the feature command or a harness makes passes `agent`.
describe('forge_complete_task always passes agent', () => {
  const HARNESS = join(dirname(fileURLToPath(import.meta.url)), 'integration');
  it('feature.md Step 7 tells the model to pass agent "claude"', () => {
    const step7 = sections(readFileSync(FEATURE_MD, 'utf8'))['7'] ?? '';
    const line = step7.split('\n').find((l) => l.includes('`forge_complete_task`')) ?? '';
    expect(line).toContain('`agent: "claude"`');
  });
  it.each(['l2-journey.mjs', 'l3-journey.mjs'])('%s: every forge_complete_task call has agent', (f) => {
    const src = readFileSync(join(HARNESS, f), 'utf8');
    const calls = [...src.matchAll(/name: "forge_complete_task",\s*arguments: \{([^}]*)\}/g)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThan(0);
    for (const args of calls) expect(args).toMatch(/\bagent: "claude"/);
  });
});

