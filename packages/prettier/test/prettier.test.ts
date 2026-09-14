import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('@tempel/prettier', () => {
  describe('successful prettify', () => {
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
 * Sets up a test for a given file by renaming it, running Prettier, and cleaning up.
 * @param {TestOptions} options - The test configuration options.
 */
function setupTest({ throws = false, expects = {}, file }: TestOptions) {
  describe(`Linting ${path.basename(file.original)}`, () => {
    let prettierError: Error | null = null;

    beforeAll(async () => {
      // Rename the .tpl file by removing the .tpl extension
      fs.copyFileSync(file.original, file.renamed);

      try {
        // Run the workspace-local Prettier binary to avoid slow npx resolution.
        await execa('prettier', ['--config', './index.cjs', file.renamed], {
          preferLocal: true,
        });
      } catch (e) {
        prettierError = e as Error;
        process.env.DEBUG && console.log(`prettier failed with`, prettierError);
      }
    });

    if (throws) {
      it('should throw Prettier errors', () => {
        expect(prettierError).toBeInstanceOf(Error);
      });
    } else {
      it('should not throw Prettier errors', () => {
        expect(prettierError).toBeNull();
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
