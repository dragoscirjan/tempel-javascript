# @tempel/commitlint

A zero-configuration commitlint setup that extends `@commitlint/config-conventional` with a flexible configuration factory. This package provides an easy way to enforce [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in your JavaScript and TypeScript projects.

## Features

- **Zero Configuration**: Works out of the box with sensible defaults
- **Flexible Factory**: Configuration function accepts custom options
- **Conventional Commits**: Built on `@commitlint/config-conventional`
- **Dual Module Support**: ESM and CommonJS compatible

## Installation

```bash
npm install --save-dev @tempel/commitlint
```

## Usage

### Basic Usage

```javascript
// commitlint.config.mjs
import commitlintConfig from "@tempel/commitlint";

export default commitlintConfig();
```

### With Custom Options

```javascript
// commitlint.config.mjs
import commitlintConfig from "@tempel/commitlint";

export default commitlintConfig({
  rules: {
    "header-max-length": [2, "always", 72],
  },
  ignores: [(commit) => commit.includes("[skip ci]")],
});
```

### CommonJS

```javascript
// commitlint.config.cjs
const commitlintConfig = require("@tempel/commitlint");

module.exports = commitlintConfig();
```

## Configuration

The configuration factory merges your options with the base `@commitlint/config-conventional` configuration. Pass `requireIssueId: true` to require a GitHub issue reference in the commit header:

```javascript
export default commitlintConfig({
  requireIssueId: true,
});
```

This accepts headers such as `feat(#51): add Jest support` and rejects headers without a `#123` issue scope. The option defaults to `false` in the reusable factory.

For detailed rule configuration and usage, see the [commitlint documentation](https://commitlint.js.org/).

## Git Hooks Setup

Install with Husky for automatic commit message validation:

```bash
npm install --save-dev husky
mise exec -- pnpm --filter ./packages/commitlint exec -- commitlint --config "$PWD/commitlint.config.mjs" --edit "$1"
chmod +x .husky/commit-msg
```

## Testing

The package includes comprehensive tests validating configuration factory behavior:

```bash
mise run test
```

## Documentation

- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Commitlint Rules Reference](https://commitlint.js.org/#/reference-rules)

## License

MIT © Dragos Cirjan
