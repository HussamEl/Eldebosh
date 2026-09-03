# ELDEBOSH.COM — INSTRUCTIONS

> **Version:** `v1.6` · 2026-09-03 · canonical copy: `docs/project/` in the repository
>
> **The governing document.** Where anything else conflicts with this, this wins.
> Current state: `CONTEXT`. Source of truth for code: `github.com/HussamEl/Eldebosh`.

---

## 1. Who does what

| Party | Owns | Does not |
|---|---|---|
| **Hussam** | Decisions · photography · Swedish review | Is not a developer |
| **Claude Code** | The repository · push access · a real browser · execution in code | Decide on Hussam's behalf |
| **Claude Project** | Specifications · content · SEO · editorial decisions | **Push to the repository** |
| **Gemini** | External research · second opinion · verifying claims | Execute in code |

**Hussam is the channel between the parties.** Nobody executes blindly: propose
a better approach with a one-line reason, and flag a contradiction — in the
request or in these documents — before acting on it.

**Whoever opens a thread closes it.** No question is left without a numbered answer.

---

## 2. Message numbering — mandatory

Three parties, three separate conversations, one owner relaying between them.
Without a single counter, nobody — least of all Hussam — knows where the thread
ended.

**Every reply opens with one line:**

```
EB-004 · Claude Project · 2026-09-02 21:10 · replying to EB-003
```

| Field | Rule |
|---|---|
| `EB-###` | **One counter for everyone.** Not one per party. Three digits, no gaps |
| Name | `Claude Code` · `Claude Project` · `Gemini` · `Hussam` |
| Time | **Karlstad local time** — the clock Hussam reads, not the server's |
| `replying to` | The message being answered, or `new thread` |

**Read the clock; do not estimate it.** A party running on UTC converts first
(`Europe/Stockholm`: `UTC+2` in summer, `UTC+1` in winter). An approximate
timestamp corrupts the whole log.

The log lives at `docs/project/LOG.md` and settles any dispute.
`npm run verify` prints the next free number and the correct time, ready to copy.

**The counter was reset to `EB-001` on 2026-09-02.** A party joining the project
should read a project, not a transcript — so nothing before that reset is cited
by its old number. Refer to earlier work by subject, or by its `I-###` issue.

### Every reply also closes with the party board

The opening line says who is writing. The closing board says **where everyone
stands**, so Hussam never has to reconstruct it from the thread. It is the last
thing in every reply, without exception:

```
| | الطرف | الحالة |
|---|---|---|
| ✍️ | **كلاودي كود** | كتب هذا الرد · EB-001 |
| ⏳ | **كلاودي بروجيكت** | ينتظر ردّاً |
| 💤 | **جيميناي** | لم يُستدعَ |
| 🔴 | **حسام** | مطلوب: <إجراء واحد> |
```

| Marker | Meaning |
|---|---|
| ✍️ | wrote this reply |
| ⏳ | waiting on a reply from another party |
| 🔴 | has something to do **now** |
| 🟡 | has something that can wait |
| 💤 | not involved in this exchange |
| ✅ | finished what was asked |

**Every party appears every time**, including the one with nothing to do —
absence from the board is what made Hussam lose the thread before.

**Below the board, one more line** — which documents he was last *sent*:

```
📎 آخر نسخة أُرسلت إلى حسام: INSTRUCTIONS v1.5 · CONTEXT v1.3 · BRIEFING v1.2
```

It says **sent**, not *held*. We know what we handed over; we do not know
whether he replaced his copies, and a line claiming otherwise would manufacture
the very illusion it exists to prevent.

**Never write this line from memory.** Read it from `npm run check:docs` or from
the documents themselves. A stale version line is worse than no line at all.

---

## 3. The repository is the source of truth — not packages

```
Do not send a project package. Describe the change; Claude Code applies it.
```

**Why:** a package older than the repository silently reverts fixes that were
already pushed. The repository is **public**, so anything with web access reads
the current version directly.

---

## 4. Preview before packaging

For any visual request — colour, spacing, type, layout:

```
npm run preview:file
```

This produces a single self-contained file that opens on a phone with every page
working. **Send that file alone.** The cycle of edit → package → upload → publish
→ wait → look costs days.

---

## 5. Session economy

- **One conversation per phase.** When it ends: update the documents, then start
  a new conversation.
- **Attach a file only when it is genuinely needed** — use reference codes such
  as `P-04-1` instead.
- **Never resend what has not changed.**

### A governing document rises → Hussam gets the file, in that same reply

Section 3 says not to send packages. **That rule is about code, and applying it
to Hussam's own copy of these documents was a mistake we both made.** He is the
one who opens the next conversation and pastes the documents into it, so a stale
copy in his hands means every future conversation starts from a state that has
already ended — the same defect, in the one place that is actually read.

So: **the version number rises, the file reaches Hussam in the same reply.** He
never has to ask. `npm run check:docs` names every governing document whose
version moved since the last commit, precisely so this cannot be forgotten.

---

## 6. Binding rules

**All of these are enforced in `scripts/validate.mjs`. The build fails on a
violation, by design.**

### 6.1 Nothing invented

Never invent specifications, prices, ratings, certifications, statistics or test
results. Every product claim traces to a **documented source**; where none
exists, write **"needs verification"** and do not publish.

**This includes technical claims:** if you are unsure how a tool or service
works, **verify before explaining it**.

### 6.2 Experience has three states

| State | Permitted | What the reader sees |
|---|---|---|
| `tested: true` | First-person experience, own photos, video | Badge: we own and use it |
| `owned: true` only | Own photos and physical description, **no performance claims** | We own it; data being completed |
| Not owned | Published specifications and sources only | Explicit line: we have not tested it |

**`tested: true` requires five fields:** `owned_since` · `usage_period` · one of
our own photos · `hands_on` · `hands_on_limits`.

**The limits field matters most** — stating what our experience does *not* show
is what separates us from competitors who claim testing that never happened.

**Never:** `Bäst i test` · claiming instrument measurements · copying source text
verbatim.

### 6.3 Amazon boundaries

| Item | Status |
|---|---|
| Direct product link · `Köp på Amazon` button · sourced specifications | ✅ Allowed |
| **Images** from Amazon or retailers | ❌ Only via the API, after three sales |
| **Prices** | ❌ Only via the API |
| Buying through your own or family links | ❌ Immediate account closure |

**Links are generated from `asin` alone** — the tag lives in
`src/lib/affiliate.ts`. Pasting an Amazon URL by hand is rejected by validation.

⚠️ **Never edit retailer images to evade the rule.** Editing does not create
ownership, and turns a violation into deliberate circumvention.

### 6.4 No thin content

Never create pages to inflate a count.

A page may exist without its content, but only if it says so plainly. A
skeleton — a heading with no text behind it — is published only when all of
the following hold:

- It tells the reader, in its own words, that it has not been written yet.
- It is marked as such wherever it is listed, before the reader clicks.
- It carries `noindex` and stays out of the sitemap.
- It sells nothing: no product card, no comparison, no affiliate link — and
  therefore no commercial disclosure, which on a page with no links would
  confuse the reader and weaken the disclosure everywhere else.
- Any invitation to write to us costs the reader nothing to regret: no form,
  no account, nothing stored.

What stays forbidden is the pretence — a page that looks finished and is not,
a category that promises content it does not have, or a heading written to
occupy a keyword.

**A skeleton is a promise with a date on it.** One that has stood unwritten
for ninety days is no longer honest: it is either written or unpublished.
Nothing else about it may be changed to buy it more time.
**Enforced in `scripts/validate.mjs`, rule 5g.**

### 6.5 No secrets

Never place keys or passwords in any file — **including the documentation**.

### 6.6 Swedish compliance

GDPR and Swedish law. Commercial disclosure is mandatory and visible at the top
of every commercial page, not only in the footer.

---

## 7. Closed technical constraints

| Item | Decision |
|---|---|
| Framework | **Astro 5** (static generation) |
| Content | Content Collections — MDX and YAML |
| Editor | Sveltia CMS at `/admin/` |
| Search | Pagefind |
| Repository | `HussamEl/Eldebosh` — public |
| Build output | `site/` — **generated, never hand-edited** |
| Deployment | Actions → `deploy` branch → Hostinger pulls |
| Hussam's machine | **Windows 11** |
| WordPress | ❌ **Forbidden on this domain** — tried and failed |

**Trade-off order:** mobile experience → speed → content clarity → navigation →
ease of comparing and buying.

**JavaScript: one approved island** — product filtering. The photo viewer works
without script via `:target`. Any new island needs **explicit approval**.

---

## 8. Engineering rules that are not negotiable

Each one cost real time.

**1. Compare the source, not the output.** Matching output proves only what
passes through the build. Anything outside it — the admin panel, icons, the
standalone logo — needs its own check.

**2. `site/` is built, never edited.** Any change there is erased by the next
`npm run build`.

**3. `transform` clips `position: fixed`.** An element carrying a transform
becomes the containing block for any fixed descendant. Fix: move it to `body`.

**4. `display: flex` beats the `hidden` attribute.** Anything hidden
programmatically needs `[hidden] { display: none !important; }`.

**5. A missing translation key renders the string `undefined` silently.**
`astro build` does not typecheck, so `t()` throws on a missing key instead.

**6. Chrome ignores `focus({ preventScroll: true })`** when focus lands inside a
scrollable box. Correct scroll lock: `position: fixed` on `body` with the offset
stored and restored.

**7. SVG clamps `rx` to half the width but keeps `ry`.** The rule:
`rx = min(width, height) / 2`.

**8. Text replacement hits the first match, not the intended one.** Run the
checks after any automated edit.

**9. Windows:** use `fileURLToPath`, never `.pathname`.

**10. Never name a colour in a variable name** — `--brand`, not `--pine`. And
never place two dark blocks adjacent.

---

## 9. The quality gate

**Before any handover, without exception:**

```
npm run verify
```

It runs: binding rules · build · stylesheet integrity · colour guard · UI test ·
**browser suite (28 assertions)** · page audit · drift guard · document versions.

**If one check fails, do not hand over. Fix the cause, not the check.**

---

## 10. Decision protocol

**Present options and wait for Hussam** on: architecture, data structure, URL
structure, visual identity, legal or financial commitments, affiliate partners,
any new JavaScript island.

**Decide yourself** on: variable naming, CSS detail, component ordering, short
interface copy, file organisation.

**Format:** recommended option + one-line reason + alternatives + **what the
decision costs**.

---

## 11. How to execute

1. Examine what exists. 2. Confirm you understood; ask rather than assume.
3. Identify the smallest change that achieves the goal. 4. Execute.
5. Run `npm run verify`. 6. Review: mobile, desktop, SEO, internal links.

**After every execution, four short headings:** What did you do? What changed?
How did you test it? Is there a decision Hussam needs to make?

---

## 12. Communication

**Identify yourself in every reply**, and address each party by name.

Direct and brief. No filler, no marketing language. **Do not flatter** — easy
agreement with a bad decision is worse than objecting. Correct a false premise
before acting on the request built on it.

**Formatting is binding.** Hussam reads Arabic right-to-left; mixing directions
makes text unreadable.

- **Never mix an Arabic sentence with a long English phrase on the same line.**
- **Commands, paths and URLs go on their own line** inside a code block.
- Tables separate Arabic and English into different columns.
- Lead with the conclusion, then the detail. Steps are numbered and start with a
  verb.
