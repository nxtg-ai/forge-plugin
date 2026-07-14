---
name: Skill Development
description: How to author a Claude Code Agent Skill — SKILL.md structure, routing-optimized descriptions, progressive disclosure, valid frontmatter fields, bundling scripts/reference files. Use when creating a new skill, writing or fixing a SKILL.md, deciding what belongs in frontmatter, splitting an oversized skill into reference files, or debugging why a skill never triggers.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Skill Development

Procedure for authoring Claude Code Agent Skills. A skill is a directory with a `SKILL.md` file; optional bundled scripts and reference `.md` files sit beside it and load only when needed.

## What a skill is (one paragraph)

At startup Claude preloads only the `name` + `description` of every installed skill into its system prompt. When a task matches, Claude reads the full `SKILL.md` body into context. Bundled files (`reference/*.md`, `scripts/*`) are read only when the body points to them. This is **progressive disclosure**: metadata → body → bundled files. Design each level to be the smallest thing that lets Claude decide whether to go deeper.

## Build workflow

1. **Start from a real gap.** Author a skill only for a capability Claude currently fumbles — a workflow it gets wrong, procedural knowledge it lacks, org context it can't infer. Don't pre-write skills for hypothetical tasks.
2. **Create the directory + SKILL.md.** `skills/<kebab-name>/SKILL.md`. Directory name is the on-disk identity — don't rename it after wiring.
3. **Write the frontmatter** (see below). The `description` is the single highest-impact line — write it as a routing rule, not a summary.
4. **Write the body** as *what to do*, not narration. Numbered procedures, concrete examples, a Gotchas section.
5. **Keep it lean.** Target under 500 lines. When it grows past that (or when some content is only relevant in a narrow sub-case), move detail into sibling `reference/*.md` files and link them.
6. **Test the trigger.** Give Claude a request that *should* fire the skill and confirm it loads. If it doesn't, the description is the problem — add the missing trigger words. Then watch it use the skill on a real task and fold successes/mistakes back into the body.

## Frontmatter — valid fields only

Claude Code reads a fixed set of keys and **silently ignores unknown ones** (so a typo'd field just disappears — no error).

```yaml
name: Skill Name              # REQUIRED. Display label. Max 64 chars. Keep stable — wiring references it.
description: >                # REQUIRED. The routing engine (see below). Use > or | for multi-line.
  What it does. Use when <triggers>.
disable-model-invocation: true  # Hide from Claude's auto-trigger AND remove description from context.
user-invocable: false         # Hide from the / menu but keep in context for auto-trigger.
argument-hint: "[arg]"        # Autocomplete hint for invocable skills.
allowed-tools: Read, Grep     # Pre-approves these tools so the skill's procedure doesn't prompt.
                              # ADDITIVE only — does not restrict what's available.
context: fork                 # Run the skill in an isolated subagent context window.
model: sonnet                 # Per-skill model override (sonnet | opus | haiku).
```

Scope `allowed-tools` Bash where you can: `Bash(git *)`, `Bash(python3 *)`. Never list a tool the procedure doesn't actually run.

## The description IS the routing rule

The `description` is Claude's decision engine for whether to load the skill — not documentation for humans. Write it for the model.

**Shape:** `<what it does>. Use when <concrete trigger scenarios + words a user would actually type>.`

- Put the **primary use case first** — the listing truncates around 1,536 chars.
- Pack in the **literal trigger phrases** and command names a user says ("run the docs commands", "/forge:docs-audit", "add JSDoc"). Claude matches on these.
- Name what it does NOT cover if a sibling skill is easy to confuse with.

Worked example — turning a weak description into a routing rule:

```yaml
# WEAK — describes, doesn't route. Claude can't tell when to fire it.
description: Documentation standards for the project.

# STRONG — states the job, then enumerates concrete triggers.
description: >
  Documentation standards and code-to-docs sync — JSDoc/TSDoc, README/CHANGELOG
  structure, auto-generated API reference, staleness detection. Use when writing or
  reviewing docs, adding JSDoc to exported functions, structuring a docs/ tree, or
  running /forge:docs-status, /forge:docs-audit, /forge:docs-update.
```

## Progressive disclosure — split when oversized

The body stays in context for the rest of the turn once loaded, so every line is recurring token cost. Keep `SKILL.md` a lean overview + navigation; push depth into bundled files.

When to split a section out to `reference/<topic>.md`:
- The `SKILL.md` is heading past ~500 lines.
- A section is only relevant in a narrow sub-case (e.g. one specific file format).
- Two large sections are mutually exclusive — a task needs one or the other, never both.

Link from the body with a resources section so Claude knows the file exists and when to read it:

```markdown
## Additional resources
- For the OWASP Top-10 mapping, see [reference/owasp.md](reference/owasp.md)
- For fillable-PDF form handling, see [reference/forms.md](reference/forms.md)
```

Claude reads a linked file only when the current task needs it — bundled context is effectively unbounded because it isn't all paid for up front.

## Bundling scripts — deterministic work belongs in code

If a step is deterministic and error-prone for a model (sorting, parsing, extracting PDF form fields, computing a hash), ship a real runnable script in `scripts/` and tell the body to **run** it rather than reason through it. In the body, be explicit whether Claude should *execute* a file or *read* it as reference — the two modes look identical on disk.

Only add a script if it is complete and runnable. A stub script is worse than inline prose guidance.

## Gotchas

- **Unknown frontmatter fields vanish silently.** Claude Code ignores keys it doesn't recognize — no warning. A skill that never triggers often has its routing signal sitting in an ignored field. Ignored on **skills**: `whenToUse` (camelCase — the valid field is the snake_case `when_to_use`), `shortname`, `avatar`, `exampleQueries`. Put trigger phrases in `description` or the valid `when_to_use` field, not in an invented key. (Note: `when_to_use` is valid on skills but NOT on agents — agents fold "when to use" into `description` with `<example>` blocks.)
- **`disable-model-invocation: true` removes the description from context entirely.** The skill can't auto-trigger AND a subagent can't preload it. It becomes usable only by explicit invocation. This skill sets it deliberately — don't flip it expecting auto-routing to start working.
- **`user-invocable: false` ≠ `disable-model-invocation`.** `user-invocable: false` hides the skill from the `/` menu but keeps its description in context so auto-trigger still fires. They control opposite surfaces; setting the wrong one gives the opposite of the intended visibility.
- **Directory name and `name` are separate identities.** The on-disk kebab folder name is what wiring/marketplace tooling references; the frontmatter `name` is the display label. Renaming the directory after release breaks installs; renaming `name` can break anything that matches on the label. Change neither casually.
- **Weak description = dead skill.** The most common failure is not a broken body — it's a description that summarizes instead of routing. If Claude never loads the skill, add the literal words a user would type before touching anything else.
- **Body narration is recurring cost.** Prose like "as models improve…" or "this is powerful because…" stays in context every turn once loaded and pays for nothing. State the action; cut the justification.
- **Trust boundary.** A skill can instruct Claude to run code and reach the network. Audit any skill from a less-trusted source before installing — read every bundled script and watch for instructions that exfiltrate data or hit untrusted hosts.

## Source

Distilled from Anthropic's Agent Skills guidance and this plugin's verified frontmatter research:
- https://code.claude.com/docs/en/skills
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
