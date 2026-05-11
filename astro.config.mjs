import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://georgeollis.github.io',
  output: 'static',
  redirects: {
    '/about-me': '/me',
  },
});
