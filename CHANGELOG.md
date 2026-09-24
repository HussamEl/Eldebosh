# Changelog

A few lines per delivery, newest first. Earlier history (2026-09-02 to
2026-09-20, with its decision, issue and risk logs) is in git at `c54dcff`.

## 1.0.7 — 2026-09-24

- Published after the owner's review on the live site (EB-019): guide
  `liten-powerbank-for-fickan` and article `sa-forlanger-du-batteriets-livslangd`.
  The battery cluster is complete.
- Hidden products (`verified: false`) we own and photographed stay on the home
  page and the market stall with photo, name and code only: no specs, price
  band or buy link (EB-019, RULES 2.4). `audit` fails any buy link for a
  hidden product; it caught 12 on the old build (`P-11`, `P-22`).

## 1.0.6 — 2026-09-24

- Until launch, a page at stage `written` shows its text on the live site
  under a yellow "waiting for review" banner, and its card on the home page
  says so (EB-017). It stays noindex and out of the sitemap, and carries the
  disclosure before any buy link. Switch: `SHOW_WRITTEN_FOR_REVIEW` in
  `src/lib/review-codes.ts`, off at launch (L3). RULES 2.8 notes it.
- Found, not changed (TASKS Q6): the home page shows six hidden products,
  two with a buy button, although RULES 2.4 says a hidden product appears on
  no page.

## 1.0.5 — 2026-09-24

- Review codes on the live site until launch (EB-015): the product code
  (`P-01`) beside the brand on tiles and cards, and the photo code (`P-01-2`)
  under each of our photos. One switch, `SHOW_REVIEW_CODES` in
  `src/lib/review-codes.ts`, turned off at launch with the build stamp (L3).
- Preview build: a page at stage `written` now shows its text (with the
  "ready for review" bar) instead of the empty skeleton. The live site is
  unchanged.
- Replies link to the changed pages on the live site instead of raw GitHub
  URLs; `INSTRUCTIONS.md` v1.3.

## 1.0.4 — 2026-09-24

- `P-03` corrected: it has three ports (2 × USB-C, 1 × USB-A) and no built-in
  cables, per the maker's page and the owner's own unit. The same claim is
  removed from its pros and from the pick reason in `basta-powerbank-2026`.
- Article `sa-forlanger-du-batteriets-livslangd` written (stage `written`),
  from Apple's and Google's own battery pages. Its description no longer says
  that charge count does not matter; Google's page says it does.
- Gemini paused by the owner (EB-013): he reviews alone, and every content
  delivery lists each claim with its source. `INSTRUCTIONS.md` v1.2.

## 1.0.3 — 2026-09-24

- Weights from the makers' pages for `P-01` (250 g), `P-02` (189 g) and
  `P-03` (513 g), with the source beside each value. `P-04` has none: the
  maker gives no weight and the retailer gives two. The published
  comparison `10000-vs-20000-mah` now shows the weights in its table.
- Guide `liten-powerbank-for-fickan` written (stage `written`, two picks,
  three maker sources); waits for Gemini's review and the owner's approval.

## 1.0.2 — 2026-09-23

- Skeleton triage (T4, approved in EB-009): six skeletons unpublished because
  we do not own the products their page type requires — `usb-c-vs-lightning`,
  `billaddare-usb-c`, `kabelhantering-skrivbord`, `mobilhallare-bil`,
  `magnetfaste-vs-klamfaste`, `ventilationsgaller-vs-vindruta`. Six are to be
  written, six wait for product data until 2026-11-01. Order in
  `docs/project/TASKS.md`.

## 1.0.1 — 2026-09-23

- Collaboration protocol 1.2 (`docs/project/INSTRUCTIONS.md` v1.1): consult
  before any change, with one exception for fixing a broken build or publish;
  Claude Code writes content, Gemini reviews it independently, the owner
  decides. Claude Project leaves the setup; `PROJECT_BOX.md` removed.
- Every reply ends with a change summary, raw GitHub URLs of changed files and
  three ready-to-copy replies.

## 1.0.0 — 2026-09-23

A full review and rebuild of how the project is built, checked, published and
documented. Visitors see the same site, with one compliance fix.

**Publishing**
- The site is built in GitHub Actions instead of being committed: `site/` is
  no longer in the repository. Edits saved in `/admin/` now reach the live
  site with no manual step (before, they never did).
- The exact build that passed every check is the one published to `deploy`.
- Reproducible builds: the version stamp is the time of the last source
  commit, so pushes that change only docs or scripts publish nothing.

**Admin panel**
- Sveltia CMS pinned (`@sveltia/cms` 0.204.0) and shipped with the site
  instead of loaded from a CDN; tested in a real browser (`npm run test:admin`).
- Config rewritten: dropdowns for category, subcategory, icons and product
  references; fields in working order ending with "visible on the site";
  photos converted to webp on upload.
- `public/admin/.htaccess` stops browsers caching the CMS for a year.

**Photos**
- Any uploaded photo is composed into a 720×720 tile in the house style at
  build time (`scripts/lib/tile.mjs`); `npm run tile` does it by hand.

**Compliance**
- The affiliate disclosure now sits above the first buy link on the home page
  and on the market-stall pages (it was below the products on the home page and
  missing on the stall pages). `npm run audit` now fails any page where a buy
  link comes before the disclosure.

**Tooling**
- `npm run new:product` creates a product file with the next free code.
- `scripts/lib/repo.mjs` shares loaders between scripts; `make-state` rewritten
  (per-product "what is missing" table, next free code, skeleton deadlines).
- Removed: the drift guard, server-cleanup script, CSV export, Python tile
  script, archive scripts, the generated start file.
- Windows: remaining `.pathname` path builders replaced with `fileURLToPath`.

**Documentation**
- Every code comment rewritten in English to explain what and why, without
  development history.
- About 36 documents replaced by: `README.md`, `CLAUDE.md`,
  `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/CONTENT.md`,
  `docs/OPERATIONS.md` (English), and `docs/project/HANDOVER.md`,
  `INSTRUCTIONS.md`, `PROJECT_BOX.md`, `TASKS.md`, `LOG.md` (Arabic), plus the
  generated `STATE.md` and `ASSETS.md`.
- Message counter restarted at `EB-001`; collaboration documents at `v1.0`.
