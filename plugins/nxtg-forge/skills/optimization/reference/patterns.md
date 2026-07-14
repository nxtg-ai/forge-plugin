# Optimization Fix Patterns

Detailed catalog referenced from `../SKILL.md`. Apply only after a profile has proven
the bottleneck's bucket (CPU / memory / I/O). Each section is a menu, not a checklist —
pick the one fix that removes the measured top item.

## Algorithm

- **Data-structure choice** — the highest-leverage change. A `Set`/`Map` membership
  check is O(1) vs an array's O(n). A repeated `array.find` in a loop is a hidden O(n²);
  index into a `Map` once.
- **Reduce time complexity** — collapse nested loops, precompute lookups, sort-then-scan
  instead of scan-per-element.
- **Lazy evaluation** — defer work until its result is actually needed; short-circuit.
- **Memoize** — cache pure-function results keyed by args (only when recompute is the
  proven cost and the key space is bounded).

## Database

- **Indexes** — add on columns in `WHERE`/`JOIN`/`ORDER BY`. Confirm the planner uses
  them with `EXPLAIN ANALYZE`; a composite index's column order matters.
- **Eliminate N+1** — replace "1 list query + one detail query per row" with a single
  `JOIN` or a batched `WHERE id IN (...)`. This is the most common web-app latency bug.
- **Batch writes** — one multi-row `INSERT`/`UPDATE` instead of a loop of singles.
- **Partition / archive** — split or age-out large tables so hot queries scan less.
- **Denormalize deliberately** — only when a proven read path can't be indexed away, and
  you own the write-side consistency.

## Frontend

- **Code splitting** — `React.lazy` + dynamic `import()` per route so the initial chunk
  carries only what first paint needs.
- **Lazy loading** — images/components below the fold load on intersection.
- **Bundle optimization** — tree-shake (import the named export, not the barrel), drop
  heavy deps, analyze with a bundle visualizer / `source-map-explorer`.
- **Virtual scrolling** — render only visible rows for long lists (hundreds+).
- **Debounce / throttle** — rate-limit expensive handlers (search-as-you-type, scroll,
  resize).
- **Web Workers** — move CPU-heavy work off the main thread so the UI stays responsive.
- **`requestAnimationFrame`** — batch DOM/visual updates to the frame, not per-event.

## Network

- **Fewer requests** — combine/batch endpoints; avoid waterfalls of dependent calls.
- **Compress payloads** — gzip/brotli; ship only the fields the client uses.
- **HTTP/2** — multiplex over one connection to kill head-of-line blocking.
- **Pagination / cursors** — never return an unbounded collection.
- **Efficient query shape** — GraphQL/field-selection to avoid over-fetching.

## Caching

Cache **last**, after the slow path is proven and correct. Every cache needs an
invalidation story or it becomes a correctness bug.

### Levels

1. **Browser** — HTTP cache headers (`Cache-Control`, `ETag`), service workers.
2. **CDN / edge** — static assets and cacheable API responses at edge locations.
3. **Application** — in-memory (bounded LRU) or Redis for shared/multi-instance state.
4. **Database** — query/result cache, materialized views.

### Write/read patterns

- **Cache-aside** (lazy) — app checks cache, on miss loads from source and populates.
  Simplest; risk is stampede on cold keys.
- **Read-through** — cache layer loads on miss transparently.
- **Write-through** — write hits cache and source synchronously; consistent, slower
  writes.
- **Write-behind** — write to cache, flush to source async; fast writes, risk of loss
  and **stale reads elsewhere** — the classic "data is wrong" bug.
- **Refresh-ahead** — proactively refresh hot keys before expiry to avoid miss latency.

### Invalidation traps

- Unbounded in-memory cache = a memory leak wearing a performance hat. Bound it (LRU +
  max size / TTL).
- A write path that updates the DB but not the cache serves stale reads until TTL.
- Cache keyed on mutable derived data goes stale silently — key on identity + version.

## Profiling tools by stack

- **Browser / React** — DevTools Performance + Network tabs, React Profiler.
- **Node** — `node --prof` / `--cpu-prof`, `clinic`, `0x` flamegraphs.
- **Rust (forge-orchestrator)** — `cargo flamegraph`, `cargo build --release` (the repo
  already sets `opt-level=z`, LTO, stripped for size).
- **Database** — `EXPLAIN ANALYZE`, slow-query log.
- **Bundle** — `vite-bundle-visualizer`, `source-map-explorer dist-ui/*.js`.
