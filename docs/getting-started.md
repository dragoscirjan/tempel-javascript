# Getting started

## Install the toolkit

Install the packages you need as development dependencies:

```bash
pnpm add -D @tempel/eslint @tempel/prettier @tempel/tsconfig @tempel/vitest @tempel/jest @tempel/commitlint husky
```

Every package is independent; installing the complete set is optional.

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

Or load it from `prettier.config.mjs`:

```js
import tempelPrettierConfig from "@tempel/prettier";

export default tempelPrettierConfig;
```

## Configure TypeScript

Extend the preset matching your runtime:

```json
{
  "extends": "@tempel/tsconfig/esm.json",
  "include": ["src/**/*.ts"]
}
```

Available presets are `base.json`, `browser.json`, `cjs.json`, `esm.json`, and `vitest.json`.

## Configure Vitest

Create `vitest.config.js`:

```js
import tempelVitestConfig from "@tempel/vitest";

export default tempelVitestConfig();
```

The defaults discover `*.spec.js`, `*.test.js`, `*.e2e.js` and their TypeScript equivalents.

## Configure Jest

Create `jest.config.mjs`:

```js
import defineConfig from "@tempel/jest";

export default defineConfig();
```

Jest uses the same `src`, `test`, and E2E naming conventions as the shared Vitest defaults.

## Configure commit messages

Create `commitlint.config.mjs`:

```js
import commitlintConfig from "@tempel/commitlint";

export default commitlintConfig();
```

Use Husky to run Commitlint from a `commit-msg` hook.

## Common commands

From this repository, Mise provides the standard workflow:

```bash
mise run deps:sync   # install tools and dependencies
mise run build       # build generated and compiled outputs
mise run test        # run package tests
mise run lint        # lint and fix
mise run format      # format supported files
mise run validate    # run the local validation pipeline
mise run docs:dev    # serve this documentation locally
```
