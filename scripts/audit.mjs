/**
 * Audit every built page for problems the content rules cannot see.
 *
 * Runs on site/ after the build:
 *  - fixed widths in ch that break text on small screens
 *  - inline layout styles leaking into markup
 *  - images without alt text or without dimensions (layout shift)
 *  - missing or duplicated h1
 *  - affiliate links without rel="sponsored nofollow noopener" or our tag
 *  - missing canonical, description length
 *  - internal links to pages that are not generated
 *  - more than one stylesheet, buttons without an accessible name
 *  - skeleton pages that sell
 *  - fixed-path assets without a content hash in their URL
 *
 *   npm run audit
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'site');

function pages(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'pagefind' || e === '_astro' || e === 'admin') continue;
      pages(p, out);
    } else if (e === 'index.html') out.push(p);
  }
  return out;
}

const problems = [];
const note = (page, msg) => problems.push(`${page.replace(DIST, '')}: ${msg}`);

// Redirect pages (the root, and old article paths) are meta-refresh stubs with
// no title or description; they are not content and are skipped.
const isRedirect = (file) =>
  /<meta[^>]+http-equiv=["']?refresh/i.test(readFileSync(file, 'utf8'));

const list = pages(DIST)
  .filter((f) => f !== join(DIST, 'index.html'))
  .filter((f) => !isRedirect(f));

// Every generated path, for checking internal links.
const generated = new Set(
  pages(DIST).map((f) => f.replace(DIST, '').replace(/index\.html$/, ''))
);
generated.add('/');
console.log(`\n${'─'.repeat(52)}\nAudit of ${list.length} pages\n${'─'.repeat(52)}`);

for (const file of list) {
  const short = file;
  const html = readFileSync(file, 'utf8');
  const d = new JSDOM(html).window.document;

  // 1. fixed widths in ch
  for (const el of d.querySelectorAll('[style*="ch"]')) {
    if (/max-width\s*:\s*\d+ch/.test(el.getAttribute('style') || '')) {
      note(short, `fixed width on <${el.tagName.toLowerCase()}> — make it responsive`);
    }
  }

  // 2. inline layout styles
  for (const el of d.querySelectorAll('[style]')) {
    const st = el.getAttribute('style') || '';
    if (/(padding|margin|font-size|max-width)/.test(st) && !st.includes('--fill')) {
      note(short, `inline layout style on <${el.tagName.toLowerCase()}>: ${st.slice(0, 42)}`);
    }
  }

  // 3. images: alt text and dimensions
  for (const img of d.querySelectorAll('img')) {
    // alt="" is accepted only with aria-hidden: a decorative image in a group
    const decorative = img.getAttribute('aria-hidden') === 'true' && img.getAttribute('alt') === '';
    if (!img.getAttribute('alt') && !decorative) {
      note(short, `image without alt: ${img.getAttribute('src')}`);
    }
    if (!img.getAttribute('width') || !img.getAttribute('height')) {
      note(short, `image without width/height (layout shift): ${img.getAttribute('src')}`);
    }
  }

  // 4. exactly one h1
  const h1s = d.querySelectorAll('h1');
  if (h1s.length !== 1) note(short, `${h1s.length} h1 elements (exactly 1 required)`);

  // 5. affiliate links
  for (const a of d.querySelectorAll('a[data-affiliate]')) {
    const rel = a.getAttribute('rel') || '';
    if (!rel.includes('sponsored') || !rel.includes('nofollow') || !rel.includes('noopener')) {
      note(short, `affiliate link with incomplete rel: ${rel || '(empty)'}`);
    }
    if (!(a.getAttribute('href') || '').includes('tag=')) {
      note(short, 'affiliate link without our tag');
    }
  }

  // 6. meta
  if (!d.querySelector('link[rel="canonical"]')) note(short, 'no canonical link');
  const desc = d.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  if (desc.length < 50 || desc.length > 165) note(short, `description is ${desc.length} characters (50–165)`);

  // 7. internal links to pages that do not exist
  for (const a of d.querySelectorAll('a[href^="/"]')) {
    const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
    if (!href || href.startsWith('//')) continue;
    if (/\.(css|js|png|jpg|jpeg|webp|svg|xml|txt|ico|woff2?)$/i.test(href)) continue;
    const norm = href.endsWith('/') ? href : href + '/';
    if (!generated.has(norm) && !generated.has(href)) {
      note(short, `broken internal link: ${href}`);
    }
  }

  // 8. one stylesheet per page
  const sheets = [...d.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => l.getAttribute('href') || '')
    .filter((h) => h.includes('_astro'));
  if (sheets.length > 1) note(short, `${sheets.length} stylesheets (1 expected)`);

  // 9. buttons need an accessible name
  for (const b of d.querySelectorAll('button')) {
    const label = (b.textContent || '').trim() || b.getAttribute('aria-label');
    if (!label) note(short, 'button without an accessible name');
  }

  // 10. a skeleton sells nothing
  //
  // A skeleton page shows no product card, comparison or buy link — and, for
  // that reason, no affiliate disclosure. A template that hid the disclosure
  // but still rendered the buy links would publish affiliate links with no
  // disclosure, which Swedish marketing law does not allow.
  if (d.querySelector('.notwritten')) {
    if (d.querySelector('[rel~="sponsored"], [data-affiliate]')) {
      note(short, 'skeleton page shows a buy link — skeletons sell nothing');
    }
    if (d.querySelector('.compare-table, .tile-cta')) {
      note(short, 'skeleton page shows a comparison table or buy button');
    }
  }

  // 11. every fixed-path asset carries a content hash in its URL
  //
  // .htaccess lets browsers cache .js and .css for a year. That is right for
  // _astro/* (hashed file names) and wrong for a fixed path: visitors would get
  // new pages with an old script. Assets served from public/ therefore carry
  // ?v=<hash> (src/lib/asset-hash.ts).
  const assets = [
    ...[...d.querySelectorAll('script[src]')].map((el) => el.getAttribute('src') || ''),
    ...[...d.querySelectorAll('link[rel="stylesheet"]')].map((el) => el.getAttribute('href') || ''),
  ];
  for (const src of assets) {
    if (!src.startsWith('/') || src.startsWith('//')) continue;
    // _astro/* is hashed by name. pagefind/* is generated by Pagefind itself and
    // changes only when the dependency is upgraded.
    if (src.startsWith('/_astro/') || src.startsWith('/pagefind/')) continue;
    if (!/[?&]v=[0-9a-f]{6,}/.test(src)) {
      note(short, `fixed-path asset without a content hash (cached for a year): ${src}`);
    }
  }
}

console.log(problems.length ? '' : '✓ No findings\n');
const seen = new Map();
for (const p of problems) {
  const key = p.split(':').slice(1).join(':').slice(0, 60);
  seen.set(key, (seen.get(key) || 0) + 1);
}
for (const [msg, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  • ${msg.trim()}${n > 1 ? `  ×${n}` : ''}`);
}
if (problems.length) console.log(`\n${problems.length} finding(s)\n`);
process.exit(problems.length ? 1 : 0);
