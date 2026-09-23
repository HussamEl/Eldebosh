/**
 * Site version stamp, shown next to the home logo and in <meta name="eldebosh-build">.
 *
 * It is the time of the last commit that changed anything the site is built
 * from — not the time the build ran. Two consequences, both deliberate:
 *   - The same source always builds to byte-identical output, so the deploy
 *     step can tell a real change from a rebuild and skip docs-only pushes.
 *   - The owner can check that an edit is live: the stamp on the site equals
 *     the time of that edit.
 *
 * Temporary: remove before launch by setting SHOW_BUILD_STAMP to false, or by
 * deleting this file, its block in Header.astro and `.build-stamp` in global.css.
 * The <meta> tag can stay — it is invisible and useful for support.
 */
import { execFileSync } from 'node:child_process';
import { now } from './clock.mjs';

export const SHOW_BUILD_STAMP = true;

/** Paths whose changes alter the built site. Docs and scripts are not among them. */
const SITE_INPUTS = ['src', 'public', 'astro.config.mjs', 'package.json', 'package-lock.json'];

function lastSiteChange(): Date {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...SITE_INPUTS], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (iso) return new Date(iso);
  } catch {
    // Not a git checkout (e.g. a downloaded ZIP): fall back to the build time.
  }
  return new Date();
}

/** `YYYY-MM-DD HH:MM`, Karlstad time. Computed once per build. */
export const BUILD_STAMP = now(lastSiteChange());
