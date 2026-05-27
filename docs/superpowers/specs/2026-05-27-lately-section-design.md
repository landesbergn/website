# Lately section — design

A new section of the personal site at `/lately/` — a running, ever-growing chronological log of things Noah has been up to (reading, watching, hearing, building, going). One page, newest entries on top, optional photo per entry surfaced via hover (desktop) or tap (mobile).

## Goals

- A low-friction place to share short, dated personal updates without the weight of a blog post.
- Visual when there's something to show (concert, hike, project), text-only otherwise — both first-class.
- Easy to add a new entry: edit one file, drop one image, push.

## Non-goals

- Not a blog replacement. Long-form reflections still go in `src/content/blog/`.
- No tagging, filtering, search, RSS, comments, or social sharing. Single chronological page.
- No image processing pipeline beyond what already exists in the repo. Photos are served as-is from `public/`.

## Page

- **URL:** `/lately/`
- **Nav:** add a "Lately" link to the top nav, after "Writing": `Home · Projects · Writing · Lately`
- **Page heading:** `Lately` (as an H2, matching the project page's oxblood-bar treatment)
- **Intro line:** "A running log of things I've been up to."

## Layout

### Desktop (≥ ~720px)

Two-column 50/50 split. Page max-width ~1040px — wider than the 720px blog column to give the photo enough presence at half-width.

```
+----------------------------+----------------------------+
| Lately                     |                            |
| A running log of things... |                            |
|                            |                            |
| ● May 26  Finished ...     |   [ blank on load ]        |
| ● May 24  Caught Big...    |                            |
| ● May 20  Dipsea hike...   |                            |
| ● May 18  Pasta from...    |                            |
| ● May 14  Mendocino...     |                            |
| ●                          |                            |
+----------------------------+----------------------------+

(hovering "Big Thief" row →)

+----------------------------+----------------------------+
| ● May 26  Finished ...     | ┌──────────────────────┐   |
| ● May 24 [Caught Big...]   | │                      │   |
| ● May 20  Dipsea hike...   | │     [photo]          │   |
| ● May 18  Pasta from...    | │                      │   |
| ● May 14  Mendocino...     | └──────────────────────┘   |
|                            | Adrianne Lenker, Fox       |
|                            | Theater, 5/24              |
+----------------------------+----------------------------+
```

**Left column** — one row per entry. Each row:
- Small oxblood dot (`●`). Filled at full opacity if the entry has a photo; ~35% opacity if not. Acts as the visual cue for "this is hoverable."
- Date in monospace, muted color, tabular-nums, fixed-width slot (~5em).
- Entry text in serif body. Inline markdown allowed (italics, links).

**Right column** — sticky positioned (`position: sticky; top: 24px`) so the photo stays in view while the left column scrolls.

### Interaction

- **On load:** right pane is blank (empty, no placeholder image).
- **Hover entry with photo:** right pane fills with `<img>` + caption. Pane stays filled when mouse leaves the entry.
- **Hover entry without photo:** no change. Whatever was last shown stays put. Avoids flicker on every mouse-over.
- **Keyboard focus:** focusing a list item (Tab navigation) triggers the same swap. Each row is a `<li>` containing a focusable element (either `tabindex="0"` on the `<li>` or, if the entry has a link, the link is the focus target).
- **Hovered row visual:** subtle oxblood background tint (`#b1454522`) on the text, matching the existing `::selection` aesthetic.
- **Reduced motion:** no transitions on the right-pane swap (it's already a hard swap, no animation, so this is moot — but worth noting).

### Mobile (< ~720px)

Single column. No sticky pane.

- Entries with a photo show a small "▾ photo" indicator after the entry text in the oxblood accent color.
- Tap the indicator (or anywhere on the row, for tap-target generosity) to toggle the photo inline below the entry, with the caption below it.
- Default state: collapsed. State is per-entry; multiple entries can be open at once.
- The indicator flips between `▸ photo` (collapsed) and `▾ photo` (expanded).

```
Lately
A running log of things I've been up to.

May 26  Finished The Sympathizer.
─────────────────────────────────
May 24  Big Thief at the Fox.  ▾ photo
        ┌────────────────────┐
        │     [photo]        │
        └────────────────────┘
        Adrianne Lenker, 5/24
─────────────────────────────────
May 20  Dipsea hike.  ▸ photo
─────────────────────────────────
May 18  Pasta from scratch.
─────────────────────────────────
```

## Data model

Single file: `src/data/lately.yaml`.

```yaml
- date: 2026-05-26
  text: Finished *The Sympathizer* — second time through, even better.

- date: 2026-05-24
  text: Caught [Big Thief](https://bigthief.net) at the Fox in Oakland.
  photo: big-thief-fox.jpg
  caption: Adrianne Lenker, Fox Theater, 5/24

- date: 2026-05-20
  text: Hiked the Dipsea with friends — fog all the way to Stinson.
  photo: dipsea-fog.jpg
  caption: Somewhere above Stinson
```

**Fields:**

| Field | Required | Type | Notes |
|---|---|---|---|
| `date` | yes | ISO date (YYYY-MM-DD) | Sort key. Newest first at render time. |
| `text` | yes | string (inline markdown) | Italics (`*x*`), links (`[x](url)`). Block-level markdown intentionally not supported — entries should stay short. |
| `photo` | no | string (filename) | Filename only, no path prefix. Resolved against `public/image/lately/`. |
| `caption` | no | string | Plain text. Shown under the photo in monospace muted color. Doubles as the image `alt` attribute. |

**Validation:** loader-side check (in the page's Astro frontmatter): every entry must have `date` and `text`. If `photo` is present, `caption` must also be present (so we never render an image without alt text). Build fails loud if violated.

**Sort:** entries are sorted by `date` descending in the page component. Order in the YAML file doesn't affect render order, but convention is newest-first for readability when editing.

**Markdown rendering:** use a small inline-only Markdown processor. Options:
- Astro's built-in `marked` or `markdown-it` (already a transitive dep)
- A 20-line regex pass for `*em*` and `[text](url)` only

Recommend: use whatever Astro already bundles to avoid a new dep. Restrict to inline rendering (no `<p>` wrappers).

## Files added / changed

```
src/
├── data/
│   └── lately.yaml                  NEW — entries
├── pages/
│   └── lately.astro                 NEW — page component
└── layouts/
    └── BaseLayout.astro             EDIT — add Lately to nav

public/
└── image/
    └── lately/                       NEW directory — entry photos
        └── (one file per entry)

src/styles/global.css                 EDIT — Lately-specific styles
                                       (or co-locate in lately.astro via <style>)
```

## Styles

Lately-specific CSS lives in `src/pages/lately.astro` under a scoped `<style>` block. Reuses existing CSS variables (`--color-bg`, `--color-text`, `--color-muted`, `--color-rule`, `--color-accent`, `--font-serif`, `--font-mono`).

A custom page max-width is needed (~1040px) since the default `--content-max` is 720px. Two ways to handle:

1. Override `.page` max-width on the Lately page via a body class or wrapper class
2. Apply a wider container only within the Lately page

Recommend: option 2 — keep `.page` at 720px, but add a `.lately-wide` wrapper inside the page main slot that breaks out to 1040px on viewports that can fit it. Avoids affecting site-wide layout.

## Update workflow

To add an entry:

1. (If there's a photo) drop the image into `public/image/lately/`. Recommended ~1200px wide, JPG or PNG, hand-resized — no build-time processing.
2. Open `src/data/lately.yaml`, add an entry block at the top with today's date.
3. `git commit && git push` to master. Netlify deploys in ~1 minute.

No CMS, no admin UI. The README/CLAUDE.md update will document this workflow.

## Accessibility

- Each entry is a `<li>` inside a `<ul>`. Markup is a real list, not a `<div>` grid.
- The right pane is `<aside aria-live="polite">` so screen readers announce content swaps when a sighted user hovers/focuses.
- Photo `<img>` has `alt` set to the entry's `caption`. If `caption` is empty (shouldn't happen — see validation), `alt=""` (decorative).
- Each list item has `tabindex="0"` so keyboard users can focus through entries and trigger the same pane swap. The hovered/focused state styling is the same.
- Mobile expand/collapse uses a real `<button>` inside the `<li>` with `aria-expanded` and `aria-controls`.
- No information conveyed by color alone: the filled-vs-faded dot is a hint; the actual "has photo" semantic is conveyed via the hoverable behavior on desktop and the explicit "▸ photo" button on mobile.
- `prefers-reduced-motion`: nothing animates anyway, so no special handling needed.

## Testing / verification

- `npm run build` succeeds, including the YAML loader and inline markdown step.
- `npm run preview` and click through `/lately/`:
  - Desktop: hover entries with photos, verify pane fills and sticks. Hover entries without photos, verify no flicker. Scroll, verify pane stays in viewport.
  - Mobile (DevTools responsive mode at 375px): tap "▾ photo" toggles, verify image and caption appear/disappear, verify multiple entries can be open.
  - Tab through entries from keyboard, verify focus styling and pane updates.
- Validation: temporarily add an invalid entry (photo without caption), confirm build fails with a useful message. Remove.
- Lighthouse / WAVE check on the rendered page for a11y regressions.

## Out of scope (now)

- Pagination / "show older" toggle — defer until the page is long enough to feel slow.
- Per-entry permalinks — defer until someone asks for one.
- Image optimization (Astro `<Image>` component) — defer; hand-sized JPEGs are fine to start, matching the convention in `public/image/`.
- RSS feed — defer until someone asks.
- Video / embed support — start with images only. Add when needed.
