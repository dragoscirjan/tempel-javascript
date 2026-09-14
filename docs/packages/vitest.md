# Vitest

`@tempel/vitest` is a configuration factory that adds practical defaults to Vitest while preserving normal Vitest configuration options.

## Basic usage

```js
import tempelVitestConfig from "@tempel/vitest";

export default tempelVitestConfig();
```

## Defaults

- `globals: true`
- Verbose reporting
- JavaScript and TypeScript test discovery
- `src/**/*.spec.*`
- `test/**/*.test.*`
- `test/**/*.e2e.*`
- Vitest default coverage exclusions plus `src/test/**/*`

## Customization

Any supported Vitest test option can be passed to the factory:

```js
import tempelVitestConfig from "@tempel/vitest";

export default tempelVitestConfig({
  environment: "jsdom",
  setupFiles: ["./test/setup.ts"],
  coverage: {
    reporter: ["text", "html", "lcov"],
    exclude: ["src/mocks/**/*"],
  },
});
```

Use `@tempel/tsconfig/vitest.json` when TypeScript tests need Vitest globals in the type environment.
