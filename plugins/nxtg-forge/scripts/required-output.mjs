#!/usr/bin/env node
// Stop gate for required output (DIRECTIVE-NXTG-20261013-21, alpha run 5 F-O and F-P; EMMA-SOUL rulings).
// Three commands have output an alpha criterion reads. Their required parts no longer depend on the
// model choosing to produce them:
//   /nxtg-forge:status        the report block its `!` step computed (scripts/status-report.mjs)
//   /nxtg-forge:gap-analysis  the dimension block its `!` step computed (scripts/gap-report.mjs)
//   /nxtg-forge:feature       the task actions: helper call, claim and complete as claude, get_tasks
// When the turn's command is one of these, this gate reads the session transcript and refuses to end the
// turn until the required output is there: every line of the computed block, matched line by line
// (a heading with other content under it does not count), or the feature's tool calls. Any other turn,
// /nxtg-forge:status-enhanced included, is never gated.
//
// A block is Claude Code's Stop `decision: "block"`. Its reason is recorded in the stream as a
// "Stop hook feedback:" row starting with FEEDBACK_TAG, so a run can count fires. At most MAX_BLOCKS per
// turn; after that the turn ends with the gap visible.
//
//   node required-output.mjs hook     (Stop hook: JSON on stdin; prints a block decision or nothing)
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_BLOCKS = 3;
export const FEEDBACK_TAG = 'FORGE REQUIRED OUTPUT';
const END = '<!-- /forge-required -->';
export const GATES = {
  status: {
    begin: '<!-- forge-required: status v1 -->',
    ungatedArgs: (t) => t.some((a) => a !== '--verbose'), // --json/--git/--tests/--governance print other shapes
    sentinel: '◌ **Forge status unavailable** — the status step did not run',
    what: 'the report that the /nxtg-forge:status step computed',
  },
  'gap-analysis': {
    begin: '<!-- forge-required: gap-analysis v1 -->',
    ungatedArgs: (t) => t.some((a) => a !== '--fix'), // --scope/--severity/--json narrow or reshape it
    sentinel: '◌ **Gap checks unavailable** — the check step did not run',
    what: 'the dimension table that the /nxtg-forge:gap-analysis step computed',
  },
  feature: {},
};

const textOf = (content) => typeof content === 'string' ? content
  : Array.isArray(content) ? content.filter((c) => c?.type === 'text').map((c) => c.text).join('\n') : '';
const isFeedback = (t) => t.startsWith('Stop hook feedback:');

export function parseTranscript(raw) {
  return raw.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// The rows of one turn: from the first user row carrying promptId to the end. Without a promptId, the
// turn starts at the last user prompt that is neither a tool result nor hook feedback.
export function turnOf(rows, promptId) {
  let pid = promptId;
  if (!pid) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      const c = r.message?.content;
      if (r.type !== 'user' || r.isMeta) continue;
      if (Array.isArray(c) && c.some((x) => x?.type === 'tool_result')) continue;
      if (isFeedback(textOf(c))) continue;
      pid = r.promptId; if (!pid) return { rows: rows.slice(i), command: null };
      break;
    }
  }
  const start = rows.findIndex((r) => r.type === 'user' && r.promptId === pid);
  if (start < 0) return { rows: [], command: null };
  const turn = rows.slice(start);
  const mine = turn.filter((r) => r.type === 'user' && r.promptId === pid);
  let command = null; let args = '';
  for (const r of mine) {
    const t = textOf(r.message?.content);
    const m = t.match(/<command-name>\/?nxtg-forge:([a-z-]+)<\/command-name>/);
    if (m && !r.isMeta) { command = m[1]; args = t.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1] ?? ''; }
  }
  const body = mine.filter((r) => r.isMeta).map((r) => textOf(r.message?.content)).filter((t) => !isFeedback(t)).join('\n');
  const priorBlocks = mine.filter((r) => isFeedback(textOf(r.message?.content)) && textOf(r.message?.content).includes(FEEDBACK_TAG)).length;
  const texts = []; const tools = []; const results = new Map();
  for (const r of turn) {
    const c = r.message?.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) {
      if (r.type === 'assistant' && x?.type === 'text') texts.push(x.text);
      if (r.type === 'assistant' && x?.type === 'tool_use') tools.push({ id: x.id, name: String(x.name ?? ''), input: x.input ?? {} });
      if (r.type === 'user' && x?.type === 'tool_result') results.set(x.tool_use_id, { text: textOf(x.content), isError: x.is_error === true });
    }
  }
  for (const t of tools) Object.assign(t, results.get(t.id) ?? { text: null, isError: false });
  return { rows: turn, command, args: args.trim(), body, priorBlocks, texts, tools };
}

// One line as compared: whitespace collapsed and table cells trimmed, so `| a |  b |` matches `|a|b|`.
export const norm = (l) => l.trim().replace(/\s+/g, ' ').replace(/\s*\|\s*/g, '|');
const skip = (l) => !l.trim() || /^<!-- \/?forge-required/.test(l.trim()) || /^-{3,}$/.test(l.trim()) || /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(l.trim());

// The computed block for a gate, from the expanded command body; null when the step did not run.
export function requiredBlock(body, gate) {
  const i = body.indexOf(gate.begin);
  if (i < 0) return null;
  const j = body.indexOf(END, i);
  return j < 0 ? null : body.slice(i, j + END.length);
}

export function missingLines(block, texts) {
  const have = new Set(texts.join('\n').split('\n').map(norm));
  return block.split('\n').filter((l) => !skip(l)).filter((l) => !have.has(norm(l)));
}

const tokens = (args) => args.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];

function blockFor(kind, n, missing, instruction, payload) {
  return [`${FEEDBACK_TAG}: gate=${kind} block=${n}/${MAX_BLOCKS} missing=${missing}`, instruction, ...(payload ? ['', payload] : [])].join('\n');
}

function textGate(kind, turn, n) {
  const gate = GATES[kind];
  if (gate.ungatedArgs(tokens(turn.args))) return null;
  const block = requiredBlock(turn.body, gate);
  if (!block) {
    const ok = missingLines(gate.sentinel, turn.texts).length === 0;
    return ok ? null : blockFor(kind, n, 1, `The /nxtg-forge:${kind} step did not run, so there is no computed output. Print exactly this line, then end your turn:`, gate.sentinel);
  }
  const missing = missingLines(block, turn.texts);
  if (!missing.length) return null;
  return blockFor(kind, n, missing.length,
    `Your reply does not yet contain ${gate.what}. ${missing.length} required line(s) are missing or differ, first: ${missing[0]}\nPrint this block exactly as given, line for line (you may leave out the two marker comments), then end your turn:`,
    block);
}

const named = (t, tool) => t.name === tool || t.name.endsWith(`__${tool}`);
const lines = (texts) => texts.join('\n').split('\n').map((l) => l.trim().replace(/^\*\*|\*\*$/g, '').trim());

function featureGate(turn, n, { forgeDir }) {
  const said = lines(turn.texts);
  const helpers = turn.tools.filter((t) => t.name === 'Bash' && /feature-task\.sh/.test(String(t.input.command ?? '')) && t.text !== null);
  const helper = helpers[helpers.length - 1];
  const created = helper && /^status=created$/m.test(helper.text);
  if (!created) {
    if (helper) return null; // no-forge, no-forge-dir, or a failure the helper printed: visible as is
    if (said.some((l) => /^No task created: \S/.test(l))) return null;
    if (!forgeDir) return null; // no `.forge/`: the helper would say no-forge-dir
    return blockFor('feature', n, 1,
      'This /nxtg-forge:feature turn has not created its orchestrator task. Run Step 4.2: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/feature-task.sh" "<title>" "<description>"`, then claim the task. If the work is already done and no task is warranted, print one line instead, then end your turn:',
      'No task created: <reason>');
  }
  const id = helper.text.match(/^task_id=(T-\d+)$/m)?.[1] ?? null;
  const at = turn.tools.indexOf(helper);
  const after = turn.tools.slice(at + 1).filter((t) => !t.isError);
  const claim = after.find((t) => named(t, 'forge_claim_task') && t.input.agent === 'claude' && (!id || t.input.task_id === id));
  const tid = id ?? claim?.input.task_id;
  if (!claim) {
    return blockFor('feature', n, 1, `The helper created ${id ?? 'a task'}; claim it with \`forge_claim_task\` (task_id \`${id ?? '<the new task>'}\`, agent \`claude\`) before the work, then continue.`);
  }
  const done = after.slice(after.indexOf(claim) + 1);
  const complete = done.find((t) => named(t, 'forge_complete_task') && t.input.task_id === tid && t.input.agent === 'claude' && String(t.input.result_summary ?? '').trim());
  if (!complete) {
    if (said.some((l) => l.startsWith(`Task ${tid} left claimed: `) && l.length > `Task ${tid} left claimed: `.length)) return null;
    return blockFor('feature', n, 1,
      `${tid} is claimed but not completed. When the work is done, call \`forge_complete_task\` with task_id \`${tid}\`, agent \`claude\` and a one- or two-sentence \`result_summary\`, then \`forge_get_tasks\`. If the work did not finish, do not complete it; print one line instead, then end your turn:`,
      `Task ${tid} left claimed: <reason>`);
  }
  const shown = done.slice(done.indexOf(complete) + 1).find((t) => named(t, 'forge_get_tasks') && (t.text ?? '').includes(tid));
  if (!shown) return blockFor('feature', n, 1, `${tid} is completed. Call \`forge_get_tasks\` so the result shows it completed by claude, with its outcome, then end your turn.`);
  return null;
}

// Pure: transcript rows and the hook input in, a block reason or null out.
export function evaluate({ rows, promptId, lastAssistant, forgeDir = false }) {
  const turn = turnOf(rows, promptId);
  if (!turn.command || !(turn.command in GATES)) return null;
  if (lastAssistant) turn.texts.push(lastAssistant);
  if (turn.priorBlocks >= MAX_BLOCKS) return null;
  const n = turn.priorBlocks + 1;
  return turn.command === 'feature' ? featureGate(turn, n, { forgeDir }) : textGate(turn.command, turn, n);
}

function hook(stdin) {
  let input = {};
  try { input = JSON.parse(stdin); } catch { return ''; }
  if (!input.transcript_path) return '';
  let raw = '';
  try { raw = readFileSync(input.transcript_path, 'utf8'); } catch { return ''; }
  const reason = evaluate({
    rows: parseTranscript(raw),
    promptId: input.prompt_id,
    lastAssistant: input.last_assistant_message,
    forgeDir: existsSync(join(input.cwd || process.cwd(), '.forge')),
  });
  return reason ? JSON.stringify({ decision: 'block', reason }) : '';
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(fileURLToPath(import.meta.url)) && process.argv[2] === 'hook') {
  let stdin = '';
  process.stdin.on('data', (d) => { stdin += d; });
  process.stdin.on('end', () => {
    try { const out = hook(stdin); if (out) process.stdout.write(`${out}\n`); } catch { /* never break a turn on a gate fault */ }
  });
}
