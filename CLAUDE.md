# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal website for Noah Landesberg at https://www.noahlandesberg.com. Static site built with Astro, Markdown content, deployed on Netlify. Previously a Hugo + R blogdown site (2017–2026); pre-rebuild state preserved at the `v1-hugo-final` git tag.

## Commands

```sh
npm install              # install deps
npm run dev              # http://localhost:4321
npm run build            # → dist/
npm run preview          # serve dist/ on localhost:4321 (post-build sanity check)
```

There is no test suite, no linter, and no formatter configured. Verify changes by running `npm run build` and clicking through the affected pages with `npm run preview`.

Astro requires Node ≥ 22.12 (per `engines` in `astro/package.json`). Netlify is pinned to Node 22 in `netlify.toml`. If you bump Astro and the Netlify build fails with an engines error, that's the variable to update.

## Deploy & rollback

- Pushes to `master` deploy to production via Netlify (~1 min). PRs get auto-built deploy previews — the URL appears as a check on the PR.
- To roll back: Netlify dashboard → Deploys → previous successful deploy → "Publish deploy". One click, no git involved.
- Build config lives in `netlify.toml` (publish dir `dist`, command `npm run build`, Node 22). Overrides any dashboard build settings.

## Repo architecture

```
src/
├── content/blog/          Markdown blog posts (4 currently)
├── content.config.ts      Content collection schema (Astro 6 loader API)
├── layouts/               BaseLayout (shell), PostLayout (post chrome)
├── legacy/                Frozen pre-rendered HTML from the R/blogdown era (3 posts)
├── assets/                Build-time-optimized images (e.g. avatar.jpg)
├── pages/
│   ├── index.astro
│   ├── projects.astro
│   ├── 404.astro
│   └── blog/
│       ├── index.astro            /blog/ — combined post listing
│       ├── [...path].astro        /blog/<permalink>/ — Markdown posts via collection
│       └── post/<slug>.astro      /blog/post/<slug>/ — frozen R-rendered HTML, one file per post
└── styles/global.css      All site styles (no framework, no Tailwind)

public/
├── image/                 Static images referenced by posts (book covers, etc.)
└── rmarkdown-libs/        Required JS/CSS runtime for the frozen DiagrammeR post
```

### Adding a Markdown blog post

Drop a file in `src/content/blog/<slug>.md`:

```md
---
title: My new post
date: 2026-05-05
permalink: post/my-new-post
description: One-line summary used by the meta description and post-list display.
---

Body in Markdown.
```

The `permalink` field controls the URL relative to `/blog/`. Conventionally `post/<slug>`. For one-off posts that need a non-`/post/` URL (the 2021-in-review post is an example), set `permalink` to the desired path.

## Architectural quirks worth knowing

These are the parts that don't make sense from reading any one file alone.

### Two routing systems for blog posts

Markdown posts (4) live in the content collection and render through the dynamic route `src/pages/blog/[...path].astro`, which calls `getStaticPaths` based on each post's `permalink` frontmatter field.

The three R-rendered posts from the blogdown era — DiagrammeR, rhymer intro, Reply All scraping — are NOT in the content collection. They live as raw HTML fragments in `src/legacy/` and are rendered through dedicated `.astro` files at `src/pages/blog/post/<slug>.astro`. Each such page imports its HTML body via `?raw`, wraps it in `PostLayout`, and renders the body with `<Fragment set:html={body} />`.

The blog listing in `src/pages/blog/index.astro` and the home page combine both sources by hardcoding the three frozen posts into an array next to `getCollection('blog')` results.

**Why**: re-running the original R code at build time would require maintaining R + blogdown forever. The pre-rendered HTML is the canonical artifact for those posts; we serve it as-is.

### DiagrammeR widget script handling

The DiagrammeR post's HTML body contains `<script>` tags for `htmlwidgets.js`, `viz.js`, `grViz.js`, plus inline `<script type="application/json">` data blocks per widget. Browsers don't execute `<script>` tags inserted via `set:html`, so the four loader scripts and the DiagrammeR stylesheet are stripped from the body and re-emitted in the page `<head>` via the `head` slot in `BaseLayout` / `PostLayout`. The inline JSON data blocks are non-executing, so they ride along in the body and the htmlwidgets framework finds them via DOM queries.

Same pattern for the Reply All post's `kePrint.js` (kable tables).

If you regenerate the legacy fragments or change scripts they reference, mirror the head-hoisting in the corresponding `src/pages/blog/post/<slug>.astro`.

### URL parity with the legacy Hugo site

Every post URL the prior Hugo site exposed must continue to resolve. The existing slugs:

- `/blog/post/building-my-website-with-blogdown/`
- `/blog/post/8-analytics-books-i-read-in-2017/`
- `/blog/post/2020-12-20-2020-lists/`
- `/blog/post/thinking-in-systems-with-diagrammer/` (frozen)
- `/blog/post/introducing-rhymer/` (frozen)
- `/blog/post/web-scraping-reply-all-transcripts/` (frozen)
- `/blog/2022-02-20-2021-in-review/` (note: not under `/post/`)

If you migrate a post, set `permalink` so the resulting URL matches the legacy one. The `2022-02-20-2021-in-review` outlier exists because Hugo's section directory mapping differed for that post; the Astro setup handles it via the per-post `permalink` field.

### PostHog is cookieless

PostHog is initialized in `src/layouts/BaseLayout.astro` with `persistence: 'memory'` (no cookies, no localStorage). Each visit is treated as a new identity. This is deliberate so the site doesn't need a consent banner. If you change `persistence`, factor in cookie-consent obligations.

The PostHog project key is read from `import.meta.env.PUBLIC_POSTHOG_KEY` (set in Netlify env vars). The init is guarded by `if (key)` so local builds without the env var don't crash; PostHog is just inert.

### Images

The legacy book-cover JPEGs in `public/image/` are intentionally NOT run through Astro's `<Image>` component — they're already small and referenced by Markdown posts that we don't want to transform. New typography-first images can be optimized through `<Image>` from `src/assets/` if added later.

### Aesthetic conventions

The design is intentionally early-internet-flavored: system serif body, monospace metadata, oxblood `#b14545` accent used in three places only (link hover underline, project `↗`, `::selection`), warm off-white `#fdfbf5` background. Don't reach for default-browser blue/purple links — links inherit body color and use a font-weight bump in prose for affordance, with a faded oxblood underline appearing on hover. CSS variables for these live at the top of `src/styles/global.css`.

H2s carry a 3px oxblood vertical bar to the left as a rhythm marker. `<hr>` is restyled as a centered `* * *` editorial divider via `::before` content.
