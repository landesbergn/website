# Mobile Title Load-Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On touch devices, make the site title "Noah Landesberg" animate in on every page load — letters dropping in staggered, each flashing a palette color before settling to ink — so majority-mobile visitors see the site's signature delight (which is otherwise hover-gated and invisible to touch).

**Architecture:** Pure CSS, no JavaScript, no DOM changes. The markup already wraps each title letter in `<span style="--i: N" aria-hidden="true">` (in `BaseLayout.astro`), so we only add a `@keyframes` + an `animation` rule scoped to `@media (hover: none)`, plus one line in the existing reduced-motion block. `animation-fill-mode: backwards` is used (never `forwards`) so the rule applies the start frame only during the stagger delay and reverts cleanly afterward — no flash, no layout shift, no locking of the cascade.

**Tech Stack:** Astro static site, hand-written CSS in `src/styles/global.css` (no framework). Node ≥ 22.12. Verify via `npm run build` + `npm run preview` (no test suite exists).

---

## Context the implementer needs

- All site styles live in one file: `src/styles/global.css`. There is no CSS framework.
- The title markup is generated in `src/layouts/BaseLayout.astro` (lines ~33-35): each character of "Noah Landesberg" is a `<span style="--i: ${i}" aria-hidden="true">`, and the parent `<a>` carries `aria-label="Noah Landesberg — home"`. **Do not change this markup** — the animation reuses it as-is. Accessibility is already handled (animated letters are `aria-hidden`; the link has a label).
- The existing **hover** wave + color cascade is at `src/styles/global.css:93-114`. It is desktop-only in practice (touch has no hover). **Leave it unchanged.**
- The palette CSS variables are defined at the top of the file: `--color-accent` (oxblood), `--accent-mustard`, `--accent-teal`, `--accent-rose`, `--color-text` (ink).
- The existing reduced-motion block is at `src/styles/global.css:633-652` (`@media (prefers-reduced-motion: reduce)`).
- Branch `mobile-title-load-reveal` already exists and has the design spec committed. Work continues on it. Do **not** commit to `master` (it deploys to production on push).

## File Structure

- Modify only: `src/styles/global.css`
  - Add one `@keyframes title-reveal` block + one `@media (hover: none)` block, placed immediately after the existing hover-cascade rules (after line 114), so all title-animation rules sit together.
  - Add `animation: none;` to the title-span selector inside the existing `@media (prefers-reduced-motion: reduce)` block.

No other files change.

---

### Task 1: Add the load-reveal animation (touch only, reduced-motion-safe)

**Files:**
- Modify: `src/styles/global.css` (insert after line 114; edit reduced-motion block ~633-652)

- [ ] **Step 1: Add the keyframes + touch-only animation rule**

Insert the following immediately AFTER the existing hover-cascade block that ends at line 114 (the line `.site-header h1.site-title a:hover span:nth-child(4n+4) { color: var(--accent-rose); }`):

```css

/* Mobile load-reveal: the title's color cascade is hover-gated, so touch
   visitors never see it. On touch devices (no hover) replay it automatically
   on every page load — letters drop in staggered, each flashing a palette
   color before settling to ink. Reuses the per-letter spans + --i index from
   BaseLayout. Pure CSS; `backwards` fill (never `forwards`) keeps the start
   frame only during the stagger delay and reverts cleanly after — no flash,
   no layout shift, and it never locks the spans out of the cascade. */
@keyframes title-reveal {
  0% {
    opacity: 0;
    transform: translateY(9px);
    color: var(--color-text);
  }
  55% {
    color: var(--c, var(--color-text));
  }
  100% {
    opacity: 1;
    transform: none;
    color: var(--color-text);
  }
}

@media (hover: none) {
  .site-header h1.site-title a span {
    animation: title-reveal 0.55s cubic-bezier(.34, 1.56, .64, 1) backwards;
    animation-delay: calc(var(--i, 0) * 40ms);
  }
  /* Per-letter palette target, same 4-color cycle as the hover cascade. */
  .site-header h1.site-title a span:nth-child(4n+1) { --c: var(--color-accent); }
  .site-header h1.site-title a span:nth-child(4n+2) { --c: var(--accent-mustard); }
  .site-header h1.site-title a span:nth-child(4n+3) { --c: var(--accent-teal); }
  .site-header h1.site-title a span:nth-child(4n+4) { --c: var(--accent-rose); }
}
```

- [ ] **Step 2: Disable the animation under reduced-motion**

In the existing `@media (prefers-reduced-motion: reduce)` block, find this rule (around line 636-639):

```css
  .site-header h1.site-title a span,
  a.project-link .arrow {
    transition: none;
  }
```

Change it to also kill the animation:

```css
  .site-header h1.site-title a span,
  a.project-link .arrow {
    transition: none;
    animation: none;
  }
```

(This block is later in the file than the `@media (hover: none)` rule and has equal selector specificity, so for a touch user who also prefers reduced motion it wins — the title appears instantly, no motion. `animation: none` on `.arrow` is harmless; the arrow has no animation.)

- [ ] **Step 3: Build to verify no CSS/build errors**

Run: `npm run build`
Expected: build completes successfully, `dist/` written, no errors.

- [ ] **Step 4: Verify the animation in a mobile viewport**

Run: `npm run preview` (serves `dist/` at http://localhost:4321)

In a browser, open the site and check all of the following:

1. **Mobile (touch emulation):** Open DevTools, toggle device toolbar / emulate a phone (this makes `@media (hover: none)` match). Reload the page. Expected: the title "Noah Landesberg" drops in letter-by-letter (left to right) with each letter briefly flashing a palette color (oxblood/mustard/teal/rose), settling to ink. Navigate Home → Projects → Lately; expected: it replays on each page load.
2. **Desktop (mouse):** In a normal (non-emulated) window where `hover: hover` matches, reload. Expected: NO load animation; the title is static on load. Hover the title; expected: the existing wave + color cascade still works exactly as before.
3. **Reduced motion:** In DevTools, emulate `prefers-reduced-motion: reduce` (Rendering tab → "Emulate CSS media feature prefers-reduced-motion") while still in mobile emulation. Reload. Expected: the title appears instantly, fully visible, with no drop and no color flash.
4. **No layout shift / no invisible title:** In all cases the title occupies its normal space immediately (only opacity/transform animate); it is never permanently invisible.

If any check fails, fix the CSS and re-run Steps 3-4 before committing.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "$(cat <<'EOF'
Add mobile load-reveal for the site title

On touch devices (@media hover: none), replay the title's letter-by-letter
color cascade automatically on every page load, so majority-mobile visitors
see the signature delight that's otherwise hover-gated. Pure CSS, reuses the
existing per-letter spans + --i index, respects prefers-reduced-motion, and
uses animation-fill-mode: backwards so it never flashes, shifts layout, or
locks the desktop hover cascade. Desktop behavior unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec coverage** — checking each spec section against a task:
- "Make the title color cascade automatic on load for touch" → Task 1 Step 1. ✓
- "Mobile/touch only; desktop untouched" → `@media (hover: none)` (Step 1) + desktop verification (Step 4.2). ✓
- "Every page load; pure CSS, no storage" → CSS `animation` runs on every load; no JS/storage added. ✓
- "Same 4-color palette cycle as hover" → `:nth-child(4n+1..4)` `--c` assignments (Step 1). ✓
- "`animation-fill-mode: backwards`, not forwards" → Step 1 animation shorthand ends in `backwards`. ✓
- "Respect prefers-reduced-motion" → Step 2. ✓
- "No FOUC / no layout shift" → `opacity:0` only inside keyframe + backwards-fill window; verified Step 4.4. ✓
- "Verification: build, mobile preview, desktop hover intact, reduced-motion" → Steps 3-4. ✓
- "Dedicated branch, not master" → Context note + already on `mobile-title-load-reveal`. ✓

**2. Placeholder scan** — no TBD/TODO/"handle edge cases"/vague steps; all CSS shown in full. ✓

**3. Type/name consistency** — keyframe name `title-reveal` is referenced identically in the `animation` shorthand; custom property `--c` is defined per `nth-child` and consumed in the `55%` keyframe; palette variable names (`--color-accent`, `--accent-mustard`, `--accent-teal`, `--accent-rose`, `--color-text`) match those defined at the top of `global.css`. ✓
