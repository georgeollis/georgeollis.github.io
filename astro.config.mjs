import { defineConfig } from 'astro/config';
import remarkToc from 'remark-toc';

export default defineConfig({
  site: 'https://georgeollis.github.io',
  output: 'static',
  markdown: {
    remarkPlugins: [remarkToc]
  }
});
