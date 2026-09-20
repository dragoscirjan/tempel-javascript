#!/usr/bin/env bash

# Exercise the bundled release CLI without changing the repository or contacting npm.
set -euo pipefail

action_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${action_root}/../../.." && pwd)"
cli="${action_root}/dist/index.js"
temporary_root="$(mktemp -d)"
trap 'rm -rf "${temporary_root}"' EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_fails() {
  local expected="$1"
  shift
  local output
  if output="$("$@" 2>&1)"; then
    fail "command unexpectedly passed: $*"
  fi
  grep -F -- "${expected}" <<<"${output}" >/dev/null || {
    printf '%s\n' "${output}" >&2
    fail "failure did not contain: ${expected}"
  }
}

create_fixture() {
  local fixture="$1"
  mkdir -p "${fixture}/.changeset" "${fixture}/node_modules/@changesets/cli" "${fixture}/bin"
  cat >"${fixture}/package.json" <<'JSON'
{
  "name": "release-fixture",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "echo build",
    "format:packages": "echo format"
  }
}
JSON
  cat >"${fixture}/.changeset/config.json" <<'JSON'
{
  "access": "public",
  "baseBranch": "main",
  "commit": false,
  "fixed": [],
  "ignore": [],
  "linked": [],
  "privatePackages": {"version": false, "tag": false},
  "updateInternalDependencies": "patch"
}
JSON
  cat >"${fixture}/node_modules/@changesets/cli/package.json" <<'JSON'
{
  "name": "@changesets/cli",
  "version": "3.0.3",
  "bin": {"changeset": "bin.js"}
}
JSON
  cat >"${fixture}/node_modules/@changesets/cli/bin.js" <<'JS'
const fs = require('node:fs');
fs.appendFileSync(process.env.RELEASE_LOG, `changeset ${process.argv.slice(2).join(' ')}\n`);
process.exit(Number(process.env.FAIL_CHANGESET || 0));
JS
  cat >"${fixture}/bin/pnpm" <<'SH'
#!/usr/bin/env bash
printf 'pnpm %s\n' "$*" >>"${RELEASE_LOG}"
exit "${FAIL_PNPM:-0}"
SH
  chmod +x "${fixture}/bin/pnpm"
  touch "${fixture}/pnpm-lock.yaml"
}

# Use the real Changesets CLI to verify one package and a workspace graph.
real_changesets="$(realpath "${repo_root}/node_modules/@changesets/cli")"
single_fixture="${temporary_root}/single-package"
mkdir -p "${single_fixture}/.changeset" "${single_fixture}/node_modules/@changesets"
ln -s "${real_changesets}" "${single_fixture}/node_modules/@changesets/cli"
cat >"${single_fixture}/package.json" <<'JSON'
{"name":"single-package","version":"1.0.0","packageManager":"pnpm@10.0.0"}
JSON
cat >"${single_fixture}/.changeset/config.json" <<'JSON'
{"access":"restricted","baseBranch":"main","commit":false,"fixed":[],"ignore":[],"linked":[],"privatePackages":{"version":false,"tag":false},"updateInternalDependencies":"patch"}
JSON
cat >"${single_fixture}/.changeset/release.md" <<'MD'
---
"single-package": minor
---

Test a single package.
MD
cat >"${single_fixture}/release.yml" <<'YAML'
version: 1
engine: changesets
project:
  package_manager: pnpm
versioning:
  update_lockfile: false
YAML
TEMPEL_RELEASE_WORKSPACE="${single_fixture}" node "${cli}" version --config release.yml >/dev/null
[[ "$(node -p "require('${single_fixture}/package.json').version")" == '1.1.0' ]] || \
  fail 'single-package version was not updated'

workspace_fixture="${temporary_root}/workspace"
mkdir -p "${workspace_fixture}/.changeset" "${workspace_fixture}/node_modules/@changesets" \
  "${workspace_fixture}/packages/a" "${workspace_fixture}/packages/b" "${workspace_fixture}/packages/private"
ln -s "${real_changesets}" "${workspace_fixture}/node_modules/@changesets/cli"
cat >"${workspace_fixture}/package.json" <<'JSON'
{"name":"workspace-root","version":"1.0.0","private":true,"packageManager":"pnpm@10.0.0","workspaces":["packages/*"]}
JSON
cat >"${workspace_fixture}/pnpm-workspace.yaml" <<'YAML'
packages:
  - packages/*
YAML
cat >"${workspace_fixture}/packages/a/package.json" <<'JSON'
{"name":"@fixture/a","version":"1.0.0"}
JSON
cat >"${workspace_fixture}/packages/b/package.json" <<'JSON'
{"name":"@fixture/b","version":"1.0.0","dependencies":{"@fixture/a":"workspace:^"}}
JSON
cat >"${workspace_fixture}/packages/private/package.json" <<'JSON'
{"name":"@fixture/private","version":"1.0.0","private":true}
JSON
cp "${single_fixture}/.changeset/config.json" "${workspace_fixture}/.changeset/config.json"
cat >"${workspace_fixture}/.changeset/release.md" <<'MD'
---
"@fixture/a": patch
"@fixture/b": minor
---

Test a workspace release.
MD
cp "${single_fixture}/release.yml" "${workspace_fixture}/release.yml"
TEMPEL_RELEASE_WORKSPACE="${workspace_fixture}" node "${cli}" version --config release.yml >/dev/null
[[ "$(node -p "require('${workspace_fixture}/packages/a/package.json').version")" == '1.0.1' ]] || \
  fail 'workspace package A version was not updated'
[[ "$(node -p "require('${workspace_fixture}/packages/b/package.json').version")" == '1.1.0' ]] || \
  fail 'workspace package B version was not updated'
[[ "$(node -p "require('${workspace_fixture}/packages/private/package.json').version")" == '1.0.0' ]] || \
  fail 'private workspace package was updated'

fixture="${temporary_root}/project with spaces"
create_fixture "${fixture}"
cat >"${fixture}/release.yml" <<'YAML'
version: 1
engine: changesets
project:
  path: .
  executor: pnpm
  package_manager: pnpm
versioning:
  update_lockfile: true
  after: [format:packages]
publishing:
  before: [build]
  create_github_releases: true
  push_git_tags: true
pull_request:
  title: 'chore: release packages'
  commit_message: 'chore(#84): release packages'
  base_branch: main
YAML

export PATH="${fixture}/bin:${PATH}"
export RELEASE_LOG="${temporary_root}/release.log"
export TEMPEL_RELEASE_WORKSPACE="${fixture}"
export TEMPEL_RELEASE_CONFIG="release.yml"

output_file="${temporary_root}/github-output"
GITHUB_OUTPUT="${output_file}" node "${cli}" resolve
grep -Fx 'cwd=.' "${output_file}" >/dev/null
grep -Fx 'pr-title=chore: release packages' "${output_file}" >/dev/null
grep -Fx 'create-github-releases=true' "${output_file}" >/dev/null
grep -Fx 'use-github-app=false' "${output_file}" >/dev/null

: >"${RELEASE_LOG}"
node "${cli}" version
diff -u <(printf '%s\n' \
  'changeset version' \
  'pnpm install --lockfile-only --no-frozen-lockfile --ignore-scripts' \
  'pnpm run format:packages') "${RELEASE_LOG}"

: >"${RELEASE_LOG}"
NODE_AUTH_TOKEN=test-token node "${cli}" publish
diff -u <(printf '%s\n' 'pnpm run build' 'changeset publish') "${RELEASE_LOG}"

cat >"${fixture}/release.json" <<'JSON'
{
  "version": 1,
  "engine": "changesets",
  "project": {"path": ".", "executor": "node", "package_manager": "pnpm"},
  "versioning": {"update_lockfile": false},
  "publishing": {"before": []}
}
JSON
TEMPEL_RELEASE_CONFIG=release.json node "${cli}" resolve >/dev/null

assert_fails 'must be supplied together' \
  env TEMPEL_RELEASE_GITHUB_APP_CLIENT_ID_SET=true \
  TEMPEL_RELEASE_GITHUB_APP_PRIVATE_KEY_SET=false node "${cli}" resolve
app_output_file="${temporary_root}/github-app-output"
GITHUB_OUTPUT="${app_output_file}" \
  TEMPEL_RELEASE_GITHUB_APP_CLIENT_ID_SET=true \
  TEMPEL_RELEASE_GITHUB_APP_PRIVATE_KEY_SET=true node "${cli}" resolve
grep -Fx 'use-github-app=true' "${app_output_file}" >/dev/null
token_wiring='github-token: $'
token_wiring+='{{ steps.github-app.outputs.token || inputs.github-token || github.token }}'
[[ "$(grep -Fc "${token_wiring}" "${action_root}/action.yml")" -eq 2 ]] || \
  fail 'GitHub App token is not forwarded to both Changesets operations'
grep -F 'actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1' \
  "${action_root}/action.yml" >/dev/null

cat >"${fixture}/invalid.yml" <<'YAML'
version: 1
unknown: true
YAML
assert_fails 'contains unknown key "unknown"' env TEMPEL_RELEASE_CONFIG=invalid.yml node "${cli}" resolve

cat >"${fixture}/missing-version.yml" <<'YAML'
engine: changesets
YAML
assert_fails 'Configuration version must be 1' \
  env TEMPEL_RELEASE_CONFIG=missing-version.yml node "${cli}" resolve

cat >"${fixture}/missing-engine.yml" <<'YAML'
version: 1
YAML
assert_fails 'Configuration engine must be changesets' \
  env TEMPEL_RELEASE_CONFIG=missing-engine.yml node "${cli}" resolve

cat >"${fixture}/missing-script.yml" <<'YAML'
version: 1
engine: changesets
versioning:
  after: [missing]
YAML
assert_fails 'Configured package script "missing" does not exist' \
  env TEMPEL_RELEASE_CONFIG=missing-script.yml node "${cli}" resolve

cat >"${fixture}/command-hook.yml" <<'YAML'
version: 1
engine: changesets
publishing:
  before: ['build; echo unsafe']
YAML
assert_fails 'is not a valid package script name' \
  env TEMPEL_RELEASE_CONFIG=command-hook.yml node "${cli}" resolve

outside="${temporary_root}/outside"
create_fixture "${outside}"
cat >"${fixture}/outside.yml" <<YAML
version: 1
engine: changesets
project:
  path: ../outside
YAML
assert_fails 'project.path must resolve inside' env TEMPEL_RELEASE_CONFIG=outside.yml node "${cli}" resolve

cat >"${fixture}/invalid-executor.yml" <<'YAML'
version: 1
engine: changesets
project:
  executor: shell
YAML
assert_fails 'project.executor must be one of' env TEMPEL_RELEASE_CONFIG=invalid-executor.yml node "${cli}" resolve

cat >"${fixture}/invalid-boolean.yml" <<'YAML'
version: 1
engine: changesets
versioning:
  update_lockfile: yes
YAML
assert_fails 'versioning.update_lockfile must be true or false' \
  env TEMPEL_RELEASE_CONFIG=invalid-boolean.yml node "${cli}" resolve

cp "${fixture}/release.yml" "${fixture}/release.toml"
assert_fails 'must use a .json, .yaml, or .yml extension' \
  env TEMPEL_RELEASE_CONFIG=release.toml node "${cli}" resolve

assert_fails 'requires NODE_AUTH_TOKEN' env -u NODE_AUTH_TOKEN node "${cli}" publish

: >"${RELEASE_LOG}"
set +e
FAIL_PNPM=23 NODE_AUTH_TOKEN=test-token node "${cli}" publish >/dev/null 2>&1
status=$?
set -e
[[ "${status}" -eq 23 ]] || fail "expected hook exit 23, got ${status}"
[[ "$(cat "${RELEASE_LOG}")" == 'pnpm run build' ]] || fail 'publish continued after a failing hook'

set +e
FAIL_CHANGESET=17 node "${cli}" version >/dev/null 2>&1
status=$?
set -e
[[ "${status}" -eq 17 ]] || fail "expected Changesets exit 17, got ${status}"

summary_file="${temporary_root}/summary"
GITHUB_STEP_SUMMARY="${summary_file}" \
  TEMPEL_RELEASE_MODE=$'version|unsafe\nheading' \
  TEMPEL_RELEASE_PUBLISHED_PACKAGES='[{"name":"package|name","version":"1.0.0"}]' \
  node "${cli}" summary
grep -Fx '| Mode | version unsafe heading |' "${summary_file}" >/dev/null
grep -Fx '| package name | 1.0.0 |' "${summary_file}" >/dev/null
GITHUB_STEP_SUMMARY="${temporary_root}" node "${cli}" summary 2>/dev/null

cat >"${fixture}/pnp.yml" <<'YAML'
version: 1
engine: changesets
project:
  package_manager: yarn
  executor: yarn
versioning:
  update_lockfile: false
YAML
mv "${fixture}/node_modules/@changesets/cli" "${fixture}/node_modules/@changesets/cli.saved"
touch "${fixture}/.pnp.cjs"
assert_fails "Yarn Plug'n'Play is not supported" env TEMPEL_RELEASE_CONFIG=pnp.yml node "${cli}" resolve
rm "${fixture}/.pnp.cjs"
mv "${fixture}/node_modules/@changesets/cli.saved" "${fixture}/node_modules/@changesets/cli"

sed -i.bak 's/"version": "3.0.3"/"version": "2.29.8"/' \
  "${fixture}/node_modules/@changesets/cli/package.json"
rm -f "${fixture}/node_modules/@changesets/cli/package.json.bak"
assert_fails '@changesets/cli version 3 is required' node "${cli}" resolve

printf 'Release action tests passed.\n'
