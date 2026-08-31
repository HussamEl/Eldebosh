# ELDEBOSH.COM — CONTEXT

> **Version:** `v1.0` · 2026-08-31 · canonical copy: `docs/project/` in the repository
>
> State, decisions and the reasons behind them. **Rules live in `INSTRUCTIONS`.**
> Source of truth for code: `github.com/HussamEl/Eldebosh` — branch `main`, public.

---

## 1. The owner

| | |
|---|---|
| Name | **Hussam** |
| Email | `info@eldebosh.com` |
| Phone | `+46727782553` |
| City | Karlstad, Sweden |
| Machine | Windows 11 · **not a developer** |
| Language | Communicates in Arabic · edits content in Swedish |

These details are **live on the site**: the square settings, the `kontakt` page
and the business card. A home address is not required — the activity is not a
registered company.

---

## 2. What the project is

**Definition:** a place to discover practical technology that makes daily life
easier, more comfortable, safer and more efficient.

```
everyday problem → practical solution → suitable options → comparison → recommendation → purchase
```

**It is not:** a shop, a tech news site, or an affiliate blog.

**First editorial rule:** start with the problem, not the product name.

**Market:** Sweden · **Languages:** Swedish primary (`/sv/`), English secondary
(`/en/`) · **Revenue:** affiliate only · **Tag:** `electro066-21` on `amazon.se`.

---

## 3. The competitive advantage — the most important section

**Swedish competitors claim testing that never happened.** Their phrasing is
identical, their images come from retailers, and there is no human in any of it.

**1. The products are in his home.** Twenty products used daily, photographed by
hand.

**2. A physical presence.** A municipal permit for a table at `Stora Torget` in
Karlstad. A visitor can **hold the product before buying it** — which turns the
weakest point of the affiliate model into its strongest asset.

**3. Honesty about limits.** Stating what our experience does not show. No
competitor can write that.

---

## 4. Current state

| Item | State |
|---|---|
| Repository | `HussamEl/Eldebosh` · `main` · public · clean tree |
| Source | In the repository: `src/` + `public/` |
| Build output | `site/` — 33 generated pages |
| **Deployment** | 🟢 **Working** — GitHub builds, the host pulls automatically |
| Automated checks | **28/28 in Chromium** + colours + versions + drift + 31-page audit |
| Brand | 57 files plus their generators |
| Products | 20 files · **11 have an ASIN · 9 waiting** · 4 verified for display |
| Content | 41 MDX pages · 11 published |
| WordPress | ❌ Removed — forbidden on the domain |

---

## 5. Deployment — automatic

```
main → GitHub Actions builds and checks → deploy branch → Hostinger pulls → live
```

**The `deploy` branch** holds the built site alone, at its root. **Never push to
it by hand** — Actions updates it on every push to `main`.

**Why this shape:** FTP upload from GitHub timed out; the host blocks GitHub's
runners. The block is on **inbound** traffic only, and the host's outbound access
is fine. So the direction was reversed: it pulls instead of being pushed to. The
host did not change.

**Manual pull when needed:** hPanel → Git → `Overview` tab → `Redeploy`. The
`Deployments` tab keeps every deployment with its log.

**⚠️ The editor at `/admin/` writes to the repository.** A change reaches the
site within minutes through the chain above — not instantly.

---

## 6. Technical structure

```
Astro 5 (SSG) → Content Collections (MDX + YAML)
              → Pagefind (static search index)
              → Sveltia CMS at /admin/
              → GitHub Actions → deploy branch → Hostinger
```

**Why Astro:** the content is near-static and read far more than written. Static
output gives the best performance, a near-zero attack surface, and moving the
site means uploading a folder.

### Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **WordPress** | **Tried and failed** — `index.php` and `.htaccess` hijacked every request |
| Next.js | Requires a server; complexity with no return |
| Hand-written HTML | Collapses past roughly 30 pages |
| Webflow / Framer | Permanent subscription, weak with hundreds of linked products |

### URL structure — closed

| Type | Path |
|---|---|
| Home | `/sv/` |
| Category · subcategory | `/sv/[category]/` · `/sv/[category]/[subcategory]/` |
| **Solution** | `/sv/solutions/[slug]/` |
| Guide · comparison · post | `/sv/guides/` · `/sv/compare/` · `/sv/blog/` |
| Static page | `/sv/info/[slug]/` |
| The square | `/sv/pa-torget/` · `/en/on-the-square/` |
| Search | `/sv/sok/` · `/en/search/` |
| Product | **Deliberately disabled** — a data entity with no page |

The root redirects to `/sv/`. Every path ends in a trailing slash.

**Reserved:** `solutions` `guides` `compare` `blog` `info` `sok` `search` `admin`
`sv` `en` `pagefind`

---

## 7. The product schema

```yaml
id, code            # code is a permanent P-NN reference; image names derive from it
name, brand, category, subcategory
key_specs: {}       # the first numeric entry becomes the tile's hero number
pros, cons, best_for
price_band          # budget | mid | premium — never a fixed price
asin                # the only affiliate input; the URL is generated
source_url, last_verified
owned, tested, owned_since, usage_period
own_photos          # max 3 — {src, alt, caption}
hands_on, hands_on_limits
verified            # the display gate
```

**Badge rule:** `best-overall` and its siblings sit on the **guide-to-product
relation**, never on the product. The same product can be the value pick in one
guide and the wrong choice in another.

**Two display gates:** `published` for content in `docs()`; `verified` for
products in `getProduct()` and `verifiedProducts()` — both in
`src/lib/content.ts`.

**One deliberate exception:** an **owned** product with one of our own photos
appears without a buy button, labelled `Länk kommer`. The rule exists to stop
unsourced specifications, not to hide a product we physically have.

**Pipeline:** `draft → written → reviewed → published`. Validation rejects a
mismatch.

**Image naming:** `P-NN-K.webp` — one to three per product, cross-fading in CSS
alone.

---

## 8. Visual identity

| Element | Value |
|---|---|
| Primary | `--brand: #1273d1` |
| Dark | `--brand-deep: #123f66` — header and footer |
| Hero | `--brand-hero: #14456e`, gradient |
| Light surface | `--brand-soft: #f0f7fe` |
| Border tint | `--brand-tint: #d3e7fa` |
| Page ground | `--page: #e7f2fd` |
| Accent | `--volt: #55c6f2` · `--volt-deep: #2fb2e6` |
| Type | `Inter Tight` headings · `Inter` body — variable, self-hosted |

**The mark:** an **E** built from three rounded bars whose middle bar carries the
sky accent — the same charge-bar motif that sits above the site's headings. The
wordmark is **vector outlines, not text**, pulled from Inter Tight, so it needs
no font installed in any application or at any printer.

**The whole identity regenerates** with `npm run brand:all`. Never redraw it by
hand.

**Closed rules:** a compressed heading scale · never two adjacent dark blocks ·
every inner page opens with a `--brand-soft` band · product cards work without an
image.

---

## 9. The Karlstad presence

**Situation:** a municipal permit for a table at `Stora Torget`, weekdays,
removed daily. **No registered company** — a limited declared activity.

| Decision | Reason |
|---|---|
| **No published hours** | Attendance is not guaranteed; a visitor who finds nobody loses trust permanently |
| **The promise is a reply, not attendance** | "Get in touch before you come" — a promise that can be kept |
| **No mention of home storage** | Privacy |
| **No booking system** | Call and message only |
| **No Klarna or Swish Handel** | Nothing is sold online |

**What is sold:** the site sells nothing. At the square: single cables and used
items only, as a separate activity documented on the disclosure page.

---

## 10. Legal compliance

| Requirement | State |
|---|---|
| Commercial disclosure | ✅ Top of every commercial page plus the footer |
| Amazon disclosure | ✅ Both languages |
| Editorial method | ✅ Published |
| Square sales separated | ✅ Documented |
| Contact page | ✅ Published with real details |
| Privacy · cookies · terms | ⬜ Drafts |

Swedish marketing law requires disclosure using words such as
`annonssamarbete` or `reklamlänk`. **Standing recommendation:** a
**cookie-free** analytics tool, avoiding the consent dialog entirely.

---

## 11. Risks

| # | Risk | State |
|---|---|---|
| R-01 | **Amazon account closure** — permanent, no appeal | Managed by automated checks |
| R-02 | Wrong tax classification of affiliate income | ⚠️ **Open** — free consultation not yet taken |
| R-03 | Single point of failure (one person) | Partial |
| R-04 | The editor loads from a CDN with no pinned version | ⚠️ **Open** |
| R-05 | Swedish language quality | Managed by the `reviewed` stage |
| R-06 | File loss | ✅ Closed — the repository is the backup |
| R-07 | Amazon terms change | Managed |
| R-08 | Content that does not rank | Managed |

---

## 12. Open questions

1. Register the `.se` domain defensively?
2. Analytics — cookie-free, or Google Analytics?
3. **Tax classification of affiliate income** ⚠️ critical.
4. Which affiliate network after Amazon?

**⚠️ Assumptions that need verification — do not build a decision on them:**
Nordic affiliate networks (Adtraction · Awin · TradeDoubler) · Swedish retailers
(Kjell · Elgiganten · NetOnNet · Webhallen) · image usage terms from Anker and
UGREEN · safety and insurance terms for charging other people's batteries.

---

## 13. What remains, by priority

| # | Task | Owner |
|---|---|---|
| 1 | 🔴 **Nine ASINs** — without them, nine products have no buy button | **Hussam** |
| 2 | 🟠 Tax authority consultation (`R-02`) | **Hussam** |
| 3 | 🟠 Pin or vendor the editor (`R-04`) | Claude Code |
| 4 | 🟠 Complete the legal pages | Claude Project |
| 5 | 🟡 **The battery cluster — 11 pages** | Claude Project |
| 6 | 🟡 Build-time image step | Claude Code |
| 7 | 🟡 Search Console and analytics | Shared |

**The nine missing:** Baseus MagPro · Cooper MagStand · EasyAcc bordsfläkt ·
HUAWEI öppna hörlurar · LENCENT Reseadapter · Vikbart mobilstativ ·
simarro magnetringar · UGREEN snabbladdare · UGREEN USB-C 240W.

**The battery cluster** is the first wave: eleven pages around a single problem —
the phone dying mid-day. Completing it activates the first category and creates
enough surface to reach the three sales Amazon requires.

**Binding order:** solution pages → products → guides and comparisons → posts.
A guide is not published with fewer than two picks.
