---
name: Documentation
description: >
  Documentation standards and code-to-docs sync conventions for Forge projects — JSDoc/TSDoc
  annotations, README/CHANGELOG structure, auto-generated API reference, doc-tree layout, and
  staleness detection. Use when writing or reviewing docs, adding JSDoc to exported functions,
  structuring a docs/ tree, deciding what to document vs auto-generate, or running the Forge
  docs commands (/forge:docs-status, /forge:docs-audit, /forge:docs-update).
when_to_use: >
  Trigger phrases: "document this", "add JSDoc", "write the README", "generate API docs",
  "is our documentation stale", "docs audit", "documentation coverage", "changelog", "ADR",
  "how should I structure docs", "docs are out of date".
allowed-tools: Read, Grep, Glob, Bash(git *), Bash(find *)
---

# Documentation Management

**Purpose**: Keep documentation synchronized with code
**Primary Agent**: `release-sentinel` (opus) — docs↔code sync, staleness, changelog generation
**Supporting Agent**: `docs` (sonnet) — writes JSDoc/README/API/architecture docs
**Contributors**: all agents (each documents its own output)

---

## The Documentation Promise

> "Every feature is documented. Every change is tracked. 
> No user is left wondering how something works."

The doc tree below is the **recommended layout for a consuming project** — it is aspirational,
not the structure of this plugin repo itself. Adopt the parts that fit; do not scaffold empty
directories to match it.

---

## Documentation Hierarchy
````
docs/
├── README.md                 # Entry point, always current
├── CHANGELOG.md              # Auto-generated from commits
├── CONTRIBUTING.md           # How to contribute
├── 
├── getting-started/          # Onboarding
│   ├── installation.md
│   ├── quick-start.md
│   └── first-project.md
│
├── guides/                   # How-to guides
│   ├── authentication.md
│   ├── deployment.md
│   └── troubleshooting.md
│
├── api/                      # API reference (auto-generated)
│   ├── overview.md
│   ├── users.md
│   ├── projects.md
│   └── webhooks.md
│
├── components/               # Component docs (auto-generated)
│   ├── button.md
│   ├── input.md
│   └── card.md
│
├── cli/                      # CLI reference (auto-generated)
│   └── commands.md
│
├── architecture/             # Design docs (manual)
│   ├── overview.md
│   ├── decisions/            # ADRs
│   │   ├── 001-database-choice.md
│   │   └── 002-auth-strategy.md
│   └── diagrams/
│
└── templates/                # Doc templates
    ├── api-endpoint.md
    ├── component.md
    └── adr.md
````

---

## Documentation Types & Ownership

### 1. Reference Documentation (Auto-Generated)

**What**: API endpoints, component props, CLI commands, config options
**How**: Extract from code annotations (JSDoc, OpenAPI, decorators)
**When**: On every relevant code change
**Owner**: Release Sentinel (automated)
````typescript
/**
 * Create a new user account
 * 
 * @endpoint POST /api/users
 * @auth Required (Bearer token)
 * @rateLimit 10 requests/minute
 * 
 * @param {string} email - User's email address
 * @param {string} password - Password (min 8 chars)
 * @param {string} [name] - Display name (optional)
 * 
 * @returns {User} Created user object
 * @throws {400} Invalid input
 * @throws {409} Email already exists
 * 
 * @example
 * ```bash
 * curl -X POST https://api.example.com/users \
 *   -H "Authorization: Bearer <token>" \
 *   -d '{"email": "user@example.com", "password": "secure123"}'
 * ```
 */
export async function createUser(req: Request): Promise<User> {
  // Implementation
}
````

↓ Auto-generates ↓
````markdown
## POST /api/users

Create a new user account.

### Authentication
Required. Include Bearer token in Authorization header.

### Rate Limit
10 requests per minute.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | Password (min 8 chars) |
| name | string | No | Display name |

### Response

Returns the created `User` object.

### Errors

| Code | Description |
|------|-------------|
| 400 | Invalid input |
| 409 | Email already exists |

### Example
```bash
curl -X POST https://api.example.com/users \
  -H "Authorization: Bearer <token>" \
  -d '{"email": "user@example.com", "password": "secure123"}'
```
````

---

### 2. Conceptual Documentation (Human + AI)

**What**: Architecture overviews, design decisions, system concepts
**How**: Human writes, AI assists with formatting and linking
**When**: After major architectural changes
**Owner**: Lead Architect creates, Release Sentinel maintains

---

### 3. Tutorial Documentation (Human + AI)

**What**: Step-by-step guides, walkthroughs, examples
**How**: Human creates outline, AI can expand and validate
**When**: New features, common workflows
**Owner**: Relevant agent creates, Release Sentinel maintains

---

### 4. Changelog (Fully Automated)

**What**: Version history, changes, migration guides
**How**: Parse conventional commits
**When**: Every release
**Owner**: Release Sentinel (automated)

---

## Staleness Detection

Documentation becomes stale when:

1. **Code changed, docs didn't**
   - File hash changed since last doc update
   - New exports not documented
   - Function signatures changed

2. **Time-based decay**
   - No updates in 90+ days for active areas
   - Version mismatch (doc says v1.x, code is v2.x)

3. **Link rot**
   - Internal links broken
   - External links return 404

4. **Example failures**
   - Code examples don't compile
   - API examples return errors

---

## Documentation Quality Checklist

Every documentation file must have:

- [ ] Clear title and purpose
- [ ] Last updated date
- [ ] Version compatibility note
- [ ] Working code examples
- [ ] Links to related docs
- [ ] No broken links
- [ ] No outdated screenshots

---

## Commands

These are namespaced under `forge:` and are **user-typed only** — each carries
`disable-model-invocation: true`, so Claude never auto-invokes them; the user runs them.

| Command | Purpose | Arguments |
|---------|---------|-----------|
| `/forge:docs-status` | Show documentation health & coverage | none |
| `/forge:docs-audit` | Comprehensive quality audit (coverage, inventory, links) | none |
| `/forge:docs-update` | Find and update stale docs | `--file <path>`, `--dry-run`, `--jsdoc`, or none = all |

There is **no** `docs-generate` command in this plugin. To create a doc from a template, invoke
the `docs` agent or use `/forge:docs-update --jsdoc` for source annotations.

---

## Gotchas

- **`/docs-generate` does not exist.** Earlier revisions of this skill listed it; the plugin ships
  only `docs-status`, `docs-audit`, `docs-update`. Do not tell a user to run it.
- **Commands are namespaced `/forge:docs-*`, not bare `/docs-*`.** A bare `/docs-status` will not
  resolve.
- **These commands do not auto-trigger.** All three have `disable-model-invocation: true`. Saying
  "check the docs" does not fire them — the user must type the slash command, or you run the
  underlying analysis yourself with Grep/Glob/Bash.
- **`docs-update` argument surface is inconsistent between frontmatter and body.** Its
  `argument-hint` advertises `[file-path] [--all]`, but the command body actually parses
  `--file <path>`, `--dry-run`, and `--jsdoc` (bare invocation = update all). Follow the body's
  flags, not the hint.
- **Staleness detection is git-window-based, not semantic.** `docs-update` compares
  `git diff --name-only HEAD~20 -- src/` against docs changes — a doc edited by hand without a
  matching source commit inside that window can read as "fresh" even if wrong. It flags *drift*,
  not *correctness*.
- **Two agents own docs, split by intent.** `release-sentinel` (opus) handles sync/staleness/
  changelog around releases; `docs` (sonnet) authors new prose. Route "keep docs current for the
  release" to release-sentinel and "write the API guide" to docs.
- **Auto-generation only works if the source is annotated.** The JSDoc→markdown pipeline below
  produces nothing from undocumented exports. `docs-status` counts documented vs undocumented
  exports precisely so you know the input coverage before generating.

---

## Additional resources

- `docs/architecture/decisions/` — ADRs (Architecture Decision Records), manually authored
- Command sources: `commands/docs-status.md`, `commands/docs-audit.md`, `commands/docs-update.md`