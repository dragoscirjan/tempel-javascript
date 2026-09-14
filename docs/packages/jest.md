# Jest

`@tempel/jest` is a portable Jest configuration factory for teams that prefer Jest over Vitest.

## Installation

```bash
pnpm add -D @tempel/jest
```

The package includes Jest as a runtime dependency and can be used from an ESM Jest configuration.

## Basic usage

Create `jest.config.mjs`:

```js
import defineConfig from "@tempel/jest";

export default defineConfig();
```

## Defaults

- Discovers `src/**/*.spec.js`, `src/**/*.spec.ts`
- Discovers `test/**/*.test.js`, `test/**/*.test.ts`
- Discovers `test/**/*.e2e.js`, `test/**/*.e2e.ts`
- Enables verbose reporting
- Ignores `node_modules`, `dist`, `coverage`, and `src/test` from coverage paths

## Customization

The factory accepts standard Jest configuration options. Custom values override the defaults:

```js
import defineConfig from "@tempel/jest";

export default defineConfig({
  testEnvironment: "jsdom",
  testMatch: ["src/**/*.{test,spec}.{js,ts,tsx}"],
  collectCoverage: true,
  coverageReporters: ["text", "html", "lcov"],
});
```

Jest-specific transforms, test environments, reporters, projects, and coverage thresholds can be configured using the normal Jest options.
