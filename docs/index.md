# Tempel JavaScript Development Toolkit

Tempel publishes six configuration packages for JavaScript and TypeScript projects. Each package can be installed on its own.

## Packages

- [`@tempel/eslint`](/packages/eslint) provides an ESLint flat configuration for JavaScript, TypeScript, JSON, JSONC, JSON5, YAML, TOML, Markdown, and text files.
- [`@tempel/prettier`](/packages/prettier) formats code, data files, Markdown, YAML, and TOML.
- [`@tempel/tsconfig`](/packages/tsconfig) provides presets for browser projects, Node.js ESM, Node.js CommonJS, and Vitest.
- [`@tempel/vitest`](/packages/vitest) creates Vitest configuration with shared discovery and coverage defaults.
- [`@tempel/jest`](/packages/jest) creates Jest configuration with matching test locations and coverage exclusions.
- [`@tempel/commitlint`](/packages/commitlint) builds on the Conventional Commits configuration and can require a GitHub issue ID in the commit scope.

## Validation action

The repository also includes a [composite GitHub Action](/ci) that runs format, lint, duplicate-check, test, and audit scripts. Projects can choose the task executor, rename scripts, or skip checks they do not use.

Start with the [getting started guide](/getting-started), then open the [package reference](/packages/) for complete options and defaults.
