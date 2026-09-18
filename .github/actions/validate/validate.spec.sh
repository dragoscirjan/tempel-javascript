#!/usr/bin/env bash

# Exercise validate.sh without installing each supported executor.
set -euo pipefail

action_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
temp_dir="$(mktemp -d)"
readonly action_root temp_dir
readonly validate_script="${action_root}/validate.sh"
readonly fake_bin="${temp_dir}/bin"
readonly command_log="${temp_dir}/commands.log"
readonly working_directory_log="${temp_dir}/working-directory.log"
readonly summary_file="${temp_dir}/summary.md"

cleanup() {
  rm -rf "${temp_dir}"
}
trap cleanup EXIT

mkdir -p "${fake_bin}"
cat >"${fake_bin}/executor" <<'EXECUTOR'
#!/usr/bin/env bash
set -euo pipefail

printf '%s' "${0##*/}" >>"${COMMAND_LOG}"
for argument in "$@"; do
  printf '\t%s' "${argument}" >>"${COMMAND_LOG}"
done
printf '\n' >>"${COMMAND_LOG}"
printf '%s\n' "${PWD}" >"${WORKING_DIRECTORY_LOG}"

for argument in "$@"; do
  if [[ -n "${FAIL_SCRIPT:-}" && "${argument}" == "${FAIL_SCRIPT}" ]]; then
    exit 9
  fi
done
EXECUTOR
chmod +x "${fake_bin}/executor"
for executor in npm pnpm yarn node bun deno nub mise; do
  ln -s executor "${fake_bin}/${executor}"
done

assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  if [[ "${expected}" != "${actual}" ]]; then
    printf 'FAIL: %s\nExpected:\n%s\nActual:\n%s\n' \
      "${message}" "${expected}" "${actual}" >&2
    exit 1
  fi
}

reset_log() {
  : >"${command_log}"
}

run_validate() {
  PATH="${fake_bin}:${PATH}" \
    COMMAND_LOG="${command_log}" \
    WORKING_DIRECTORY_LOG="${working_directory_log}" \
    "${validate_script}"
}

reset_log
: >"${summary_file}"
GITHUB_STEP_SUMMARY="${summary_file}" run_validate >/dev/null
assert_equal \
  $'npm\trun\tformat\nnpm\trun\tlint\nnpm\trun\tduplicate-check\nnpm\trun\ttest\nnpm\trun\taudit\t--\t--audit-level=moderate' \
  "$(<"${command_log}")" \
  'defaults run all checks with npm'
assert_equal \
  $'## Validate summary\n\n| Check | Result |\n| --- | --- |\n| Format | Passed |\n| Lint | Passed |\n| Duplicate check | Passed |\n| Test | Passed |\n| Audit | Passed |\n\n**Overall: Passed**' \
  "$(<"${summary_file}")" \
  'successful checks are written to the job summary'

reset_log
: >"${summary_file}"
if GITHUB_STEP_SUMMARY="${summary_file}" \
  FAIL_SCRIPT=lint \
  run_validate >/dev/null 2>&1; then
  printf 'FAIL: lint failure must stop validation\n' >&2
  exit 1
fi
assert_equal $'npm\trun\tformat\nnpm\trun\tlint' "$(<"${command_log}")" \
  'validation stops at the first required failure'
assert_equal \
  $'## Validate summary\n\n| Check | Result |\n| --- | --- |\n| Format | Passed |\n| Lint | Failed |\n| Duplicate check | Not run |\n| Test | Not run |\n| Audit | Not run |\n\n**Overall: Failed**' \
  "$(<"${summary_file}")" \
  'failed summaries preserve checks that did not run'

reset_log
VALIDATE_RUN_FORMAT=false \
  VALIDATE_RUN_LINT=false \
  VALIDATE_RUN_DUPLICATE_CHECK=false \
  VALIDATE_RUN_TEST=false \
  VALIDATE_RUN_AUDIT=false \
  run_validate >/dev/null
assert_equal '' "$(<"${command_log}")" 'checks can all be disabled'

reset_log
VALIDATE_EXECUTOR=pnpm \
  VALIDATE_SCRIPT_FORMAT='format:check' \
  VALIDATE_SCRIPT_LINT='lint:check' \
  VALIDATE_SCRIPT_DUPLICATE_CHECK=duplicates \
  VALIDATE_SCRIPT_TEST='test:unit' \
  VALIDATE_SCRIPT_AUDIT='audit:ci' \
  VALIDATE_AUDIT_LEVEL=high \
  run_validate >/dev/null
assert_equal \
  $'pnpm\trun\tformat:check\npnpm\trun\tlint:check\npnpm\trun\tduplicates\npnpm\trun\ttest:unit\npnpm\trun\taudit:ci\t--\t--audit-level=high' \
  "$(<"${command_log}")" \
  'custom script names and audit level are forwarded'

reset_log
VALIDATE_RUN_FORMAT=false \
  VALIDATE_RUN_LINT=false \
  VALIDATE_RUN_DUPLICATE_CHECK=true \
  VALIDATE_SCRIPT_DUPLICATE_CHECK=duplicates \
  VALIDATE_IGNORE_DUPLICATE_CHECK_RESULT=true \
  VALIDATE_RUN_TEST=false \
  VALIDATE_RUN_AUDIT=false \
  FAIL_SCRIPT=duplicates \
  run_validate >/dev/null
assert_equal $'npm\trun\tduplicates' "$(<"${command_log}")" \
  'ignored duplicate failures still run the script'

reset_log
if VALIDATE_RUN_FORMAT=false \
  VALIDATE_RUN_LINT=false \
  VALIDATE_RUN_DUPLICATE_CHECK=true \
  VALIDATE_SCRIPT_DUPLICATE_CHECK=duplicates \
  VALIDATE_IGNORE_DUPLICATE_CHECK_RESULT=false \
  VALIDATE_RUN_TEST=false \
  VALIDATE_RUN_AUDIT=false \
  FAIL_SCRIPT=duplicates \
  run_validate >/dev/null 2>&1; then
  printf 'FAIL: duplicate failures must fail by default\n' >&2
  exit 1
fi

for executor in npm pnpm yarn node bun deno nub; do
  reset_log
  VALIDATE_EXECUTOR="${executor}" \
    VALIDATE_RUN_FORMAT=false \
    VALIDATE_RUN_LINT=false \
    VALIDATE_RUN_DUPLICATE_CHECK=false \
    VALIDATE_RUN_TEST=false \
    VALIDATE_RUN_AUDIT=true \
    run_validate >/dev/null

  case "${executor}" in
    npm | pnpm | nub)
      expected="${executor}"$'\trun\taudit\t--\t--audit-level=moderate'
      ;;
    node)
      expected=$'node\t--run\taudit\t--\t--audit-level=moderate'
      ;;
    yarn | bun)
      expected="${executor}"$'\trun\taudit\t--audit-level=moderate'
      ;;
    deno)
      expected=$'deno\ttask\taudit\t--audit-level=moderate'
      ;;
  esac
  assert_equal "${expected}" "$(<"${command_log}")" \
    "${executor} receives audit arguments"
done

reset_log
VALIDATE_EXECUTOR=pnpm \
  VALIDATE_USE_MISE=true \
  VALIDATE_RUN_FORMAT=false \
  VALIDATE_RUN_LINT=false \
  VALIDATE_RUN_DUPLICATE_CHECK=false \
  VALIDATE_RUN_TEST=true \
  VALIDATE_RUN_AUDIT=false \
  run_validate >/dev/null
assert_equal $'mise\texec\t--\tpnpm\trun\ttest' "$(<"${command_log}")" \
  'mise exec wraps the selected executor command'

mkdir -p "${temp_dir}/project"
reset_log
VALIDATE_PATH="${temp_dir}/project" \
  VALIDATE_RUN_FORMAT=false \
  VALIDATE_RUN_LINT=false \
  VALIDATE_RUN_DUPLICATE_CHECK=false \
  VALIDATE_RUN_TEST=true \
  VALIDATE_RUN_AUDIT=false \
  run_validate >/dev/null
assert_equal "${temp_dir}/project" "$(<"${working_directory_log}")" \
  'path selects the executor working directory'

if VALIDATE_EXECUTOR=unknown run_validate >/dev/null 2>&1; then
  printf 'FAIL: unsupported executors must fail\n' >&2
  exit 1
fi

if VALIDATE_RUN_FORMAT=perhaps run_validate >/dev/null 2>&1; then
  printf 'FAIL: invalid booleans must fail\n' >&2
  exit 1
fi

if VALIDATE_RUN_FORMAT='' run_validate >/dev/null 2>&1; then
  printf 'FAIL: empty booleans must fail\n' >&2
  exit 1
fi

if VALIDATE_SCRIPT_FORMAT='' run_validate >/dev/null 2>&1; then
  printf 'FAIL: empty script names must fail\n' >&2
  exit 1
fi

if VALIDATE_PATH='' run_validate >/dev/null 2>&1; then
  printf 'FAIL: empty paths must fail\n' >&2
  exit 1
fi

if VALIDATE_PATH="${temp_dir}/missing" run_validate >/dev/null 2>&1; then
  printf 'FAIL: missing paths must fail\n' >&2
  exit 1
fi

if VALIDATE_AUDIT_LEVEL=urgent run_validate >/dev/null 2>&1; then
  printf 'FAIL: invalid audit levels must fail\n' >&2
  exit 1
fi

printf 'All validate action tests passed.\n'
