import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const contentDir = path.resolve('src/content/blog');
const outputRoot = path.resolve('public/images/blog');

const markdownImageRegex = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function getExtension(url) {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname);
  return ext || '.png';
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(targetPath, buffer);
}

async function processFile(filePath) {
  const source = await readFile(filePath, 'utf8');
  const postSlug = path.basename(filePath, '.md');
  const postAssetDir = path.join(outputRoot, postSlug);
  await mkdir(postAssetDir, { recursive: true });

  const matches = [...source.matchAll(markdownImageRegex)];
  if (matches.length === 0) {
    return { changed: false, downloads: 0 };
  }

  let updated = source;
  let downloads = 0;
  const usedNames = new Set();

  for (const match of matches) {
    const originalUrl = match[1];
    const url = originalUrl.split('?')[0];

    if (!url.includes('storage.ghost.io')) {
      continue;
    }

    const baseName = sanitizeFilename(path.basename(new URL(url).pathname) || `image${getExtension(url)}`);
    let targetName = baseName;
    let index = 1;

    while (usedNames.has(targetName)) {
      const ext = path.extname(baseName);
      const stem = path.basename(baseName, ext);
      targetName = `${stem}-${index}${ext}`;
      index += 1;
    }

    usedNames.add(targetName);

    const targetPath = path.join(postAssetDir, targetName);
    const publicPath = `/images/blog/${postSlug}/${targetName}`;

    await downloadFile(url, targetPath);
    updated = updated.replaceAll(originalUrl, publicPath);
    downloads += 1;
  }

  if (updated !== source) {
    await writeFile(filePath, updated, 'utf8');
    return { changed: true, downloads };
  }

  return { changed: false, downloads: 0 };
}

async function run() {
  const files = (await readdir(contentDir))
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(contentDir, file));

  let changedFiles = 0;
  let totalDownloads = 0;

  for (const file of files) {
    const result = await processFile(file);
    if (result.changed) {
      changedFiles += 1;
      totalDownloads += result.downloads;
    }
  }

  console.log(`Localized images in ${changedFiles} file(s). Downloaded ${totalDownloads} image(s).`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
