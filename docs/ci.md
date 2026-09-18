# Continuous integration

The repository ships its validation pipeline as a reusable composite GitHub Action. Both this repository and any other project can run the same format, lint, duplicate-check, test, and audit checks from a workflow.

## Pipeline

Two workflows guard every push and pull request on `main`:

| Workflow                             | What it does                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **CI**                               | Runs the `Quality` job (build + validation) and the `Release packages` job (Changesets release PR or npm publish). |
| **Test validate action**             | Lints the action sources with ShellCheck and runs its shell test suite on Ubuntu and macOS.                        |
| **Test validate action integration** | Exercises the composite action end to end against a fixture project.                                               |

The `Quality` job runs through the action itself:

```yaml
- uses: ./.github/actions/validate
  with:
    executor: pnpm
    use-mise: true
    script-format: format:check
    script-lint: lint:check
    script-duplicate-check: duplicate-check
    script-test: test
    script-audit: audit
```

## The validate action

`.github/actions/validate` runs a project's format, lint, duplicate-check, test, and audit scripts in order and writes a results table to the job summary. Each check can be disabled or mapped to a different script name. The action does not install the selected executor or the project dependencies — check out the repository and install dependencies first.

### Usage

From a workflow inside this repository:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: ./.github/actions/validate
        with:
          executor: pnpm
          script-format: format:check
          script-lint: lint:check
```

From another repository, reference the action by commit SHA or tag:

```yaml
- uses: dragoscirjan/tempel-javascript/.github/actions/validate@main
  with:
    executor: pnpm
```

### Inputs

| Input                           | Default           | Description                                                                                  |
| ------------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `executor`                      | `npm`             | Task executor. Supported values are `npm`, `pnpm`, `yarn`, `node`, `bun`, `deno`, and `nub`. |
| `use-mise`                      | `false`           | Run the selected executor through `mise exec`.                                               |
| `path`                          | `.`               | Directory that contains the package scripts to run.                                          |
| `run-format`                    | `true`            | Run the format script.                                                                       |
| `script-format`                 | `format`          | Name of the format script.                                                                   |
| `run-lint`                      | `true`            | Run the lint script.                                                                         |
| `script-lint`                   | `lint`            | Name of the lint script.                                                                     |
| `run-duplicate-check`           | `true`            | Run the duplicate-check script.                                                              |
| `script-duplicate-check`        | `duplicate-check` | Name of the duplicate-check script.                                                          |
| `ignore-duplicate-check-result` | `false`           | Report duplicate-check failures as warnings instead of failing the action.                   |
| `run-test`                      | `true`            | Run the test script.                                                                         |
| `script-test`                   | `test`            | Name of the test script.                                                                     |
| `run-audit`                     | `true`            | Run the audit script.                                                                        |
| `script-audit`                  | `audit`           | Name of the audit script.                                                                    |
| `audit-level`                   | `moderate`        | Minimum audit severity. Use `info`, `low`, `moderate`, `high`, or `critical`.                |

### Mise integration

Set `use-mise` to `true` when mise manages the selected executor. The action then prefixes every command with `mise exec --`:

```yaml
- uses: ./.github/actions/validate
  with:
    executor: pnpm
    use-mise: true
    script-format: format:check
    script-lint: lint:check
```

Install mise in the job with [`jdx/mise-action`](https://github.com/jdx/mise-action) before running the action.

This repository keeps mise as the single source of truth for its tasks: `package.json` exposes thin scripts such as `format:check`, `lint:check`, `duplicate-check`, and `audit` that delegate to the matching `mise run <task>` commands, and the action invokes those scripts.
