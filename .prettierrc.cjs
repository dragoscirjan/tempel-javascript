const config = require('./packages/prettier/index.cjs');

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: 'packages/tsconfig/README.md',
      options: {
        // ESLint rejects trailing commas in embedded JSONC.
        trailingComma: 'none',
      },
    },
  ],
};
