# Cross-IDE Feasibility Analysis — NXTG-Forge Plugin

> DIRECTIVE-CLX9-20260326-03, Item 7 | Author: forge-plugin team | Date: 2026-03-30

## Executive Summary

Forge currently ships as a Claude Code plugin (33 agents, 33 skills, 23 commands, 13 hooks, 3 MCP servers). Analysis of Superpowers' proven 5-platform approach and each platform's plugin spec shows that **~70% of Forge content is IDE-agnostic** (skills, agent system prompts, MCP servers) and can be shared across platforms with minimal adaptation. Hooks and commands require platform-specific rewrites. A Cursor port is the lowest-effort, highest-value first target.

---

## 1. Component Portability Matrix

| Component | Count | IDE-Agnostic? | Notes |
|-----------|-------|---------------|-------|
| **Skills** (`skills/*/SKILL.md`) | 33 | Yes | SKILL.md format is identical in Claude Code, Cursor, and Codex. OpenCode loads via `@import`. Gemini uses playbook `@imports`. |
| **Agent system prompts** (body of `agents/*.md`) | 33 | Yes (content) | The markdown body (instructions, personality, workflow) is pure text. Portable as-is. |
| **Agent frontmatter** (YAML in `agents/*.md`) | 33 | No | `model`, `color`, `tools`, `isolation`, `skills`, `permissionMode` are Claude Code-specific fields. Each platform has its own metadata schema. |
| **Commands** (`commands/*.md`) | 23 | Partial | Command body is markdown instructions — portable. But frontmatter (`description`, `disable-model-invocation`) and slash-command invocation are Claude Code-specific. Cursor uses identical format. Codex/Gemini have no command system. |
| **Hook scripts** (`hooks/scripts/*.sh`) | 13 | Partial | Bash scripts are portable. But trigger wiring (`PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`) differs per platform. Cursor has similar events. OpenCode uses JS hooks. Codex/Gemini have no hook system. |
| **hooks.json** (trigger config) | 1 | No | Claude Code-specific format. Cursor uses `hooks-cursor.json` with different event names. OpenCode uses JS plugin exports. |
| **MCP servers** (`.mcp.json`) | 3 | Yes (protocol) | MCP is a cross-platform standard. Cursor supports MCP natively. OpenCode supports MCP. Codex supports MCP. Gemini has limited MCP support. Config format varies slightly per platform. |
| **plugin.json** (manifest) | 1 | No | Each platform has its own manifest format. |

### Portability Summary

| Category | Portable | Needs Adaptation | Platform-Specific |
|----------|----------|-----------------|-------------------|
| Knowledge content (skills, prompts) | 66 files | — | — |
| Commands | — | 23 files (body reusable, frontmatter differs) | — |
| Hooks | — | 13 scripts (bash portable, wiring differs) | 1 config per platform |
| Manifests + MCP config | — | — | 1 per platform |

**Bottom line: 66 of 103 content files (64%) are directly portable. Another 36 (35%) need adapter shims. Only manifests and hook configs are fully platform-specific.**

---

## 2. Platform Analysis

### 2a. Cursor

**Plugin spec:** `.cursor-plugin/plugin.json` manifest. Supports `skills/`, `agents/`, `commands/`, `rules/`, `hooks/`, `mcpServers`. Has a marketplace.

**What maps directly:**
- `skills/*/SKILL.md` — identical format, drop-in compatible
- `commands/*.md` — identical format (markdown + YAML frontmatter)
- `agents/*.md` — body is identical; frontmatter needs field mapping
- MCP servers — Cursor supports MCP natively via `mcpServers` in manifest or `mcp.json`
- Hook scripts (bash) — portable; Cursor events map closely to Claude Code events

**Cursor hook event mapping:**

| Claude Code Event | Cursor Event | Compatible? |
|-------------------|-------------|-------------|
| `PreToolUse` | `preToolUse` | Yes (same concept) |
| `PostToolUse` | `postToolUse` | Yes |
| `UserPromptSubmit` | `beforeSubmitPrompt` | Yes |
| `Stop` | `stop` | Yes |
| — | `sessionStart` / `sessionEnd` | New (no CC equivalent) |
| — | `beforeShellExecution` / `afterShellExecution` | New (more granular than PreToolUse Bash) |

**Agent frontmatter mapping:**

| Claude Code Field | Cursor Equivalent | Notes |
|-------------------|------------------|-------|
| `name` | `name` | Identical |
| `description` | `description` | Identical |
| `model` | `model` | Likely different model IDs |
| `color` | Not supported | Drop |
| `tools` | `tools` | Same concept, possibly different tool names |
| `isolation: worktree` | Unknown | May not be supported |
| `skills` | `skills` | Same concept |
| `permissionMode` | Unknown | Cursor has its own approval modes |

**Minimal `.cursor-plugin/plugin.json`:**

```json
{
  "name": "nxtg-forge",
  "version": "3.5.2",
  "description": "AI-powered development governance — security guards, OWASP scanning, quality gates",
  "author": {
    "name": "NXTG AI",
    "email": "hello@nxtg.ai"
  },
  "homepage": "https://github.com/nxtg-ai/forge-plugin",
  "repository": "https://github.com/nxtg-ai/forge-plugin",
  "license": "MIT",
  "keywords": ["security", "governance", "owasp", "semgrep", "quality"],
  "skills": "skills/",
  "agents": "agents/",
  "commands": "commands/",
  "rules": "rules/",
  "hooks": "hooks/hooks-cursor.json",
  "mcpServers": ".mcp.json"
}
```

**What needs creation for Cursor:**
1. `.cursor-plugin/plugin.json` — manifest (shown above)
2. `hooks/hooks-cursor.json` — map events from `hooks.json` to Cursor event names
3. `rules/*.mdc` — convert key skills to always-on rules (optional, adds value)
4. Agent frontmatter adapter — strip `color`, map `model` to Cursor model IDs

**Effort: Small (S)** — 1-2 day sprint. Forge's structure already mirrors Cursor's plugin spec almost exactly. The Superpowers precedent proves this works.

---

### 2b. Codex CLI

**Plugin spec:** No formal plugin system. Uses `AGENTS.md` in repo root + `.agents/skills/*/SKILL.md` for discovery. Manual installation via symlinks.

**What maps directly:**
- `skills/*/SKILL.md` — identical format, symlink to `~/.agents/skills/nxtg-forge/`
- Agent prompts — export as structured `AGENTS.md` sections

**What doesn't map:**
- No hook system (Codex has no pre/post tool hooks)
- No command system (no slash commands)
- No agent orchestration (no Task tool, no parallel agents)
- No plugin manifest or marketplace
- MCP support is emerging but not mature

**Minimal Codex `AGENTS.md` export:**

```markdown
# NXTG-Forge — Codex Agent Configuration

## Role
You are an AI development agent enhanced with NXTG-Forge governance capabilities.
Follow secure coding practices and OWASP guidelines.

## Prime Directive
1. Never write code with known security vulnerabilities
2. Use parameterized queries for all database access
3. Never store secrets in code or environment files committed to git
4. Validate all inputs at system boundaries
5. Follow the principle of least privilege

## Security Rules
- No eval(), new Function(), or dynamic code execution
- No os.system() or subprocess with shell=True
- No string concatenation in SQL queries
- No hardcoded credentials or API keys

## Stack Awareness
Detect project stack automatically and apply appropriate rules:
- TypeScript/JavaScript: ESLint, Vitest, parameterized SQL
- Python: pytest, SQLAlchemy ORM, no pickle deserialization
- Rust: cargo clippy, cargo audit, sqlx with compile-time checks

## Quality Gates
- All tests must pass before marking work complete
- Security scan must show zero high/critical findings
- No new dependencies without license audit
```

**Skill symlink structure:**
```
~/.agents/skills/nxtg-forge/
├── owasp-security/SKILL.md          (direct copy)
├── security/SKILL.md                 (direct copy)
├── testing-strategy/SKILL.md         (direct copy)
├── architecture/SKILL.md             (direct copy)
└── coding-standards/SKILL.md         (direct copy)
```

**What's lost in Codex:**
- 4 PreToolUse security guards (no hook system)
- Semgrep auto-scan hook (no PostToolUse)
- 23 slash commands (no command system)
- Multi-agent orchestration (no Task tool)
- MCP governance tools (limited MCP support)
- Agent specialization (single-agent model)

**Effort: Small (S)** — Generate `AGENTS.md` + symlink skills. But the **value is low** because Codex lacks hooks, commands, and multi-agent support — Forge's core differentiators are lost.

---

### 2c. OpenCode

**Plugin spec:** JavaScript/TypeScript module exporting hook functions. Configuration via `opencode.json`. Full hook system with tool interception.

**What maps directly:**
- Skills — loadable via `@import` or context injection
- MCP servers — OpenCode supports MCP natively
- Hook concepts — OpenCode has `tool.execute.before`/`tool.execute.after` (equivalent to PreToolUse/PostToolUse)

**What needs adaptation:**
- Hook scripts must be rewritten as JavaScript plugin functions (not bash)
- Agent definitions need OpenCode's agent format
- Commands need OpenCode's command format
- Plugin manifest is `opencode.json` entries, not `plugin.json`

**Minimal OpenCode plugin (`plugins/nxtg-forge.js`):**

```javascript
export const NxtgForge = async ({ project, directory }) => {
  return {
    hooks: {
      "tool.execute.before": async (event) => {
        // Security guards: command-guard, secret-shield, injection-guard, sql-guard
        const { tool, input } = event;
        if (tool === "shell" && isDangerousCommand(input.command)) {
          return { blocked: true, reason: "SECURITY: Dangerous command blocked" };
        }
        if (["read", "write", "edit"].includes(tool) && isSensitiveFile(input.path)) {
          return { blocked: true, reason: "SECURITY: Sensitive file access blocked" };
        }
      },
      "tool.execute.after": async (event) => {
        // Semgrep auto-scan on file writes
        if (["write", "edit"].includes(event.tool) && event.input.path) {
          await runSemgrepScan(event.input.path);
        }
      }
    }
  };
};
```

**What's lost in OpenCode:**
- Agent specialization (OpenCode has single-agent model, custom agents are simpler)
- Slash commands (OpenCode has commands but different format)
- Skills auto-activation (OpenCode uses explicit `@import`)

**Effort: Medium (M)** — Hook scripts need JS rewrite. Skills are portable. MCP works. But the plugin API is different enough to need dedicated development.

---

### 2d. Gemini CLI

**Plugin spec:** `gemini-extension.json` metadata + `GEMINI.md` context file + `.gemini/playbooks/` for skills. No hook system. No command system.

**What maps directly:**
- Skills — export as playbooks in `.gemini/playbooks/` via `@import`
- Agent prompt — export as `GEMINI.md` context

**What doesn't map:**
- No hook system at all (no PreToolUse, no PostToolUse)
- No command system (no slash commands)
- No agent specialization (single context model)
- No MCP support (Gemini uses its own tool/extension system)
- No plugin marketplace

**Minimal Gemini export:**

```
GEMINI.md                              # Main context with governance rules
.gemini/
├── settings.json                      # CLI settings
├── rules/
│   └── security.md                    # Always-on security rules
└── playbooks/
    ├── owasp-security.md              # @import from GEMINI.md
    ├── testing-strategy.md            # @import from GEMINI.md
    └── coding-standards.md            # @import from GEMINI.md
gemini-extension.json                  # Extension metadata
```

**`gemini-extension.json`:**
```json
{
  "name": "nxtg-forge",
  "version": "3.5.2",
  "description": "Security governance and OWASP scanning for AI development",
  "context": "GEMINI.md"
}
```

**What's lost in Gemini:**
- ALL security hooks (no hook system exists)
- ALL slash commands (no command system)
- Multi-agent orchestration
- MCP governance tools
- Real-time security scanning

**Effort: Small (S)** — Export skills as playbooks + generate GEMINI.md. But **value is very low** because Gemini lacks hooks, commands, agents, and MCP — essentially only skills survive.

---

## 3. Effort & Value Matrix

| Platform | Effort | Value | Priority | Rationale |
|----------|--------|-------|----------|-----------|
| **Cursor** | **S** (1-2 days) | **High** | **P1** | Near-identical plugin spec. Full hooks, MCP, agents, skills, commands. Large market share. Superpowers already proves this works. |
| **Codex** | **S** (0.5-1 day) | **Low** | P3 | Easy export but loses hooks, commands, multi-agent — only skills + AGENTS.md survive. |
| **OpenCode** | **M** (3-5 days) | **Medium** | P2 | Full hook system (JS rewrite needed). MCP works. Growing user base. Worth doing after Cursor. |
| **Gemini** | **S** (0.5-1 day) | **Very Low** | P4 | No hooks, no commands, no agents, no MCP. Only playbook export. Minimal governance value. |

---

## 4. Recommended Implementation Strategy

### Phase 1: Shared Core Extraction (prerequisite, 1 day)

Before any port, refactor the repo to formalize the shared/platform-specific boundary:

```
plugins/nxtg-forge/
├── skills/                     # SHARED — identical across all platforms
├── agents/                     # SHARED body, PLATFORM-SPECIFIC frontmatter
├── commands/                   # SHARED body, PLATFORM-SPECIFIC frontmatter
├── hooks/
│   ├── scripts/                # SHARED — bash scripts
│   ├── hooks.json              # Claude Code hook wiring
│   └── hooks-cursor.json       # Cursor hook wiring (new)
├── servers/                    # SHARED — MCP servers (protocol is standard)
├── .claude-plugin/             # Claude Code manifest
│   └── plugin.json
├── .cursor-plugin/             # Cursor manifest (new)
│   └── plugin.json
├── .mcp.json                   # Claude Code MCP config
└── cursor-mcp.json             # Cursor MCP config (new, if format differs)
```

### Phase 2: Cursor Port (P1, 1-2 days)
1. Create `.cursor-plugin/plugin.json`
2. Create `hooks/hooks-cursor.json` mapping events
3. Create `rules/security-governance.mdc` (always-on rule from security skill)
4. Test in Cursor marketplace dev mode
5. Publish

### Phase 3: OpenCode Port (P2, 3-5 days)
1. Create `.opencode/plugins/nxtg-forge.js`
2. Rewrite 4 security guard hooks as JS functions
3. Rewrite semgrep scan hook as JS function
4. Register MCP servers in `opencode.json` format
5. Test with OpenCode CLI

### Phase 4: Codex + Gemini Exports (P3-P4, 1 day total)
1. Generator script that exports `AGENTS.md` from agent system prompts
2. Generator script that symlinks skills to `~/.agents/skills/nxtg-forge/`
3. Generator script that creates `GEMINI.md` + `.gemini/playbooks/`
4. Document installation in `docs/install-codex.md` and `docs/install-gemini.md`

---

## 5. Key Architectural Decision

**Single repo, multiple manifests** (Superpowers model) vs **separate repos per platform**.

**Recommendation: Single repo with multiple manifests.**

Rationale:
- Superpowers proves this works at scale across 5 platforms
- Skills are the bulk of content (33 dirs) and are 100% shared
- Agent prompts are shared; only frontmatter metadata differs
- MCP servers are protocol-standard and shared
- Only manifests + hook configs need per-platform variants
- One PR updates all platforms simultaneously
- No sync drift between platform repos

The cost is a slightly more complex repo structure. The benefit is zero content divergence.

---

## 6. What Superpowers Gets Right (Steal List)

| Pattern | How Superpowers Does It | Forge Adaptation |
|---------|------------------------|------------------|
| Shared skills directory | Single `skills/` consumed by all platforms | Already have this structure |
| Platform-specific manifests | `.claude-plugin/`, `.cursor-plugin/`, `.opencode/`, `gemini-extension.json` | Add `.cursor-plugin/` as first step |
| Hook adapters | `hooks.json` (Claude) + `hooks-cursor.json` (Cursor) + JS (OpenCode) | Create `hooks-cursor.json` mapping |
| Session bootstrap | `using-superpowers` meta-skill loaded at session start | Could add `using-forge` meta-skill |
| Tool mapping files | `references/gemini-tools.md` maps platform tools | Create tool mapping for each platform |
| Installation guides | Platform-specific README sections | Already have `docs/` structure |

---

## References

- [Superpowers — DeepWiki Architecture](https://deepwiki.com/obra/superpowers)
- [Superpowers — Codex Integration](https://deepwiki.com/obra/superpowers/5.2-codex-integration)
- [Superpowers — Gemini Integration](https://deepwiki.com/obra/superpowers/5.6-gemini-cli-integration)
- [Cursor Plugin Reference](https://cursor.com/docs/reference/plugins)
- [Cursor Plugin Marketplace](https://cursor.com/blog/marketplace)
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins/)
- [OpenCode Agent Docs](https://opencode.ai/docs/agents/)
- Forge skills: `forge:codex-framework`, `forge:gemini-framework`
