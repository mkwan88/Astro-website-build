// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import { readdirSync, readFileSync } from 'node:fs';

// Blog post URL -> last modified date (updatedDate, else publishDate), for sitemap <lastmod>.
// Set updatedDate in a post's frontmatter to the date an update is pushed.
const BLOG_DIR = './src/content/blog';
const blogLastmod = Object.fromEntries(
  readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(`${BLOG_DIR}/${file}`, 'utf8');
      const date = (source.match(/^updatedDate:\s*(\S+)/m) ?? source.match(/^publishDate:\s*(\S+)/m))?.[1];
      return [`https://kwantum.net/blog/${file.replace(/\.md$/, '')}/`, date];
    })
    .filter(([, date]) => date)
);

// https://astro.build/config
export default defineConfig({
  site: 'https://kwantum.net',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    // thank-you and form-error are noindex, so keep them out of the sitemap too
    sitemap({
      filter: (page) => !/\/(thank-you|form-error)\/$/.test(page) && !page.includes('/mockups/'),
      serialize: (item) => {
        const date = blogLastmod[item.url];
        if (date) item.lastmod = new Date(date).toISOString();
        return item;
      },
    }),
    mdx(),
    icon(),
  ]
});