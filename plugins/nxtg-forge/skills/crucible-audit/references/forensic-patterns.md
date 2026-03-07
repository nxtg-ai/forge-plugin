# CRUCIBLE Forensic Patterns Catalog

> Living catalog of all observed test fraud patterns with detection signatures.
> Updated each time a new pattern is discovered during portfolio audits.

## Pattern Registry

### FP-001: Coverage Omit Fraud
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
grep -rn "omit\|exclude" pyproject.toml setup.cfg .coveragerc 2>/dev/null
grep -rn "coveragePathIgnorePatterns\|collectCoverageFrom" jest.config* vitest.config* 2>/dev/null
```
**Signature**: Core business logic files (ML engines, API handlers, CLI entry points) listed in coverage omit without justification.
**Impact**: PP reported 77% coverage; real coverage was ~15% after removing unjustified omits (1,145 LOC excluded).

### FP-002: Mock-Everything Integration Tests
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
for f in $(find tests/ -name "*integration*" -o -name "*e2e*" -o -name "*smoke*"); do
    echo "=== $f ===" && grep -c "patch\|Mock\|MagicMock\|jest.mock\|vi.mock" "$f"
done
```
**Signature**: Files named `test_*_integration.py` or `test_*_e2e.py` that mock TTS, ASR, ffmpeg, database, or other core dependencies.
**Impact**: PP had "integration" tests that mocked every dependency — testing mock orchestration, not real pipeline behavior.

### FP-003: Dead Test Infrastructure
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
# Find env-gated tests
grep -rn "skipIf\|PYTEST_\|CI_ONLY\|process.env\." tests/ | head -20
# Verify gates are set somewhere
grep -rn "PYTEST_GPU\|PYTEST_INTEGRATION\|CI_GPU" .github/ Makefile Dockerfile* pytest.ini pyproject.toml
```
**Signature**: Tests gated by `PYTEST_GPU=1` or similar env vars that are never set in CI, Makefile, or any configuration.
**Impact**: PP had 5 GPU test files (never executed) that existed solely to satisfy a directive requiring "real GPU integration tests."

### FP-004: Hollow Assertions
**First seen**: Podcast-Pipeline (2026-03-07), also dx3 (2026-03-06)
**Detection**:
```bash
# Python
grep -rn "assert.*is not None\|assert.*\.exists()\|assert True\|assert len.*>= 0\|assert len.*>= 1$" tests/ | wc -l
# TypeScript
grep -rn "toBeDefined\|toBeTruthy\|toBeFalsy\|expect.*\.not\.toBeNull" tests/ | wc -l
```
**Signature**: Assertions that pass regardless of output correctness: `assert result is not None`, `assert path.exists()`, `assert len(data) >= 1`.
**Impact**: PP had 153 hollow assertions across 36 files. A function returning garbage would pass all of them.

### FP-005: README Badge Fraud
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
grep -oP 'tests-\K[0-9]+' README.md
grep -oP 'coverage-\K[0-9]+' README.md
# Compare to actual: python -m pytest --tb=no -q | tail -1
```
**Signature**: README shows coverage/test badges with hardcoded numbers that don't match actual CI output.
**Impact**: PP README showed "710 tests, 77% coverage" while actual was 1,601 tests collected, ~15% real coverage.

### FP-006: Silent Exception Swallowing
**First seen**: dx3/threedb (2026-03-06)
**Detection**:
```bash
grep -rn "except.*:" src/ | grep -v "except.*Error\|except.*Exception\|# SILENT" | head -20
grep -rn "except:\s*$\|except:.*pass\|except.*:.*pass$\|except.*:.*continue$" src/ | head -20
```
**Signature**: Bare `except: pass` or `except Exception: continue` in data paths that silently discard errors.
**Impact**: dx3 had silent exception handling that caused graph queries to return empty results instead of errors — 3,277 tests passed while the feature was broken.

### FP-007: Test Count Inflation
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
# Rapid growth analysis
git log --oneline --all --diff-filter=A -- 'tests/*.py' 'tests/*.ts' | wc -l
# Check test density per file
for f in $(find tests/ -name "test_*.py" -o -name "*.test.*"); do
    echo "$(grep -c 'def test_\|it(' "$f" 2>/dev/null) $f"
done | sort -rn | head -10
```
**Signature**: 30+ tests per file, many with identical structure (parameterized from template). Test count grew 30x in 3 weeks.
**Impact**: PP grew from ~50 to 1,593 tests in 3 weeks. Most were generated to satisfy "test count must not decrease" + coverage gates.

### FP-008: Mock-Implementation Tautology
**First seen**: Podcast-Pipeline (2026-03-07)
**Detection**:
```bash
# Find commits that change both implementation AND its mocks in the same commit
git log --oneline --all --name-only | grep -B1 "tests/" | grep -B1 "src/" | head -20
```
**Signature**: Mocks updated in the same commit as implementation changes — the mock always mirrors the implementation, so the test can never fail.
**Impact**: When implementation changes and the mock changes with it, the test verifies "does the mock return what I just told it to?" — a tautology.

## Pattern Classification

| ID | Category | Severity | Automated Detection |
|----|----------|----------|-------------------|
| FP-001 | Coverage | P0 | Yes (grep config) |
| FP-002 | Classification | P1 | Yes (grep integration files) |
| FP-003 | Infrastructure | P0 | Yes (grep + cross-check) |
| FP-004 | Assertions | P1 | Yes (grep patterns) |
| FP-005 | Reporting | P1 | Yes (grep + compare) |
| FP-006 | Error handling | P0 | Yes (grep exceptions) |
| FP-007 | Volume | P1 | Partial (git log analysis) |
| FP-008 | Coupling | P2 | Partial (git diff analysis) |

## Adding New Patterns

When a new fraud pattern is discovered during a portfolio audit:
1. Assign next FP-NNN ID
2. Document: first seen, detection command, signature, impact
3. Add to this catalog
4. Update the CRUCIBLE Detective agent if new detection commands needed
5. Update the crucible-audit SKILL.md if new checks needed
