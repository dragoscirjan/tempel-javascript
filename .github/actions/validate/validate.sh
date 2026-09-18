#!/usr/bin/env bash

# Run the validation scripts configured by action.yml.
set -euo pipefail

format_result='Not run'
lint_result='Not run'
duplicate_check_result='Not run'
test_result='Not run'
audit_result='Not run'

# Append the check results to the GitHub job summary without masking failures.
write_summary() {
  local exit_status="$1"
  local overall=Passed

  if ((exit_status != 0)); then
    overall=Failed
  fi

  if [[ -z "${GITHUB_STEP_SUMMARY:-}" ]]; then
    return 0
  fi

  if ! {
    printf '## Validate summary\n\n'
    printf '| Check | Result |\n'
    printf '| --- | --- |\n'
    printf '| Format | %s |\n' "${format_result}"
    printf '| Lint | %s |\n' "${lint_result}"
    printf '| Duplicate check | %s |\n' "${duplicate_check_result}"
    printf '| Test | %s |\n' "${test_result}"
    printf '| Audit | %s |\n' "${audit_result}"
    printf '\n**Overall: %s**\n' "${overall}"
  } >>"${GITHUB_STEP_SUMMARY}"; then
    printf '::warning::Could not write the validate job summary.\n'
  fi
}

# Preserve the validation exit status after writing the summary.
on_exit() {
  local exit_status="$1"

  trap - EXIT
  write_summary "${exit_status}"
  exit "${exit_status}"
}
trap 'on_exit "$?"' EXIT

# Parse a GitHub Action boolean input and reject ambiguous values.
parse_boolean() {
  local input_name="$1"
  local input_value="$2"

  case "${input_value}" in
    [Tt][Rr][Uu][Ee])
      printf 'true\n'
      ;;
    [Ff][Aa][Ll][Ss][Ee])
      printf 'false\n'
      ;;
    *)
      printf 'Input %s must be true or false, got %q.\n' \
        "${input_name}" "${input_value}" >&2
      return 2
      ;;
  esac
}

# Require a non-empty script or task name for each enabled check.
require_script() {
  local input_name="$1"
  local script_name="$2"

  if [[ -z "${script_name}" ]]; then
    printf 'Input %s must not be empty.\n' "${input_name}" >&2
    return 2
  fi
}

# Run one script while preserving arguments as separate shell words.
run_script() {
  local label="$1"
  local script_name="$2"
  shift 2
  local -a command=("${executor}" "${task_command}" "${script_name}")

  if (($# > 0)); then
    # npm-compatible runners and Node use -- to separate script arguments.
    case "${executor}" in
      npm | pnpm | node | nub)
        command+=(--)
        ;;
      yarn | bun | deno) ;;
    esac
    command+=("$@")
  fi

  if [[ "${use_mise}" == true ]]; then
    command=(mise exec -- "${command[@]}")
  fi

  printf '::group::Validate: %s\n' "${label}"
  printf 'Running:'
  printf ' %q' "${command[@]}"
  printf '\n'

  if "${command[@]}"; then
    printf '::endgroup::\n'
    return 0
  else
    local status=$?
    printf '::endgroup::\n'
    return "${status}"
  fi
}

executor="${VALIDATE_EXECUTOR-npm}"
use_mise="$(parse_boolean use-mise "${VALIDATE_USE_MISE-false}")"
run_format="$(parse_boolean run-format "${VALIDATE_RUN_FORMAT-true}")"
run_lint="$(parse_boolean run-lint "${VALIDATE_RUN_LINT-true}")"
run_duplicate_check="$(
  parse_boolean run-duplicate-check "${VALIDATE_RUN_DUPLICATE_CHECK-true}"
)"
ignore_duplicate_check_result="$(
  parse_boolean ignore-duplicate-check-result \
    "${VALIDATE_IGNORE_DUPLICATE_CHECK_RESULT-false}"
)"
run_test="$(parse_boolean run-test "${VALIDATE_RUN_TEST-true}")"
run_audit="$(parse_boolean run-audit "${VALIDATE_RUN_AUDIT-true}")"
readonly executor use_mise run_format run_lint run_duplicate_check
readonly ignore_duplicate_check_result run_test run_audit

script_format="${VALIDATE_SCRIPT_FORMAT-format}"
script_lint="${VALIDATE_SCRIPT_LINT-lint}"
script_duplicate_check="${VALIDATE_SCRIPT_DUPLICATE_CHECK-duplicate-check}"
script_test="${VALIDATE_SCRIPT_TEST-test}"
script_audit="${VALIDATE_SCRIPT_AUDIT-audit}"
audit_level="${VALIDATE_AUDIT_LEVEL-moderate}"
working_directory="${VALIDATE_PATH-.}"
readonly script_format script_lint script_duplicate_check script_test
readonly script_audit audit_level working_directory

case "${executor}" in
  node)
    task_command=--run
    ;;
  deno)
    task_command=task
    ;;
  npm | pnpm | yarn | bun | nub)
    task_command=run
    ;;
  *)
    printf 'Unsupported executor %q. Use npm, pnpm, yarn, node, bun, deno, or nub.\n' \
      "${executor}" >&2
    exit 2
    ;;
esac
readonly task_command

if [[ "${use_mise}" == true ]]; then
  if ! command -v mise >/dev/null 2>&1; then
    printf 'mise is not available on PATH.\n' >&2
    exit 127
  fi
elif ! command -v "${executor}" >/dev/null 2>&1; then
  printf 'Executor %q is not available on PATH.\n' "${executor}" >&2
  exit 127
fi

case "${audit_level}" in
  info | low | moderate | high | critical) ;;
  *)
    printf 'Unsupported audit level %q. Use info, low, moderate, high, or critical.\n' \
      "${audit_level}" >&2
    exit 2
    ;;
esac

if [[ "${run_format}" == false ]]; then
  format_result=Skipped
fi
if [[ "${run_lint}" == false ]]; then
  lint_result=Skipped
fi
if [[ "${run_duplicate_check}" == false ]]; then
  duplicate_check_result=Skipped
fi
if [[ "${run_test}" == false ]]; then
  test_result=Skipped
fi
if [[ "${run_audit}" == false ]]; then
  audit_result=Skipped
fi

if [[ -z "${working_directory}" ]]; then
  printf 'Input path must not be empty.\n' >&2
  exit 2
fi
if ! cd -- "${working_directory}"; then
  printf 'Input path %q is not an accessible directory.\n' \
    "${working_directory}" >&2
  exit 2
fi

if [[ "${run_format}" == true ]]; then
  if ! require_script script-format "${script_format}"; then
    format_result=Failed
    exit 2
  fi
  if run_script Format "${script_format}"; then
    format_result=Passed
  else
    check_status=$?
    format_result=Failed
    printf '::error title=Validate: Format::Format failed with exit code %d.\n' \
      "${check_status}"
    exit "${check_status}"
  fi
fi

if [[ "${run_lint}" == true ]]; then
  if ! require_script script-lint "${script_lint}"; then
    lint_result=Failed
    exit 2
  fi
  if run_script Lint "${script_lint}"; then
    lint_result=Passed
  else
    check_status=$?
    lint_result=Failed
    printf '::error title=Validate: Lint::Lint failed with exit code %d.\n' \
      "${check_status}"
    exit "${check_status}"
  fi
fi

if [[ "${run_duplicate_check}" == true ]]; then
  if ! require_script script-duplicate-check "${script_duplicate_check}"; then
    duplicate_check_result=Failed
    exit 2
  fi
  if run_script "Duplicate check" "${script_duplicate_check}"; then
    duplicate_check_result=Passed
  else
    duplicate_status=$?
    if [[ "${ignore_duplicate_check_result}" == true ]]; then
      duplicate_check_result=Warning
      printf '::warning::Duplicate check failed with exit code %d.\n' \
        "${duplicate_status}"
    else
      duplicate_check_result=Failed
      printf '::error title=Validate: Duplicate check::Duplicate check failed with exit code %d.\n' \
        "${duplicate_status}"
      exit "${duplicate_status}"
    fi
  fi
fi

if [[ "${run_test}" == true ]]; then
  if ! require_script script-test "${script_test}"; then
    test_result=Failed
    exit 2
  fi
  if run_script Test "${script_test}"; then
    test_result=Passed
  else
    check_status=$?
    test_result=Failed
    printf '::error title=Validate: Test::Test failed with exit code %d.\n' \
      "${check_status}"
    exit "${check_status}"
  fi
fi

if [[ "${run_audit}" == true ]]; then
  if ! require_script script-audit "${script_audit}"; then
    audit_result=Failed
    exit 2
  fi
  if run_script Audit "${script_audit}" "--audit-level=${audit_level}"; then
    audit_result=Passed
  else
    check_status=$?
    audit_result=Failed
    printf '::error title=Validate: Audit::Audit failed with exit code %d.\n' \
      "${check_status}"
    exit "${check_status}"
  fi
fi
