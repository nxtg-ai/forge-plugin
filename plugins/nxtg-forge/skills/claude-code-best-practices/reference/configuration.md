# Configuration — settings, permissions, hooks, CLAUDE.md

## Settings tiers (later wins, more specific wins)

1. **User (global):** `~/.claude/settings.json`
2. **Project (team-shared, committed):** `.claude/settings.json`
3. **Local (personal, gitignored):** `.claude/settings.local.json`

Put shared team behavior in project settings; personal/sensitive overrides in local.

```json
{
  "permissions": {
    "allow": ["Read", "Write(src/**)", "Bash(git *)", "Bash(npm *)", "Bash(pytest *)"],
    "deny": ["Read(**/.env*)", "Read(**/*.key)", "Write(**/production.config.*)",
             "Bash(rm *)", "Bash(sudo *)"]
  },
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write(*.py)",
        "hooks": [{ "type": "command", "command": "python -m black \"$file\"", "timeout": 10 }] }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "git fetch origin", "timeout": 15 }] }
    ]
  }
}
```

Note: pinning `"model": "claude-...-<date>"` in a committed settings file freezes the model
for the whole team and rots. Omit it (inherit) or use `/model` at runtime unless you
deliberately want a fixed model.

## Permissions model

- **`deny` overrides `allow`.** Denies are the hard boundary; keep secrets/dangerous
  commands there.
- **Patterns are literal glob matches.** `Read(.env*)` matches `.env` in cwd but NOT
  `config/.env` — use `Read(**/.env*)` to cover nested paths. Verify with a dry Read before
  trusting a rule.
- Scope Bash narrowly: `Bash(git *)`, `Bash(npm *)` rather than blanket `Bash`.
- Keep API keys/secrets in `.env` and `deny` Claude access to them. Review edits before
  accepting when working outside an allowlist.

## Hooks — events and wiring

Hooks are run by the harness (not the model), so they are the only way to *guarantee* an
automated behavior. They must be fast and deterministic.

| Event | Fires | Typical use |
|---|---|---|
| `PreToolUse` | before a tool runs | **blocking guard** — exit `2` denies the call |
| `PostToolUse` | after a tool runs | lint/format/scan the written file |
| `UserPromptSubmit` | on each user prompt | inject context, sync state |
| `Stop` | when Claude finishes | post-task checks, reminders (advisory) |
| `SessionStart` | session begins | fetch, warm caches |

Rules:
- **Exit code 2 in `PreToolUse` = deny the tool** (the model receives the stderr message).
  Advisory hooks must exit 0.
- **Set `timeout`.** A slow `SessionStart`/`UserPromptSubmit` hook adds latency to every
  turn. This plugin's hooks use `timeout: 5`.
- In a plugin, reference scripts via `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/...`, never an
  absolute path (breaks on install to a different location).
- Use a `matcher` to scope which tool/pattern triggers the hook.

## CLAUDE.md structure

Auto-loaded standing context. Hierarchy: `~/.claude/CLAUDE.md` (global) → `./CLAUDE.md`
(project root) → subdirectory CLAUDE.md (component-specific). Keep each file:

- **Failure-focused:** the build quirk, the forbidden path, the naming rule Claude keeps
  getting wrong — not a feature tour.
- **Lean:** ~100-200 lines; past ~40k chars Claude Code itself warns performance degrades.
- **Orienting, not exhaustive:** what the project is, who owns it, the front door, common
  commands. Push deep material into skills/`docs/` and link it.
- **Iterated like a prompt:** when Claude repeats a mistake, add the one line that prevents
  it; when a rule stops mattering, delete it.

Reference files in prompts with `@`:
```
Review auth security. @./src/auth/
Compare implementations. @./src/old.js @./src/new.js
```
