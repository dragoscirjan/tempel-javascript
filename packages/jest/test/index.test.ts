import { describe, expect, it } from 'vitest';

import defineConfig, { DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS, DEFAULT_TEST_MATCH } from '../dist/index.js';

describe('defineConfig', () => {
  it('returns portable Jest defaults', () => {
    expect(defineConfig()).toEqual({
      testMatch: DEFAULT_TEST_MATCH,
      verbose: true,
      coveragePathIgnorePatterns: DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS,
    });
  });

  it('allows Jest options to override defaults', () => {
    expect(
      defineConfig({
        testMatch: ['custom/**/*.test.ts'],
        verbose: false,
        testEnvironment: 'jsdom',
      }),
    ).toEqual({
      testMatch: ['custom/**/*.test.ts'],
      verbose: false,
      coveragePathIgnorePatterns: DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS,
      testEnvironment: 'jsdom',
    });
  });
});
