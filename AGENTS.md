# AGENTS.md

This file contains instructions for LLM agents working in this repository. The development workflow, coding standards, tests, commits, and release process are documented in [CONTRIBUTING.md](CONTRIBUTING.md) and apply to both agents and human contributors.

## Repository identity

Tempel is a monorepo of shared JavaScript and TypeScript development configuration. It publishes six `@tempel/*` packages:

- `packages/eslint`
- `packages/prettier`
- `packages/tsconfig`
- `packages/vitest`
- `packages/jest`
- `packages/commitlint`

The repository also contains the reusable `.github/actions/validate` composite action and a VitePress site under `docs/`. There is no `extensions/` module system or global release package in this repository.

## Agent workflow

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing files.
- Use GitHub Issues for task records and the GitHub Wiki for design documents. Use `gh` or the configured GitHub MCP when the user asks to read or change either one.
- Keep feature work off the main checkout. Create a branch and a sibling worktree under `../tempel-javascript--workspaces/`. Replace `/` in the branch name with `--` in the worktree directory name. For example, branch `docs/contributing` uses `../tempel-javascript--workspaces/docs--contributing`.
- For implementation requests, commit the finished change, push the branch, and open a pull request unless the user limits the task to local work.
- Never merge a pull request, publish a package, create a release, or deploy documentation without explicit user approval.
- Do not discard changes that were already present when the task started.

## Code inspection

Use a code indexing tool for code inspection and evaluate whether its results are useful.

1. Run `mise run clean` before indexing because `codeindex_cgc` does not respect `.gitignore`.
2. Index the repository or active worktree with `codeindex_cgc` before relying on graph results.
3. Keep the index updated while changing code.
4. Scope every query with `repo_path`.
5. Check source files directly when the index misses monorepo relationships. Use `codeindex_gitnexus` when commit-based impact analysis is more useful.

If `codeindex_cgc` cannot index a Git worktree, index the main repository at the same commit and verify every changed file directly in the worktree.
