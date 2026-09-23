# Operations

Running, checking, publishing and repairing eldebosh.com.

---

## Setup

Node 22 and npm. On a fresh clone:

```
npm ci
npx playwright install chromium     # once, for the browser tests
npm run dev                         # local site at http://localhost:4321/sv/
```

The owner's machine runs Windows 11; every script works there (paths from
`fileURLToPath`, npm scripts without shell-specific syntax).

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local development server, with the admin panel at `/admin/` |
| `npm run check` | The binding content rules only (`scripts/validate.mjs`) — seconds |
| `npm run build` | Rules, then `astro build` into `site/`, then the Pagefind index |
| **`npm run verify`** | **Everything below, in order. Must pass before any push** |
| `npm run state` | Regenerate `docs/project/STATE.md` — the status board and the only source of numbers |
| `npm run assets` | Regenerate `docs/project/ASSETS.md` — every photo by code |
| `npm run new:product -- …` | Create a product file with the next free code ([CONTENT.md](CONTENT.md#adding-a-product)) |
| `npm run tile -- <photo> P-NN-K` | Compose one photo into a product tile |
| `npm run preview:file` | One offline HTML file of the whole site, drafts included, for review on a phone |
| `npm run serve` | Serve the built `site/` on port 8080 |
| `npm run brand:all` | Regenerate logo, icons, social and print assets (needs Python deps) |

### What `verify` runs

| Check | Catches |
|---|---|
| `build` (with `check`) | Any broken content rule; schema errors; build errors |
| `test:claims` | Regressions in the experience-claim detector (33 cases) |
| `check:css` | Unbalanced braces, orphan selectors, duplicate rules, unused classes, undefined tokens |
| `check:colors` | A colour outside the design system, in CSS, SVG, admin or components |
| `test:ui` | The UI script's behaviour in a real DOM (jsdom) |
| `test:browser` | The built site in Chromium: layout on phone and desktop, filter, viewer, focus, scroll lock, the no-JavaScript fallback, brand files served |
| `test:admin` | The admin panel loads the pinned CMS with `config.yml` and opens real entries |
| `audit` | Every built page: one h1, alt text, image sizes, canonical, description, broken internal links, affiliate `rel` and tag, disclosure above buy links, skeletons that sell, uncached-safe asset URLs |
| `check:drafts` | A published fixed page still containing draft text |
| `state`, `assets` | Regenerate the two status files (rewritten only when their content changes) |
| `check:docs` | Collaboration documents carry a version, and a changed one has a raised version; prints the next message number and Karlstad time |
| `check:admin` | A field present in content files but missing from the admin config (the CMS would delete it on the next save); subcategory options out of sync |
| `check:links` | A relative link in any Markdown document pointing to a missing file |

**If a check fails, fix the cause.** Never weaken or skip a check to get green.

---

## Publishing

```
push to main  (from a developer, or a save in /admin/)
  └─ GitHub Actions: .github/workflows/verify.yml
       verify job   npm ci → build → every check above → upload site/ as an artifact
       publish job  (main only, only if verify passed)
                    downloads that exact build, commits it to the `deploy` branch
                    → GitHub webhook → Hostinger pulls `deploy` into public_html
```

- The build that was tested is the build that is published; it is never
  rebuilt in between.
- `deploy` holds only the built site at its root. Each publish is a child of
  the previous commit — never a force push, because the host runs `git pull`.
- Builds are reproducible, so a push that changes only docs or scripts
  produces an identical site and no new deploy commit.
- **Pushes go directly to `main`** — standing permission from the owner. A
  session that is forced onto a branch works there, then merges into `main`,
  pushes, and deletes the branch in the same session. No pull request unless
  the owner asks for one.

### Is it live?

Every page carries the site version:

```
<meta name="eldebosh-build" content="2026-09-23 19:36">
```

It is the time of the last commit that changed the site's sources. Until
launch it is also shown next to the logo. If the live page shows the time of
your change, it is live.

Where to look when it is not: GitHub → Actions (the failing check is named in
the log) → the `deploy` branch's last commit → hPanel → Websites →
eldebosh.com → Advanced → Git → Deployments.

---

## The admin panel

`https://eldebosh.com/admin/` — Sveltia CMS, version pinned in `package.json`
(`@sveltia/cms`) and shipped with the site.

**Sign in:** "Sign In with Token", using a GitHub fine-grained personal access
token limited to the `HussamEl/Eldebosh` repository with the permission
**Contents: Read and write**. Create it at GitHub → Settings → Developer
settings → Personal access tokens → Fine-grained tokens. When it expires, make
a new one the same way. The token is never written into any file.

**Configuration:** `public/admin/config.yml`. Labels are Arabic (the owner's
language), comments English. Do not add `base_url` — it is for an OAuth proxy
this site does not run. After any change: `npm run check:admin` and
`npm run test:admin` (both in `verify`).

**Upgrading the CMS:** change the version of `@sveltia/cms` in
`package.json`, `npm install`, `npm run verify`. `test:admin` confirms the new
version loads the config and opens real entries.

---

## Hosting (Hostinger)

Set once; recorded here for a rebuild or a move.

1. Empty `public_html` completely in the File Manager. Git will not deploy into
   a folder with other files, and leftovers keep serving pages the site no
   longer builds.
2. hPanel → Websites → eldebosh.com → Advanced → **Git** → connect GitHub →
   repository `HussamEl/Eldebosh`, **branch `deploy`** (never `main`: it would
   publish the source), directory `public_html`. Deploy.
3. Copy the webhook URL Hostinger shows, then on GitHub: repository Settings →
   Webhooks → Add webhook → paste as Payload URL, content type
   `application/json`, just the push event.

From then on every publish reaches the live site with no manual step.
`public/.htaccess` sets the index and 404 pages, compression, caching and two
security headers; it must be at the root of `deploy` (the workflow fails if it
is missing). `public/admin/.htaccess` turns off long caching for the admin
panel, whose files cannot carry a content hash. HTTPS is enforced by
Hostinger's SSL setting, not by `.htaccess`.

**Never install WordPress in `public_html`.** Its `index.php` and `.htaccess`
take over every request. If WordPress is ever needed, use a subdomain.

---

## When something breaks

| Symptom | Likely cause | Action |
|---|---|---|
| Actions red | A check failed; nothing was published | Open the run, read the named failure, fix, push |
| Actions green, site old | The webhook did not reach the host | hPanel → Git → **Redeploy**. Check the webhook's recent deliveries on GitHub |
| Site without styling | `.htaccess` missing, or wrong directory | Confirm directory `public_html` and that `deploy` has `.htaccess` at its root |
| A deleted page still loads | Files left from before Git deploy | Empty `public_html`, then Redeploy |
| Admin: "not found" or no save | Token expired or lacks Contents write | Make a new token (above) |
| Admin: a field disappeared after saving | The field is not in `config.yml` | `npm run check:admin` names it; add it to the config |
| Build fails: skeleton older than 90 days | A skeleton's deadline passed | Write the page, or set `published: false`. Never move its date |

**Manual fallback, no build needed:** download the `deploy` branch as a ZIP from
GitHub (Code → Download ZIP while viewing the `deploy` branch), empty
`public_html` **completely**, and upload the ZIP's contents. Uploading on top of
old files has broken the site before; always empty first.

---

## Project memory

The repository is the only memory of this project: collaborators work in
separate conversations that are not kept. If information is needed and not
found here, it is missing — ask, then add the answer to the right document in
the same change.

| Where | What |
|---|---|
| `docs/project/STATE.md` | Generated status: products, pages, stages, deadlines, the next free code |
| `docs/project/TASKS.md` | The current task list |
| `docs/project/INSTRUCTIONS.md` | How the owner, Claude Code and Claude Project work together |
| `docs/project/LOG.md` | The message counter (`EB-###`) |
| `CHANGELOG.md` | What changed, per delivery |
| git history | Everything else. The project before the v1.0 rebuild, with its decision, issue and risk logs, is commit `c54dcff` |
