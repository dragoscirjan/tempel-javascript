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
2. The release action checks Changesets state, creates a GitHub App token when the repository credentials are configured, and opens or updates a version pull request when changes are pending.
3. The action runs `changeset version`, updates `pnpm-lock.yaml`, and runs `format:packages` before Changesets commits that pull request.
4. A pull request created by the App starts CI normally. When App credentials are absent, the job uses the default GitHub token and explicitly dispatches CI for the version branch.
5. Merging the version pull request starts the pipeline again.
6. The action runs the build hook, publishes changed packages, pushes Changesets tags, and creates GitHub releases.

The release job is serialized so two `main` runs cannot publish concurrently. No package version should be edited manually. The private root package is not published.

Publishing is not atomic. If one registry request fails after another package is published, fix the cause and rerun the workflow. Changesets skips package versions that already exist in the registry.

## Local commands

```bash
mise run version:modules   # Version packages, update the lockfile, and format manifests
mise run release:modules   # Build and publish changed packages
```

These tasks call the same bundled release CLI as GitHub Actions and read `.github/tempel-release.yml`. Run `mise run build` after changing the release action source so its committed bundle stays current.

Publishing requires `NODE_AUTH_TOKEN` to be configured for npm. Use the automated workflow for normal releases. Do not publish from a feature branch.

## Reusing the action

The release action also supports other Node.js repositories, including workspace monorepos. The caller provides the checkout, Node.js and package-manager setup, installed dependencies, GitHub permissions, and npm authentication. GitHub authentication can use the default token, an explicit token, a pre-generated App installation token, or a GitHub App client ID and private key. An optional versioned JSON or YAML file selects the project path and policy without exposing shell-command inputs.

See the [continuous integration guide](ci.md) for the repository integration and the [action reference](https://github.com/dragoscirjan/tempel-javascript/blob/main/.github/actions/release/README.md) for its complete input, output, configuration, and authentication contract.
