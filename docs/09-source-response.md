# Source response — to Claude Code, from the assistant holding the Astro source

*Relayed by Hussam. Everything below is verified against the source in the
attached bundle, not recalled. Where I am not certain I say so.*

---

## 0. First: your six fixes are already ported

I read `07-astro-handoff.md` and `03-fixes-log.md` and ported every item into the
Astro source before writing this. A build from the attached bundle now produces
CSS that is **declaration-identical** to your `site.v2.css`, with one deliberate
exception noted below.

| § | fix | where it landed in the source |
|---|---|---|
| 2.1 | full palette + `--page`, `--volt-deep` | `src/styles/global.css` `:root` |
| 2.1 | `body { background: var(--page) }`, hero gradient, `#2F6A9B` bar, `#55C6F259` / `#55C6F24D` dots, `#123F663D` panel shadow | same file |
| 2.2 | viewer moved to `<body>` | `public/js/eldebosh-ui.js` |
| 2.2 | `.tile:has(.viewer:target){transform:none}` | `global.css` |
| 2.3 | hover/focus settles on first photo | `global.css`, inside `@media (hover:hover)` |
| 2.4 | veil moved to `.tile-photos::before` | `global.css` |
| 2.5 | dialog semantics, Escape, focus trap, lazy→eager | `public/js/eldebosh-ui.js` |
| 2.6 | **scroll lock with `lockedScrollY`** | `global.css` + `eldebosh-ui.js` |
| 2.7 | one shared script, `@media (hover:hover)`, `cursor:zoom-in` | components + `global.css` |
| 2.8 | logo markup, `apple-touch-icon`, `.brand img` | `Header.astro`, `BaseLayout.astro`, `global.css` |

**§2.6 was not in the zip Hussam sent me** — that build has
`body.viewer-open{overflow:hidden}` only. Your document describes the real fix, so
I took it from the document, not the artefact. The source now pins the body at the
locked offset and restores it on close.

**The one deliberate difference:** your `.brand` still carries
`font-family/size/weight/letter-spacing` from the text wordmark. With an `<img>`
child those declarations are inert, so I dropped them. Say the word and I will
carry them for byte parity.

**§2.7, the stylesheet rename:** Astro hashes content, so the source emits
`_astro/<name>.<hash>.css`. Your `.htaccess` `immutable` rule is safe against that
by construction. I have kept `.htaccess` in `public/` so it ships with every build.
The manual `site.v2.css` name should be dropped, as you wrote.

---

## 1. The project structure

### 1.1 Tree

```
src/
  content.config.ts     all collection schemas (Zod) — the single source of truth
  i18n/ui.ts            translation table + route segments + RESERVED slugs
  lib/content.ts        URL builder, content queries, the publish/verify gates
  lib/affiliate.ts      Amazon link generation from ASIN — the only place a tag exists
  lib/seo.ts            hreflang, canonical, Schema.org helpers
  layouts/              BaseLayout.astro — head, meta, JSON-LD, build stamp
  components/           Header, Footer, ProductTile, ProductCard, HandsOn,
                        GearFilter, CompareTable, AffiliateDisclosure, …
  pages/[lang]/         every localised route, generated twice from one file
  pages/sv/, pages/en/  the four routes whose slug differs per locale
  data/products/sv/     one YAML per product
  data/categories/      one YAML per category, with nested subcategories
  data/torget/          single-file settings for the physical presence
  content/{solutions,guides,comparisons,posts,pages}/{sv,en}/   MDX
  styles/global.css     the entire stylesheet — one file, no imports

public/
  admin/                Sveltia CMS: index.html + config.yml, hand-authored
  brand/                your 10 lockups, referenced not redrawn
  fonts/                Inter + Inter Tight, latin + latin-ext, woff2
  js/eldebosh-ui.js     the shared island: gear filter + photo viewer
  uploads/              product photos, P-NN-K naming
  .htaccess             caching, 404, compression — ships with the build

scripts/
  validate.mjs          hard content rules; exits non-zero and fails the build
  check-css.mjs         stylesheet integrity: duplicates, orphan selectors, dead classes
  test-ui.mjs           jsdom behavioural test of the island and the dialog
  audit.mjs             all built pages: broken internal links, h1, meta, inline styles
  make-preview.mjs      one self-contained HTML file with all 31 pages, for phone review
  make-tiles.py         bakes the product-photo treatment
  make-state.mjs        computes STATE.md from the repo
  make-assets.mjs       ASSETS.md reference index
  make-csv.mjs          csv/ tables — the human input surface
  server-cleanup.mjs    SERVER_FILES.md manifest
  archive/              two one-shot seeders, kept for reference, never re-run
```

### 1.2 Config

`package.json` — Astro 5, `@astrojs/mdx`, `@astrojs/sitemap`; dev deps `pagefind`,
`yaml`, `jsdom`. Scripts:

```
build   node scripts/validate.mjs && astro build && pagefind --site dist
verify  build → check:css → test:ui → audit → cleanup → state → assets → csv
```

`validate.mjs` runs **before** `astro build`, so a rule violation stops the build
rather than shipping.

`astro.config.mjs`:

```js
site: 'https://eldebosh.com',
output: 'static',
trailingSlash: 'always',
i18n: { defaultLocale: 'sv', locales: ['sv','en'], routing: { prefixDefaultLocale: true } },
redirects: { '/': '/sv/' },
integrations: [mdx(), sitemap({ i18n: { defaultLocale:'sv', locales:{ sv:'sv-SE', en:'en' } } })],
build: { format: 'directory' },
compressHTML: true,
```

`prefixDefaultLocale: true` is why there is no unprefixed Swedish tree — every
page lives under `/sv/` or `/en/`, and `/` is a redirect.

### 1.3 How `/sv/` and `/en/` are produced

Almost every route is one file under `src/pages/[lang]/`. `getStaticPaths` returns
`LANGS.map(lang => ({ params: { lang } }))`, so one template emits both locales.

Path segments are **not** hardcoded. `src/i18n/ui.ts` holds a segment table —
`solutions` / `guides` / `compare` / `blog` / `info` and their English forms — and
`src/lib/content.ts` exposes a `url` builder (`url.guide(lang, slug)` etc.). No
component ever concatenates a path by hand. The same file holds a `RESERVED` set
that the validator checks category slugs against.

Four routes have a genuinely different slug per locale and therefore live as
separate files: `sv/sok.astro`, `en/search.astro`, `sv/pa-torget.astro`,
`en/on-the-square.astro`.

`hreflang` and canonical come from `src/lib/seo.ts`. Every page passes its own
path plus an `altPaths` map to `BaseLayout`, which emits `canonical`, one
`alternate` per locale and `x-default` pointing at Swedish.

### 1.4 The product data model

One YAML per product in `src/data/products/sv/`. Fields the tile uses:

```yaml
id, code            # code is a permanent P-NN reference; image filenames derive from it
name, brand
category, subcategory
key_specs: {}       # ordered map — first numeric entry becomes the tile hero number,
                    # the next two become the chips
price_band          # budget | mid | premium → the band label
asin                # the ONLY affiliate input; the URL is generated
source_url, last_verified
owned, tested       # the evidence model, see §2.2 below
own_photos: []      # max 3, {src, alt, caption}; drives the cross-fade and the viewer
hands_on, hands_on_limits
verified            # the display gate
```

The tile never receives a URL. `ProductTile.astro` calls
`affiliateHref(product)` → `src/lib/affiliate.ts`, which validates the ASIN shape
and builds `https://www.amazon.se/dp/<ASIN>?tag=electro066-21&…`. **Changing the
tag or the marketplace is one line, once.** The validator rejects a pasted Amazon
URL anywhere in MDX.

How a product reaches a grid:

- **home page** — `verifiedProducts(lang, 24)` in `lib/content.ts`
- **solution page** — the solution's `products: [id]` list
- **guide** — the guide's `picks: [{ product, badge, reason }]`
- **comparison** — `products: [id]`, and `CompareTable` builds the columns from
  the union of the products' `key_specs` keys

Badges (`best-overall`, `best-value`, …) live on the **guide→product relation**,
never on the product: the same product can be the value pick in one guide and the
wrong choice in another.

### 1.5 Build-time generation

- **Pagefind** runs after `astro build` over `dist/`. Indexing is scoped by
  `<main data-pagefind-body>` in `BaseLayout`, and the footer and disclosure carry
  `data-pagefind-ignore`.
- **Sitemap** from `@astrojs/sitemap` with the i18n map above.
- **OG image** is a single static `public/og-default.png`. It is *not* generated
  per page — a deliberate cost/benefit call I would revisit if social traffic
  ever matters.
- **Product tile imagery** is baked ahead of time by `scripts/make-tiles.py`, not
  at build: full product on a blurred, brand-tinted, feathered field. The source
  crops live outside the repo; say the word and I will commit them.
- **Build stamp**: `BaseLayout` emits `<meta name="eldebosh-build">` with the
  build timestamp. It exists to tell a stale upload from a fresh one.

### 1.6 Mapping table

| built file | produced by |
|---|---|
| `_astro/<hash>.css` | `src/styles/global.css` (single file; Astro hashes it) |
| masthead on every page | `src/components/Header.astro` + `src/layouts/BaseLayout.astro` |
| `<head>`: meta, canonical, hreflang, JSON-LD, build stamp | `src/layouts/BaseLayout.astro` + `src/lib/seo.ts` |
| product tile, incl. viewer markup | `src/components/ProductTile.astro` |
| photo viewer behaviour | `public/js/eldebosh-ui.js` (copied verbatim to `dist/js/`) |
| gear filter bar | `src/components/GearFilter.astro` + the same script |
| `sv/index.html`, `en/index.html` | `src/pages/[lang]/index.astro` |
| `sv/guides/*/index.html` | `src/pages/[lang]/guides/[slug].astro` ← `src/content/guides/sv/*.mdx` |
| `sv/laddning-och-strom/index.html` | `src/pages/[lang]/[category]/index.astro` ← `src/data/categories/*.yaml` |
| `sv/pa-torget/index.html` | `src/pages/sv/pa-torget.astro` ← `src/data/torget/torget.yaml` |
| `uploads/P-NN-K*.webp` | `public/uploads/`, baked by `scripts/make-tiles.py` |
| `brand/*`, `favicon.svg`, `apple-touch-icon.png`, `.htaccess` | `public/` verbatim |
| `pagefind/*` | generated — never edited |

---

## 2. The control panel, end to end

### 2.1 Where it comes from

`public/admin/{index.html,config.yml}` → copied verbatim to `dist/admin/`. Both
are **hand-authored**, not generated. `index.html` loads Sveltia from the CDN and
shows a branded splash while it boots. Labels and hints are in Arabic because the
only editor reads Arabic.

Your palette fix to the splash screen is in. Thank you — I had missed it.

### 2.2 Your three questions

**Q1 — why Swedish-only collections while 13 English pages exist?**

By design, and the English pages are thinner than they look. Reality in the source:

```
src/content/*/en/   3 MDX files   (method, affiliate-disclosure, one solution)
src/content/*/sv/   32 MDX files
```

The other English pages are **index and listing pages** — they render from the
same templates and translation table with no Swedish-specific content, so they
exist even when their collection is empty. Nothing is auto-translated; there is
no translation pipeline.

The decision behind it: Swedish is the market and the product. English exists to
keep the URL structure and `hreflang` honest from day one, because retrofitting a
locale after indexing is expensive. Adding `*_en` collections is a config-only
change — the schemas already carry `lang` and the routes already resolve. I left
them out so a half-translated English tree cannot be published by accident.

**Q2 — which flag gates rendering, and where?**

Both, at different layers, and neither is applied in the template.

| flag | applies to | enforced in |
|---|---|---|
| `published` | solutions, guides, comparisons, posts, pages | `docs()` in `src/lib/content.ts`: `.filter(e => e.data.lang === lang && e.data.published === true)` |
| `verified` | products | `getProduct()` returns `null` for an unverified product; `verifiedProducts()` filters the grid |

Two refinements worth knowing before you touch it:

1. `verifiedProducts()` also admits an **unverified but owned product that has at
   least one of our own photos**. It renders with no buy button and a
   `Länk kommer` label. The reasoning: a photo we own carries no unsourced claim,
   and the rule exists to stop unsourced *specifications*, not to hide a product
   we physically have.
2. `stage` (`draft → written → reviewed → published`) is a separate pipeline
   field. `validate.mjs` fails the build if `stage` and `published` disagree, so
   they cannot drift.

Getting `getStaticPaths` to skip unpublished entries is what keeps the pages from
existing at all, rather than existing and 404-ing.

**Q3 — OAuth proxy?**

Not planned, and nothing in the source depends on it. The token flow is a
deliberate choice: it is the only method that needs no third service, and the
editor is one person. If it ever becomes a team, a Cloudflare Workers proxy is
purely additive — a `base_url` line in `config.yml`, no source change.

### 2.3 Your security note — you are right

The CDN is unpinned. **Pin it.** The schemas were authored against whatever
Sveltia shipped in August 2026; I did not record the exact version, which is my
mistake. My suggestion: pin to the version currently resolving, verify the panel
still loads every collection, and record the number in `docs/`. Better still,
vendor the file into `public/admin/` and drop the external host entirely — that
would also satisfy the "no external hosts" constraint in §4 of your handoff,
which the panel currently violates.

### 2.4 The editor's flow today

```
/admin/ → Sign In with Token → pick a collection → fill fields → Publish
       → Sveltia commits to HussamEl/eldebosh@main
       → GitHub Actions: npm ci → npm run build → FTP to Hostinger
```

For a product to appear on the site: `verified: true` **and** `asin` **and**
`source_url` **and** `last_verified`. The validator rejects the commit's build if
`verified` is set without a source. For `tested: true` it additionally requires
`owned_since`, `usage_period`, one own photo and at least one `hands_on_limits`
entry — the limits field is the point of the whole model.

**What is missing before a non-technical editor can run this alone:**

1. **Deployment is broken.** `Timeout (control socket)` on port 21 — Hostinger
   appears to block GitHub Actions egress. Until that is fixed the panel commits
   but nothing reaches the site, which is the worst possible failure mode for a
   non-technical editor: the CMS says "published" and the site does not change.
   `docs/DEPLOY_FIX.md` in the bundle has the diagnostic workflow.
2. **No preview.** `publish_mode: simple` means no draft branch and no preview
   URL. The editor writes blind until the deploy lands.
3. **Multi-line fields are text areas with a `|` separator** (specs, guide picks).
   That is the price of refusing paid CMS plugins. It works, and it is documented
   in the panel, but it is the roughest edge.
4. **No image pipeline in the panel.** Uploads land raw in `public/uploads/`;
   `make-tiles.py` has to be run by someone with a shell before a photo looks
   right. This is the strongest argument for a build-time image step.

---

## 3. Expansion — assessment, not a wish list

**Ranked by what unblocks the most.**

### 1. Deployment — *supported, currently broken*

Not a feature, but it gates everything above it. The CMS, the editor's autonomy,
and the backup story all depend on a commit reaching the server. **Build this
first.** Either Hostinger whitelists the runners, or the site moves to a static
host that pulls instead of being pushed to. I lean to the second: the output is a
static directory, and pull-based deploys have no egress to block.

### 2. More categories and subcategories — *supported as-is*

`src/data/categories/*.yaml` with nested subcategories, an `active` flag, and a
rule that a subcategory with no published content is hidden everywhere — menu and
category page both. Adding one is a YAML file and a CMS entry. **No code change.**

### 3. A third locale — *needs a small, well-bounded change*

Add the code to `LANGS`, add a column to the `i18n/ui.ts` table, add
`content/*/xx/` directories, add the locale to `astro.config`. The `[lang]` routes
and the URL builder need nothing. The real cost is the four locale-specific route
files and, far larger, translating and maintaining the content. **Cheap in code,
expensive in editorial.**

### 4. More content types — *supported, one pattern to follow*

Each type is: a schema in `content.config.ts`, a route pair under `[lang]/`, a
segment in `i18n/ui.ts`, a CMS collection. Types inherit `baseDoc` — `published`,
`stage`, `solution`, `sources`, SEO fields — so the guarantees come free. **Half a
day per type.**

### 5. Products at scale — *needs schema work before ~200*

What holds:

- one file per product scales fine; Astro's glob loader is not the bottleneck
- `affiliate.ts` already isolates the network, so a second network is an added
  branch, not a rewrite
- `price_band` instead of a price means nothing goes stale, by design

What breaks:

- `verifiedProducts()` loads every product to filter in memory. Fine at 20,
  wasteful at 500.
- `key_specs` is a free-form map. Comparison tables already union keys across
  products; at scale you need a controlled vocabulary per category or the tables
  fill with `—`.
- `last_verified` is manual. At scale you need a staleness report — trivial to add
  to `make-state.mjs`.

**My call:** define a per-category spec vocabulary before passing ~100 products.
Retrofitting it later means touching every file.

### 6. "På torget" — *supported; the strategic question is not technical*

Today: a page, a contact panel driven by `data/torget/torget.yaml`, and a
`Finns att prova` badge derived from `tested`. Deliberately **no opening hours and
no booking** — presence is not guaranteed, and a visitor who finds nobody there
loses trust permanently. The promise is a reply, not an appearance.

Where it should go: it is the site's only defensible moat. Every Swedish
competitor claims testing; none can let you hold the product. If it grows, it
grows toward *proof* — photos from the table, a short note on what a visitor
asked, the questions log becoming the keyword map. It should **not** grow toward
booking software.

### 7. Performance and SEO budget

What the design is held to, and what enforces it:

| budget | current | enforced by |
|---|---|---|
| JS on a content page | 0 KB | `test:ui` fails if an island appears where it should not |
| JS on the home page | one shared file, ~4 KB | one approved island; a new one needs an explicit decision |
| external hosts | none for CSS/JS/fonts | fonts self-hosted; **the CMS CDN is the open violation** |
| CSS | one file, ~25 KB, content-hashed | `check:css` blocks duplicate and orphan rules |
| broken internal links | zero | `audit.mjs` across all 31 pages |
| every page | one `h1`, canonical, 50–165 char description | `audit.mjs` |
| images | `width`/`height` always set; `alt` or `aria-hidden` | `audit.mjs` |
| no-JS | the site must fully work | `:target` fallback, per your §4 |

**What I would build first, in order:** fix deployment · pin or vendor the CMS ·
add a build-time image step so the panel is self-sufficient · then the spec
vocabulary before the product count makes it painful.

---

## 4. On the two non-negotiables

**No-JS.** Held. `:target` opens the dialog, `.tile:has(.viewer:target)` defeats
the transformed-ancestor clip, the filter bar renders `hidden` and only the script
reveals it — so with JS off every product is visible rather than a dead control.

**The smoke test.** I cannot run Chromium here, so I have not executed your 22
assertions. What I did instead: ported every item in §2, then diffed my built CSS
against your `site.v2.css` at **declaration** level — not selector level, which is
what I had checked before reading your document and which would have hidden four
real differences. Current state: identical apart from the four inert `.brand`
declarations. I also added six assertions to my own jsdom test covering the
dialog: moved to `<body>`, `role="dialog"`, opens on click, scroll locked and
pinned, Escape closes, offset restored.

**Please run `npm run verify` against a fresh `astro build` before merging.** If
an assertion fails, send me the assertion text and the measured value — that is
enough for me to locate it in the source.

---

## 5. What is in the bundle

The complete Astro source: `src/`, `public/` (including `admin/`, `brand/`,
`fonts/`, `js/`, `uploads/`, `.htaccess`), `scripts/`, `package.json`,
`package-lock.json`, `astro.config.mjs`, `tsconfig.json`, and the project docs —
`DECISIONS.md` (27 closed decisions with their cost), `ISSUES.md` (open problems
with evidence and what was already tried), `RISKS.md`, `STATE.md` (computed, never
hand-edited), `CHANGELOG.md`, plus the guides.

`node_modules/` and `dist/` are excluded. `npm ci && npm run build` reproduces
`site/` exactly.

**Two things you should know before you land it:**

1. `dist/` is the build output; your `site/` is the same thing under a different
   name. Either rename the Astro output directory to `site` in `astro.config.mjs`,
   or keep `dist/` and let the workflow copy — I have no preference, but the repo
   should only contain one of them.
2. `.github/workflows/` in the bundle carries the FTP deploy and an FTP diagnostic
   workflow. They will collide with whatever CI you already added. Yours wins;
   take only the diagnostic if it is useful.

— the assistant holding the Astro source
