# Validate action

This composite GitHub Action runs a project's format, lint, duplicate-check, test, and audit scripts. Each check can be disabled or mapped to a different `package.json` script.

The action supports npm, pnpm, Yarn, Node.js, Bun, Deno, and Nub. The Node.js runner requires Node.js 22 or newer. The action does not install the selected executor or project dependencies.

## Usage

Check out the repository and install its dependencies before running the action.

```yaml
name: Validate

on:
  pull_request: {}
  push:
    branches: [main]

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
          ignore-duplicate-check-result: true
          audit-level: high
```

Set `use-mise` when mise manages the selected executor. The action then prefixes every command with `mise exec --`.

```yaml
- uses: ./.github/actions/validate
  with:
    executor: pnpm
    use-mise: true
    script-format: format:check
    script-lint: lint:check
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `executor` | `npm` | Runs scripts with `npm`, `pnpm`, `yarn`, `node`, `bun`, `deno`, or `nub`. |
| `use-mise` | `false` | Wraps every executor command with `mise exec --`. |
| `path` | `.` | Directory that contains the package scripts. Accepts relative or absolute paths. |
| `run-format` | `true` | Runs the format script. |
| `script-format` | `format` | Format script name. |
| `run-lint` | `true` | Runs the lint script. |
| `script-lint` | `lint` | Lint script name. |
| `run-duplicate-check` | `true` | Runs the duplicate-check script. |
| `script-duplicate-check` | `duplicate-check` | Duplicate-check script name. |
| `ignore-duplicate-check-result` | `false` | Emits a warning instead of failing when duplicate-check exits nonzero. |
| `run-test` | `true` | Runs the test script. |
| `script-test` | `test` | Test script name. |
| `run-audit` | `true` | Runs the audit script. |
| `script-audit` | `audit` | Audit script name. |
| `audit-level` | `moderate` | Minimum severity: `info`, `low`, `moderate`, `high`, or `critical`. |

The action invokes npm, pnpm, Yarn, Bun, and Nub scripts as `<executor> run <script>`. Node.js uses `node --run <script>`. Deno uses `deno task <script>`. With `use-mise: true`, the complete command becomes `mise exec -- <executor command>`.

Set `path` when another checkout step places the project in a subdirectory:

```yaml
- uses: actions/checkout@v4
  with:
    path: project
- uses: dragoscops/npm/actions/validate@v1
  with:
    executor: pnpm
    path: project
```

The audit check appends `--audit-level=<level>` to the configured audit script. The script must accept that option. For example:

```json
{
  "scripts": {
    "audit": "pnpm audit"
  }
}
```

## Job summary

The action writes a table to the GitHub job summary. Passed, failed, skipped, warning, and not-run states appear separately. Validation stops at the first required failure, so checks after that failure appear as `Not run`.

| Check | Result |
| --- | --- |
| Format | Passed |
| Lint | Failed |
| Duplicate check | Not run |
| Test | Not run |
| Audit | Not run |

**Overall: Failed**

Use the `run-*` inputs to skip checks that a project does not define:

```yaml
- uses: dragoscops/npm/actions/validate@v1
  with:
    run-format: false
    run-duplicate-check: false
    run-audit: false
```
