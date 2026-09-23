# Content

How to add products, pages and photos, and how to write for this site. The
rules themselves are in [RULES.md](RULES.md); this is the practical path.

Two ways to do everything below:

- **The admin panel** at `https://eldebosh.com/admin/` — forms with dropdowns,
  photo upload, and a checklist order that ends with `verified`. Saving commits
  to `main`; the site updates a few minutes later.
- **The files** in the repository, then `npm run verify` and push to `main`.

Both end in the same YAML and MDX files, and both are checked by the same
pipeline before anything is published.

---

## Who does what

| | Owns | Delivers |
|---|---|---|
| **The owner** | The products, the photos, every decision, Swedish review | ASINs, photos, `tested` status, hands-on notes, approval to publish |
| **Claude Code** | The repository, and writing the content | Swedish text, `pros`, `cons`, `best_for`, sources, files, checks, publishing |
| **Gemini (reviewer)** | Independent review | Checks sources, claims and Swedish before anything is published; reads the repository through raw GitHub URLs |

Only the owner may set `tested: true` or write hands-on text: it is a claim
about something he used.

---

## Adding a product

### 1. Create the file

```
npm run new:product -- --name "UGREEN Nexode 65W" --brand UGREEN --sub snabbladdare
```

Options: `--asin B0XXXXXXXX`, `--owned`, `--id <file-id>`. It picks the next
free code (`P-NN`), derives the category from the subcategory, and writes
`src/data/products/sv/<id>.yaml` with every field in the admin panel's order,
hidden (`verified: false`). Or: admin panel → المنتجات (products) → New.

The code `P-NN` is assigned once and never changes — photo names are built
from it. The next free code is also in `docs/project/STATE.md`.

Categories and subcategories (spelled exactly; the build rejects anything else
and suggests the nearest match):

```
laddning-och-strom    powerbanks · snabbladdare · kablar · billaddning
hallare-och-ordning   bilhallare · skrivbordsstall · kabelordning
```

The home-page filter buttons are display groups, not subcategories:
`Laddare` covers `snabbladdare` and `billaddning` (`src/lib/gear-groups.ts`).

### 2. Fill it in

| Field | Rule |
|---|---|
| `name`, `brand` | As printed on the product |
| `key_specs` | From a documented source only |
| `pros`, `cons`, `best_for` | Written by Claude Code from sources, reviewed by Gemini; empty until then, never invented |
| `price_band` | `budget` · `mid` · `premium`. Never a `price` field |
| `problems_solved` | `problem_id`s of existing solution pages |
| `asin` | 10 characters, capitals and digits. Without it there is no buy button and the product enters no guide |
| `owned`, `tested` | See [RULES.md §2.2](RULES.md#22-experience-has-exactly-three-states) |
| `own_photos` | 1–3, see [Photos](#photos) |

`tested: true` requires `owned: true`, `owned_since`, `usage_period`, one own
photo, and `hands_on_limits`. Write `hands_on_limits` with care: what our use
does **not** show is the most valuable sentence on the card.

### 3. Verify it — this makes it visible

```yaml
verified: true
source_url: "https://maker.example/product"   # the maker's page, preferably
last_verified: 2026-09-23
```

The specification source is one of: the maker's page (`source_url`), our photo
of the printed specification (`spec_photo`, one of `own_photos`), or the owner's
dated comparison of the listing with the device (`owner_checked`). A retailer
listing alone only warns. **Check that the ASIN is the same model** as the
product described — a wrong ASIN once sold a different model.

### 4. Check and publish

```
npm run check      # the rules, in seconds
npm run verify     # everything, before pushing
```

Then push to `main` (or save in the admin panel). `STATE.md`, `ASSETS.md` and
the filter counts update themselves; never write a count by hand.

---

## Photos

**Name:** `P-NN-K.webp` — product code, photo number 1–3. The first photo may
carry the ASIN: `P-NN-1-<ASIN>.webp`. A replacement gets a new name
(`P-NN-1-v2.webp`) so no cache serves the old one.

**What to shoot:**

| # | Shows |
|---|---|
| 1 | The product alone — required |
| 2 | Scale: next to a bank card or a phone |
| 3 | In use: in the car, on the desk, in the bag — the strongest one |

Window light, no direct flash, original background. Keep the originals outside
the project; do not strip EXIF (the capture date is evidence the photo is ours).

**Upload:** in the admin panel's photo field (it converts to webp and limits
size), or put the file in `public/uploads/`. **Any photo is fine as uploaded:**
the build turns every upload that is not already a tile into a 720×720 tile in
the house style — the photo centred, surrounded by a blurred, brand-tinted
version of itself with feathered edges (`scripts/lib/tile.mjs`). The original
file in `public/uploads/` is never changed.

To see or commit the finished tile yourself:

```
npm run tile -- path/to/photo.jpg P-24-1 [ASIN]
```

In the product file:

```yaml
own_photos:
  - src: "/uploads/P-24-1.webp"
    alt: "Swedish text describing what the photo shows"
    caption: "Vår egen bild."
```

Refer to a photo by its code (`P-03-1`) instead of sending it again — the
index of every photo is `docs/project/ASSETS.md` (`npm run assets`), which
also lists uploads no product uses.

---

## Adding a page

Solutions, guides, comparisons and articles: admin panel → the matching
collection → New, or an MDX file in `src/content/<collection>/sv/`.

Required in every page: `title` (≤ 70), `description` (50–165), `lang`,
`slug`, `category`, `updated`, `published`, `stage`. Guides, comparisons and
articles also need `solution` — the `problem_id` of their solution page.

The path from idea to live:

```
stage: draft       published: false   idea, heading only
stage: draft       published: true    live skeleton — "not written yet", noindex, sells nothing, 90-day limit
stage: written     published: true    text exists, still shown as a skeleton until approved
stage: reviewed    published: false   approved, about to go live
stage: published   published: true    live with its text
```

A guide needs at least two picks of verified products; a comparison needs two
to four. Sources go in `sources` with `publisher`, `url`, `accessed`, `type`
and `claim` (in our words).

Preview drafts on a phone before publishing:

```
npm run preview:file     → eldebosh-preview.html, one file, every page, drafts included
```

---

## Writing for this site

### The strategy

Swedish affiliate sites compete on "bäst i test" and claim field tests they
did not run. We cannot and will not write that, so we do not compete there.
None of them start from the **problem**; they start from the product name.
Someone searching "why does my phone die in the cold?" finds product lists,
not an answer. That gap is ours. The Swedish winter is a local angle that
translated English content does not cover.

Write in **clusters**, not alphabetically: a half-finished cluster does not
rank. Each cluster is a solution page with its guides, comparisons and
articles. Wave 1 (battery) is complete; wave 2 is charging and cables; wave 3
is mounts and organisation. Every page of all three waves already exists as a
file with title, description and parent solution — the remaining work is the
text. `docs/project/STATE.md` shows where each stands.

### By page type

- **Solution:** start with the symptoms, not a product. Explain the cause,
  then the ways out. No product before the reader understands the problem.
- **Guide:** what the specifications mean in practice, then the picks. A badge
  describes the product's role in this guide, not the product in general.
- **Comparison:** the table is generated from data; then a plain verdict —
  which is better, for whom. Do not flatter.
- **Article:** verifiable information with a source. Always links to its
  solution page.

### Words

Use the terms Swedish shops use, not literal translations:

| | Swedish |
|---|---|
| power bank | `powerbank` |
| phone charger / fast charger | `mobilladdare` / `snabbladdare` |
| charging cable | `laddkabel` |
| car charger | `billaddare`, `biladapter` |
| phone holder / car mount | `mobilhållare` / `bilhållare` |
| air vent | `ventilationsgaller`, `fläktgaller` |
| cable management | `kabelhantering` |
| wireless charging | `trådlös laddning` |
| standards | `PD` · `Quick Charge` · `PPS` · `GaN` · `MagSafe` · `Qi2` |

`mAh` (capacity) and `W` (power) measure different things; readers confuse
them, which is a content opportunity, not a detail.

### Experience wording

Describe what was observed, never what was measured; never "bäst i test"; never
copy a source's sentences. Examples and the full rule:
[RULES.md §2.2–2.3](RULES.md#22-experience-has-exactly-three-states).

### Video

Later, after the first sales: one video per cluster comparing products we own,
linked with a button, never embedded (embedding slows the page).
