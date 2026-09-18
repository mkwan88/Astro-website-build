// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.kwantum.com.au',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap(), mdx(), icon()]
});