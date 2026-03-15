import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    // Only collect tests from tests/ — exclude __tests__/ which uses node:test runner
    include: ['tests/**/*.test.mjs'],
    // FORGE_TEST_MODE prevents index.mjs from blocking on stdio server.connect()
    env: {
      FORGE_TEST_MODE: '1',
    },
  },
});
