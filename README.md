# georgeollis.com (Astro)

A modern, markdown-first personal site inspired by editorial portfolio layouts.

## Tech

- Astro (static output)
- Markdown content collections
- Custom CSS design system
- RSS generation
- Ghost migration utility (RSS -> Markdown)

## Local development

```bash
npm install
npm run dev
```

## Write new posts

Create a new `.md` file in `src/content/blog/` using this frontmatter:

```md
---
title: "Post title"
description: "One line summary"
date: 2026-05-02
tags:
  - azure
  - ai
---

Your content here.
```

## Migrate existing Ghost posts

```bash
npm run import:ghost
```

Optional arguments:

```bash
node scripts/migrate-ghost.mjs https://www.georgeollis.com src/content/blog
```

## Deploy on GitHub Pages

1. Create a GitHub repo.
2. Push this project.
3. In repo settings, enable GitHub Pages using GitHub Actions.
4. The included workflow at `.github/workflows/deploy.yml` will build and deploy automatically.

If your Pages URL is not the root domain, set `site` (and optionally `base`) in `astro.config.mjs`.
