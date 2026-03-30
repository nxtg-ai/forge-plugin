# Optimization

> Teaches agents to profile before optimizing, target real bottlenecks, and apply proven performance strategies across the full stack.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Performance & Debugging |

---

## What It Provides

This skill encodes expert performance optimization knowledge so agents avoid the cardinal sin of premature optimization. It teaches a disciplined workflow -- measure, identify bottlenecks, optimize targeted areas, validate improvements -- and provides a comprehensive catalog of optimization strategies across algorithms, databases, frontend, backend, caching, and networking.

Without this skill, agents guess at performance problems or apply blanket optimizations that may not target actual bottlenecks. With it, agents first establish baselines, then apply surgically targeted improvements to the parts of the system that actually matter.

The knowledge spans six key metric categories (response time, throughput, memory, CPU, network I/O, disk I/O) and teaches agents to distinguish between CPU-bound, memory-bound, and I/O-bound bottlenecks -- each requiring fundamentally different optimization approaches.

## When It Activates

- When you ask an agent to improve application performance or reduce latency
- When an agent is profiling or diagnosing slow endpoints, queries, or renders
- When your project needs caching strategy design or database query optimization
- When building frontend performance budgets or backend concurrency models

## The Knowledge Inside

### The Optimization Workflow

The skill enforces a strict six-step process: establish baseline, set goals, profile, optimize, validate, monitor. Agents learn never to skip the baseline step -- you cannot prove an optimization worked without before-and-after measurements. Goals must be concrete (response time under 200ms at p95, not "make it faster").

### Bottleneck Classification

Every performance problem falls into one of three categories, and each demands different solutions. CPU-bound issues (inefficient algorithms, regex complexity, missing indexes) need algorithmic improvements. Memory-bound issues (leaks, oversized objects, missing pagination) need structural changes. I/O-bound issues (synchronous operations, missing caching, network latency) need concurrency and caching. Agents learn to diagnose which category applies before choosing a strategy.

### Caching Strategies

The skill teaches a layered caching model -- browser cache, CDN cache, application cache, database cache -- and five cache patterns (cache-aside, read-through, write-through, write-behind, refresh-ahead). Agents learn when each pattern is appropriate and how to avoid common caching pitfalls like stale data and cache stampedes.

### Frontend-Specific Optimization

For frontend work, the skill covers code splitting, lazy loading, bundle optimization, virtual scrolling, debouncing/throttling, Web Workers, and RequestAnimationFrame. Agents learn to distinguish between loading performance (how fast the page appears) and runtime performance (how smoothly it operates).

### Database Optimization

Database optimization gets dedicated coverage: index strategy, N+1 query elimination, batch operations, query explain plans, normalization vs. denormalization trade-offs, table partitioning, and data archival. These are among the highest-leverage optimizations in most applications.

## How to Leverage It

Always tell the agent what you have measured before asking for optimization. Agents with this skill will ask for profiling data if you do not provide it.

### Example: Database Query Optimization
```
User: "The /api/users endpoint takes 3 seconds. Optimize it."
What happens: The agent first profiles the endpoint, identifies an N+1 query
in the ORM layer as the bottleneck, adds eager loading, implements a Redis
cache for frequently accessed user lists, and validates the improvement with
before/after timing.
```

## Power Applications

- Use the optimization workflow to create performance regression test suites
- Apply caching strategies at multiple layers simultaneously for compound improvements
- Combine with the browser-debugging skill to profile frontend and backend in a single pass

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **browser-debugging** | Provides the tooling to measure frontend performance |
| **agent-backend-master** | Backend Master applies these patterns during implementation |
| **agent-platform-builder** | Platform Builder uses these patterns for infrastructure sizing |

## Tips

- Premature optimization is the root of all evil -- always measure first
- The biggest performance gains usually come from algorithmic improvements and caching, not micro-optimizations
- Network I/O optimization (fewer requests, compression, HTTP/2) often has outsized impact on user-perceived performance

---

*See also: [browser-debugging](browser-debugging.md), [agent-backend-master](agent-backend-master.md)*
