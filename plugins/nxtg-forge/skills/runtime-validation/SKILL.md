---
name: Runtime Validation
description: >
  Catch the bugs a green test suite misses by observing REAL runtime behavior — tail
  application logs during test/server runs, validate API responses against their schema
  contracts, and assert data-integrity invariants (density ≤ 1.0, %≤100, referential
  integrity). Use when unit tests pass 100% but the running app still errors, when a
  Pydantic/Zod/serde validation error or schema drift shows up only at runtime, when
  reviewing whether a test suite actually exercises the running system, or when someone
  says "all tests pass but it's broken", "smoke test", "the mocks lied", or "verify it
  works live".
when_to_use: >
  "all tests pass but production/the server is broken", "green suite, real bug", "schema
  drift", "validation error only at runtime", "contract mismatch between layers", "our
  invariant (density/percent/count) went out of range", "mock tests didn't catch it",
  "how do I test the real running system, not mocks", before declaring a change
  demo-ready.
allowed-tools: Bash, Read, Grep
---

# Runtime Validation

Unit tests assert on **mocked inputs and isolated functions**. Runtime validation asserts
on the **actual running system** — logs, real HTTP responses, and cross-layer data. A suite
can be 100% green while the product is broken, because the mocks never hit the code path
that fails. This skill is the discipline that closes that gap.

## Why this exists (real forge incident, not hypothetical)

`hooks/scripts/smoke-test-reminder.sh` in this plugin carries the origin verbatim:

> On 2026-02-06, an agent spent an entire day writing **2326 mock unit tests** while the
> actual product was broken. A duplicate placeholder route intercepted all real requests.
> Nobody caught it because **nobody started the actual server**.

That is the whole thesis: *a passing mock suite is not evidence the running system works.*
The three techniques below are how you get that evidence.

## The three techniques

| Technique | What it observes | Catches |
|-----------|------------------|---------|
| **Log monitoring** | app logs during a test/server run | validation errors, stack traces, swallowed exceptions the assertion never saw |
| **Contract validation** | real HTTP responses vs their schema | schema drift, missing/renamed fields, type mismatches between layers |
| **Invariant checking** | derived data values | math/domain violations (density > 1.0, negative counts, % > 100) |

Runtime validation *composes with* your existing tests — it does not replace them. Run the
unit suite for logic, then observe the running system for everything the mocks hid.

## 1. Log monitoring during test/server runs

The cheapest, highest-yield technique: watch the app's own logs for error signatures while
you exercise it, and **fail the run if any appear** — even when every assertion passed.

```bash
# Tail logs while a test or smoke run executes; fail on known error signatures.
: > logs/app.log                      # truncate so you only see this run
npx vitest run                        # or: cargo test / pytest / your smoke script
if grep -Eiq 'validation error|panicked at|Input should be|type=\w+_error|Unhandled' logs/app.log; then
  echo "RUNTIME ERRORS in logs despite green suite:" >&2
  grep -Ei 'validation error|panicked at|Input should be|type=\w+_error|Unhandled' logs/app.log >&2
  exit 1
fi
```

In-test framing (pytest example — the pattern is identical in vitest with a global setup/teardown):

```python
@pytest.fixture
def log_guard(tmp_path):
    log = tmp_path / "app.log"
    patterns = [r"validation error for \w+", r"Input should be .* than", r"type=\w+_error"]
    yield log
    hits = [l for l in log.read_text().splitlines() if any(re.search(p, l) for p in patterns)]
    assert not hits, f"Runtime errors in logs (suite passed anyway): {hits}"
```

## 2. Contract validation (response vs schema)

Assert the **real** response shape against the schema its consumers expect. The status code
being 200 says nothing about the body being valid — parse it back through the model.

```python
# pytest + Pydantic
def test_graph_overview_contract(client):
    resp = client.get("/api/graph/overview")
    assert resp.status_code == 200
    GraphOverviewResponse.model_validate(resp.json())  # raises on drift/missing fields
```

```typescript
// vitest + Zod (this repo's stacks are JS/vitest and Rust — prefer these over Python here)
const resp = await fetch("/api/graph/overview").then(r => r.json());
GraphOverviewResponse.parse(resp); // throws ZodError on any contract mismatch
```

The value is the round-trip: response leaves one layer typed, arrives at another, and you
re-validate at the boundary instead of trusting that both sides agree.

## 3. Invariant checking (worked example)

Unit tests often assert *a* bound but not *both*. The classic miss:

```python
def test_density():
    density = clustering.calculate_density(nodes, edges)
    assert density > 0          # passes — but never checks the UPPER bound
```

A green test, a real bug: `calculate_density` returned `4.5`. Runtime validation catches it
because the schema (or an explicit invariant) rejects the value the moment it appears:

```
validation error for ClusterMetadata
  density  Input should be less than or equal to 1  [input_value=4.5]
```

Encode invariants once and check them against real produced data:

```python
INVARIANTS = [
    ("density",  lambda d: 0.0 <= d["density"] <= 1.0),
    ("percent",  lambda d: 0.0 <= d["percent"] <= 100.0),
    ("count",    lambda d: d["count"] >= 0),
]
for cluster in service.compute_clusters():
    for name, ok in INVARIANTS:
        assert ok(cluster.dict()), f"invariant {name} violated: {cluster.dict()}"
```

*(The `density > 1.0` case is an illustrative pattern, not a claimed forge audit finding —
use it as the shape of the bug class, not as a citation.)*

## Wiring into forge

- **`forge_run_tests` (governance-mcp)** auto-detects the runner in order **vitest → jest →
  pytest** (`servers/governance-mcp/tools.mjs:getTestResults`). It returns pass/fail counts
  — use it for the green baseline, then layer log/contract checks on top; a green
  `forge_run_tests` is necessary, not sufficient.
- **`smoke-test-reminder.sh` (Stop hook)** fires when >3 `*.test.*` files OR any
  `api-server`/`server/` file changed in the session, pointing you at `./scripts/smoke-test.sh`.
  Treat that reminder as the trigger to run the log-monitoring step above.
- **CRUCIBLE Gate 9 (two-box live-proof)** — the ASIF ship gate that a provider is proven on
  the *consuming* machine with a live run, not a mocked unit test. Runtime validation is how
  you satisfy it: start the real thing, exercise it, watch the logs.

## Gotchas

- **A 200 status is not a valid body.** Frameworks return 200 with a malformed or partially
  serialized payload constantly. Always parse the body back through its schema; never let the
  status code stand in for contract validity.
- **Truncate the log before each run.** Grepping a long-lived `app.log` matches *last week's*
  errors and fails a clean run (or, worse, a rotated log hides this run's error). `: > log`
  first, or capture only the run's time window.
- **`set -o pipefail` + `git diff` in a non-git dir exits non-zero** and can abort your
  validation wrapper before it runs — the exact class of bug behind the v3.3.1 forge hook
  incident (see plugin memory). Guard with `require_git` / `git rev-parse` before piping git.
- **`grep -c` counts lines, not matches** — two errors on one line count as one. For a
  pass/fail gate that's fine; for metrics use `grep -o … | wc -l`.
- **Assert BOTH bounds.** `assert x > 0` is the single most common invariant miss. Range
  checks need a floor *and* a ceiling; the ceiling is where the real bug hides.
- **Mocks can't validate contracts.** If the test mocks the response, it validates your mock,
  not the server. Contract validation only means something against a real (or realistic
  integration) response.
- **`pytest` detection depends on `.venv/bin/pytest` or `which pytest`** in `forge_run_tests`;
  a global-but-unlinked pytest, or a differently-named venv, reports "No test runner detected"
  rather than erroring. Confirm the runner was actually found before trusting a "0 failures".
- **Runtime validation flakes on shared/dirty state.** Logs and live responses carry state
  from prior runs; isolate (fresh log, fresh DB/fixture, fresh server) or you'll chase ghosts.

## Quick start

1. Run the existing suite green first (`npx vitest run`, `cargo test`, or `pytest`).
2. Re-run the same flow with the server actually started and `app.log` truncated.
3. `grep -Ei 'validation error|panicked|Input should be|Unhandled' logs/app.log` — any hit is
   a bug the green suite missed. Fix root cause; do not suppress the log line.
4. For each externally-facing response, parse it back through its schema at the boundary.
5. For each derived numeric, assert floor **and** ceiling.

## Related skills

- `crucible-audit` — audits whether the *test suite itself* catches bugs (hollow assertions,
  silent failures). Runtime validation observes the *running system*; CRUCIBLE audits the tests.
- `verify-governance` — surfaces test-vs-reality mismatches as a governance concern.
- `testing-strategy` — unit/integration/E2E structure (the layers this skill observes).
