import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('@tempel/eslint', () => {
  describe('successful lints', () => {
    const successDir = path.join(__dirname, 'success');

    // Read all .tpl files in the success directory
    const tplFiles = fs.readdirSync(successDir).filter((file) => path.extname(file) === '.tpl');

    tplFiles.forEach((tplFile) => {
      const originalFilePath = path.join(successDir, tplFile);
      const renamedFile = tplFile.replace(/\.tpl$/, '');
      const renamedFilePath = path.join(successDir, renamedFile);

      setupTest({
        file: {
          original: originalFilePath,
          renamed: renamedFilePath,
        },
      });
    });
  });
  describe('failed lints', () => {
    const failureDir = path.join(__dirname, 'failure');

    // Read all .tpl files in the success directory
    const tplFiles = fs.readdirSync(failureDir).filter((file) => path.extname(file) === '.tpl');

    tplFiles.forEach((tplFile) => {
      const originalFilePath = path.join(failureDir, tplFile);
      const renamedFile = tplFile.replace(/\.tpl$/, '');
      const renamedFilePath = path.join(failureDir, renamedFile);

      setupTest({
        throws: true,
        file: {
          original: originalFilePath,
          renamed: renamedFilePath,
        },
      });
    });
  });
});

type TestOptions = {
  file: {
    original: string;
    renamed: string;
  };
  expects?: Record<string, () => void>;
  throws?: boolean;
};

/**
 * Sets up a test for a given file by renaming it, running ESLint, and cleaning up.
 * @param {TestOptions} options - The test configuration options.
 */
function setupTest({ throws = false, expects = {}, file }: TestOptions) {
  describe(`Linting ${path.basename(file.original)}`, () => {
    let eslintError: Error | null = null;

    beforeAll(async () => {
      // Rename the .tpl file by removing the .tpl extension
      fs.copyFileSync(file.original, file.renamed);

      try {
        // Run ESLint on the renamed file
        await execa({
          preferLocal: true,
        })`eslint --config ./index.js ${file.renamed}`;
      } catch (e) {
        eslintError = e as Error;
        process.env.DEBUG && console.log(`eslint failed with`, eslintError);
      }
    });

    if (throws) {
      it('should throw ESLint errors', () => {
        expect(eslintError).toBeInstanceOf(Error);
      });
    } else {
      it('should not throw ESLint errors', () => {
        expect(eslintError).toBeNull();
      });
    }

    if (Object.keys(expects).length) {
      describe('custom tests', () => {
        Object.entries(expects).forEach(([name, call]) => {
          // eslint-disable-next-line vitest/valid-title, vitest/expect-expect
          it(name, () => call());
        });
      });
    }

    afterAll(() => {
      // Remove the renamed file after the test
      if (fs.existsSync(file.renamed)) {
        fs.unlinkSync(file.renamed);
      }
    });
  });
}
