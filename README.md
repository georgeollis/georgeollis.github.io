# georgeollis.com

Personal blog by George Ollis — writing about Azure, cloud architecture, AI, and infrastructure.

Built with [Astro](https://astro.build), deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Writing a new post

Create a `.md` file in `src/content/blog/` with this frontmatter:

```md
---
title: "Post title"
description: "One line summary"
date: 2026-05-06
tags:
  - azure
---

Post content here.
```

## Deployment

Pushes to `main` automatically build and deploy via `.github/workflows/deploy.yml`.
