# Release action

This composite action creates Changesets version pull requests and publishes changed Node.js packages. It works with a package at the repository root and with workspace monorepos. Changesets remains responsible for package discovery, version groups, dependency bumps, private packages, changelogs, tags, and registry publication.

## Requirements

Before calling the action:

- check out the repository with full Git history;
- install a Node.js release supported by Changesets 3, currently Node.js 22.11 or newer in the 22.x line, Node.js 24, or Node.js 26 and newer;
- install the project's package manager and project dependencies;
- install `@changesets/cli` version 3 in the project;
- grant the job the permissions needed for pull requests, tags, and releases;
- configure npm authentication in the caller workflow.

The action does not install tools or dependencies. It does not read npm credentials from its configuration file.

## Usage

```yaml
jobs:
  release:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    concurrency:
      group: npm-release
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1 # v4
      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - uses: dragoscirjan/tempel-javascript/.github/actions/release@<commit-sha>
        with:
          config: .github/tempel-release.yml
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Pin external use to a reviewed commit SHA or release tag.

## GitHub authentication

Without authentication inputs, the action uses `${{ github.token }}`. That token can create version pull requests, tags, and releases when the job grants `contents: write` and `pull-requests: write`. GitHub does not start new workflow runs for pull requests created with the default token, so the caller must dispatch validation after the action returns `pr-number`.

### Required GitHub permissions

| Credential                         | Repository access required by this action                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Default `${{ github.token }}`      | Job permissions `contents: write` and `pull-requests: write`.                                                                     |
| Fine-grained personal access token | Access to the target repository, Metadata read, Contents read and write, and Pull requests read and write.                        |
| Classic personal access token      | `public_repo` scope for a public repository or `repo` scope when private repository access is required.                           |
| GitHub App installation token      | The App must be installed on the target repository with Metadata read, Contents read and write, and Pull requests read and write. |

The release action itself does not require Actions write permission. Grant Actions read and write to a fine-grained PAT or GitHub App only when the caller also uses that credential to invoke the workflow-dispatch API. A token cannot exceed the repository access of its user or App installation. Organization policies can require approval for fine-grained tokens or SAML SSO authorization for classic tokens.

See GitHub's references for [fine-grained PAT permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), [classic token scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps), and [GitHub App permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps).

For first-class GitHub App authentication, install an App on the current repository with the permissions listed above. Store its client ID in a repository variable and its private key in a repository secret:

```yaml
- uses: dragoscirjan/tempel-javascript/.github/actions/release@<commit-sha>
  with:
    config: .github/tempel-release.yml
    github-app-client-id: ${{ vars.RELEASE_APP_CLIENT_ID }}
    github-app-private-key: ${{ secrets.RELEASE_APP_PRIVATE_KEY }}
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The action uses the pinned official `actions/create-github-app-token` action to create an installation token for the current repository. The token is masked and revoked when the job finishes. Pull requests and pushes created by the App can trigger workflows normally.

Callers may instead pass a pre-generated GitHub App installation token or a personal access token through `github-token`. When complete App credentials are present, their generated token takes precedence over `github-token`. Supplying only one App credential fails during preflight.

## Configuration

The optional `config` input accepts a JSON or YAML file relative to the repository root. Without a file, the action uses the repository root, detects the package manager, runs no hooks, updates npm or pnpm lockfiles, and keeps the Changesets defaults for pull requests and GitHub releases.

```yaml
version: 1
engine: changesets

project:
  path: .
  executor: pnpm
  package_manager: pnpm
  use_mise: false

versioning:
  update_lockfile: true
  after:
    - format:packages

publishing:
  before:
    - build
  create_github_releases: true
  push_git_tags: true

pull_request:
  title: Version Packages
  commit_message: Version Packages
  base_branch: main
  draft: create
```

A supplied file must declare `version: 1` and `engine: changesets`. The parser rejects unknown keys and unsupported schema versions. `project.path` and the configuration file must resolve inside the checked-out workspace.

### Repository layouts

A single-package repository with `package.json`, its lockfile, and `.changeset/config.json` at the root can omit the configuration file:

```yaml
- uses: dragoscirjan/tempel-javascript/.github/actions/release@<commit-sha>
```

For a workspace monorepo, point `project.path` at the directory that owns the workspace manifest and `.changeset/config.json`. Changesets reads npm, pnpm, Yarn, or Bun workspace metadata and decides which public packages and internal dependencies change. The action does not scan `packages/`, `apps/`, or any other hard-coded directory.

```yaml
version: 1
engine: changesets
project:
  path: tools/javascript-project
  executor: pnpm
  package_manager: pnpm
publishing:
  before:
    - build
```

### Project settings

| Field             | Default                          | Description                                                                                    |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `path`            | `.`                              | Directory containing `package.json` and `.changeset/config.json`.                              |
| `executor`        | Detected package manager         | Runs configured package scripts. Accepted values are `npm`, `pnpm`, `yarn`, `bun`, and `node`. |
| `package_manager` | `packageManager` or one lockfile | Selects lockfile handling. Accepted values are `npm`, `pnpm`, `yarn`, and `bun`.               |
| `use_mise`        | `false`                          | Prefixes local commands with `mise exec --`.                                                   |

The action detects the package manager from `package.json#packageManager`, then from one recognized lockfile. It defaults to npm when neither is present and fails when lockfiles disagree. Yarn projects must use `nodeLinker: node-modules`; Yarn Plug'n'Play archives cannot be executed by the bundled action.

### Version settings

`versioning.after` is an ordered list of package script names. The action runs these scripts after `changeset version` and the lockfile update, before Changesets commits the version pull request.

Automatic lockfile updates support npm and pnpm. Set `versioning.update_lockfile` to `false` for Yarn or Bun and perform any required update in a hook script.

### Publish settings

`publishing.before` is an ordered list of package script names. The action runs these scripts before `changeset publish`. Use it for builds or repository checks that must complete before publication.

`create_github_releases` and `push_git_tags` default to `true`. GitHub releases require tags, so the action rejects `create_github_releases: true` with `push_git_tags: false`.

Do not put cleanup or deployment commands after publication. npm publication is irreversible and can succeed for some packages before another package fails.

Project-wide release metadata stays outside the generic action. A repository that publishes a bill-of-materials or global release package can prepare it in a named `publishing.before` script. The action does not assume that such a package exists or inspect project-specific paths.

### Pull request settings

The action supports a title, commit message, base branch, and Changesets draft mode. `draft` accepts `create` or `always`. Changesets generates the pull request body.

## Inputs

| Input                    | Default               | Description                                                                             |
| ------------------------ | --------------------- | --------------------------------------------------------------------------------------- |
| `config`                 | Empty                 | Optional JSON or YAML configuration file.                                               |
| `github-token`           | `${{ github.token }}` | GitHub token, personal access token, or pre-generated App installation token.           |
| `github-app-client-id`   | Empty                 | GitHub App client ID. Must be paired with `github-app-private-key`.                     |
| `github-app-private-key` | Empty                 | GitHub App private key. Must be paired with `github-app-client-id` and passed secretly. |

The action does not accept an npm token input. The first release requires `NODE_AUTH_TOKEN` in the caller environment. npm trusted publishing is not enabled until the action can validate the package-level trusted-publisher setup and npm CLI version.

## Outputs

| Output               | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `mode`               | `none`, `version`, or `publish`.                            |
| `pr-number`          | Version pull request number when mode is `version`.         |
| `published`          | Whether the publish step released a package.                |
| `published-packages` | JSON array containing published package names and versions. |

## Local commands

The bundled CLI provides the same version and publish operations outside GitHub Actions:

```json
{
  "scripts": {
    "version:modules": "node .github/actions/release/dist/index.js version --config .github/tempel-release.yml",
    "release:modules": "node .github/actions/release/dist/index.js publish --config .github/tempel-release.yml"
  }
}
```

The committed bundle contains its YAML parser and third-party license notices. Run the repository's release-action build whenever the TypeScript source changes.

## Limits

- Changesets Action v2 requires `@changesets/cli` version 3.
- Automatic lockfile updates support npm and pnpm in this release.
- Yarn requires the `node-modules` linker; Plug'n'Play is not supported.
- npm trusted publishing through GitHub OIDC is not supported in this release.
- The action does not install project tools or dependencies.
- The action does not replace `.changeset/config.json`.
- Multi-package publication is not atomic. Retry the failed workflow after fixing the registry or package error. Changesets skips versions that are already published.
