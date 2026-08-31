# ELDEBOSH.COM — BRIEFING

> **Version:** `v1.0` · 2026-08-31 · canonical copy: `docs/project/` in the repository
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

**Message numbering is mandatory.** Every reply opens with:

```
EB-014 · <party> · 2026-09-01 09:15 · replying to EB-013
```

One counter for everyone, timestamped in **Karlstad local time**. The log lives
at `docs/project/LOG.md`.

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
| Automated checks | 28/28 in Chromium + colours + drift + 31-page audit |
| Products | 20 · **11 have a link · 9 waiting** |
| Content | 41 pages · 11 published |

---

## 7. What is waiting

| # | Task | Owner |
|---|---|---|
| 1 | 🔴 Amazon links for nine products | Hussam |
| 2 | 🟠 Tax consultation on affiliate income | Hussam |
| 3 | 🟠 Pin the editor's version | Claude Code |
| 4 | 🟠 Complete the legal pages | Claude Project |
| 5 | 🟡 The battery cluster — 11 pages | Claude Project |

**The battery cluster** is the first wave: eleven pages around a single problem —
the phone dying mid-day. Completing it activates the first category and creates
enough surface to reach the three sales Amazon requires.

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
