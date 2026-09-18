// eslint.config.mjs
import tempelEslintConfig from './packages/eslint/index.js';

export default [
  {
    ignores: ['packages/*/dist/**', 'apps/*/build/**', 'docs/.vitepress/**'],
  },
  ...tempelEslintConfig,
  {
    files: ['packages/shared/**'],
    rules: {
      // Stricter rules for shared packages
      'no-console': 'error',
    },
  },
];
