---
name: Optimization
description: >
  Measure-first performance optimization playbook — profiling discipline, bottleneck
  triage (CPU/memory/I/O), caching layers, and the algorithm/DB/frontend/network fix
  patterns. Use when the user reports something is slow ("dashboard takes forever",
  "API is laggy", "bundle is 2MB", "memory keeps growing"), asks to profile,
  benchmark, reduce latency/bundle-size, or fix N+1 queries — and to interpret the
  output of the /forge:optimize command or the `performance` agent.
when_to_use: >
  Triggers: "it's slow", "profile this", "reduce bundle size", "optimize this query",
  "memory leak", "N+1 queries", "improve response time", "benchmark", "the app lags",
  "cut load time", "why is this taking so long". Also when reviewing /forge:optimize
  output or briefing the `performance` agent (agents/performance.md).
user-invocable: false
allowed-tools: Read, Grep, Glob, Bash
---

# Performance Optimization

Diagnose and fix performance problems **from measurement, never from guessing**. This
skill is the reasoning layer; the deterministic scan lives in the `/forge:optimize`
command and the `performance` agent.

## The one rule

> Measure → find the real bottleneck → fix that one thing → re-measure. Repeat.

Premature optimization wastes effort on code that isn't hot. A profile that shows
where time/memory/allocations actually go beats any intuition. Optimize the top item,
prove the delta, then re-profile — the bottleneck usually moves.

## Where this fits in Forge

| Surface | What it does | When |
|---|---|---|
| `/forge:optimize` (command) | Deterministic 7-dimension static scan (large files, `as any`, dead exports, deps, dup, console, TODO debt) + optional `--fix` | Codebase-health sweep, refactor triage |
| `performance` agent (`agents/performance.md`) | Bundle analysis, React render profiling, memory-leak hunting, API latency | Deep dive on a specific slow surface |
| This skill | The measure-first method + fix patterns both of the above apply | Any "it's slow" reasoning |

`/forge:optimize` is a TypeScript-oriented static-quality scan — it does **not** run a
profiler. For actual runtime numbers you still profile (browser DevTools, `cargo
flamegraph`, `node --prof`, `EXPLAIN ANALYZE`). Read `reference/patterns.md` for the
full per-domain fix catalog; keep this file for triage.

## Triage: classify the bottleneck first

Before touching code, put the symptom in one bucket — the fix set is different for each.

- **CPU-bound** — high CPU, work scales with input. Causes: O(n²) loops, redundant
  recompute, heavy regex, no memoization. Fix: better algorithm/data structure, cache
  results, memoize.
- **Memory-bound** — RSS climbs, GC thrash, OOM. Causes: leaks (unremoved listeners,
  growing caches), giant objects held in scope, no pagination. Fix: release refs, bound
  caches, stream/paginate.
- **I/O-bound** — low CPU but slow wall-clock. Causes: sync I/O, N+1 queries, chatty
  network, missing cache. Fix: batch, async/parallel, cache, add indexes.

Quick discriminator: if CPU is pegged → CPU-bound; if wall-time ≫ CPU-time → I/O-bound;
if it degrades over hours/requests → memory leak.

## Worked example — "the dashboard takes forever to load"

1. **Measure** — DevTools Performance tab + Network waterfall. Observe: 1.8s blocked on
   a single `/api/tasks` call; main thread idle during it. → **I/O-bound**, not render.
2. **Find** — server logs show `/api/tasks` fires one query per task (N+1): 1 list +
   240 detail queries.
3. **Fix that one thing** — replace the loop with a single joined/batched query.
4. **Re-measure** — call drops 1.8s → 90ms. Load now render-bound at 300ms.
5. **Repeat** — next profile shows a synchronous 200-row render → add virtual scrolling.

Note how the bottleneck *moved* after each fix. Stopping after step 3 and "also"
adding a Redis cache would have optimized the wrong layer.

## Worked example — "our bundle is over 2MB"

1. **Measure** — `npx vite-bundle-visualizer` (or `source-map-explorer dist-ui/*.js`).
   Observe one dependency is 60% of the bundle.
2. **Fix** — code-split the route that needs it (`React.lazy` / dynamic `import()`), or
   swap for a lighter lib; tree-shake by importing the used export only.
3. **Re-measure** — confirm the initial chunk shrank; verify no runtime regression with
   `npm test`.

## Fix pattern index

Deep catalog with concrete code lives in [reference/patterns.md](reference/patterns.md):

- **Algorithm** — data-structure choice, complexity reduction, lazy evaluation
- **Database** — indexes, N+1 elimination, batching, EXPLAIN plans, partitioning
- **Frontend** — code splitting, lazy loading, virtual scrolling, debounce/throttle,
  Web Workers, `requestAnimationFrame`
- **Network** — fewer requests, compression, HTTP/2, pagination
- **Caching** — the 4 cache levels and 5 write/read patterns, with invalidation traps

## Gotchas

- **`/forge:optimize` grep-excludes any path containing the substring `test`** (`grep
  -v test`). A file named `contest.ts` or a dir like `latest/` is silently dropped from
  the type-safety / console / dead-code counts. Don't treat its "0 console statements"
  as proof — spot-check.
- **Dimension 1 (large files) only matches `*.ts`, not `*.tsx`.** In forge-ui (React 19)
  the biggest files are `.tsx` and won't appear in the >300-line list. Re-run the find
  with `-name "*.tsx"` for the UI repo.
- **The command is TypeScript/npm-shaped.** It scans `src/`, runs `npm outdated`,
  `depcheck`. It says nothing about forge-orchestrator (Rust) — there you profile with
  `cargo flamegraph`, size-optimize via the release profile (`opt-level=z`, LTO,
  stripped, already set in that repo's `Cargo.toml`), not `depcheck`.
- **Caching is the #1 source of correctness bugs, not just a speed win.** Every cache
  needs an invalidation story. Stale reads from an un-invalidated write-behind cache
  look like "the data is wrong", not "the app is slow" — cache last, and only after the
  slow path is proven and correct.
- **Micro-optimizing an I/O-bound path does nothing.** Hand-tuning a loop that spends
  95% of wall-time waiting on the DB is wasted effort. Always confirm the bucket
  (CPU/memory/I/O) before choosing a fix, or you optimize the 5% that doesn't matter.
- **A single benchmark number is noise.** Warm up, run multiple iterations, report
  median/p95 — JIT, cold caches, and GC pauses make a first-run timing meaningless.
- **`--fix` writes files.** The command runs analysis read-only and presents a plan
  first; never let it auto-apply on an unstaged tree you can't `git diff` to review.

## Workflow

1. **Baseline** — capture current numbers with a real tool (not a stopwatch feel).
2. **Classify** — CPU / memory / I/O bucket.
3. **Profile** — find the single hottest item in that bucket.
4. **Fix one thing** — the smallest change that removes the top item.
5. **Validate** — re-measure the delta; run tests so the fix didn't break behavior.
6. **Repeat or stop** — if the new top item is under budget, stop.

## Additional resources

- [reference/patterns.md](reference/patterns.md) — full algorithm / DB / frontend /
  network / caching fix catalog with code.
- `commands/optimize.md` — the deterministic 7-dimension scan and its `--fix` flow.
- `agents/performance.md` — the profiling/bundle/leak specialist agent.
