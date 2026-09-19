# Commitlint

`@tempel/commitlint` exports a configuration factory based on `@commitlint/config-conventional`.

## Basic usage

```js
import tempelCommitlintConfig from "@tempel/commitlint";

export default tempelCommitlintConfig();
```

The factory accepts Commitlint configuration and merges custom rules over the conventional preset:

```js
export default tempelCommitlintConfig({
  rules: {
    "header-max-length": [2, "always", 72],
  },
});
```

The package supports ESM and CommonJS consumers through conditional exports.

## Commit hook

Install `@commitlint/cli` and Husky, then add a `commit-msg` hook:

```bash
pnpm exec husky init
printf '%s\n' 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

## GitHub issue IDs

The Tempel repository calls the factory with `requireIssueId: true`. A commit header must use a `#` followed by digits as its scope:

```text
feat(#51): add Jest support
fix(#50): replace deprecated plugin
```

The reusable factory leaves this option disabled by default. Enable it in another project with:

```js
export default tempelCommitlintConfig({
  requireIssueId: true,
});
```

This option configures `#` as the issue prefix, requires a parsed reference, and adds a rule that accepts only scopes matching `^#\d+$`. These two required rules take precedence over custom values supplied for the same rule names.
