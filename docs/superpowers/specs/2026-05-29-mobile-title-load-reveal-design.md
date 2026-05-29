# Mobile title load-reveal — design

**Date:** 2026-05-29
**Status:** Approved (design), pending implementation

## Problem

More than half of site visitors are on mobile, but every "delightful" interaction on the
site is **hover-gated** and therefore invisible to touch:

- the per-letter wave + color cascade on the "Noah Landesberg" site title,
- the project `↗` arrow tilt,
- the social-icon color swap,
- the link underline-on-hover affordance.

Two animations *do* run on touch already (the `* * *` divider shimmer, the 404 gradient
drift), but the signature delight — the colorful title — never fires for a phone visitor.

## Decision

Take the site's **existing** title delight (the letter wave + palette color cascade) and
make it **automatic on load** for touch devices, instead of inventing new mobile-only
mechanics.

This was chosen after exploring ~13 alternatives (scroll-reveal, tactile press states,
device-tilt, time-of-day background, page transitions, sticky header, finger-trail, scroll
progress, end-of-page sign-off, link underline sweep, etc.). The throughline of the
rejection: keep the delights that are already *the site's*, and make them reach the phone —
not add a new mobile vocabulary. See "Non-goals" below.

Two product decisions confirmed with the user:

- **Scope: mobile / touch only.** Desktop already has the hover wave and stays untouched.
- **Cadence: home page only** (revised 2026-05-29 after first review — originally "every page
  load"). The reveal fires when `/` loads but not on subsequent navigations to Projects /
  Lately / blog, so it reads as a landing-page welcome rather than a repeating tic. Achieved by
  scoping the CSS to a `.home` class (no JS, no storage — still consistent with the cookieless
  ethos).

## Behavior

On touch devices, when the site header renders:

1. Each letter of "Noah Landesberg" starts slightly below its resting position and invisible.
2. Letters animate in **staggered** left-to-right (drop up + spring + fade in).
3. Mid-animation each letter briefly **flashes its palette color** following the same
   4-color cycle the hover uses — oxblood `--color-accent`, mustard `--accent-mustard`,
   teal `--accent-teal`, rose `--accent-rose` — then settles to ink (`--color-text`).
4. Total run ≈ 1.1s (≈40ms stagger × 15 chars + ~0.55s per-letter animation).

The space character is included in the span sequence (as it already is for the hover); its
drop and color are simply invisible — no special-casing needed.

## Implementation

Pure CSS, no JavaScript. All changes in `src/styles/global.css`. The markup already provides
what we need: `BaseLayout.astro` wraps each title letter in its own `<span style="--i: N"
aria-hidden="true">`, and the `<a>` carries an `aria-label`, so the animation is invisible to
assistive tech and adds no DOM.

- Mark the home page: `BaseLayout.astro` adds a `home` class to the `.page` wrapper when
  `Astro.url.pathname === '/'`. The reveal selectors descend from `.home`.
- Add a new rule **inside `@media (hover: none)`** so it only affects touch devices. Desktop
  (`hover: hover`) is unchanged.
- **Specificity caveat:** adding the `.home` ancestor raises the rule to (0,3,3), above the
  reduced-motion `animation: none` override. So that override is also scoped to
  `.home .site-header h1.site-title a span` (equal specificity, later in source → it still
  wins). Forgetting this would silently re-enable the animation for reduced-motion users.
  - Define a `title-reveal` `@keyframes`: `0%` = `opacity:0`, `translateY(8–10px)`, color ink;
    ~`55%` = `color: var(--c)` (the per-letter palette color); `100%` = `opacity:1`,
    `transform:none`, color ink.
  - On `.site-header h1.site-title a span`: `animation: title-reveal ~0.55s
    cubic-bezier(.34,1.56,.64,1) backwards;` with `animation-delay: calc(var(--i, 0) * 40ms);`.
  - Assign `--c` per letter via `:nth-child(4n+1..4)` mirroring the hover's color cycle.

- **`animation-fill-mode: backwards` (NOT `forwards`)** is load-bearing. `backwards` applies
  the `0%` keyframe only during the stagger delay (so later letters don't flash visible before
  their turn), and after the animation ends the span reverts to its base style. We deliberately
  avoid `forwards`, which would keep overriding `transform`/`color` after completion and lock
  out any future state. (On mobile there is no hover, so this is mostly hygiene, but it keeps
  the rule from fighting the cascade and matches desktop behavior conceptually.)

- **Reduced motion:** extend the existing `@media (prefers-reduced-motion: reduce)` block
  (already at the bottom of `global.css`) to add `animation: none;` to
  `.site-header h1.site-title a span`. Because that block appears later in source than the
  `@media (hover: none)` rule and has equal specificity, it wins for a touch user who also
  prefers reduced motion → letters appear instantly, no motion, fully visible.

### No FOUC / no layout shift

`opacity:0` lives only inside the keyframe and the `backwards`-fill window; the span's base
opacity stays `1`. If CSS is slow or the animation is disabled, letters render normally. No
JS means no flash-of-unstyled or hydration gap.

## Non-goals (explicitly rejected)

- New mobile-only mechanics: device-tilt, shake-to-scramble (both also need iOS motion
  permission — ruled out), time-of-day background, palette finger-trail, page transitions,
  end-of-page sign-off.
- Generic web patterns: scroll-progress bar, condensing sticky header.
- Re-gating the old delight behind a tap target nobody uses (tapping the heading).
- Touching desktop behavior.
- Any storage / "once per session" throttling.

## Verification

No test suite exists. Verify by:

1. `npm run build` succeeds.
2. `npm run preview`, open in a mobile viewport (DevTools device emulation + a real phone via
   the deploy preview): confirm the title drops in with the color flash on load and on each
   navigation.
3. Desktop: confirm the hover wave still works and nothing animates on load.
4. Toggle "Reduce motion" (OS or DevTools emulate `prefers-reduced-motion`): confirm the title
   appears instantly with no animation on mobile.
5. Deploy preview on the PR for a final real-device check.

## Delivery

Per project convention, this work is done on a **dedicated branch** (never committed directly
to `master`, which deploys to production on push). Ship via PR; the Netlify deploy preview is
the real-device verification surface.
