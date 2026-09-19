# Jest

`@tempel/jest` exports a Jest configuration factory. Jest is a runtime dependency of the package.

## Installation

```bash
pnpm add -D @tempel/jest
```

## Basic usage

Create `jest.config.mjs`:

```js
import defineConfig from "@tempel/jest";

export default defineConfig();
```

## Defaults

- `verbose` is `true`.
- `testMatch` contains:
  - `**/src/**/*.spec.[jt]s`
  - `**/test/**/*.test.[jt]s`
  - `**/test/**/*.e2e.[jt]s`
- `coveragePathIgnorePatterns` contains:
  - `/node_modules/`
  - `/dist/`
  - `/coverage/`
  - `/src/test/`

The patterns discover JavaScript and TypeScript files. The factory does not configure a TypeScript transformer. Add a Jest-compatible transform or another supported compilation step when tests contain TypeScript syntax.

## Customization

Standard Jest options override the defaults:

```js
import defineConfig from "@tempel/jest";

export default defineConfig({
  testEnvironment: "jsdom",
  testMatch: ["src/**/*.{test,spec}.{js,ts,tsx}"],
  collectCoverage: true,
  coverageReporters: ["text", "html", "lcov"],
});
```

Transforms, test environments, reporters, projects, and coverage thresholds pass through unchanged.

## Exported defaults

The package exports the default arrays for reuse:

```js
import defineConfig, { DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS, DEFAULT_TEST_MATCH } from "@tempel/jest";
```

`DEFAULT_TEST_MATCH` is the factory's test pattern array. `DEFAULT_COVERAGE_PATH_IGNORE_PATTERNS` is its coverage exclusion array.
