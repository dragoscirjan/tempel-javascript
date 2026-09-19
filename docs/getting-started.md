# Getting started

## Install the packages

Install only the packages your project needs. This command installs the full set:

```bash
pnpm add -D @tempel/eslint @tempel/prettier @tempel/tsconfig @tempel/vitest @tempel/jest @tempel/commitlint @commitlint/cli husky
```

## Configure ESLint

Create `eslint.config.mjs`:

```js
import tempelEslintConfig from "@tempel/eslint";

export default tempelEslintConfig;
```

The default configuration includes JavaScript, TypeScript, Prettier, Vitest, JSON, YAML, TOML, Markdown, and text rules.

## Configure Prettier

Add the shared configuration to `package.json`:

```json
{
  "prettier": "@tempel/prettier"
}
```

You can also load it from `prettier.config.mjs`:

```js
import tempelPrettierConfig from "@tempel/prettier";

export default tempelPrettierConfig;
```

## Configure TypeScript

Extend the preset for the project's runtime:

```json
{
  "extends": "@tempel/tsconfig/esm.json",
  "include": ["src/**/*.ts"]
}
```

The package provides `base.json`, `browser.json`, `cjs.json`, `esm.json`, and `vitest.json`.

## Configure Vitest

Create `vitest.config.js`:

```js
import tempelVitestConfig from "@tempel/vitest";

export default tempelVitestConfig();
```

The default discovery patterns are:

- `src/**/*.spec.js`
- `src/**/*.spec.ts`
- `test/**/*.test.js`
- `test/**/*.test.ts`
- `test/**/*.e2e.js`
- `test/**/*.e2e.ts`

## Configure Jest

Create `jest.config.mjs`:

```js
import defineConfig from "@tempel/jest";

export default defineConfig();
```

Jest uses the same six default locations as Vitest. The factory discovers TypeScript files but does not configure a TypeScript transformer. Add a Jest-compatible transform if the tests contain TypeScript syntax.

## Configure commit messages

Create `commitlint.config.mjs`:

```js
import commitlintConfig from "@tempel/commitlint";

export default commitlintConfig();
```

Initialize Husky and add a `commit-msg` hook:

```bash
pnpm exec husky init
printf '%s\n' 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

The hook now checks each commit message with the exported configuration.

## Run validation in GitHub Actions

Use the [validate action](/ci) to run the project's format, lint, duplicate-check, test, and audit scripts in CI. The action supports npm, pnpm, Yarn, Node.js, Bun, Deno, and Nub.
