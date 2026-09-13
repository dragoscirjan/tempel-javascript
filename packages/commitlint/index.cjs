/**
 * @typedef {import('@commitlint/types').UserConfig} UserConfig
 */

const GITHUB_ISSUE_PARSER_OPTIONS = {
  issuePrefixes: ['#'],
  issuePrefixesCaseSensitive: false,
};

/**
 * Returns the commitlint configuration.
 * @param {Partial<UserConfig> & { requireIssueId?: boolean }} [options={}] - Configuration options for commitlint.
 * @returns {UserConfig}
 */
module.exports = (options = {}) => {
  const { requireIssueId = false, ...config } = options;

  return {
    extends: ['@commitlint/config-conventional'],
    ...(requireIssueId
      ? {
          parserPreset: {
            parserOpts: GITHUB_ISSUE_PARSER_OPTIONS,
          },
          rules: {
            'references-empty': [2, 'never'],
            ...config.rules,
          },
        }
      : {}),
    ...config,
  };
};

module.exports.GITHUB_ISSUE_PARSER_OPTIONS = GITHUB_ISSUE_PARSER_OPTIONS;
