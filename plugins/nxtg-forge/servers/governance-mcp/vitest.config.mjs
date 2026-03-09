import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    // Only collect tests from tests/ — exclude __tests__/ which uses node:test runner
    include: ['tests/**/*.test.mjs'],
  },
});
