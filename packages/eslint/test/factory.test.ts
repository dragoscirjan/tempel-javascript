import { describe, it, expect } from 'vitest';

// Import the factory function and individual rule creators (these will be implemented)
import {
  createEslintConfig,
  createJsAndTsConfig,
  createPrettierConfig,
  createYamlConfig,
  createJsonConfig,
  createMarkdownConfig,
  createTextConfig,
} from '../index.js';

describe('ESLint Factory Function', () => {
  describe('createEslintConfig - Default Configuration', () => {
    it('should return an array of ESLint configurations', () => {
      const config = createEslintConfig();

      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });

    it('should include all rule sets by default', () => {
      const config = createEslintConfig();

      // Should contain configurations for all supported file types
      const configNames = config.map((c) => c.name).filter(Boolean);

      expect(configNames).toContain('tempel:global/node');
      expect(configNames).toContain('tempel:global/ts');
      expect(configNames).toContain('tempel:prettier');
      expect(configNames).toContain('tempel:yaml');
      expect(configNames).toContain('tempel:json');
      expect(configNames).toContain('tempel:markdown');
      expect(configNames).toContain('tempel:text');
    });

    it('should include default ignores configuration', () => {
      const config = createEslintConfig();

      const ignoreConfig = config.find((c) => c.ignores);
      expect(ignoreConfig).toBeDefined();
      expect(ignoreConfig?.ignores).toContain('**/venv/**/*.*');
      expect(ignoreConfig?.ignores).toContain('**/vitest.config.js');
    });

    it('should maintain backward compatibility with current static export', () => {
      const config = createEslintConfig();

      // The structure should match the current static export
      expect(config).toBeInstanceOf(Array);
      expect(config.every((c) => typeof c === 'object')).toBe(true);
    });
  });

  describe('createEslintConfig - Feature Toggles', () => {
    it('should exclude TypeScript rules when disabled', () => {
      const config = createEslintConfig({ enableTypeScript: false });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:global/ts');
      expect(configNames).toContain('tempel:global/node'); // JS should still be included
    });

    it('should exclude Prettier rules when disabled', () => {
      const config = createEslintConfig({ enablePrettier: false });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:prettier');
    });

    it('should exclude YAML rules when disabled', () => {
      const config = createEslintConfig({ enableYaml: false });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:yaml');
    });

    it('should exclude JSON rules when disabled', () => {
      const config = createEslintConfig({ enableJson: false });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:json');
    });

    it('should exclude Markdown rules when disabled', () => {
      const config = createEslintConfig({ enableMarkdown: false });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:markdown');
    });

    it('should allow multiple feature toggles simultaneously', () => {
      const config = createEslintConfig({
        enableYaml: false,
        enableMarkdown: false,
        enableJson: false,
      });

      const configNames = config.map((c) => c.name).filter(Boolean);
      expect(configNames).not.toContain('tempel:yaml');
      expect(configNames).not.toContain('tempel:markdown');
      expect(configNames).not.toContain('tempel:json');
      expect(configNames).toContain('tempel:global/node');
      expect(configNames).toContain('tempel:prettier');
    });
  });

  describe('createEslintConfig - Custom Ignores', () => {
    it('should accept custom ignore patterns', () => {
      const customIgnores = ['**/custom/**', '*.temp'];
      const config = createEslintConfig({ ignores: customIgnores });

      const ignoreConfig = config.find((c) => c.ignores);
      expect(ignoreConfig?.ignores).toEqual(customIgnores);
    });

    it('should handle empty ignores array', () => {
      const config = createEslintConfig({ ignores: [] });

      // Should not have a global ignore config (but may have rule-specific ignores)
      const globalIgnoreConfig = config.find((c) => c.ignores && !c.name);
      expect(globalIgnoreConfig).toBeUndefined();
    });
  });

  describe('createEslintConfig - Rule Customization', () => {
    it('should merge custom global rules', () => {
      const customRules = {
        'no-console': 'warn',
        'max-len': ['error', { code: 100 }],
      };

      const config = createEslintConfig({ rules: customRules });

      // Find JS/TS configs and verify rules are merged
      const jsConfig = config.find((c) => c.name === 'tempel:global/node');
      expect(jsConfig?.rules?.['no-console']).toBe('warn');
      expect(jsConfig?.rules?.['max-len']).toEqual(['error', { code: 100 }]);
    });

    it('should allow rule-set specific customizations', () => {
      const config = createEslintConfig({
        rules: {
          prettier: {
            'prettier/prettier': ['error', { printWidth: 100 }],
          },
        },
      });

      const prettierConfig = config.find((c) => c.name === 'tempel:prettier');
      expect(prettierConfig?.rules?.['prettier/prettier']).toEqual(['error', { printWidth: 100 }]);
    });
  });

  describe('createEslintConfig - Environment Configuration', () => {
    it('should support different environments', () => {
      const config = createEslintConfig({ environments: ['browser', 'node'] });

      const jsConfig = config.find((c) => c.name === 'tempel:global/node');
      expect(jsConfig?.languageOptions?.globals).toBeDefined();
    });

    it('should default to node environment', () => {
      const config = createEslintConfig();

      const jsConfig = config.find((c) => c.name === 'tempel:global/node');
      expect(jsConfig?.languageOptions?.globals).toHaveProperty('__ENV');
    });
  });

  describe('Individual Rule Set Functions', () => {
    describe('createJsAndTsConfig', () => {
      it('should create JavaScript and TypeScript configurations', () => {
        const configs = createJsAndTsConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThanOrEqual(2);

        const jsConfig = configs.find((c) => c.name === 'tempel:global/node');
        const tsConfig = configs.find((c) => c.name === 'tempel:global/ts');

        expect(jsConfig).toBeDefined();
        expect(tsConfig).toBeDefined();
      });

      it('should accept custom rules', () => {
        const customRules = { 'no-console': 'warn' };
        const configs = createJsAndTsConfig({ rules: customRules });

        const jsConfig = configs.find((c) => c.name === 'tempel:global/node');
        expect(jsConfig?.rules?.['no-console']).toBe('warn');
      });
    });

    describe('createPrettierConfig', () => {
      it('should create Prettier configuration', () => {
        const configs = createPrettierConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBe(1);
        expect(configs[0].name).toBe('tempel:prettier');
      });

      it('should accept custom Prettier rules', () => {
        const customRules = {
          'prettier/prettier': ['error', { printWidth: 100 }],
        };
        const configs = createPrettierConfig({ rules: customRules });

        expect(configs[0].rules?.['prettier/prettier']).toEqual(['error', { printWidth: 100 }]);
      });
    });

    describe('createYamlConfig', () => {
      it('should create YAML configuration', () => {
        const configs = createYamlConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThanOrEqual(1);
        const yamlConfig = configs.find((c) => c.name === 'tempel:yaml');
        expect(yamlConfig).toBeDefined();
      });
    });

    describe('createJsonConfig', () => {
      it('should create JSON configuration', () => {
        const configs = createJsonConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThanOrEqual(1);
        const jsonConfig = configs.find((c) => c.name === 'tempel:json');
        expect(jsonConfig).toBeDefined();
      });
    });

    describe('createMarkdownConfig', () => {
      it('should create Markdown configuration', () => {
        const configs = createMarkdownConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThanOrEqual(1);
        const markdownConfig = configs.find((c) => c.name === 'tempel:markdown');
        expect(markdownConfig).toBeDefined();
      });
    });

    describe('createTextConfig', () => {
      it('should create text file configuration', () => {
        const configs = createTextConfig();

        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThanOrEqual(1);
        const textConfig = configs.find((c) => c.name === 'tempel:text');
        expect(textConfig).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined options gracefully', () => {
      const config = createEslintConfig(undefined);

      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });

    it('should handle empty options object', () => {
      const config = createEslintConfig({});

      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });

    it('should handle invalid rule values gracefully', () => {
      const config = createEslintConfig({
        rules: {
          'invalid-rule': 'invalid-value',
        },
      });

      expect(Array.isArray(config)).toBe(true);
    });

    it('should preserve existing rules when merging custom rules', () => {
      const config = createEslintConfig({
        rules: {
          'no-console': 'warn',
        },
      });

      const jsConfig = config.find((c) => c.name === 'tempel:global/node');
      expect(jsConfig?.rules?.['node-import/prefer-node-protocol']).toBe('error');
      expect(jsConfig?.rules?.['no-console']).toBe('warn');
    });
  });

  describe('Type Safety', () => {
    it('should return proper ESLint configuration type', () => {
      const config = createEslintConfig();

      // Each config should be a valid Linter.Config
      config.forEach((cfg) => {
        expect(typeof cfg).toBe('object');
        expect(cfg).not.toBe(null);

        expect(cfg.files === undefined || Array.isArray(cfg.files)).toBe(true);
        expect(cfg.rules === undefined || typeof cfg.rules === 'object').toBe(true);
        expect(cfg.plugins === undefined || typeof cfg.plugins === 'object').toBe(true);
      });
    });
  });
});
