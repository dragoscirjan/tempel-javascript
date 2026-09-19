# Tempel JavaScript Development Toolkit

Tempel publishes shared configuration for JavaScript and TypeScript projects. The packages cover linting, formatting, TypeScript compilation, testing, and commit-message validation. Install each package separately or use the complete set.

## Packages

| Package                                     | What it configures                                                    |
| ------------------------------------------- | --------------------------------------------------------------------- |
| [`@tempel/eslint`](packages/eslint)         | ESLint flat config for code and common configuration formats          |
| [`@tempel/prettier`](packages/prettier)     | Prettier config for code, data files, Markdown, YAML, and TOML        |
| [`@tempel/tsconfig`](packages/tsconfig)     | Browser, Node.js ESM, Node.js CommonJS, and Vitest TypeScript presets |
| [`@tempel/vitest`](packages/vitest)         | Vitest configuration factory                                          |
| [`@tempel/jest`](packages/jest)             | Jest configuration factory                                            |
| [`@tempel/commitlint`](packages/commitlint) | Conventional Commits configuration factory                            |

## Validation action

The reusable [validate action](docs/ci.md) runs a project's format, lint, duplicate-check, test, and audit scripts with npm, pnpm, Yarn, Node.js, Bun, Deno, or Nub. The action reports each result in the GitHub job summary.

## Documentation

The user documentation is maintained as a VitePress site in [`docs/`](docs/).

- Start with the [getting started guide](docs/getting-started.md).
- Browse the [package reference](docs/packages/index.md).
- Run `mise run docs:dev` to serve the site locally.
- Run `mise run docs` to build it.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, worktree, coding, testing, commit, and pull request workflow. The short setup is:

```bash
mise run deps:sync
mise run validate
```

Package releases use Changesets. See the [release guide](docs/releases.md) for the maintainer workflow.

## License

MIT © Tempel / Dragos Cirjan
