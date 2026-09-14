/**
 * @typedef {import('@commitlint/types').UserConfig} UserConfig
 */

const GITHUB_ISSUE_PARSER_OPTIONS = {
  issuePrefixes: ['#'],
  issuePrefixesCaseSensitive: false,
};

const GITHUB_ISSUE_SCOPE_PATTERN = /^#\d+$/;

const githubIssueScopePlugin = {
  rules: {
    'scope-issue-id': (parsed) => [
      GITHUB_ISSUE_SCOPE_PATTERN.test(parsed.scope || ''),
      'scope must be a GitHub issue ID such as #50',
    ],
  },
};

/**
 * Returns the commitlint configuration.
 * @param {Partial<UserConfig> & { requireIssueId?: boolean }} [options={}] - Configuration options for commitlint.
 * @returns {UserConfig}
 */
export default (options = {}) => {
  const { requireIssueId = false, rules = {}, plugins = [], ...config } = options;

  const mergedRules = {
    ...rules,
    ...(requireIssueId
      ? {
          'references-empty': [2, 'never'],
          'scope-issue-id': [2, 'always'],
        }
      : {}),
  };

  return {
    extends: ['@commitlint/config-conventional'],
    ...config,
    ...(Object.keys(mergedRules).length ? { rules: mergedRules } : {}),
    ...(requireIssueId
      ? {
          parserPreset: {
            parserOpts: GITHUB_ISSUE_PARSER_OPTIONS,
          },
          plugins: [...plugins, githubIssueScopePlugin],
        }
      : plugins.length
        ? { plugins }
        : {}),
  };
};

export { GITHUB_ISSUE_PARSER_OPTIONS };
