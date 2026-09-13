import type { Config } from 'jest';

const DEFAULT_TEST_MATCH = ['**/src/**/*.spec.[jt]s', '**/test/**/*.test.[jt]s', '**/test/**/*.e2e.[jt]s'];

const DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS = ['/node_modules/', '/dist/', '/coverage/', '/src/test/'];

/**
 * Creates a Jest configuration with portable defaults for JavaScript and TypeScript projects.
 *
 * @param options Jest options that override the defaults.
 * @return A complete Jest configuration.
 */
export default function defineConfig(options: Config = {}): Config {
  const {
    testMatch = DEFAULT_TEST_MATCH,
    verbose = true,
    coveragePathIgnorePatterns = DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS,
    ...customConfig
  } = options;

  return {
    testMatch,
    verbose,
    coveragePathIgnorePatterns,
    ...customConfig,
  };
}

export { DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS, DEFAULT_TEST_MATCH };
