# CLAUDE.md

Instructions for an AI agent (Claude Code) working in this repository. Read
this file, then `docs/project/STATE.md` and `docs/project/TASKS.md`, before
doing anything. The project is explained in [README.md](README.md) and `docs/`.

## Standing permissions

- **Push directly to `main`.** Standing permission from the owner (2026-09-05).
  If your environment forces a session branch: work there, then merge it into
  `main`, push `main`, and delete the branch **in the same session** — work
  reaches the live site only from `main`. Say in your first reply where you are
  pushing.
- **No pull request** unless the owner explicitly asks for one.
- Git mechanics, branches, lockfiles, dependency versions, formatting, commit
  wording and which check to run are yours to decide. Never ask the owner
  about them.

## Before every push

```
npm run verify
```

It must pass. If a check fails, fix the cause — never weaken, skip or work
around a check. After any change to the UI script or to CSS that hides
elements, `verify` is mandatory (a flex rule beats the `hidden` attribute; a
script can run before its elements exist).

Never run `git restore .` or any command that discards uncommitted work you
did not create.

## Non-negotiable rules

Full list with reasons and enforcement: [docs/RULES.md](docs/RULES.md). The
ones that must never slip:

1. **Nothing invented** — no specification, price, rating, quote or statistic
   without a named source.
2. **Experience only when real** — first-person experience wording requires a
   linked product with `tested: true`. Never "Bäst i test", never a claimed
   measurement.
3. **No fixed prices** (`price_band` only). **No Amazon images or prices** until
   the API opens after three qualifying sales. Never edit a retailer image.
4. **Amazon links only from `asin`**; no affiliate link in article text;
   disclosure above the first buy link on every commercial page.
5. **Only the owner's own photos**, and never one product's photo under
   another's name.
6. **No secrets** anywhere in the repository, including docs.
7. **Zero JavaScript by default.** No new script without the owner's approval.
8. **`site/` is build output** — never edit or commit it.

**Never change without the owner's explicit decision:** the URL structure
(`url` in `src/lib/content.ts`), `SEGMENTS` and `RESERVED` in `src/i18n/ui.ts`,
the schema in `src/content.config.ts`, the disclosure logic and link
attributes. Also his: anything that costs money, changes what visitors see,
promises something on the site's behalf, or touches the Amazon account.

## Visual changes

Show visual changes as a single preview file before publishing:

```
npm run preview:file
```

## Working with the owner — consult first

The owner, Hussam, is not a developer and edits content in `/admin/`. He reads
Arabic, right to left. Gemini, the independent reviewer, is **paused** since
2026-09-24 (EB-013); until the owner brings it back, he reviews alone. The full
protocol is [docs/project/INSTRUCTIONS.md](docs/project/INSTRUCTIONS.md); in
short:

1. **No file is changed before the owner approves.** The first reply to any
   task is analysis: what is affected, your professional view, a
   recommendation and its cost. Then stop and wait.
2. **One exception:** a broken build, check or publish on GitHub is fixed at
   once, without waiting, and reported in the next reply.
3. **Every reply** opens with the `EB-###` line and ends with: the party board,
   a short summary of what changed in the repository, the live link on
   `https://eldebosh.com` of every page whose visible content changed (the
   owner checks on the live site as a visitor; no preview files for him), and
   two ready-to-copy blocks — approval and a question (a third, for Gemini,
   with raw GitHub URLs, only when Gemini is active again).
4. Content you write stays at `stage: written` until the owner approves it.
   While Gemini is paused, every content delivery lists each factual claim
   with the link to its source, so the owner can check it himself.
5. **Read only what the task needs.** Do not re-read the whole repository.

Reply in Arabic, right-aligned and easy to read (EB-027): **never put Arabic
inside a code block** — code blocks render left to right and scramble it; they
hold links, paths and commands only. Ready-to-copy replies are Arabic
blockquotes, not code blocks. Never start an Arabic line with a Latin code
(`P-22`, a slug): put it mid-sentence or on its own line. Keep
conclusions first, a recommended answer rather than a choice of options, no
flattery. Do not ask him to run terminal commands unless there is no other
way.

Numbers come from `npm run state`, never from memory or from another document.

## When you finish

Update what changed: `docs/project/TASKS.md`, `CHANGELOG.md` (a few lines per
delivery), `docs/project/LOG.md` (the message counter). If something you
needed was not documented, add it where it belongs.

## Windows

The owner's machine runs Windows 11. Build paths from `import.meta.url` with
`fileURLToPath`, never `.pathname`.
