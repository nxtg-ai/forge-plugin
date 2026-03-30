# Performance

> Finds and eliminates bottlenecks -- profiles bundle size, React render cycles, memory leaks, API latency, and enforces performance budgets.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Performance agent measures first and optimizes second. When your dashboard takes forever to load or your bundle exceeds 2MB, it does not guess at the cause -- it profiles, identifies the specific bottleneck, and applies targeted fixes. It understands the full performance stack: JavaScript bundle size and tree-shaking, React component render cycles, memory allocation and leak detection, API response times and query efficiency, and WebSocket message throughput.

The agent enforces performance budgets -- concrete thresholds that separate "fast enough" from "needs work." JS bundle under 200KB gzipped. First Contentful Paint under 1.5 seconds. API p95 latency under 500ms. Heap memory under 100MB. These are not aspirational targets; they are enforced constraints. When a budget is exceeded, the agent identifies the specific cause and recommends a fix: code split this route, memoize this component, debounce this state update, paginate this query.

What makes this agent particularly useful for React applications is its understanding of render performance. It identifies unnecessary re-renders caused by missing `React.memo`, inline object/function creation in JSX, state stored too high in the component tree, and components that could benefit from lazy loading. These are the performance issues that do not show up in network profiling but dominate real-world user experience.

## When to Use It

- **When the UI feels slow**: When page loads take too long, interactions feel laggy, or scrolling stutters. The Performance agent profiles to identify whether the bottleneck is bundle size, render cycles, data fetching, or memory.
- **When bundle size is too large**: When your production build exceeds budget and you need specific recommendations on what to code-split, tree-shake, or lazy-load.
- **When memory usage grows over time**: When long-running sessions (dashboards, terminals) accumulate memory. The agent identifies leak patterns: unclosed WebSockets, cleared intervals, removed event listeners, and unbounded arrays.
- **After adding new dependencies**: When a new library increases bundle size and you need to assess the cost vs. alternatives.

Do not use the Performance agent for functional bugs (use Detective), security issues (use Security), or test coverage (use Testing). Performance focuses exclusively on speed, size, and resource efficiency.

## How It Works

The Performance agent analyzes across five areas:

1. **Bundle Analysis** -- Runs build visualization tools to identify the largest modules. Maps dependency trees to find packages that could be replaced with lighter alternatives or loaded dynamically.

2. **React Render Profiling** -- Scans components for missing memoization (React.memo, useMemo, useCallback), identifies components that re-render on every parent update, and flags large component trees that should be lazy-loaded with React.lazy + Suspense.

3. **Memory Leak Detection** -- Searches for common leak patterns: WebSocket connections not closed in useEffect cleanup, setInterval/setTimeout not cleared on unmount, event listeners not removed, subscriptions not unsubscribed, and arrays that grow without bound.

4. **API Performance** -- Checks for N+1 query patterns, missing pagination on list endpoints, absent caching for read-heavy data, and response time compliance with budget targets.

5. **Build Optimization** -- Verifies tree-shaking effectiveness (named imports vs. wildcard), identifies dynamic import candidates for rarely-used features, checks asset optimization (image compression, SVG usage), and scans for unused CSS classes.

Each finding maps to a specific budget metric, making it clear which optimizations have the highest impact on user experience.

## Examples

### Example 1: Slow Dashboard Load

```
User: "The dashboard takes forever to load"

Performance:
  - Profiles: Bundle is 1.8MB gzipped (budget: 200KB)
  - Finds:
    - monaco-editor: 800KB (loaded on every page, used only in terminal view)
    - chart.js: 300KB (could use lightweight alternative)
    - lodash: 71KB (only 3 functions used, import full library)
  - Recommends:
    - Lazy-load monaco-editor with React.lazy() -- saves 800KB on initial load
    - Replace chart.js with lightweight charting library -- saves 250KB
    - Switch to lodash-es with named imports -- saves 65KB
  - Result: Bundle reduction from 1.8MB to 685KB with three targeted changes
```

### Example 2: Memory Leak in Long-Running Session

```
User: "Memory keeps climbing when the dashboard is open"

Performance:
  - Analyzes: Components with useEffect hooks that access external resources
  - Finds:
    - useWebSocket hook: Missing cleanup on disconnect -- WebSocket stays open across re-renders
    - ActivityFeed: setInterval for polling not cleared in cleanup function
    - Terminal panel: Event listener on window.resize never removed
  - Fixes:
    - Add ws.close() in useEffect return function
    - Add clearInterval in useEffect cleanup
    - Add removeEventListener in useEffect cleanup
  - Verifies: Heap stays flat at 45MB after 30 minutes (was climbing 2MB/minute)
  - Result: Three leak sources fixed with proper cleanup patterns
```

### Example 3: React Render Optimization

```
User: "The agent list re-renders constantly when WebSocket messages arrive"

Performance:
  - Profiles: AgentList component re-renders 10x/second during active sessions
  - Finds:
    - AgentCard not wrapped in React.memo -- re-renders on every parent update
    - Inline object creation in JSX: style={{ color: status.color }} creates new ref each render
    - WebSocket messages update top-level state, causing full tree re-render
  - Recommends:
    - Wrap AgentCard in React.memo with custom comparison
    - Extract inline styles to constants or useMemo
    - Move WebSocket state closer to consuming components
  - Result: Re-renders reduced from 10/s to 1/s (only when agent data actually changes)
```

## Power Use Cases

**Budget-Driven Development**: Set performance budgets at the start of a project and run the Performance agent after each feature addition. If a feature pushes bundle size over 200KB or API latency over 500ms, you know immediately and can address it before the debt compounds.

**Detective Subagent Mode**: The Detective spawns the Performance agent as one of four parallel subagents during health checks. Performance provides build analysis, dependency auditing, and TODO/FIXME counting while other agents handle testing, security, and documentation.

**Post-Dependency Audit**: After adding a new npm package, run the Performance agent to measure the bundle size impact. It shows the exact cost in KB and suggests lighter alternatives if the impact exceeds budget. This prevents the gradual bundle bloat that plagues long-lived projects.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Detective** | Detective spawns Performance as a subagent during health checks. Performance provides the bundle size and resource metrics for the health score. |
| **Planner** | For performance-critical features, Planner includes Performance in the quality gate phase to verify budgets are met. |
| **UI** | Performance identifies React render issues; UI agent implements the optimized component patterns (memo, lazy, virtual scroll). |
| **/forge:optimize** | The `/forge:optimize` command provides a quick optimization pass. The Performance agent provides deep profiling and budget enforcement. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Bundle analysis and size optimization. React render profiling. Memory leak detection. API latency checking. Performance budget enforcement with concrete thresholds. |
| **L2 Pro Builder** | Performance metrics tracked as task metadata via orchestrator. Budget violations surfaced in `forge_get_health` scores. |
| **L3 Ship Lord** | Bundle size trends, memory charts, and latency graphs rendered in the forge-ui dashboard. Visual budget indicators (green/yellow/red). |

## Tips & Gotchas

- **Do**: Measure before optimizing. The Performance agent profiles first -- never apply optimizations based on assumptions about where the bottleneck is.
- **Don't**: Memoize everything. `React.memo` has a cost (comparison function runs on every render). Only memoize components that the Performance agent identifies as re-rendering unnecessarily.
- **Do**: Check for memory leaks in components with WebSocket connections, timers, or event listeners. Missing cleanup functions are the number one leak source in React applications.
- **Don't**: Ignore bundle size until it becomes a problem. Run the Performance agent after adding dependencies to catch bloat early when alternatives are still easy to swap.

---

*See also: [UI](ui.md) | [Detective](detective.md) | [/forge:optimize](../commands/optimize.md)*
