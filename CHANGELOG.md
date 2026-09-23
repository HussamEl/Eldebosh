# Changelog

A few lines per delivery, newest first. Earlier history (2026-09-02 to
2026-09-20, with its decision, issue and risk logs) is in git at `c54dcff`.

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
