# Prettier

`@tempel/prettier` exports an ESM Prettier configuration for code, data files, Markdown, YAML, and TOML.

## Usage

Reference the package from `package.json`:

```json
{
  "prettier": "@tempel/prettier"
}
```

You can also import it from `prettier.config.mjs`:

```js
import tempelPrettierConfig from "@tempel/prettier";

export default tempelPrettierConfig;
```

The package root export points to `index.mjs`. The published export map does not provide a CommonJS entry.

## Defaults

| Setting          | Value          |
| ---------------- | -------------- |
| `printWidth`     | `120`          |
| `tabWidth`       | `2`            |
| `semi`           | `true`         |
| `singleQuote`    | `true`         |
| `trailingComma`  | `"all"`        |
| `bracketSpacing` | `true`         |
| Default parser   | `"typescript"` |

File overrides select these parsers and options:

| Files             | Parser and options                                           |
| ----------------- | ------------------------------------------------------------ |
| `*.json`          | JSON parser and double quotes                                |
| `*.json5`         | JSON5 parser and double quotes                               |
| `*.jsonc`         | JSONC parser and double quotes                               |
| `*.js`            | Babel parser                                                 |
| `*.md`            | Markdown parser, preserved prose wrapping, and double quotes |
| `*.yaml`, `*.yml` | YAML parser and single quotes                                |
| `*.toml`          | TOML parser with comment and entry alignment disabled        |

The configuration loads `prettier-plugin-toml`. It does not load an import-sorting plugin.

Run these commands from a project that has the package installed:

```bash
pnpm exec prettier --write .
pnpm exec prettier --check .
```
