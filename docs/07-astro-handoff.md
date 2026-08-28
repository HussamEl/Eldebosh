# Handoff brief — for the assistant that owns the Astro source

*Written in English on purpose: this page is meant to be pasted, whole, into the
conversation that holds the Astro source. Everything below is verified against
the built site in this repository, not recalled from memory.*

---

## 1. Situation

The repository **github.com/HussamEl/Eldebosh** (branch `main`) now holds:

```
site/    the deployed build output (dist) — 18 sv pages, 13 en pages
brand/   the visual identity: vector masters, exports, and the generators in src/
tools/   verify-site.mjs — a 22-check browser smoke test
docs/    architecture, design system, fixes log, brand, deployment, roadmap
```

The site build in `site/` has been repaired and re-themed, and a full visual
identity has been built and wired into it. **None of that exists in the Astro
source yet.** The next `astro build` will overwrite `site/` and silently undo
every fix listed below.

This document is the port list. Section 5 is what we need from you.

---

## 2. What changed in the build — and why

### 2.1 Palette

The build shipped a lime accent; the approved design is navy/sky blue. Token
values, as they must end up in the source stylesheet's `:root`:

```css
--ink:#10161D; --ink-2:#3F4C59; --muted:#66727F;
--paper:#FFFFFF; --page:#E7F2FD;          /* --page is new; body used --paper */
--mist:#F2F7FC; --mist-2:#E4EEF7;
--line:#D7E3EE; --line-2:#BCD2E3;
--brand:#1273D1;                           /* was #2563EB */
--brand-deep:#123F66;                      /* was #1E4D8F — masthead, footer */
--brand-hero:#14456E;                      /* was #2A63AB */
--brand-soft:#F0F7FE; --brand-tint:#D3E7FA;
--volt:#55C6F2;                            /* was #C4F04E (lime) */
--volt-deep:#2FB2E6;                       /* new — hover for --volt surfaces */
--warn:#8A4B1F;
```

Rules that carried hard-coded values of the old palette:

```css
body            { background: var(--page) }                  /* was var(--paper) */
.hero           { background: linear-gradient(168deg, var(--brand-hero), var(--brand-deep)) }
.hero .charge   { background:#2F6A9B }                       /* was #4A86CC */
.btn-volt:hover { background: var(--volt-deep) }             /* was #B6E63F */
.tile-dot           { box-shadow:0 0 0 2px #55C6F259 }       /* was #C4F04E59 */
.handson-badge .dot { box-shadow:0 0 0 3px #55C6F24D }       /* was #C4F04E4D */
.nav-panel          { box-shadow:0 20px 44px -14px #123F663D } /* was #1E4D8F3D */
```

`--volt` is an accent, not a text colour: never set small text in it on white.

### 2.2 The photo viewer was clipped inside its card — the headline bug

`.viewer` is `position:fixed`, but it was rendered **inside** `article.tile`,
which has `overflow:hidden` and takes `transform:translateY(-2px)` on hover. A
transformed ancestor becomes the containing block for fixed descendants, so the
dialog was laid out and clipped inside the ~240px card. The pointer is always
over the card at the moment of the click, so this fired on **every** desktop
open. Measured in Chrome at 1440×900:

| | before | after |
|---|---|---|
| `.viewer-box` | `204×729` at `y = -73` | `480×776`, centred |
| `.viewer-veil` | `236×434` (the card) | `1440×900` (the viewport) |

Fix, in two layers:

- JS moves every `.viewer` to `<body>` on load.
- CSS fallback for no-JS: `.tile:has(.viewer:target){transform:none}`

### 2.3 Hover froze the cross-fade mid-transition

```css
/* before */ .tile:hover .tile-photos .tile-photo { animation-play-state: paused }
```

Pausing an opacity cross-fade at an arbitrary frame leaves two half-faded photos
stacked. Replaced with a rule that settles on the first photo:

```css
@media (hover:hover){
  .tile:hover .tile-photos .tile-photo,
  .tile:focus-within .tile-photos .tile-photo { animation:none; opacity:0; transition:opacity .18s ease }
  .tile:hover .tile-photos .tile-photo:first-child,
  .tile:focus-within .tile-photos .tile-photo:first-child { opacity:1 }
}
```

### 2.4 Two rules fought over one pseudo-element

`.tile-face:after` draws the accent bar under the image; `.tile-face[href^="#"]:after`
drew the hover veil. The second won, so photo tiles lost their bar. The veil
moved to `.tile-photos:before` (`z-index:1`, `pointer-events:none`), which also
keeps it under the photo-count badge at `z-index:2`.

### 2.5 Dialog behaviour

`:target` alone jumped the page (measured `scrollY: 305` on open), ignored
Escape, and pushed a history entry per open and per close. `site/js/eldebosh-ui.js`
now owns it: `preventDefault` instead of a hash change, close on Escape / veil /
×, `role="dialog"` + `aria-modal` + `aria-labelledby`, a focus trap, focus
returned to the photo on close, and `loading="lazy"` flipped to `eager` on open
(lazy images inside a `display:none` container never start loading). `:target`
remains as the no-JS fallback.

### 2.6 Scroll lock — `overflow:hidden` is not enough

Opening the dialog still slid the page ~305px. Cause: focus moves to the close
button with `focus({ preventScroll: true })`, and **Chrome ignores that option
when focus lands inside a scrollable box** (`.viewer-box{overflow-y:auto}`);
`html{scroll-behavior:smooth}` delayed the jump so it read as unrelated. Fix —
pin the body at the locked offset:

```css
body.viewer-open { position:fixed; inset-inline:0; width:100%; overflow:hidden }
```
```js
lockedScrollY = window.scrollY;
document.body.style.top = `-${lockedScrollY}px`;
document.body.classList.add('viewer-open');
// on close
document.body.style.top = '';
window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
```

This also fixes background scrolling on iOS Safari, where `overflow:hidden` on
`body` does nothing. The bug was caught by the smoke test, not by review.

### 2.7 Cleanup

- The gear-filter script was duplicated verbatim inside `sv/index.html` and
  `en/index.html`; it now lives in `site/js/eldebosh-ui.js` together with the
  viewer, with a guard on `data-count-template` (it threw when absent).
- All card hover effects sit inside `@media (hover:hover)` so they stop sticking
  on touch screens.
- `cursor: zoom-in` on the clickable photo.
- The stylesheet was renamed `_subcategory_.DBnoV-zu.css` → `site.v2.css`,
  because `.htaccess` caches CSS `immutable` for a year and an in-place edit
  would never reach returning visitors. **Astro's content hashing solves this
  properly — once the source builds again, drop the manual name.**

### 2.8 Identity wired in

| file | state |
|---|---|
| `site/brand/*.svg` | new — 10 lockups the pages reference |
| `site/logo.svg`, `site/favicon.svg` | replaced |
| `site/og-default.png` | redesigned |
| `site/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | new |
| all 31 pages | masthead markup + an `apple-touch-icon` link |
| stylesheet | `.brand` / `.brand img` rules |

Masthead markup, before → after:

```html
<a class="brand" href="/sv/">elde<span>bosh</span></a>

<a class="brand" href="/sv/" aria-label="Eldebosh — startsida">
  <img src="/brand/eldebosh-logo-header.svg" alt="Eldebosh" width="170" height="26" decoding="async">
</a>
```
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```
```css
.brand { display:inline-flex; align-items:center; line-height:0 }
.brand img { height:26px; width:auto; display:block }
@media (max-width:22em){ .brand img { height:23px } }
```

The identity itself is generated, not hand-drawn: the wordmark is real vector
outlines pulled from the Inter Tight variable font already in `site/fonts/`,
shaped through HarfBuzz. `brand/src/` rebuilds every asset (`npm run brand:all`)
and the output is byte-identical between runs. Do not re-draw or re-colour the
logo in the Astro source — reference the files.

---

## 3. The contract the source has to keep

`npm run verify` boots a static server over `site/`, drives Chromium and asserts
22 things. It must still pass on a freshly built `site/`:

1. all 32 pages load with no console error, no page error, no 4xx
2. `--volt` is `#55C6F2` and `body` is `rgb(231,242,253)`
3. the header logo loads and is 26px tall, with an `aria-label` on its link
4. every `.viewer` is a direct child of `<body>`
5. the open dialog's veil is exactly the viewport, and its box is > 400px wide
6. opening changes neither `location.hash` nor `scrollY`
7. `body.viewer-open` is set and focus sits on `.viewer-close`
8. Escape closes, unlocks, and returns focus to `.tile-face`
9. hovering a 3-photo tile leaves at most one photo visible
10. with JS disabled, the `:target` dialog still covers the full viewport while
    the card underneath is hovered
11. on iPhone 13 the logo does not overlap the nav and the dialog fits the screen
12. the tested-only filter hides tiles and the count text follows
13. the identity files exist: favicon, logo, OG image, touch icons, header SVG,
    `js/eldebosh-ui.js`, `.htaccess`

Run it with `npm install && npm run verify` from the repo root.

---

## 4. Constraints worth stating once

- The site must keep working with JavaScript disabled; the `:target` fallback is
  not decoration.
- No external CSS/JS/font hosts. Fonts are self-hosted in `site/fonts/`.
- `.htaccess` must ship with the build; it carries the caching and the 404 rule.
- Pagefind's `site/pagefind/` is generated — never edit it by hand.
- Contact details are still placeholders. `site/sv/info/kontakt/` literally says
  *"UTKAST. Lägg till riktig kontaktuppgift innan lansering."* Do not invent any.

---

## 5. What we need from you

Please reply with the complete Astro source so it can live in this repository
next to the build. Concretely:

**a. The file tree** of the Astro project, with a one-line purpose per top-level
directory.

**b. The files themselves**, as full text (not fragments), at minimum:

- `package.json`, `astro.config.*`, `tsconfig.json` if present
- every file under `src/` — layouts, components, pages, content collections,
  i18n helpers and translation tables
- the stylesheet(s) that produce the built CSS, including the `:root` token block
- the content/data that drives the product tiles and the viewer (whatever holds
  brand, name, chips, band, `tested`, affiliate URL and the photo lists)
- `public/` — everything not generated, including `.htaccess`, `robots.txt`
- any script that runs Pagefind, the sitemap or the deploy

**c. A mapping table**: which source file produces which built file, for at
least `_astro/*.css`, the masthead/layout, the product tile, and the viewer.

**d. Your read on the port**: for each item in section 2, whether it belongs in
the source stylesheet, a component, or the layout — and anything in the source
that would conflict with it.

If the source is large, send it as a git bundle or a zip rather than pasted
text; a partial paste is worse than a file transfer.

---

## 6. Target end state

```
Eldebosh/
├── src/            Astro source          ← from you
├── public/         static assets         ← from you
├── site/           build output          ← produced by `astro build`
├── brand/          identity + generators ← exists
├── tools/          smoke test            ← exists
└── docs/           documentation         ← exists
```

`npm run build && npm run verify` should be one command away from green, and CI
already runs the smoke test on every push and pull request.
