# Notes for coding agents

Tempel publishes shared configuration for JavaScript and TypeScript projects. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding, testing, commits, and releases. The rules below apply only to LLM agents.

## What is in this repository

Tempel publishes six packages under the `@tempel` scope:

- `packages/eslint`
- `packages/prettier`
- `packages/tsconfig`
- `packages/vitest`
- `packages/jest`
- `packages/commitlint`

The repository also contains the `.github/actions/validate` composite action and the VitePress site in `docs/`. It does not have an `extensions/` system or a global release package.

## Working rules

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing files.
- Use GitHub Issues for task records and the GitHub Wiki for design documents. When the user asks about either one, use `gh` or the configured GitHub MCP instead of guessing from local files.
- Do feature work on a branch and in a sibling worktree, not in the main checkout. Put worktrees under `../tempel-javascript--workspaces/`. Replace `/` in the branch name with `--` for the directory name. The branch `docs/contributing`, for example, belongs in `../tempel-javascript--workspaces/docs--contributing`.
- Unless the user asks for local-only work, finish an implementation by committing it, pushing the branch, and opening a pull request.
- Do not merge, publish packages, create releases, or deploy documentation without the user's explicit approval.
- Preserve changes that were already in the checkout when the task began.

## Inspecting code

Use a code index when a task requires code inspection. Run `mise run clean` before indexing because `codeindex_cgc` reads ignored build output. Index the repository or active worktree, keep the index current while editing, and set `repo_path` on every query.

The index can miss relationships in this monorepo. Check the source before relying on a graph result. `codeindex_gitnexus` is usually a better fit for commit-based impact analysis.

Some `codeindex_cgc` versions cannot index Git worktrees. In that case, index the main checkout at the same commit and verify all changed files in the worktree itself.
