<!-- forge-required: status v1 -->

# Forge Status
**humanize** on `detached` @ `785e5dc`
**Stage: Alpha.** The Forge plugin and orchestrator are in alpha. On 2026-10-15 (UTC) a separate NXTG.AI team (product-oracle) ran the pre-registered core-job test on a clean install of the plugin (v3.14.0) and the orchestrator (forge 1.7.0). The test passed; each repeated check passed 3 of 3 (run 7). The evidence is attached to the forge-plugin v3.14.0 release. No SLA; interfaces may change without notice.

---

## Summary
**Verdict: NEEDS ATTENTION** - health **D (60/100)**
What matters now (top 3 of 5 findings):

| #   | Severity | Finding                                  |
|-----|----------|------------------------------------------|
| 1   | [HIGH]   | Forge governance is not initialized      |
| 2   | [MED]    | No CLAUDE.md for AI-assisted work        |
| 3   | [MED]    | No strict type checking (no type config) |

## Changes since last run
No previous run recorded for this project; this run is the baseline.
Snapshot: `~/.local/state/nxtg-forge/status/2c6a1d0e9b7f4a31.json` (outside the project).

## Git: 0 changed files

| Metric    | Value      |
|-----------|------------|
| Branch    | `detached` |
| Staged    | 0          |
| Modified  | 0          |
| Untracked | 0          |

**Recent commits (5):**

| Hash      | Message                                      |
|-----------|----------------------------------------------|
| `785e5dc` | [pre-commit.ci] pre-commit autoupdate (#444) |
| `6ed367f` | Drop support for EOL Python 3.10 (#440)      |
| `8bf85bb` | Update config                                |
| `4d13dd5` | Test PyPy3.12                                |
| `71c730d` | Drop support for EOL Python 3.10             |

## Health: D (60/100), 3 of 5 dimensions below max

| Dimension   | Score          | Bar                    | Status |
|-------------|----------------|------------------------|--------|
| Tests       | 20/20          | [####################] | [OK]   |
| Types       | 0/10           | [....................] | [FAIL] |
| Security    | 15/15          | [####################] | [OK]   |
| Docs        | 10/20          | [##########..........] | [WARN] |
| Project     | 15/35          | [#########...........] | [FAIL] |
| **Overall** | **D (60/100)** | [############........] | [WARN] |

## Tests: 6 files, 68 cases

| Metric     | Value                                       |
|------------|---------------------------------------------|
| Test files | 6                                           |
| Test cases | 68                                          |
| Runner     | pytest                                      |
| Coverage   | 20/20 (68 tests across 13 files (5.2/file)) |

## Governance
Not initialized. Run `/nxtg-forge:init` (or `forge init`) to set up Forge here.

## Orchestrator
◐ **Connected; not initialized here** — run `forge init` in this project
Plain text: CONNECTED, NOT INITIALIZED HERE - run `forge init` in this project

## Tooling: 33 agents, 24 commands, 14 hook scripts

| Category | Count                         | Source       |
|----------|-------------------------------|--------------|
| Agents   | 33                            | Forge plugin |
| Commands | 24                            | Forge plugin |
| Hooks    | 14 scripts (27 registrations) | Forge plugin |

## Next actions (3)
1. Initialize governance: `/nxtg-forge:init`
2. Add a CLAUDE.md: `/init`
3. Configure a type checker: `/nxtg-forge:gap-analysis`

## Provenance

| Item         | Value                           |
|--------------|---------------------------------|
| Plugin       | nxtg-forge 3.13.0               |
| Orchestrator | forge 1.6.3                     |
| Generated    | 2026-10-14 01:52:10 UTC (1.2 s) |
| Project      | `/home/dev/humanize`            |
| Commit       | `785e5dc` on `detached`         |
<!-- /forge-required -->