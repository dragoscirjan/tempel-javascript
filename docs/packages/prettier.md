# Prettier

`@tempel/prettier` provides one formatting policy for JavaScript, TypeScript, JSON, Markdown, YAML, and TOML.

## Basic usage

In `package.json`:

```json
{
  "prettier": "@tempel/prettier"
}
```

Or in a configuration file:

```js
import tempelPrettierConfig from "@tempel/prettier";

export default tempelPrettierConfig;
```

The package also exports a CommonJS configuration from `index.cjs`.

## Defaults

- 120-character print width
- Two-space indentation
- Semicolons
- Single quotes for code
- Trailing commas everywhere possible
- Bracket spacing
- TypeScript parser by default
- Import sorting through `prettier-plugin-import-sort`

JSON uses double quotes. Markdown preserves prose wrapping. TOML is supported through `prettier-plugin-toml` without automatic alignment.

Run `prettier --write .` to format or `prettier --check .` in CI.
