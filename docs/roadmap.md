# Roadmap

## TypeScript 7 compatibility

**TODO:** remove the TypeScript 5.9 compatibility pin once the TypeScript tooling used by Tempel supports TypeScript 7.

The current ESLint stack, especially `typescript-eslint`, does not support TypeScript 7. The same constraint is applied to the Jest, Vitest, and TSConfig packages because they share the TypeScript build and validation toolchain.

Until that work is complete, the repository pins TypeScript to `5.9.3` through the root pnpm override. This is intentional: allowing TypeScript 7 to resolve can make linting and package builds fail before user code is evaluated.
