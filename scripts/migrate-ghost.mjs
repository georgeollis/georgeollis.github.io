import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

const site = process.argv[2] || 'https://www.georgeollis.com';
const outputDir = process.argv[3] || 'src/content/blog';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function markdownFrontmatter(post) {
  const tags = post.tags.length > 0 ? `\ntags:\n${post.tags.map((t) => `  - ${t}`).join('\n')}` : '\ntags: []';
  const safeDescription = (post.description || '').replace(/"/g, '\\"');

  return `---\ntitle: "${post.title.replace(/"/g, '\\"')}"\ndescription: "${safeDescription}"\ndate: ${post.date.toISOString().slice(0, 10)}${tags}\ncanonicalUrl: "${post.url}"\n---\n\n`;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function normalizeTag(tag) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9- ]/g, '')
    .replace(/\s+/g, '-');
}

async function getPostsFromRss(baseUrl) {
  const xml = await fetchText(`${baseUrl.replace(/\/$/, '')}/rss/`);
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : [items];

  return list
    .filter((item) => item && item.link)
    .map((item) => ({
      title: item.title || 'Untitled',
      url: item.link,
      date: new Date(item.pubDate || Date.now()),
      description: item.description || '',
      tags: Array.isArray(item.category)
        ? item.category.map(normalizeTag).filter(Boolean)
        : item.category
          ? [normalizeTag(item.category)].filter(Boolean)
          : [],
      html: item['content:encoded'] || item.description || ''
    }));
}

async function getPostUrlsFromSitemap(baseUrl) {
  const xml = await fetchText(`${baseUrl.replace(/\/$/, '')}/sitemap-posts.xml`);
  const doc = parser.parse(xml);
  const urls = doc?.urlset?.url ?? [];
  const list = Array.isArray(urls) ? urls : [urls];

  return list
    .filter((entry) => entry?.loc)
    .map((entry) => ({
      url: entry.loc,
      lastModified: entry.lastmod ? new Date(entry.lastmod) : null
    }));
}

function extractPostContent(html) {
  const $ = cheerio.load(html);
  const content =
    $('article').first().html() ||
    $('.gh-content').first().html() ||
    $('.post-content').first().html() ||
    $('main').first().html() ||
    $('body').html() ||
    '';

  return content;
}

function extractPostMetaFromPage(pageHtml, url) {
  const $ = cheerio.load(pageHtml);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    'Untitled';

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const published =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time').first().attr('datetime') ||
    null;

  const tags = $('meta[property="article:tag"]')
    .map((_, el) => normalizeTag($(el).attr('content') || ''))
    .get()
    .filter(Boolean);

  return {
    title,
    url,
    date: published ? new Date(published) : new Date(),
    description,
    tags,
    html: extractPostContent(pageHtml)
  };
}

async function hydrateMissingHtml(posts) {
  const hydrated = [];
  for (const post of posts) {
    const hasHtml = post.html && post.html.trim().length > 20;
    const hasTitle = post.title && post.title.trim() && post.title !== 'Untitled';
    const hasDescription = typeof post.description === 'string' && post.description.trim().length > 0;
    const hasValidDate = post.date instanceof Date && !Number.isNaN(post.date.valueOf());

    if (hasHtml && hasTitle && hasDescription && hasValidDate) {
      hydrated.push(post);
      continue;
    }

    try {
      const page = await fetchText(post.url);
      const pageMeta = extractPostMetaFromPage(page, post.url);
      const fallbackDate = pageMeta.date instanceof Date && !Number.isNaN(pageMeta.date.valueOf())
        ? pageMeta.date
        : post.lastModified instanceof Date && !Number.isNaN(post.lastModified.valueOf())
          ? post.lastModified
          : new Date();

      hydrated.push({
        ...pageMeta,
        title: hasTitle ? post.title : pageMeta.title,
        description: hasDescription ? post.description : pageMeta.description,
        date: hasValidDate ? post.date : fallbackDate,
        tags: post.tags && post.tags.length > 0 ? post.tags : pageMeta.tags,
        html: hasHtml ? post.html : pageMeta.html
      });
    } catch {
      hydrated.push(post);
    }
  }
  return hydrated;
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writePosts(posts, outDir) {
  await ensureDir(outDir);
  let written = 0;

  for (const post of posts) {
    const slug = slugify(new URL(post.url).pathname.split('/').filter(Boolean).pop() || post.title);
    const filePath = path.join(outDir, `${slug}.md`);

    if (await fileExists(filePath)) {
      continue;
    }

    const markdownBody = turndown.turndown(post.html || '');
    const payload = `${markdownFrontmatter(post)}${markdownBody.trim()}\n`;

    await writeFile(filePath, payload, 'utf8');
    written += 1;
  }

  return written;
}

async function run() {
  const rssPosts = await getPostsFromRss(site);
  const sitemapPosts = await getPostUrlsFromSitemap(site);

  const rssByUrl = new Map(rssPosts.map((post) => [post.url, post]));
  const mergedPosts = sitemapPosts.map(({ url, lastModified }) => {
    const fromRss = rssByUrl.get(url);
    if (fromRss) {
      return { ...fromRss, lastModified };
    }

    return {
      title: 'Untitled',
      url,
      date: null,
      lastModified,
      description: '',
      tags: [],
      html: ''
    };
  });

  const posts = await hydrateMissingHtml(mergedPosts);
  const written = await writePosts(posts, outputDir);

  console.log(`Imported ${written} posts into ${outputDir}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
