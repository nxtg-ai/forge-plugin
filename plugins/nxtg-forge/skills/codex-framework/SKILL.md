---
name: Codex Framework
description: >
  Reference knowledge for OpenAI Codex CLI compatibility — how Codex discovers AGENTS.md
  instructions and .agents/skills so a Forge (Claude Code) project can interoperate with Codex
  without duplicating agent definitions. Use when a user asks to "add Codex support", make the repo
  "work with Codex CLI" / "work with both Claude Code and Codex", share governance state between the
  two tools, or when comparing AGENTS.md vs CLAUDE.md discovery. REFERENCE ONLY — never auto-creates
  AGENTS.md or .agents/ files.
when_to_use: >
  add codex support, codex cli, AGENTS.md, .agents/skills, dual-tool repo, claude code and codex,
  interoperate with openai codex, share governance.json between tools, AGENTS.md vs CLAUDE.md
allowed-tools: Read, Grep, Glob
disable-model-invocation: true
---

# Codex CLI — Reference Knowledge

> **REFERENCE ONLY.** Do NOT create `AGENTS.md`, `AGENTS.override.md`, `SKILLS.md`, or `.agents/`
> on your own initiative. NXTG-Forge delivers agents and skills through the **Claude Code plugin**
> system, not Codex-style files. Only scaffold Codex files when the user **explicitly** asks to add
> Codex support (see the worked example below).

## How Codex CLI discovers instructions (AGENTS.md)

Codex builds one instruction chain per run by **concatenating** files from two layers, joined by
blank lines — it does NOT pick a single "winning" file:

1. **Home layer** (`~/.codex`, or `$CODEX_HOME`): reads `AGENTS.override.md` if present, else
   `AGENTS.md`. First non-empty file at this level only.
2. **Project layer**: from the project root (usually the git root) walking **down** to the current
   working directory, in each directory it takes at most one of: `AGENTS.override.md`, then
   `AGENTS.md`, then any name in `project_doc_fallback_filenames` (config-driven). All matched files
   are concatenated root-first.

A nested `AGENTS.md` in a subdirectory **adds to** (does not replace) the root one — closer files
come later in the concatenation, so they refine rather than override.

Rough Claude Code analogues (not 1:1 — see Gotchas):
- `CLAUDE.md` ↔ `AGENTS.md` (repo-wide instruction file)
- `.claude/agents/*.md` ↔ persona/role blocks written inline in `AGENTS.md`
- `.claude/skills/*/SKILL.md` ↔ `.agents/skills/*/SKILL.md`

## How Codex discovers skills

Codex reads skills from repository, user, admin, and system locations. For a repo, it scans
`.agents/skills` in **every directory from the current working directory up to the repo root**.
Each skill is a folder with a `SKILL.md`:

```
.agents/skills/
  skill-name/
    SKILL.md    # YAML frontmatter (name, description) + instructions
```

Codex uses the **same progressive-disclosure model as Claude Code**: it loads each skill's `name`,
`description`, and file path up front, and only reads the full `SKILL.md` body when it decides to
use that skill. So a good Codex `description` is a routing rule, exactly as in this plugin.

## Forge ↔ Codex interoperability

When a project must support BOTH Claude Code (via Forge) and Codex CLI:

1. **Forge owns the Claude Code surface** — plugin commands, agents, skills, hooks.
2. **Codex reads its own files** — `AGENTS.md`, `.agents/skills/`.
3. **Shared state** — both can read `.claude/governance.json` (the governance-mcp state file) for
   project context. This is the safe common denominator; no cross-tool code coupling.
4. **No duplication** — do NOT copy Forge's plugin agents into `AGENTS.md`. The two runtimes have
   different capabilities; a copied agent misleads more than it helps.

## Worked example — "add Codex support to my repo"

Input: user says *"make this repo work with Codex CLI too."*

Action:
1. Confirm intent (this is the only path that writes Codex files).
2. Read the repo's `CLAUDE.md` / `.claude/governance.json` for existing project context.
3. Write a **project-specific** `AGENTS.md` at repo root — role, prime directive, stack assumptions,
   output contract, quality gates. Point it at `.claude/governance.json` for shared state. Do NOT
   paste Forge agent definitions into it.
4. If the user wants Codex skills, create `.agents/skills/<name>/SKILL.md` with `name` +
   `description` frontmatter. Keep them separate from Forge's `skills/` — different runtime.

Output: a Codex-native `AGENTS.md` (+ optional `.agents/skills/`) that coexists with, and does not
duplicate, the Forge plugin.

## Key differences: Claude Code (Forge) vs Codex CLI

| Aspect | Claude Code (Forge) | Codex CLI |
|--------|---------------------|-----------|
| Instruction file | `CLAUDE.md` (imports, memory) | `AGENTS.md` (concatenated home + project chain) |
| Agent definitions | Plugin `agents/*.md` | Inline persona blocks in `AGENTS.md` |
| Skills | Plugin `skills/*/SKILL.md` | `.agents/skills/*/SKILL.md` (scanned up-tree) |
| Skill loading | Progressive (name/desc first) | Progressive (name/desc/path first) |
| Project config | `CLAUDE.md` + `governance.json` | `AGENTS.md` + `config.toml` |
| Plugin/marketplace | Yes | No (repo/user/admin/system dirs) |
| Multi-agent | Agent Teams (Task tool) | Sequential |

## Gotchas

- **AGENTS.md concatenates, it does not override.** A nested `AGENTS.md` refines the root file; both
  are included. Don't assume the deepest file "wins" — write nested files as additive refinements.
  The only true override is `AGENTS.override.md` (or config `project_doc_fallback_filenames`).
- **`AGENT.md` (singular) is NOT a Codex default.** The Codex override file is `AGENTS.override.md`;
  singular `AGENT.md` only works if added to `project_doc_fallback_filenames`. Prior versions of this
  skill listed `AGENT.md` as a first-class location — that was wrong.
- **The analogy to Claude Code is loose.** `AGENTS.md` maps to `CLAUDE.md` in role only. Claude's
  `.claude/agents/*.md` are separately-dispatchable subagents; Codex has no equivalent — its
  "agents" are prose personas inside one instruction chain. Don't promise Task-style parallelism.
- **Never create Codex files as a side effect.** This skill's whole warning exists because the
  natural next action after reading it is to scaffold `AGENTS.md`. Only do so on an explicit request.
- **Codex skill descriptions are routing rules too.** Because Codex loads only name/description up
  front, a vague description hurts routing in Codex exactly as in Claude Code — carry the same
  "what it does + when to use" discipline into any `.agents/skills/*/SKILL.md` you author.

## Additional resources

- [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Codex customization / discovery precedence](https://developers.openai.com/codex/concepts/customization)
- [Build skills (Codex SKILL.md)](https://developers.openai.com/codex/skills)
