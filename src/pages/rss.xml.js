import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: `${SITE.name} Blog`,
    description: SITE.description,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.excerpt,
        pubDate: post.data.publishDate,
        link: `/blog/${post.id}/`,
      })),
  });
}
