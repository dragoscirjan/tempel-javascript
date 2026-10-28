# Contributing to Tempel

This guide applies to people and coding agents. Agents must also follow [AGENTS.md](AGENTS.md).

Read this document before planning or performing a repository architecture, design, implementation, documentation, configuration, policy, or publication change.

## Contribution workflow

1. Clarify ambiguous requirements and confirm shared understanding.
2. Search open and closed GitHub issues. Create or link an issue before changing the repository.
3. Keep each change focused on one issue or task.
4. Follow the isolated-workspace gate and configuration in `AGENTS.md` before changing repository state.
5. Update documentation when behavior, policy, defaults, or usage changes.
6. Read and follow [VALIDATION.md](VALIDATION.md) before validating, committing, pushing, or publishing.
7. Commit with Conventional Commits and the issue number in the scope.
8. Push the branch and open a pull request linked to the issue unless the owner requested local-only work.

Do not merge, publish, release, or deploy without explicit owner instruction.

## Branches and workspaces

Create branches from `main`. Use a short prefix such as `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, or `chore/`, followed by a concise final component.

Agents must use a sibling isolated workspace created through `.agents/skills/isolated-workspace/SKILL.md`. Do not duplicate or replace the skill's workspace commands in project policy.

## Set up the repository

Mise installs the required tool versions and runs project tasks. Pnpm is the only supported package manager.

```sh
mise trust
mise run deps:sync
```

The current toolchain uses Node.js 22, pnpm 10, and Python 3.12. Run `mise tasks` for the complete task list. Use `mise run <task>` when a task exists. Direct pnpm commands are appropriate for dependency changes that have no mise task.

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
| `.github/actions/release`  | Reusable release action and bundled output         |
| `.github/workflows`        | Continuous integration, action tests, and releases |
| `docs`                     | VitePress user documentation                       |
| `.changeset`               | Changesets settings and pending release notes      |
| `mise.toml`                | Tool versions and project tasks                    |

## Inspect code

Use a code index when a task requires code inspection. Run `mise run clean` before indexing because `codeindex_cgc` reads ignored build output. Index the active repository or worktree, keep the index current while editing, and set `repo_path` on every query.

The index can miss relationships in this monorepo. Check source files before relying on graph results. `codeindex_gitnexus` is usually a better fit for commit-based impact analysis.

Some `codeindex_cgc` versions cannot index Git worktrees. In that case, index the primary checkout at the same commit and verify every changed file in the worktree itself.

Use `gh` or the configured GitHub MCP for GitHub Issues and Wiki content instead of guessing from local files.

## Make a change

Match the package you edit. ESLint, Prettier, and Commitlint use JavaScript modules. Vitest and Jest compile TypeScript. The TSConfig package generates JSON presets from `packages/tsconfig/build.js`.

Use the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) for TypeScript. Comments should explain a constraint or decision that code cannot show. If a comment must explain a whole block, simplify the block.

Published packages stay under the `@tempel` scope and declare the MIT license in `package.json`. Each package needs a README with installation steps, exports, defaults, and examples. Keep the `files` list limited to published content, and define `exports` for packages with module entry points.

Do not edit generated files in `packages/tsconfig` by hand. Change `build.js`, then run `mise run build`. Do not commit output from `dist/`, `.jscpd/`, `docs/.vitepress/dist/`, or `docs/.vitepress/cache/`.

When changing `.github/actions/release/src/`, run `pnpm run build:release-action` and commit the updated `.github/actions/release/dist/` bundle with its source.

## Add tests

Put tests in the package that owns the behavior and follow the established pattern. For new TypeScript tests, use `.spec.ts` for focused unit tests and `.test.ts` for package-level or integration behavior.

Integration tests must work in a temporary directory. They must not write fixtures or generated files into the repository checkout or another worktree.

Common tasks:

| Command                    | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `mise run build`           | Build packages and generated presets              |
| `mise run test`            | Run every package test suite                      |
| `mise run lint:check`      | Check lint rules without changing files           |
| `mise run lint`            | Apply supported lint fixes                        |
| `mise run format:check`    | Check formatting                                  |
| `mise run format`          | Format supported repository files                 |
| `mise run duplicate-check` | Check package source for duplicated code          |
| `mise run audit`           | Audit dependencies at moderate severity           |
| `mise run docs`            | Build the VitePress site                          |
| `mise run docs:dev`        | Serve documentation locally                       |
| `mise run clean`           | Remove generated package and documentation output |
| `mise run validate`        | Run the complete local validation pipeline        |

## Write documentation

The VitePress site is for Tempel users. Put installation, configuration, defaults, and other observable behavior in `docs/`. Keep repository setup and contributor instructions in this file.

When a package API or default changes, update that package's README and the relevant VitePress page. Keep the root `README.md` short and point readers to user guides and this file.

Run `mise run docs` after changing `docs/` or `docs/.vitepress/`.

## Add a Changeset

A user-visible package change needs a Changeset:

```sh
mise run changeset
```

Select every affected `@tempel/*` package and the correct semantic version level. Commit the new file under `.changeset/` with the code change.

Documentation-only work, tests, continuous integration, agent instructions, and internal tooling usually do not need a Changeset. Never edit a package's `version` field by hand.

The `mise run release:global` task is intentionally disabled because packages are versioned independently. Maintainers normally let the Changesets workflow on `main` handle versions and publication.

## Commit and open a pull request

Use Conventional Commits and put the GitHub issue number in the scope:

```text
docs(#80): add the contributor guide
fix(#81): preserve custom coverage exclusions
feat(#82): add a shared test preset
```

Keep each commit focused. Include a generated tracked file only when its source changed in the same commit.

Open a pull request against `main`. Fill in `.github/PULL_REQUEST_TEMPLATE.md` with a plain description, the linked issue, reviewer notes where useful, and the commands run. Use `Closes #<id>` when the pull request should close the issue.

Wait for checks and review. An agent may merge only after the owner gives explicit approval.
