import { defineConfig } from 'vitepress';

// Keep the user-facing documentation navigation next to the Markdown content.
export default defineConfig({
  title: 'Tempel JavaScript Toolkit',
  description: 'Portable development configurations for JavaScript and TypeScript projects.',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    sidebar: {
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'Overview', link: '/packages/' },
            { text: 'ESLint', link: '/packages/eslint' },
            { text: 'Prettier', link: '/packages/prettier' },
            { text: 'TSConfig', link: '/packages/tsconfig' },
            { text: 'Vitest', link: '/packages/vitest' },
            { text: 'Jest', link: '/packages/jest' },
            { text: 'Commitlint', link: '/packages/commitlint' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/dragoscirjan/tempel-javascript' }],
  },
});
