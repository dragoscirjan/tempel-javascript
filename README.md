# Tempel JavaScript Development Toolkit

Portable, opinionated configurations for JavaScript and TypeScript projects.

Tempel provides a shared baseline for linting, formatting, TypeScript compilation, testing, and commit-message validation. Each configuration is published independently and can be adopted on its own or as a complete development toolkit.

## Packages

- [`@tempel/eslint`](packages/eslint) — ESLint flat config for code and common configuration formats.
- [`@tempel/prettier`](packages/prettier) — Prettier config with import sorting.
- [`@tempel/tsconfig`](packages/tsconfig) — Browser, Node.js, ESM, CommonJS, and Vitest presets.
- [`@tempel/vitest`](packages/vitest) — Vitest configuration factory.
- [`@tempel/jest`](packages/jest) — Jest configuration factory.
- [`@tempel/commitlint`](packages/commitlint) — Conventional Commits configuration factory.

## Documentation

The complete user documentation is published as a VitePress site:

- Run `mise run docs:dev` to serve it locally.
- Run `mise run docs` to build it.
- Open the [documentation source](docs/) to browse the guides.

Start with the [getting started guide](docs/getting-started.md) or the [package reference](docs/packages/index.md).

## Development

This repository uses Mise and pnpm:

```bash
mise run deps:sync
mise run validate
```

Useful commands include `mise run build`, `mise run test`, `mise run lint`, `mise run format`, and `mise run docs:preview`. Package releases use Changesets; run `mise run changeset` when preparing a package change and see the [release guide](docs/releases.md).

## License

MIT © Tempel / Dragos Cirjan
