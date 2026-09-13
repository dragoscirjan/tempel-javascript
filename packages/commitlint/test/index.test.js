import { describe, expect, it } from 'vitest';
import commitlintConfig, { GITHUB_ISSUE_PARSER_OPTIONS } from '../index.mjs';

describe('commitlint configuration', () => {
  it('should export a function', () => {
    expect(typeof commitlintConfig).toBe('function');
  });

  it('should return a valid configuration object with default settings', () => {
    const config = commitlintConfig();

    expect(config).toEqual({
      extends: ['@commitlint/config-conventional'],
    });
  });

  it('should have extends property with conventional config', () => {
    const config = commitlintConfig();

    expect(config.extends).toBeDefined();
    expect(config.extends).toContain('@commitlint/config-conventional');
  });

  it('should merge custom options with default configuration', () => {
    const customOptions = {
      rules: {
        'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
      },
    };

    const config = commitlintConfig(customOptions);

    expect(config).toEqual({
      extends: ['@commitlint/config-conventional'],
      rules: {
        'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
      },
    });
  });

  it('should optionally require a GitHub issue ID in the header', () => {
    const config = commitlintConfig({ requireIssueId: true });

    expect(config.parserPreset).toEqual({ parserOpts: GITHUB_ISSUE_PARSER_OPTIONS });
    expect(config.rules?.['references-empty']).toEqual([2, 'never']);
  });

  it('should allow overriding extends property', () => {
    const customOptions = {
      extends: ['@commitlint/config-angular'],
    };

    const config = commitlintConfig(customOptions);

    expect(config.extends).toEqual(['@commitlint/config-angular']);
  });

  it('should handle multiple custom properties', () => {
    const customOptions = {
      rules: {
        'header-max-length': [2, 'always', 72],
      },
      ignores: [(commit) => commit.includes('WIP')],
      defaultIgnores: false,
    };

    const config = commitlintConfig(customOptions);

    expect(config).toMatchObject({
      extends: ['@commitlint/config-conventional'],
      rules: {
        'header-max-length': [2, 'always', 72],
      },
      ignores: expect.any(Array),
      defaultIgnores: false,
    });
  });

  it('should handle empty options object', () => {
    const config = commitlintConfig({});

    expect(config).toEqual({
      extends: ['@commitlint/config-conventional'],
    });
  });

  it('should handle undefined options', () => {
    const config = commitlintConfig(undefined);

    expect(config).toEqual({
      extends: ['@commitlint/config-conventional'],
    });
  });

  it('should maintain configuration structure when adding parserPreset', () => {
    const customOptions = {
      parserPreset: 'conventional-changelog-conventionalcommits',
    };

    const config = commitlintConfig(customOptions);

    expect(config).toEqual({
      extends: ['@commitlint/config-conventional'],
      parserPreset: 'conventional-changelog-conventionalcommits',
    });
  });

  it('should properly merge nested rules configuration', () => {
    const customOptions = {
      rules: {
        'type-enum': [2, 'always', ['feat', 'fix', 'docs']],
        'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
      },
    };

    const config = commitlintConfig(customOptions);

    expect(config.rules).toEqual({
      'type-enum': [2, 'always', ['feat', 'fix', 'docs']],
      'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    });
  });
});
