# TSConfig

`@tempel/tsconfig` publishes five TypeScript configuration files.

## Presets

| Preset         | Extends                          | Runtime settings                                         |
| -------------- | -------------------------------- | -------------------------------------------------------- |
| `base.json`    | `@tsconfig/node22/tsconfig.json` | Shared source, output, and strictness defaults           |
| `browser.json` | `base.json`                      | ES2020 target and modules with bundler module resolution |
| `cjs.json`     | `base.json`                      | Node16 modules and Node16 module resolution              |
| `esm.json`     | `base.json`                      | ESNext modules with Node module resolution               |
| `vitest.json`  | `cjs.json`                       | Node and `vitest/globals` types                          |

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

## Base defaults

The base preset uses `${configDir}` so paths resolve from the consuming configuration:

- `include` contains only `${configDir}/src/**/*.ts`.
- `exclude` is empty.
- `rootDir` is `${configDir}/src`.
- `outDir` is `${configDir}/dist`.
- `types` contains `node`.
- Declaration output and declaration maps are disabled.
- Source maps are enabled.
- Comments are removed from emitted files.
- Unused locals and parameters are errors.
- Filename casing must be consistent.
- `verbatimModuleSyntax` is disabled.

The default `include` does not select JSX or TSX files. Override `include`, `rootDir`, `outDir`, or any compiler option in the consuming project when its layout differs.
