# Contributing to Tempel

This guide is for people and coding agents. Agents also need to follow [AGENTS.md](AGENTS.md).

## Before you start

Look through the open and closed GitHub issues before starting a change. Create an issue if none covers the work. The repository's Commitlint rules require that issue number in every commit message.

Create a branch from `main`. Use a short prefix such as `feat/`, `fix/`, `docs/`, or `chore/`.

A worktree is useful when you have more than one task in progress. Agents are required to use one. Keep worktrees in the sibling `../tempel-javascript--workspaces/` directory and replace `/` in the branch name with `--` in the directory name:

```bash
git worktree add \
  -b docs/contributing \
  ../tempel-javascript--workspaces/docs--contributing \
  main
```

## Set up the repository

Mise installs the required tool versions and runs the project tasks. Pnpm is the only supported package manager.

```bash
mise trust
mise run deps:sync
```

The current toolchain uses Node.js 22, pnpm 10, and Python 3.12. Run `mise tasks` for the complete task list. Use `mise run <task>` when a task exists. Direct pnpm commands are fine for dependency changes that have no mise task.

## Find your way around

| Path                       | Contents                                           |
| -------------------------- | -------------------------------------------------- |
| `packages/eslint`          | ESLint flat configuration and rule factories       |
| `packages/prettier`        | Prettier configuration                             |
| `packages/tsconfig`        | TypeScript preset generator and generated presets  |
| `packages/vitest`          | Vitest configuration factory                       |
| `packages/jest`            | Jest configuration factory                         |
| `packages/commitlint`      | Commitlint configuration factory                   |
| `.github/actions/validate` | Reusable validation action                         |
| `.github/workflows`        | Continuous integration, action tests, and releases |
| `docs`                     | VitePress user documentation                       |
| `.changeset`               | Changesets settings and pending release notes      |
| `mise.toml`                | Tool versions and project tasks                    |

## Make a change

Match the package you are editing. ESLint, Prettier, and Commitlint use JavaScript modules. Vitest and Jest compile TypeScript. The TSConfig package generates JSON presets from `packages/tsconfig/build.js`.

Use the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) for TypeScript. Comments should explain a constraint or a decision that the code cannot show. If a comment has to explain the whole block, the block probably needs to be simpler.

Published packages stay under the `@tempel` scope and declare the MIT license in `package.json`. Each package needs a README with installation steps, exports, defaults, and examples. Keep the `files` list limited to published content, and define `exports` for packages with module entry points.

Do not edit the generated files in `packages/tsconfig` by hand. Change `build.js`, then run `mise run build`. Do not commit output from `dist/`, `.jscpd/`, `docs/.vitepress/dist/`, or `docs/.vitepress/cache/`.

## Add tests

Put tests in the package that owns the behavior and follow the pattern already used there. For new TypeScript tests, use `.spec.ts` for a focused unit test and `.test.ts` for package-level or integration behavior.

Integration tests must work in a temporary directory. They must not write fixtures or generated files into the repository checkout or another worktree.

These are the tasks used most often:

| Command                    | What it does                                       |
| -------------------------- | -------------------------------------------------- |
| `mise run build`           | Builds packages and generated presets              |
| `mise run test`            | Runs every package test suite                      |
| `mise run lint:check`      | Checks lint rules without changing files           |
| `mise run lint`            | Applies supported lint fixes                       |
| `mise run format:check`    | Checks formatting                                  |
| `mise run format`          | Formats supported repository files                 |
| `mise run duplicate-check` | Checks package source for duplicated code          |
| `mise run audit`           | Audits dependencies at moderate severity           |
| `mise run docs`            | Builds the VitePress site                          |
| `mise run docs:dev`        | Serves the documentation locally                   |
| `mise run clean`           | Removes generated package and documentation output |

Run the full check before pushing:

```bash
mise run validate
```

This task cleans generated output, builds the packages, checks formatting and lint, runs the tests and dependency audit, and builds the documentation.

## Write documentation

The VitePress site is for people who use Tempel. Put installation, configuration, defaults, and other observable behavior in `docs/`. Keep repository setup and contributor instructions here.

When a package API or default changes, update that package's README as well as the relevant VitePress page. Keep the root `README.md` short. It should point readers to the user guides and this file.

Run `mise run docs` after changing `docs/` or `docs/.vitepress/`.

## Add a Changeset

A user-visible package change needs a Changeset:

```bash
mise run changeset
```

Select every affected `@tempel/*` package and the correct semantic version level. Commit the new file under `.changeset/` with the code change.

Documentation-only work, tests, continuous integration, and internal tooling usually do not need a Changeset. Never edit a package's `version` field by hand.

The `mise run release:global` task is intentionally disabled because packages are versioned independently. Maintainers normally let the Changesets workflow on `main` handle versions and publication.

## Commit and open a pull request

Use Conventional Commits and put the GitHub issue ID in the scope:

```text
docs(#80): add the contributor guide
fix(#81): preserve custom coverage exclusions
feat(#82): add a shared test preset
```

The usual types are `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`. Keep a commit focused. Include a generated tracked file only when its source changed in the same commit.

Push the branch and open a pull request against `main`. Fill in `.github/PULL_REQUEST_TEMPLATE.md` with a plain description, the linked issue, reviewer notes where they are useful, and the commands you ran. Use `Closes #<id>` when the pull request should close the issue.

Wait for the checks and a review before merging. An agent may merge only after the user gives explicit approval.
