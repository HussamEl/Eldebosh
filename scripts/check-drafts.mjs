/**
 * No published fixed page may still carry draft text.
 *
 * Fixed pages — privacy policy, affiliate disclosure, terms, about — are
 * reached from the footer of every page. A privacy policy that says of itself
 * that it is unfinished is worse than none: these pages are the site's legal
 * standing under Swedish law, and a disclosure marked as unreviewed weakens
 * itself.
 *
 * Skeletons (stage: draft) are exempt: their body is never shown; the template
 * replaces it with a page that says it is not written yet.
 *
 *   npm run check:drafts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = join(ROOT, 'src/content/pages');

/** Markers that a text is a draft: Swedish, English and Arabic placeholders. */
const DRAFT = /UTKAST|Fylls i\.|\bTBD\b|لم يُكتب بعد/;

function mdx(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) mdx(p, out);
    else if (e.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const flagged = [];
for (const file of mdx(PAGES)) {
  const fm = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) continue;
  const [, front, body] = fm;
  if (!/^published:\s*true\s*$/m.test(front)) continue;
  if (/^stage:\s*draft\s*$/m.test(front)) continue;
  const hit = body.split('\n').find((l) => DRAFT.test(l));
  if (hit) flagged.push({ rel: file.replace(ROOT, ''), marker: hit.trim().slice(0, 64) });
}

if (!flagged.length) {
  console.log('\n✓ No published page carries draft text\n');
  process.exit(0);
}
console.log('\n✗ Published pages whose text is still a draft — visitors see them:\n');
for (const f of flagged) console.log(`  ${f.rel}\n    ${f.marker}`);
console.log('');
process.exit(1);
