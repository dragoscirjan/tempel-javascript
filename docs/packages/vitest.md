# Vitest

`@tempel/vitest` creates a Vitest configuration from test options.

## Basic usage

```js
import tempelVitestConfig from "@tempel/vitest";

export default tempelVitestConfig();
```

## Defaults

- `globals` is `true`.
- `reporters` is `["verbose"]`.
- Coverage excludes Vitest's default exclusions and `src/test/**/*`.
- Test discovery uses these six patterns:
  - `src/**/*.spec.js`
  - `src/**/*.spec.ts`
  - `test/**/*.test.js`
  - `test/**/*.test.ts`
  - `test/**/*.e2e.js`
  - `test/**/*.e2e.ts`

The defaults do not discover JSX, TSX, MJS, CJS, MTS, or CTS tests. Pass a custom `include` array when a project uses those extensions or different directories.

## Customization

Pass Vitest test options to the factory:

```js
import tempelVitestConfig from "@tempel/vitest";
import { configDefaults } from "vitest/config";

export default tempelVitestConfig({
  environment: "jsdom",
  setupFiles: ["./test/setup.ts"],
  coverage: {
    reporter: ["text", "html", "lcov"],
    exclude: [...configDefaults.exclude, "src/test/**/*", "src/mocks/**/*"],
  },
});
```

Passing `include`, `reporters`, or `coverage.exclude` replaces that default. Other test options override the generated configuration, so settings such as `globals: false` work normally.

Use `@tempel/tsconfig/vitest.json` when TypeScript tests need Vitest globals in the type environment.
