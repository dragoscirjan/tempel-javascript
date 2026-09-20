# Continuous integration

The repository includes composite GitHub Actions for project validation and Changesets releases. Callers install their own runtimes and dependencies before either action runs.

## Repository workflows

Five workflows run for pull requests and pushes to `main`:

| Workflow                         | What it does                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                               | Builds the packages, runs the validate action, and builds the documentation. On a push to `main`, its release job opens or updates a Changesets pull request or publishes changed packages. |
| Test validate action             | Checks the shell scripts with Bash and ShellCheck, then runs the shell test suite on Ubuntu and macOS.                                                                                      |
| Test validate action integration | Runs the composite action against a temporary package-script fixture and checks success, fail-fast, Node.js, and duplicate-warning behavior.                                                |
| Test release action              | Builds the committed release bundle and tests configuration, command order, authentication checks, and failures on Ubuntu and macOS.                                                        |
| Test release action integration  | Runs the composite release action against an isolated private fixture, asserts `none` mode, and checks output propagation.                                                                  |

The CI workflow configures the action like this:

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

The release job uses the repository's release action after validation succeeds:

```yaml
- id: release
  uses: ./.github/actions/release
  with:
    config: .github/tempel-release.yml
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

It has serialized concurrency and runs only for pushes to `main`. The caller configures full Git history, Node.js, pnpm, dependencies, npm registry access, and write permissions before this step. When a version pull request is created with the default GitHub token, the release job dispatches CI for its head branch because GitHub suppresses ordinary pull-request events created by that token.

## The release action

`.github/actions/release` uses Changesets Action v2 to choose one of three modes:

- `none` when no version or publication work is pending;
- `version` when pending Changesets should create or update a version pull request;
- `publish` when changed package versions should be published.

The action expects `@changesets/cli` version 3 and a Node.js version supported by that CLI. Yarn callers must use the `node-modules` linker. It exposes the selected mode, version pull request number, publication state, and published package list as outputs. It also writes a bounded job summary.

A single optional JSON or YAML file configures the project path, package manager, executor, named package-script hooks, lockfile update, pull request metadata, tags, and GitHub releases. Unknown keys fail validation. Configuration and project paths cannot escape the checked-out workspace. Hooks are script names, not shell commands.

The caller remains responsible for checkout, runtime and package-manager setup, dependency installation, permissions, protected environments, and npm authentication. The action has no npm token input and requires `NODE_AUTH_TOKEN` for publication; trusted publishing is not supported in the first release. See the [complete release action reference](https://github.com/dragoscirjan/tempel-javascript/blob/main/.github/actions/release/README.md) and the [release guide](releases.md).

## The validate action

`.github/actions/validate` runs checks in this order:

1. Format
2. Lint
3. Duplicate check
4. Test
5. Audit

The action does not install the executor or project dependencies. Set them up before the validation step.

### Usage in this repository

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

### Usage from another repository

Pin external use to a full commit SHA or a release tag. Replace `<commit-sha>` in this example:

```yaml
- uses: dragoscirjan/tempel-javascript/.github/actions/validate@<commit-sha>
  with:
    executor: pnpm
```

### Inputs

| Input                           | Default           | Description                                                                                                |
| ------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `executor`                      | `npm`             | Task executor. Supported values are `npm`, `pnpm`, `yarn`, `node`, `bun`, `deno`, and `nub`.               |
| `use-mise`                      | `false`           | Run the selected executor through `mise exec`.                                                             |
| `path`                          | `.`               | Relative or absolute directory that contains the scripts. The action runs every check from this directory. |
| `run-format`                    | `true`            | Run the format script.                                                                                     |
| `script-format`                 | `format`          | Name of the format script.                                                                                 |
| `run-lint`                      | `true`            | Run the lint script.                                                                                       |
| `script-lint`                   | `lint`            | Name of the lint script.                                                                                   |
| `run-duplicate-check`           | `true`            | Run the duplicate-check script.                                                                            |
| `script-duplicate-check`        | `duplicate-check` | Name of the duplicate-check script.                                                                        |
| `ignore-duplicate-check-result` | `false`           | Report a duplicate-check failure as a warning and continue.                                                |
| `run-test`                      | `true`            | Run the test script.                                                                                       |
| `script-test`                   | `test`            | Name of the test script.                                                                                   |
| `run-audit`                     | `true`            | Run the audit script.                                                                                      |
| `script-audit`                  | `audit`           | Name of the audit script.                                                                                  |
| `audit-level`                   | `moderate`        | Minimum audit severity. Accepted values are `info`, `low`, `moderate`, `high`, and `critical`.             |

### Command construction

The action uses these command forms:

| Executor                  | Command prefix            |
| ------------------------- | ------------------------- |
| npm, pnpm, Yarn, Bun, Nub | `<executor> run <script>` |
| Node.js                   | `node --run <script>`     |
| Deno                      | `deno task <script>`      |

The Node.js executor requires Node.js 22 or newer because it uses `node --run`.

The audit check receives `--audit-level=<level>`. npm, pnpm, Node.js, and Nub receive `--` before that argument. Yarn, Bun, and Deno receive the argument directly. The configured audit script must accept it.

### Validation and failures

The seven boolean inputs accept only `true` or `false`, without regard to letter case. The action rejects unsupported executors, unsupported audit levels, an empty or inaccessible `path`, and an empty script name for an enabled check.

A required check failure stops validation and preserves the command's exit status. Later checks appear as `Not run`. A disabled check appears as `Skipped`. `ignore-duplicate-check-result: true` is the only setting that changes a failed check to `Warning` and continues with the remaining checks.

Without mise mode, the action checks that the selected executor is on `PATH` before it runs a check. With `use-mise: true`, it checks for mise and lets `mise exec` resolve the executor.

### Job summary

When `GITHUB_STEP_SUMMARY` is available, the action appends a table with the result of every check and an overall result. The action declares no outputs; the job summary is its report. A summary-write error produces a workflow warning without replacing the validation result.

### Mise integration

Set `use-mise` to `true` when mise manages the selected executor. The action prefixes every command with `mise exec --`:

```yaml
- uses: ./.github/actions/validate
  with:
    executor: pnpm
    use-mise: true
    script-format: format:check
    script-lint: lint:check
```

Install mise with [`jdx/mise-action`](https://github.com/jdx/mise-action) before the validation step.

This repository keeps its tasks in `mise.toml`. The thin `package.json` scripts for `format:check`, `lint:check`, `duplicate-check`, and `audit` delegate to the matching mise tasks so the action can call them through pnpm.
