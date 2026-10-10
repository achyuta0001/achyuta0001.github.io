// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://achyuta0001.github.io',
  integrations: [react(), sitemap()],
  // The whole stylesheet is a few KB; inlining it saves two render-blocking requests.
  build: { inlineStylesheets: 'always' },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
