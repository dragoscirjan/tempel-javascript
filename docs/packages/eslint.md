# ESLint

`@tempel/eslint` exports an ESLint flat configuration for JavaScript, TypeScript, and common project files.

## File coverage

- JavaScript: `.js`, `.mjs`, `.cjs`, and `.jsx`
- TypeScript: `.ts`, `.mts`, `.cts`, and `.tsx`
- JSON, JSONC, JSON5, and `tsconfig*.json`
- YAML and TOML
- JavaScript code blocks processed from Markdown
- Text files and end-of-line checks
- Vitest files ending in `.e2e`, `.test`, or `.spec` with JavaScript or TypeScript module extensions

JSX and TSX receive the normal language rules. The Vitest override does not match `.jsx` or `.tsx` test files, so those files do not receive Vitest globals or recommended rules from this package.

## Basic usage

The default export is the result of `createEslintConfig()`:

```js
import tempelEslintConfig from "@tempel/eslint";

export default tempelEslintConfig;
```

## Factory usage

Use `createEslintConfig` to disable rule sets or provide overrides:

```js
import { createEslintConfig } from "@tempel/eslint";

export default createEslintConfig({
  enableTypeScript: true,
  enablePrettier: true,
  enableVitest: true,
  enableYaml: false,
  ignores: ["dist/**", "coverage/**"],
  rules: {
    typescript: {
      "no-console": "warn",
    },
    json: {
      "no-irregular-whitespace": "off",
    },
  },
});
```

Every feature switch defaults to `true`:

| Option             | Rule set                                                    |
| ------------------ | ----------------------------------------------------------- |
| `enableTypeScript` | TypeScript. JavaScript stays enabled when this is `false`.  |
| `enablePrettier`   | Prettier compatibility and formatting rules                 |
| `enableYaml`       | YAML                                                        |
| `enableToml`       | TOML                                                        |
| `enableJson`       | JSON, JSONC, JSON5, and `tsconfig*.json`                    |
| `enableMarkdown`   | Markdown processor and JavaScript code-block rules          |
| `enableText`       | Text and end-of-line rules                                  |
| `enableVitest`     | Vitest globals and recommended rules for matched test files |

The default ignore patterns are `**/venv/**/*.*`, `**/vitest.config.js`, `tmp.*`, `**/tmp`, and `*.tmp`. Passing `ignores` replaces this list. Passing `ignores: []` removes the global ignore entry.

A flat `rules` object applies to the JavaScript and TypeScript factory. For rule-set-specific changes, use `rules.typescript`, `rules.prettier`, `rules.yaml`, `rules.toml`, `rules.json`, `rules.markdown`, or `rules.text`. The factory also passes custom `plugins` and `languageOptions` to each enabled rule-set factory.

## Individual factories

The package exports these factories for manual composition:

- `createJsAndTsConfig`
- `createPrettierConfig`
- `createYamlConfig`
- `createTomlConfig`
- `createJsonConfig`
- `createMarkdownConfig`
- `createTextConfig`

Each returns an array of ESLint flat configuration objects.

## Style defaults

For JavaScript and TypeScript, the configuration uses two-space indentation, semicolons, single quotes, trailing commas, bracket spacing, and a 120-character line limit. It also enforces `node:` imports and ordered imports. The Prettier rule reports formatting differences through ESLint.
