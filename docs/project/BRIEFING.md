# ELDEBOSH.COM — BRIEFING

> **Version:** `v1.1` · 2026-09-02 · canonical copy: `docs/project/` in the repository
>
> Written to be read with no prior context. It assumes no knowledge of earlier
> conversations.

---

## 1. The project in three lines

A Swedish content site that moves a reader from an **everyday problem** to a
**practical solution** and then to a suitable product on Amazon. Revenue comes
from affiliate commission.

The advantage: the owner **owns and uses the products**, and has a **physical
presence** at the Karlstad market square where a visitor can hold a product
before buying it.

Built with `Astro` and published statically — no database, no application server.

---

## 2. Who is involved

| Party | Role |
|---|---|
| **Hussam** | Owner · decides · photographs · reviews Swedish · **not a developer** |
| **Claude Code** | Owns the repository · push access · a real browser · executes in code |
| **Claude Project** | Specifications, content and SEO · **does not push to the repository** |
| **Gemini** | External research · second opinion · verifying claims |

**Hussam is the channel between the parties.**

**Message numbering is mandatory.** Every reply **opens** with one line and
**closes** with the party board:

```
EB-001 · <party> · 2026-09-02 14:30 · new thread
```

One counter for everyone, timestamped in **Karlstad local time**. The log lives
at `docs/project/LOG.md`. **The counter was reset to `EB-001` on 2026-09-02** at
Hussam's instruction, so that a party joining now reads a project, not a
transcript. The board format is in `INSTRUCTIONS` section 2.

---

## 3. Where everything is

**Source of truth — a public repository:**

```
github.com/HussamEl/Eldebosh    branch main
```

```
src/         source: schemas, components, routes, content, data
public/      copied verbatim: the editor, brand assets, fonts, images
site/        build output — generated, never hand-edited
scripts/     checks and generators
tools/       browser suite and drift guard
brand/       the identity and its generators
docs/        documentation · docs/project/ the governing documents
```

**Commands:**

```
npm install
npm run dev            local development
npm run verify         the quality gate — every check
npm run preview:file   one preview file that opens on a phone
```

---

## 4. Rules that are never broken

**All are enforced automatically. The build fails on a violation, by design.**

**1. Nothing invented.** Every product claim traces to a documented source. And
if you are unsure how a tool works, **verify before explaining it**.

**2. Experience has three states.** Tested with evidence · owned with no
performance claim · not owned. `tested: true` requires five fields, the most
important being **what our experience does not show**.

**3. Amazon boundaries.** Links are allowed and are the core of the programme.
**Images and prices are forbidden** before API access. The penalty is permanent
closure with no appeal.

**4. No link leads to an empty page.**

**5. No secrets in any file** — including the documentation.

**6. The repository is the source of truth, not packages.** Describe the change;
Claude Code applies it.

---

## 5. Closed decisions — not reopened

| Decision | Short reason |
|---|---|
| **Astro, not WordPress** | WordPress **was tried and failed** — it hijacked every request |
| **No product pages** | A page with no experience and no price competes with retailers and loses |
| **One JavaScript island** | Interaction only where it matters commercially |
| **No online sales** | There is no stock to sell; building what goes unused is waste |
| **No published hours for the square** | Attendance is not guaranteed; the promise is a reply |
| **Deploy by pull, not push** | The host blocks GitHub's runners inbound only |
| **No fixed price** | `price_band` instead of a number — nothing goes stale |

---

## 6. Current state

| Item | State |
|---|---|
| Site | 33 generated pages, two languages |
| **Deployment** | 🟢 Automatic — GitHub builds, the host pulls |
| Automated checks | 28/28 in Chromium · **32 claim cases** · colours · style · drift · 31-page audit |
| Products | 20 · **11 have a link · 9 waiting** |
| Content | 41 pages · 11 published · **6 written, waiting on review** |
| Battery cluster | **7 of 11 written** · 4 blocked on research or data |
| Review | `npm run preview:file` — one file, drafts included, opens on a phone |

**The constraint is no longer writing.** Six finished pages wait on one person
reading Swedish as a second language. An extra page lengthens that queue. The
preview file exists so a review is one page at a time: read one, publish one.

---

## 7. What is waiting

| # | Task | Owner |
|---|---|---|
| 1 | 🔴 **Review the six written pages** — read one, publish one | **Hussam** |
| 2 | 🔴 **One real experience sentence and one frequency word per product** | **Hussam** |
| 3 | 🔴 Amazon links for nine products | **Hussam** |
| 4 | 🟠 Airline rules · cold-weather figures — official sources only | **Gemini** |
| 5 | 🟠 Publish the legal texts — written and waiting | **Hussam** |
| 6 | 🟠 Tax consultation on affiliate income | **Hussam** |
| 7 | 🟡 Documented weight per product (`I-010`) | **Hussam** or Gemini |
| 8 | 🟡 Build-time image step | Claude Code |

**The battery cluster** is the first wave: eleven pages around a single problem —
the phone dying mid-day. Completing it activates the first category and creates
enough surface to reach the three sales Amazon requires.

**Why every red row belongs to Hussam.** The site's only real advantage is that
he owns the products and reads the Swedish. Neither can be delegated, and
neither can be invented — which is precisely the rule the checks enforce.

---

## 8. Working with Hussam

**Explain in practical language.** Assume no technical knowledge.

**Formatting matters:** he reads Arabic right-to-left. Never mix an Arabic
sentence with a long English phrase on the same line. Put commands and paths on
their own lines inside code blocks.

**For visual changes:** send one preview file he opens on his phone. **No
package, no upload, no publishing.**

**Do not flatter.** Easy agreement with a bad decision is worse than objecting.

---

## 9. Before touching the code

**Read in the repository:**

```
CLAUDE.md                       the repository constitution
docs/README.md                  documentation index
docs/project/INSTRUCTIONS.md    the governing rules
docs/project/CONTEXT.md         state and decisions
```

**And run before any handover:**

```
npm run verify
```

**If one check fails, do not hand over. Fix the cause, not the check.**
