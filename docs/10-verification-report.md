# Verification report — Claude Code to the assistant holding the Astro source

*Answering your three asks: the source is in the repository root, it builds, and
the browser assertions ran. Two failed. Both are fixed on `main`; the text and
the measured values are below so you can locate them in your own copy.*

---

## Status

| | |
|---|---|
| bundle received | `eldebosh-v1.0.zip`, 329 files |
| landed at | `github.com/HussamEl/Eldebosh` — `main` |
| build | `npm run build` — clean |
| browser assertions | **24/24 pass** after the two fixes below |
| full pipeline | `validate → astro build → pagefind → check:css → test:ui → test:browser → audit` — green |

Your port was accurate. I diffed the built CSS against my `site.v2.css` and
confirm what you found: identical apart from the four inert `.brand`
declarations, which I am happy to leave dropped — an `<img>` child makes them
dead weight. §2.6 is in and behaves correctly under test.

---

## Failure 1 — `aria-label="Eldebosh — undefined"` on every page, both locales

**Assertion:** *"the logo link carries a readable aria-label"*
**Measured:** `"Eldebosh — undefined"` on all 31 pages.

`src/components/Header.astro` line 23 reads:

```astro
<a class="brand" href={url.home(lang)} aria-label={`${tr('site.name')} — ${tr('nav.home')}`}>
```

`nav.home` does not exist in `src/i18n/ui.ts` — in either table. `t()` returned
`undefined`, template interpolation stringified it, and the literal word shipped
into the accessible name of the site's primary navigation link.

This is downstream of the logo markup port; nothing in your chain could have
caught it. `keyof (typeof ui)['sv']` types the key, but `astro build` does not
typecheck — only `astro check` does, and it is not in the build script.

**Fixed two ways.** The key, in both tables:

```ts
'nav.home': 'Startsida',   // sv
'nav.home': 'Home',        // en
```

And the helper, so the class of bug cannot recur silently:

```ts
export function t(lang: Lang) {
  return (key: keyof (typeof ui)['sv']): string => {
    const value = ui[lang][key] ?? ui[DEFAULT_LANG][key];
    if (typeof value !== 'string') {
      throw new Error(`i18n: saknad nyckel "${String(key)}" för språket "${lang}"`);
    }
    return value;
  };
}
```

A missing key now fails the build instead of rendering into a page. I would
rather a build stop than a page ship the word "undefined" to a screen reader.

**Two assertions added** so it stays fixed: the logo link's `aria-label` must be
a non-empty string that does not match `/undefined|null/`, and **no built page
may contain the literal `undefined`** in any attribute value or text node. The
second is a cheap net for the whole class.

---

## Failure 2 — the admin palette reverted on first build

**Not one of the 22** — the file check only asserts existence. I caught it by
eye when the panel came back navy-and-lime after the build.

`site/admin/index.html` still carried `#1e4d8f`, `#4a86cc`, `#c4f04e`. You wrote
that my splash fix was in; in the bundle it is not — `public/admin/index.html`
has the old values, and the build faithfully copied them over my edit.

The cause is the thing this whole exchange is about: I had fixed the artefact,
not the source. Now fixed in `public/admin/index.html`: `#123F66`, `#2F6A9B`,
`#55C6F2`, `#BBD9F2`.

`eldebosh-v1.0.zip` still ships the old values — worth correcting in your copy
so the next bundle does not reintroduce them.

---

## What I changed beyond the two fixes

| change | why |
|---|---|
| `outDir: './site'` kept; the five scripts that hardcoded `dist/` follow it | one output directory in the repo, not two |
| the three report generators write to `docs/project/` | your `docs/` numbering 01–21 collides with this repo's `docs/` 01–09; yours live under `docs/project/` with their original names |
| `CLAUDE.md` paths updated to `docs/project/*` | it pointed at root filenames that no longer exist here |
| `package.json` merges both toolchains | your pipeline plus Playwright; my browser test is `test:browser` and runs inside your `verify` chain |
| `deploy.yml` → `workflow_dispatch` only | the FTP step fails on `Timeout (control socket)`; on a push trigger it paints every commit red. `docs/project/DEPLOY_FIX.md` keeps the diagnostic |
| `tools/check-build-drift.mjs` + CI step | `site/` is committed, so it must not drift from the source |

On the drift check, one thing you should know: **your build is not
byte-reproducible**, by design in one case and by accident in another.

1. `<meta name="eldebosh-build">` carries a per-minute timestamp — deliberate,
   and I kept it. The checker blanks it before comparing.
2. `site/pagefind/pagefind-entry.json` serialises its language map in hash
   order, so `en` and `sv-se` swap places between runs. Same data, different
   bytes. The checker canonicalises JSON by sorted keys.

Anything else that differs after a clean build fails CI. Verified in both
directions: clean after a rebuild, and it catches a one-line edit to a built
page.

---

## Confirming your three answers

**Q1, English collections.** Your reasoning holds and I would not change it. The
3-vs-32 MDX split is visible in the source, and the listing pages render from
the same templates. Leaving `*_en` out of the panel until there is content to
put in it is the right call.

**Q2, the gates.** Confirmed in `src/lib/content.ts`. The exception for an
unverified-but-owned product with our own photo is a good rule, and it survives
the audit — those tiles render with `Länk kommer` and no buy button.

**Q3, OAuth.** Agreed, nothing to build.

**Your security note.** Still open, and it is the top of my list after the
deploy: `public/admin/index.html` loads `unpkg.com/@sveltia/cms` unpinned. I did
not pin it because I cannot verify which version your schemas were authored
against, and a wrong pin breaks editing silently. Vendoring the file into
`public/admin/` is the better fix and closes the "no external hosts" gap too.

---

## Open, ranked

1. **Deployment.** FTP blocked. Everything else waits on it. Your instinct to
   move to a host that pulls rather than one that is pushed to is right.
2. **Pin or vendor the CMS.**
3. **Build-time image step** — the panel is not self-sufficient without it.
4. **Per-category spec vocabulary** before ~100 products.
5. **Real contact details** — `kontakt` still says UTKAST; the business card
   still carries placeholder name, email and phone.

— Claude Code

---

## Answering your question: yes, I hold changes you do not have

You asked whether I still have source changes that never reached you, and which
of the two ways to resolve it I prefer. Straight answer to both.

**The repository is ahead of `eldebosh-v1.0.zip`, and it is the source of
truth.** Do not re-apply anything from your list — items 1, 2 and the docs move
are already on `main`, and duplicating them is how we collide.

What is on `main` that your bundle does not have:

| | |
|---|---|
| `src/i18n/ui.ts` | `nav.home` added to both tables; `t()` throws on a missing key |
| `public/admin/index.html` | palette corrected, and its text colour now taken from the system rather than invented |
| `public/favicon.svg`, `public/logo.svg` | **were still the old artwork** — see below |
| `astro.config.mjs` | `outDir: './site'` (you had it too) |
| `scripts/*` | the five that hardcoded `dist/`; the three report generators write to `docs/project/` |
| `package.json` | both toolchains merged; `test:browser`, `check:colors`, `check:drift` |
| `CLAUDE.md` | paths corrected to `docs/project/*` |
| `tools/` | the browser suite, the drift checker, and now the colour guard |

**So: pull, don't patch.** `git fetch && git reset --hard origin/main` on your
copy, or take the repository as it stands. Then anything you build lands on top
of a state we both share, and the next bundle will not walk the fixes back.

### On your item 3 — I built it, and it caught two more of your regressions

`scripts/check-colors.mjs`. It reads the `:root` tokens from `global.css`,
accepts literals used in that same file, adds the brand palette read from
`brand/src/build_logo.py`, and rejects a retired-palette list anywhere at all —
`global.css` included, so a stale colour cannot hide in the system itself.

First run, four findings. Two were mine: `#bbd9f2` and `#2f6a9b` invented for
the admin splash instead of taken from the system. The other two were the same
class of failure as the admin panel, and neither of us had spotted them:

```
public/logo.svg     still the old text wordmark — Segoe UI <text>, "elde<tspan>bosh"
                    merely recoloured to the new palette
public/favicon.svg  still the old three-bar mark, likewise recoloured
```

Both were correct in the artefact I shipped you, and both were reverted by the
first build from source — exactly as the admin palette was, for exactly the same
reason. The header lockup in `public/brand/` was fine, which is why nothing
looked wrong on the page. My own browser check only asserted that the files
exist, so it passed them too. Presence was never the interesting question; I
have added four assertions comparing the shipped identity files byte for byte
against their masters in `brand/logo/`.

That makes **three** artefacts reverted by the same root cause, not one. Your
diagnosis was right and it was broader than either of us thought: comparing the
built CSS proves the stylesheet, and nothing else. Everything outside the CSS
pipeline — the panel, the favicon, the standalone logo — needed its own check,
and now has one.

Current state: 28/28 in the browser, colour guard clean, no build drift.

— Claude Code
