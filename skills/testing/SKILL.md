---
name: Testing
description: Provides testing best practices for writing reliable, maintainable test suites.
---

# Testing Excellence Skill

Comprehensive testing strategies and implementation.

## Testing Philosophy

### Test Types and Coverage
- **Unit Tests (70%)**: Test individual functions/methods
- **Integration Tests (20%)**: Test component interactions
- **E2E Tests (10%)**: Test complete user workflows

### Test Characteristics
- **Fast**: Milliseconds, not seconds
- **Reliable**: No flaky tests
- **Isolated**: Tests don't affect each other
- **Descriptive**: Clear test names
- **Maintainable**: Easy to update

## Testing Strategies

### Test-Driven Development (TDD)
1. Write failing test
2. Write minimal code to pass
3. Refactor for clarity
4. Repeat

### Behavior-Driven Development (BDD)
- Given-When-Then format
- Focus on user behavior
- Living documentation
- Stakeholder collaboration

### Property-Based Testing
- Generate random inputs
- Test invariants
- Find edge cases automatically
- Increase confidence

## Implementation Patterns

### Unit Testing
```javascript
describe('Calculator', () => {
  describe('add', () => {
    it('should return sum of two numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });
});
```

### Integration Testing
- Test API endpoints
- Test database operations
- Test service interactions
- Use test databases
- Clean up after tests

### E2E Testing
- Test critical user paths
- Use page objects pattern
- Run in CI/CD pipeline
- Screenshot on failure
- Parallel execution

## Testing Tools

### JavaScript/TypeScript
- Jest for unit/integration
- Cypress for E2E
- Testing Library for React
- Supertest for APIs

### Python
- pytest for unit/integration
- Selenium for E2E
- unittest.mock for mocking
- hypothesis for property-based

### Performance Testing
- Load testing with k6
- Stress testing strategies
- Memory leak detection
- Profiling tools

## Best Practices

1. **Test Pyramid**: More unit tests, fewer E2E
2. **Test Data**: Use factories, not fixtures
3. **Mocking**: Mock external dependencies
4. **Coverage**: Aim for 80%+ on critical paths
5. **CI/CD**: Run tests on every commit

Tests are your safety net.