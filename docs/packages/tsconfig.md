# TSConfig

`@tempel/tsconfig` contains shareable TypeScript compiler configurations for common runtimes.

## Presets

| Preset         | Use it for                                         |
| -------------- | -------------------------------------------------- |
| `base.json`    | Strict shared foundation                           |
| `browser.json` | Browser applications and libraries using a bundler |
| `cjs.json`     | Node.js CommonJS projects                          |
| `esm.json`     | Node.js ES module projects                         |
| `vitest.json`  | Vitest tests and test utilities                    |

## Usage

```json
{
  "extends": "@tempel/tsconfig/browser.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

The base configuration builds on `@tsconfig/node22`, enables source maps, removes comments from output, checks unused locals and parameters, and enforces consistent filename casing.

The package generates its JSON presets from `build.js`. Project configurations should extend a preset rather than modify the package files.
