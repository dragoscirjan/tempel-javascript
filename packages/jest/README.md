# @tempel/jest

A portable Jest configuration factory for JavaScript and TypeScript projects.

## Installation

```bash
pnpm add -D @tempel/jest
```

## Usage

Create `jest.config.mjs`:

```js
import defineConfig from "@tempel/jest";

export default defineConfig();
```

The factory returns a standard Jest configuration and accepts all normal Jest options:

```js
import defineConfig from "@tempel/jest";

export default defineConfig({
  testEnvironment: "jsdom",
  collectCoverage: true,
  testMatch: ["src/**/*.{test,spec}.{js,ts,tsx}"],
});
```

## Defaults

- Verbose test reporting
- `src/**/*.spec.js` and `src/**/*.spec.ts`
- `test/**/*.test.js` and `test/**/*.test.ts`
- `test/**/*.e2e.js` and `test/**/*.e2e.ts`
- Coverage path exclusions for dependencies, build output, coverage output, and test utilities

The package is ESM-only for configuration files. Jest itself supports the usual JavaScript and TypeScript project integrations through its standard configuration options.

## License

MIT © Tempel / Dragos Cirjan
