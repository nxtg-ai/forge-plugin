---
name: Optimization
description: Identifies performance bottlenecks and recommends optimization strategies.
---

# Performance Optimization Skill

Expert techniques for optimizing code performance and efficiency.

## Performance Analysis

### Measurement First
- **Profile Before Optimizing**: Never guess, always measure
- **Identify Bottlenecks**: Focus on the slowest parts
- **Set Performance Budgets**: Define acceptable limits
- **Monitor Continuously**: Track metrics over time

### Key Metrics
- Response time
- Throughput
- Memory usage
- CPU utilization
- Network I/O
- Disk I/O

## Optimization Strategies

### Algorithm Optimization
- Choose optimal data structures
- Reduce time complexity
- Minimize space complexity
- Use caching strategically
- Implement lazy evaluation

### Database Optimization
- **Query Optimization**
  - Use indexes effectively
  - Avoid N+1 queries
  - Batch operations
  - Use query explain plans

- **Schema Design**
  - Normalize appropriately
  - Denormalize for performance
  - Partition large tables
  - Archive old data

### Code-Level Optimization
- **Memory Management**
  - Prevent memory leaks
  - Use object pooling
  - Optimize data structures
  - Reduce allocations

- **Concurrency**
  - Parallel processing
  - Async operations
  - Thread pooling
  - Lock-free algorithms

### Frontend Optimization
- **Loading Performance**
  - Code splitting
  - Lazy loading
  - Bundle optimization
  - CDN usage

- **Runtime Performance**
  - Virtual scrolling
  - Debouncing/throttling
  - Web Workers
  - RequestAnimationFrame

## Caching Strategies

### Cache Levels
1. **Browser Cache**: HTTP headers, service workers
2. **CDN Cache**: Edge locations
3. **Application Cache**: In-memory, Redis
4. **Database Cache**: Query cache

### Cache Patterns
- Cache-aside
- Read-through
- Write-through
- Write-behind
- Refresh-ahead

## Network Optimization

- Minimize requests
- Compress payloads
- Use HTTP/2
- Implement pagination
- GraphQL for efficient queries

## Common Bottlenecks

### CPU Bound
- Inefficient algorithms
- Unnecessary computations
- Missing indexes
- Regex complexity

### Memory Bound
- Memory leaks
- Large objects
- Inefficient data structures
- Missing pagination

### I/O Bound
- Synchronous operations
- Missing caching
- Inefficient queries
- Network latency

## Optimization Workflow

1. **Establish Baseline**: Measure current performance
2. **Set Goals**: Define target metrics
3. **Profile**: Identify bottlenecks
4. **Optimize**: Apply targeted improvements
5. **Validate**: Measure improvements
6. **Monitor**: Track over time

Remember: Premature optimization is the root of all evil. Optimize what matters.