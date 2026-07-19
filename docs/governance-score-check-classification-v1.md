# Forge Governance Score — Check-Classification Pass (v1)

**Directive:** DIRECTIVE-NXTG-20260719-04 (B3 §ADVERSARIAL-FOLD **G3**) · Wave W-NXTG-20260719-A
**Scorer under classification:** `plugins/nxtg-forge/servers/governance-mcp/tools.mjs` → `getHealthScore()` (lines 307–459), the live engine behind `forge_get_governance_health` (`{score, grade, checks[]}`).
**Purpose:** partition the 8 governance checks into **commit-tree-pure** vs **environment/worktree-dependent**, so a *deterministic* 0–100 core can be defined as a pure function of the committed tree — the precondition for G3's re-measure + dual-runner byte-identical proof, and the input surface G5/G6/G8 build on.

> **G3 thesis, proven concretely.** The live score is NOT reproducible bit-for-bit on a commit because three checks read state that does not exist in the committed tree. Measured `getHealthScore()` on `forge-plugin` HEAD this session = **50/F** (Governance 0 "not initialized", Git Clean 5 "2 modified 6 untracked", Test Coverage 0 "file ratio", Type Safety 0, README/CLAUDE/File Size/Security = 45). The spec's cited **70/C** was a *different repo/worktree*. Same tool, different environment → different number. That gap IS the impurity this pass removes.

## Classification table

| # | Check | Points | Source probe (tools.mjs) | Reads | **Class** |
|---|-------|-------:|---|---|---|
| 1 | Governance | 15 | `.claude/governance.json` initialized (`:317`) | committed file | **PURE** (if `governance.json` is committed; see note) |
| 2 | **Git Clean** | 10/5 | `git.modified`/`git.untracked` (`:325–330`) | **working-tree state** | **IMPURE** — worktree-dependent; trivially clean (+10) on a bare `git checkout <sha>`; +5 on any dirty tree. Not a property of the commit. |
| 3 | **Test Coverage** | 0–20 | 3-tier (`:333–356`): T1 `testCoverage` (coverage-summary.json), T2 `testCaseCount` density, T3 `testFileRatio` | T1 = **generated coverage file** (requires EXECUTING tests; gitignored); T2/T3 = committed file counts | **MIXED** — T1 IMPURE (execution/env/flakiness + generated artifact), T2/T3 PURE (committed tree). |
| 4 | README | 10 | `README.md` exists (`:362`) | committed file | **PURE** |
| 5 | CLAUDE.md | 10 | `CLAUDE.md` exists (`:370`) | committed file | **PURE** |
| 6 | Type Safety | 0–10 | tsconfig strictness tier (`:395`) | committed `tsconfig.json`/`jsconfig.json` | **PURE** (ruleset = the tiered scoring table; pin in rubric per G6) |
| 7 | File Size | 10/5 | files > 500 lines (`:404`) | committed source line counts | **PURE** |
| 8 | **Security** | 0–15 | 3 sub-probes (`:411–446`): (a) `.env` committed, (b) **npm audit**, (c) hardcoded secrets/eval | (a)/(c) = committed-tree scan (ruleset-dependent, G6); (b) = **`npm audit`: network + installed `node_modules`** | **MIXED** — (a)+(c) PURE (pinned-ruleset scan), (b) npm-audit IMPURE (network + resolver/lockfile + registry state). |

## The redefinition (G3 corrective build)

**Deterministic 0–100 CORE** (pure functions of the committed tree, pinned ruleset per G6):

| Check | Redefinition | Max |
|---|---|---|
| Governance | unchanged — `.claude/governance.json` present+initialized in the tree | 15 |
| Test Coverage | **drop T1 real-coverage from the core**; score from T2 test-case density / T3 file-ratio only (committed tree). Real coverage moves to the environment band. | 20 |
| README / CLAUDE.md / File Size / Type Safety | unchanged (already pure) | 10/10/10/10 |
| Security | keep (a) `.env`-committed + (c) hardcoded-secrets/eval as a **pinned-ruleset** committed-tree scan; **drop npm-audit from the core** (network/env). | 15 (recomposed) |
| ~~Git Clean~~ | **removed from the deterministic core** — a bare-checkout invariant, not a commit property. | — |

**Separately-labeled ENVIRONMENT BAND** (reported, never folded into the reproducible 0–100):
- **Git Clean** (worktree hygiene at measurement time)
- **Test Coverage — real line coverage** (requires a pinned lockfile + hermetic container digest to be reproducible; G6)
- **Security — npm audit** (network + installed deps + advisory-DB snapshot)

## Expected re-measured deterministic score (≠ live)

Removing Git Clean (−the 5–10 it contributes) and the impure Security/Coverage components, and re-normalizing the core to 100, **the deterministic score will differ from both the 50/F measured here and the cited 70/C** — by construction. The exact re-measured number + the pinned-rubric weight table are produced in the G3 build step (dual-runner byte-identical recompute), tracked in the directive Response. **Until re-measured, neither 50 nor 70 may be present-tensed as "the reproducible score."**

## Downstream dependencies (what this pass unblocks)

- **G3 (remainder):** re-measure the deterministic core; prove dual-runner byte-identical on the redefined number.
- **G5:** the deterministic core is what gets the dual-runner recompute + cert-ledger row (rubric_version + both hashes) — NOT the eval-rail.
- **G6:** the two ruleset/toolchain-dependent surfaces named here (Security secret-scan ruleset; Type Safety scoring table; Test-Coverage resolver in the env band) are what the toolchain-pin envelope must fingerprint.
- **G8:** the gameable checks (checks-disabled, coverage-omits) get the anti-Goodhart weight-table invariant + property test.

---
_Instrument: this classification is re-runnable — every row cites a `tools.mjs` line + the exact input surface; the live-vs-deterministic delta is reproduced by running `getHealthScore()` on any two worktrees of the same commit._
