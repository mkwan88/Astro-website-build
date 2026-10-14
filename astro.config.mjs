// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://kwantum.net',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    // thank-you and form-error are noindex, so keep them out of the sitemap too
    sitemap({ filter: (page) => !/\/(thank-you|form-error)\/$/.test(page) }),
    mdx(),
    icon(),
  ]
});