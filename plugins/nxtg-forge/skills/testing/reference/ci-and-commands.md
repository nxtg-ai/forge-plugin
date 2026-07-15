# Run Commands, CI Gate & Test Organization

## Running the suites (by stack)

### TypeScript / JavaScript

```bash
# vitest
npm test                                  # project-configured test script
npx vitest run                            # single run (CI mode)
npx vitest                                # watch mode
npx vitest run path/to/one.test.ts        # one file
npx vitest run --coverage                 # with coverage

# jest
npx jest
npx jest --coverage

# node:test (built-in runner)
node --test                               # all *.test.mjs / test/ files
node --test path/to/file.test.mjs         # one file
```

If a test imports an entry module that opens a server/stdio at load time, gate that
side effect behind an env flag (e.g. `TEST_MODE=1`) and set it for the runner, or the
import hangs.

### Python

```bash
pytest                            # all tests
pytest tests/unit/test_x.py       # one file
pytest -k "duplicate_email"       # filter by name
pytest --cov=src --cov-report=term-missing
pytest -p no:xdist                # disable parallelism to diagnose a flake
```

### Rust

```bash
cargo test                        # unit + integration + doc tests
cargo test claim_task             # filter by name
cargo test -- --test-threads=1    # serial — when file-locking/shared-state tests collide
cargo build --release             # verify the release profile still compiles
```

### Go

```bash
go test ./...                     # whole module
go test -run TestSnakeCase ./...  # filter by name
go test -race ./...               # data-race detector
go test -cover ./...              # coverage
go test -p 1 ./...                # serial packages — diagnose a shared-resource flake
```

## Test organization

Mirror the source tree; separate tests by speed. Don't force one layout across
languages — each ecosystem has a convention, follow it:

- **JS/TS:** colocated `*.test.ts` next to source, or a top-level `tests/` / `__tests__/`.
  If two runners coexist (e.g. vitest + node:test), keep them in **separate directories**
  and make each runner's include/glob exclude the other's dir so they never collide.
- **Python:** `tests/{unit,integration,e2e}/` mirroring `src/`, shared fixtures in
  `conftest.py`.
- **Rust:** `#[cfg(test)] mod tests` inline per module for unit tests; `tests/` at crate
  root for integration/CLI e2e.
- **Go:** `_test.go` files alongside the package they test.

```
tests/
├── unit/            # fast, isolated, mocked seams — 70%
├── integration/     # real DB / HTTP / services — 20%
└── e2e/             # binary / browser-driven full flows — 10%
```

## CI gate shape

A CI gate must (1) install, (2) lint, (3) run the **full** suite, (4) fail on
regression. Tests green locally + CI green on the default branch *before* any release.

```yaml
# Node repo — illustrative
- run: npm ci
- run: npm run lint
- run: npm test            # or: npx vitest run --coverage

# Python repo — illustrative
- run: pip install -e '.[test]'
- run: ruff check .
- run: pytest --cov=src

# Rust repo — illustrative
- run: cargo fmt --check
- run: cargo clippy -- -D warnings
- run: cargo test

# Go repo — illustrative
- run: go vet ./...
- run: go test -race -cover ./...
```

**Test count never decreases.** Wire the gate so a diff that removes tests without a
documented reason fails review. New behavior ships with new tests.

## Best-practice checklist

**DO:** test behavior not implementation · one assertion focus per test · descriptive
names · Arrange-Act-Assert · independent, order-free tests · real fixtures over mocks ·
value assertions (never a bare `toBeDefined()` / `is not None`) · keep the suite fast ·
prove RED before trusting a new test · never let the test count drop.

**DON'T:** test private methods directly · mock the unit under test · sleep-to-
synchronize · `skip`/`xfail` to hide a failure · write hollow assertions · couple
tests to each other · leave commented-out tests · assert on exact wall-clock timing ·
`git add -A` a test commit (stage specific files).
