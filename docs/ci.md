# Continuous integration

The repository includes a reusable composite GitHub Action for project validation. It runs format, lint, duplicate-check, test, and audit scripts with a selected task executor.

## Repository workflows

Three workflows run for pull requests and pushes to `main`:

| Workflow                         | What it does                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                               | Builds the packages, runs the validate action, and builds the documentation. On a push to `main`, its release job opens or updates a Changesets pull request or publishes changed packages. |
| Test validate action             | Checks the shell scripts with Bash and ShellCheck, then runs the shell test suite on Ubuntu and macOS.                                                                                      |
| Test validate action integration | Runs the composite action against a temporary package-script fixture and checks success, fail-fast, Node.js, and duplicate-warning behavior.                                                |

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
