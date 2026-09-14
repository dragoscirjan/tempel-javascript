# Releases

Tempel packages are versioned independently with [Changesets](https://github.com/changesets/changesets) and published to npm from `main` by GitHub Actions.

## For contributors

Describe package changes before opening a pull request:

```bash
mise run changeset
```

Select each affected `@tempel/*` package and choose the appropriate semver level. Commit the generated file under `.changeset/` with the change.

## Automated release flow

1. A merge to `main` runs the full validation pipeline.
2. GitHub Actions opens or updates a release pull request from pending Changesets.
3. Merging that pull request applies package versions and changelogs.
4. The next `main` run builds and publishes changed packages with the repository npm token.

No package version should be edited manually. The private root package is not published.

## Local commands

```bash
mise run version:modules   # Apply pending Changesets locally
mise run release:modules   # Build and publish changed packages
```

Publishing requires `NODE_AUTH_TOKEN` to be configured for npm. Use the automated workflow for normal releases.
