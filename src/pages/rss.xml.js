import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const sanitizeForXml = (value = '') => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const site = context.site ?? 'https://www.georgeollis.com';
  const rssUrl = new URL('/rss.xml', site).toString();

  return rss({
    title: 'George Ollis',
    description: 'Engineering notes by George Ollis',
    site,
    customData: `<language>en-gb</language><atom:link href="${rssUrl}" rel="self" type="application/rss+xml" />`,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom'
    },
    items: posts.map((post) => ({
      title: sanitizeForXml(post.data.title ?? ''),
      pubDate: post.data.date,
      description: sanitizeForXml(post.data.description ?? ''),
      link: `/blog/${post.slug}/`
    }))
  });
}
