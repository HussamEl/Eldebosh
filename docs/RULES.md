# Rules

The binding rules of eldebosh.com, why each exists, and what enforces it.

Most rules are enforced by code: `npm run build` stops on a violation, so a
page that breaks one never reaches the live site. Where a rule cannot be
checked by a program, it says so. **Fix the cause of a failing check; never
weaken the check to get a green build.**

Changing a rule is the owner's decision (see [Who decides](#who-decides)).

---

## 1. The idea the rules protect

eldebosh.com is a Swedish content site that takes a reader from an **everyday
problem** ("my phone dies before evening") to a **practical solution** and then
to a **suitable product**. Income is Amazon affiliate commission only. It is not
a shop and not a tech-news site.

What sets it apart: the owner **owns the products, photographs them himself**,
and takes them to his market stall in Karlstad so visitors can try them. So the
site never uses retailer photos, never says "best in test", and never prints a
number without a source. Every rule below keeps that promise true.

---

## 2. Content honesty

### 2.1 Nothing invented

No invented specifications, prices, ratings, certifications, statistics,
quotes or test results. Every figure traces to a named source. Where none
exists the text says *needs verification* and is not published.

This includes technical explanations: verify how a thing works before
explaining it.

*Enforced partly:* products need a source to be visible (2.4). The truth of a
sentence cannot be checked by a program.

### 2.2 Experience has exactly three states

| State | Data | Allowed | The reader sees |
|---|---|---|---|
| Tested | `tested: true` | First-person experience, our photos | Badge: we own and use it |
| Owned | `owned: true`, `tested: false` | Our photos, physical description — **no judgement of performance** | We own it; data being completed |
| Not owned | both `false` | Documented specifications and published sources only | An explicit line: we have not tested it |

`tested: true` requires `owned: true`, `owned_since`, `usage_period`, at least
one of our own photos, and `hands_on_limits` — what our use does **not** show.
The limits are the most important field: stating them is what separates us
from sites that claim tests that never happened.

*Enforced:* `scripts/validate.mjs` (fields), and the claim detector
`scripts/lib/claim-rule.mjs`: a page may use first-person experience wording
only with `hands_on: true` **and** a linked tested product. A denial ("we have
not tested it") is allowed; an implied claim ("nobody has tested it as long as
we have") is not. 33 test cases: `npm run test:claims`.

A page may not claim use of a whole group ("we use all four") when only some
of them are tested — `src/lib/overclaim.mjs`.

Describe what was **observed**, not what was **measured**:

```
✅ Efter en vinter i bilen sitter fästet fortfarande kvar.
❌ Vi mätte 22 W.        (no instrument — an invented number)
❌ Testad i labbmiljö.   (untrue)
```

The same hands-on sentence in two products tells the reader nobody wrote it
from experience. *Warned* by `validate.mjs`; three products currently carry
such text, which the owner will rewrite himself (see TASKS).

### 2.3 Banned phrases

- **"Bäst i test"** — anywhere, including interface strings. It claims a
  comparative test we did not run; Swedish marketing law treats that as
  misleading. Allowed only inside a denial ("we never write *bäst i test*").
- Claiming instrument measurements.
- Copying a source's text verbatim — restate it in our words.

*Enforced:* "Bäst i test" by `validate.mjs`. The other two: by the writer.

### 2.4 A product is hidden until verified

`verified: false` is the default, and such a product appears on no page. To
make it visible it needs `source_url` and `last_verified`. A specification
source is one of:

| | Source | Brought by |
|---|---|---|
| a | `source_url` on the **maker's** page | Claude Code, checked by the reviewer |
| b | `spec_photo` — our photo of the specification printed on the device | the owner |
| c | `owner_checked` — the date the owner compared the listing with the device | the owner |

A retailer listing (Amazon and similar) is written by the seller, not the
maker; alone it only produces a warning. `spec_photo` must be one of the
product's own photos.

*Enforced:* `validate.mjs`. A published page referring to a hidden product
fails the build.

### 2.5 Sources are direct and complete

Every cited source has `publisher`, `url`, `accessed`, and states its claim in
our words. The URL is the page itself — not a search engine, cache, proxy,
translator, or a link that wraps another link.

Rules for whoever researches (cannot be checked by a program):

- State at the top whether you actually browsed. An answer that does not say
  is returned.
- "No source" is a useful answer. A quote from memory is not.
- Cite the global page or the Swedish one, never another region's version —
  regional pages of one company can contradict each other. When two
  disagree, prefer the one that matches the Swedish authority.

*Enforced (form only):* `validate.mjs`.

### 2.6 No thin content — a skeleton is a promise with a date

A page may be published before its text exists — a **skeleton** — only when it
says so plainly, is marked as unwritten wherever it is listed, is `noindex`
and out of the sitemap, and **sells nothing** (no products, no buy links, and
therefore no disclosure). What stays forbidden is pretence: a page that looks
finished and is not, or a heading written to occupy a keyword.

A skeleton older than **90 days** fails the build: write it or unpublish it.
Moving its `updated` date to buy time defeats the rule and is not allowed.

*Enforced:* `validate.mjs` (age), `scripts/audit.mjs` (a skeleton that sells),
the page templates (`NotWritten.astro`, noindex), `astro.config.mjs` (sitemap).
Deadlines are listed in `docs/project/STATE.md`.

### 2.7 Every page leads back to a problem

Every guide, comparison and article has a `solution` field pointing to an
existing solution page. A published guide has at least two picks; a published
comparison has two to four products.

*Enforced:* `validate.mjs`.

### 2.8 A written page is not a published page

`published` (is the URL live?) and `stage` (how far is the text?) are
independent. Stages: `draft` → `written` → `reviewed` → `published`. Live
skeletons are `draft` or `written`. `reviewed` is never live. `stage:
published` requires `published: true`. A page whose text still contains draft
markers cannot be published.

**Until launch only** (`SHOW_WRITTEN_FOR_REVIEW` in `src/lib/review-codes.ts`,
owner's decision EB-017): a `written` page shows its text under a "waiting for
review" banner, so the owner can review it on the live site. It stays noindex
and out of the sitemap, and if it sells it carries the disclosure like any
commercial page. The switch is turned off at launch (TASKS L3).

*Enforced:* `validate.mjs`, `scripts/check-drafts.mjs`.

---

## 3. Amazon and affiliate links

The Amazon Associates account is active with tag `electro066-21` on
`amazon.se`. Its terms are followed literally — breaking them closes the
account, and with it the site's only income.

| | Status |
|---|---|
| Direct links to product pages, a "Köp på Amazon" button, sourced specifications | ✅ Allowed |
| **Images** from Amazon or any retailer | ❌ Only through the Product Advertising API |
| **Prices** | ❌ Only through the API |
| Buying through our own links, or asking family or friends to | ❌ Account closure |

The API opens after **three qualifying sales** — a sales threshold, not a site
review; nothing speeds it up.

**Never edit a retailer image to get around the rule.** Editing creates no
ownership and turns a violation into deliberate circumvention.

Rules:

1. **Amazon links are generated from `asin` only.** The tag lives in
   `src/lib/affiliate.ts`. A pasted Amazon URL fails the build.
2. **No affiliate link in article text.** Links live in product files and are
   rendered by `ProductCard` / `CompareTable` with
   `rel="sponsored nofollow noopener"`. No cloaking redirects.
3. **No fixed price anywhere.** Products have `price_band` (`budget` · `mid` ·
   `premium`) only; a `price` field fails the build.
4. **Disclosure at the top of every commercial page** (`AffiliateDisclosure`),
   not only in the footer — required by Marknadsföringslagen. The Amazon
   sentence is in the footer of every page and at the top of every page with a
   buy link.

*Enforced:* `validate.mjs` (1, 3, 2 in text), `scripts/audit.mjs` (rel
attributes, tag, disclosure on built pages).

---

## 4. Photos

- **Only the owner's own photos**, on their original background. Never a
  retailer's photo, even edited.
- **One to three photos per product**, named `P-NN-K` (product code, photo
  1–3). The first shows the product alone; the second shows scale; the third
  shows it in use — the one no competitor can fake.
- **Never show one product's photo under another's name**, even for testing.
  A photo is a visual claim.
- Every photo is served as a 720×720 `webp` tile in the house style; the build
  composes uploads automatically (see [CONTENT.md](CONTENT.md#photos)).
- Photos rotate with CSS alone — no new JavaScript.

*Enforced:* a referenced photo must exist in `public/uploads/` and be local
(`validate.mjs`). Product codes are unique, so photos cannot be shared by
accident. Whose photo it is cannot be checked by a program.

---

## 5. The market stall in Karlstad

The owner has a municipal permit for a table and tent on Stora Torget. It is
**not a registered company**; it is an activity declared to the tax agency.

- **No fixed opening hours** on the site. The only promise is answering the
  phone.
- **Never mention a storeroom or a room at home.**
- The products he brings are exactly those with `tested: true` — no extra field.
- **The site sells no products.** At the stall he may sell single cables and
  used items only; that is separate from the site.
- A placeholder phone number fails the build (`validate.mjs`).

---

## 6. Design rules

- Headings are compact: the main heading is about `2rem` at most.
- Header and footer use `--brand-deep`; the hero uses the lighter
  `--brand-hero`. **Never two dark blocks next to each other** — the trust bar
  before the footer is light for that reason.
- Every inner page starts with a full-width `--brand-soft` band with
  breadcrumbs and title: `<header class="page-head">` (`PageHead.astro`).
- Token names are neutral (`--brand`, `--brand-deep`). **Never put a colour
  name in a variable name.**
- `--volt` is reserved for three places: the charge bar, the tested dot, and
  the primary button. It is an accent, never text on white.
- Fonts are local in `public/fonts/`. **No font from another domain.**
- A home-page section appears only when it is full: 3 problem cards, 2 guides.
- **No category in the menu before it has 3 published pages** (`active:
  false` until then). **A subcategory with no published content does not
  appear at all.**
- Every empty state offers a way back, never a dead end.
- The home-page filter bar: `Alla`, then one button per group that has
  products — `Kablar` · `Laddare` · `Powerbanks`. Groups are defined only in
  `src/lib/gear-groups.ts`; counts are computed. No button for an empty group,
  no catch-all button. No new filter without an explicit request.
- On mobile: the menu is a hamburger icon, with the language badge beside it
  on the same line.
- Product cards show the photo first when there is one, otherwise the first
  numeric specification.

*Enforced:* `scripts/check-colors.mjs` (colours outside the palette, text
contrast), `scripts/check-css.mjs` (stylesheet integrity, undefined tokens),
`tools/verify-site.mjs` (layout in a real browser). The rest by review.

---

## 7. Technical constraints

| Item | Decision |
|---|---|
| Framework | Astro 5, static output only |
| Content | Astro content collections — MDX and YAML |
| Editor | Sveltia CMS at `/admin/`, pinned in `package.json` |
| Search | Pagefind |
| Hosting | Hostinger pulls the `deploy` branch |
| JavaScript | **None by default.** One script, `public/js/eldebosh-ui.js` (filter bar, photo viewer). A new script needs a written reason and the owner's approval |
| WordPress | **Forbidden on this domain.** Its `index.php` and `.htaccess` take over every request and break the static site. If ever needed: a separate subdomain |
| Secrets | **None in the repository**, including docs. Credentials live in GitHub Secrets |
| Product pages | Disabled. A product is data shown on pages, not a page |

Trade-off order when two goals conflict: mobile experience → Core Web Vitals →
content clarity → navigation and search → comparing and buying.

**Do not change without the owner's explicit decision** — each breaks live
URLs, stored content or legal compliance:

- the URL structure (`url` in `src/lib/content.ts`),
- `SEGMENTS` and `RESERVED` in `src/i18n/ui.ts`,
- the data schema in `src/content.config.ts`,
- the disclosure logic and link attributes.

---

## 8. Engineering lessons

Each cost real time once. They are the reason for several checks.

1. **`site/` is build output.** Never edit or commit it; CI builds it.
2. **An element with `transform` clips `position: fixed` descendants.** The
   photo viewer is moved to `<body>` for that reason.
3. **`display: flex` beats the `hidden` attribute.** Anything hidden by script
   needs `.x[hidden] { display: none !important; }`.
4. **A script can run before the elements exist.** Wait for the DOM.
5. **A missing translation key** would render `undefined` silently, so `t()`
   throws instead.
6. **Chrome ignores `focus({ preventScroll: true })`** inside a scrollable box.
   Scroll lock uses `position: fixed` on `body` with the offset restored.
7. **SVG clamps `rx` to half the width but keeps `ry`.** Use
   `rx = min(width, height) / 2`.
8. **A fixed asset path with an `immutable` cache header** serves the old file
   forever after a change. Fixed-path assets carry a content hash in their URL
   (`src/lib/asset-hash.ts`); `audit` checks it.
9. **Windows:** build paths from `import.meta.url` with `fileURLToPath`, never
   `.pathname` (which yields `/C:/…`). The owner's machine runs Windows 11.
10. **Automated text edits hit the first match**, not always the intended one.
    Run the checks after any scripted edit.

---

## Who decides

**The owner decides:** anything that costs money, changes what a visitor sees,
makes a promise on the site's behalf, touches the Amazon account, the visual
identity, architecture, data structure, URL structure, legal or financial
commitments, affiliate partners, a new script.

**Whoever does the work decides:** naming, CSS detail, file organisation, git
mechanics, dependency versions, which check to run, commit wording.

When bringing the owner a decision: the recommended answer, a one-line reason,
and what it costs — not a list of options to choose from.
