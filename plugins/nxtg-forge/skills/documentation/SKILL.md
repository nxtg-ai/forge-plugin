---
name: Documentation
description: Guides documentation standards including JSDoc, README structure, and API documentation.
---

# Documentation Management

**Purpose**: Keep documentation synchronized with code
**Primary Agent**: Release Sentinel
**Supporting Agents**: All (contribute documentation)

---

## The Documentation Promise

> "Every feature is documented. Every change is tracked. 
> No user is left wondering how something works."

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

- `/docs-status` - Show documentation health
- `/docs-audit` - Full documentation audit
- `/docs-update` - Update stale documentation
- `/docs-generate <type>` - Generate new doc from template