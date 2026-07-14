# CI, Command Reference, and Test Organization

## Running the suites

### forge-plugin — governance-mcp (Node, vitest)

```bash
cd plugins/nxtg-forge/servers/governance-mcp
npm test                 # = vitest run   (primary CI; collects tests/**/*.test.mjs)
npx vitest run           # same
npx vitest               # watch mode
npx vitest run tests/health-score.test.mjs        # one file
FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs   # node:test suite
```

`vitest.config.mjs` sets `include: ['tests/**/*.test.mjs']` and `env.FORGE_TEST_MODE='1'`.
The `__tests__/` dir uses the node:test runner and is deliberately **excluded** from vitest.

### forge-orchestrator (Rust, cargo)

```bash
cd forge-orchestrator
cargo test                       # all tests (unit + CLI + MCP)
cargo test -- --test-threads=1   # sequential — use when file-locking tests collide
cargo test claim_task            # filter by name
cargo build --release            # verify release profile still compiles
```

### forge-ui (React, vitest)

```bash
cd forge-ui
npm test                    # vitest (watch by default)
npm run test:coverage       # vitest run --coverage
npm run test:integration    # src/test/integration/
npm run test:security       # src/test/security/
npm run test:performance    # src/test/performance/
npm run quality:gates       # build + lint + coverage + audits
```

## Test organization

Each repo owns its layout — do not force one convention across the three:

- **governance-mcp:** `tests/*.test.mjs` (vitest, integration-first with `setup.mjs`)
  + `__tests__/*.test.mjs` (node:test parity suite).
- **forge-orchestrator:** `#[cfg(test)] mod tests` inline in each `src/**/*.rs`
  module; CLI/MCP e2e alongside.
- **forge-ui:** `src/test/{integration,security,performance,quality}/` + colocated
  component tests.

## CI gate shape

CI must (1) install, (2) lint, (3) run the full suite, (4) fail on regression.

```yaml
# Node repo (governance-mcp / forge-ui) — illustrative
- run: npm ci
- run: npm run lint
- run: npm test          # or npm run test:coverage

# Rust repo (forge-orchestrator) — illustrative
- run: cargo fmt --check
- run: cargo clippy -- -D warnings
- run: cargo test
```

Release discipline (per repo CLAUDE.md): tests green locally + CI green on main
*before* any version bump. See the release checklist in the plugin CLAUDE.md.

## Version-sync gate (release-time)

A release is not just "tests pass." Three files must carry the **same** version or
CI/consumers drift:

- `plugins/nxtg-forge/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `plugins/nxtg-forge/servers/governance-mcp/package.json`

## Best-practice checklist

**DO:** test behavior not implementation · one assertion focus per test · descriptive
names · AAA/Arrange-Act-Assert · independent tests · real fixtures over mocks ·
value assertions (not `toBeDefined()`) · keep the suite fast · never let test count drop.

**DON'T:** test private methods directly · mock internals · sleep-to-synchronize ·
`it.skip` to hide a failure · hollow assertions · couple tests · leave commented-out
tests · assert on exact wall-clock timing.
