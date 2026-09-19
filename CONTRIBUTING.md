# Contributing to Tempel

This guide applies to human contributors and automated coding agents. Agents must also follow [AGENTS.md](AGENTS.md).

## Before you start

Search the open and closed GitHub issues before starting work. Every commit must reference a GitHub issue because the repository's Commitlint configuration requires an issue ID in the commit scope.

Create a branch from `main`. Use a short category prefix such as `feat/`, `fix/`, `docs/`, or `chore/`.

A Git worktree keeps concurrent tasks separate. Automated agents must use one, and human contributors should use one when they have other work in progress. Store worktrees under the sibling `../tempel-javascript--workspaces/` directory and replace branch-name slashes with `--` in the directory name:

```bash
git worktree add \
  -b docs/contributing \
  ../tempel-javascript--workspaces/docs--contributing \
  main
```

## Install the toolchain

Tempel uses mise to select tools and run repository tasks. pnpm is the only supported package manager.

```bash
mise trust
mise run deps:sync
```

The toolchain currently uses Node.js 22, pnpm 10, and Python 3.12. Run `mise tasks` to see every available task. Prefer `mise run <task>` whenever a task exists. Use direct pnpm commands only for dependency operations that have no mise task.

## Repository layout

| Path                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `packages/eslint`          | ESLint flat configuration and rule-set factories   |
| `packages/prettier`        | Prettier configuration                             |
| `packages/tsconfig`        | Generated TypeScript presets and their generator   |
| `packages/vitest`          | Vitest configuration factory                       |
| `packages/jest`            | Jest configuration factory                         |
| `packages/commitlint`      | Commitlint configuration factory                   |
| `.github/actions/validate` | Reusable validation composite action               |
| `.github/workflows`        | CI, action tests, and package release automation   |
| `docs`                     | VitePress user documentation                       |
| `.changeset`               | Changesets configuration and pending release notes |
| `mise.toml`                | Tool versions and repository tasks                 |

## Change the source

Preserve the source format used by each package. ESLint, Prettier, and Commitlint use JavaScript modules. Vitest and Jest compile TypeScript source. The TSConfig package uses `build.js` to generate its JSON presets.

Follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) for TypeScript changes. Add comments for constraints or decisions that the code does not express on its own. If a block needs a long explanatory comment, simplify the code first.

All published packages must:

- use the `@tempel/` scope;
- declare the MIT license in `package.json`;
- include a package README that documents installation, exports, defaults, and examples;
- expose only files intended for npm consumers through `files` and `exports`.

Do not edit `packages/tsconfig/base.json`, `browser.json`, `cjs.json`, `esm.json`, or `vitest.json` by hand. Change `packages/tsconfig/build.js` and run `mise run build` to regenerate them.

Do not commit build output from `dist/`, `.jscpd/`, `docs/.vitepress/dist/`, or `docs/.vitepress/cache/`.

## Add tests

Keep tests in the package that owns the behavior. Use `.spec.ts` for focused unit tests and `.test.ts` for package or integration behavior when adding new TypeScript tests. Follow the existing package layout when a package uses JavaScript or a dedicated `test/` directory.

Integration tests must use temporary directories. They must not write fixtures or generated files into the repository checkout or another active worktree.

Useful tasks include:

| Command                    | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `mise run build`           | Build packages and generated presets            |
| `mise run test`            | Run all package tests                           |
| `mise run lint:check`      | Check lint rules without modifying files        |
| `mise run lint`            | Apply supported lint fixes                      |
| `mise run format:check`    | Check formatting                                |
| `mise run format`          | Format supported repository files               |
| `mise run duplicate-check` | Check package source for duplicated code        |
| `mise run audit`           | Audit dependencies at moderate severity         |
| `mise run docs`            | Build the VitePress site                        |
| `mise run docs:dev`        | Serve the documentation locally                 |
| `mise run clean`           | Remove generated build and documentation output |

Run the full pipeline before pushing:

```bash
mise run validate
```

`validate` cleans generated output, builds packages, checks formatting and lint, runs tests and the dependency audit, then builds the documentation.

## Write documentation

The VitePress site is user documentation. Explain installation, configuration, defaults, and observable behavior under `docs/`. Do not put contributor setup or repository development instructions there.

Update the relevant package README when a package's public API, installation, or defaults change. Keep the root `README.md` as a short project summary that links to the VitePress guides and this contributor guide.

Build the site with `mise run docs` after changing files under `docs/` or `docs/.vitepress/`.

## Create a Changeset

Use Changesets for user-visible changes to published packages:

```bash
mise run changeset
```

Select every affected `@tempel/*` package and the correct semantic version level. Commit the generated file under `.changeset/` with the implementation.

A Changeset is usually not needed for documentation-only changes, tests, CI maintenance, or repository tooling that does not change a published package. Do not edit package `version` fields manually.

The `mise run release:global` task is reserved and exits with an instruction to use independently versioned package Changesets. Maintainers normally release packages through the automated Changesets workflow on `main`.

## Commit changes

Use Conventional Commits with the GitHub issue ID as the scope:

```text
docs(#80): add the contributor guide
fix(#81): preserve custom coverage exclusions
feat(#82): add a shared test preset
```

Common types are `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`. Keep each commit focused and include generated tracked files only when the source change requires them.

## Open a pull request

Push the branch and open a pull request against `main`. Complete `.github/PULL_REQUEST_TEMPLATE.md` with:

- a description of the change;
- linked issues, using `Closes #<id>` when appropriate;
- reviewer notes for unusual decisions or risks;
- the commands and scenarios used for validation;
- follow-up work that is outside the pull request.

Wait for required checks and review before merging. Automated agents must not merge without explicit user approval.
