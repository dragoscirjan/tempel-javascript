# Commitlint

`@tempel/commitlint` provides a small configuration factory based on `@commitlint/config-conventional`.

## Basic usage

```js
import tempelCommitlintConfig from "@tempel/commitlint";

export default tempelCommitlintConfig();
```

The factory accepts Commitlint options and merges them over the Conventional Commits preset:

```js
export default tempelCommitlintConfig({
  rules: {
    "header-max-length": [2, "always", 72],
  },
});
```

The package supports ESM and CommonJS consumers. Pair it with a Husky `commit-msg` hook to validate every commit before it is created.

## GitHub issue IDs

The root project enables `requireIssueId: true`, so commit messages must contain a GitHub issue reference:

```text
feat: add Jest support (#51)
fix(eslint): replace deprecated plugin (#50)
```

The reusable factory leaves this option disabled by default. Enable it in another project with:

```js
export default commitlintConfig({
  requireIssueId: true,
});
```

The rule is intentionally strict for now. Supporting richer issue formats and making the policy configurable per repository is a future TODO.
