# ESLint

`@tempel/eslint` is a modular ESLint flat configuration for JavaScript and TypeScript projects.

## What it covers

- JavaScript and TypeScript, including JSX and TSX
- JSON, JSONC, JSON5, and `tsconfig*.json`
- YAML and TOML
- Markdown code blocks
- Text files and end-of-line rules
- Vitest test files

The defaults also enforce Node.js `node:` protocol imports, ordered imports, practical TypeScript rules, and Prettier compatibility.

## Basic usage

```js
import tempelEslintConfig from "@tempel/eslint";

export default tempelEslintConfig;
```

## Factory usage

Use `createEslintConfig` when features need to be enabled selectively:

```js
import { createEslintConfig } from "@tempel/eslint";

export default createEslintConfig({
  enableTypeScript: true,
  enablePrettier: true,
  enableVitest: true,
  enableYaml: false,
  ignores: ["dist/**", "coverage/**"],
});
```

The factory also accepts custom `rules`, `plugins`, and `languageOptions`. Individual rule-set factories are exported for more granular composition.

## Style defaults

The configuration uses two-space indentation, semicolons, single quotes, trailing commas, a 120-character limit, and automatic Prettier integration. Test files receive Vitest globals and test-oriented rules.
