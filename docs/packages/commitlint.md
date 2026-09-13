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
