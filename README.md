# noahlandesberg.com

Personal site for [Noah Landesberg](https://www.noahlandesberg.com). Built with [Astro](https://astro.build) and deployed on [Netlify](https://netlify.com).

## Local development

```sh
npm install
npm run dev   # http://localhost:4321
```

## Deploy

Pushes to `master` deploy to production via Netlify. PRs get deploy-preview URLs automatically.

## Adding a blog post

Drop a Markdown file in `src/content/blog/` with the frontmatter below. Pushing to GitHub is enough — Vercel rebuilds.

```md
---
title: My new post
date: 2026-05-05
permalink: post/my-new-post
description: One-line summary for SEO and the post-meta line.
---

Body in Markdown.
```

The `permalink` field controls the URL (relative to `/blog/`). Existing posts use `post/<slug>` to match the legacy Hugo URL scheme.

## Layout

- `src/pages/` — top-level pages and dynamic routes
- `src/content/blog/` — Markdown blog posts
- `src/layouts/` — `BaseLayout` (shell) and `PostLayout` (post chrome)
- `src/styles/global.css` — site-wide styles
- `src/legacy/` — pre-rendered HTML from the prior R/blogdown era (DiagrammeR, rhymer, Reply All); served via dedicated pages under `src/pages/blog/post/`
- `public/` — static passthrough (favicons, post images, the `rmarkdown-libs/` widget runtime used by the legacy DiagrammeR post)

## History

This site was previously built with Hugo + R blogdown using the `hugo-renga` theme (2017–2026). The pre-rebuild state is preserved at the `v1-hugo-final` git tag.
