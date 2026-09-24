/**
 * Build a single HTML file that browses like the site — offline, no server.
 *
 * For reviewing visual changes and drafts on a phone before anything is
 * published: every page is embedded, links navigate between them, and the
 * phone's back button works. Images are stored once in a shared map.
 * Drafts are included, and a bar at the bottom jumps to pages waiting for
 * review.
 *
 *   npm run preview:file     → eldebosh-preview.html (git-ignored)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// The site's own UI script, embedded verbatim so the preview runs the same code.
const uiScript = readFileSync(join(ROOT, 'public/js/eldebosh-ui.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const DIST = join(ROOT, '.preview-site');

/* ---------- a build that includes drafts, in its own folder ----------
   Unpublished pages are not built normally, so they could not be reviewed.
   ELDEBOSH_PREVIEW=1 includes them (src/lib/preview.ts) and sends the output
   to .preview-site, so this never touches the build that gets published. */
const build = spawnSync(process.execPath, [join(ROOT, 'node_modules/astro/astro.js'), 'build'], {
  cwd: ROOT,
  env: { ...process.env, ELDEBOSH_PREVIEW: '1' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
if (build.status !== 0) {
  console.error('✗ The preview build failed.');
  process.exit(1);
}
if (!existsSync(DIST)) {
  console.error('✗ The preview build produced no output folder.');
  process.exit(1);
}

/* ---------- which pages are drafts, and which wait for review ---------- */
const stages = new Map();
(function scan(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) scan(f);
    else if (e.endsWith('.mdx') || e.endsWith('.md')) {
      const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      const slug = fm[1].match(/^slug:\s*"?([a-z0-9-]+)"?\s*$/m);
      const stage = fm[1].match(/^stage:\s*(\w+)\s*$/m);
      // A live page is marked only while its text waits for approval (stage: written).
      if (/^published:\s*true\s*$/m.test(fm[1]) && !(stage && stage[1] === 'written')) continue;
      if (slug) stages.set(slug[1], stage ? stage[1] : 'draft');
    }
  }
})(join(ROOT, 'src/content'));

/* ---------- collect pages ---------- */
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (['pagefind', '_astro', 'admin', 'fonts', 'uploads'].includes(e)) continue;
      walk(p, out);
    } else if (e === 'index.html') {
      out.push(p);
    }
  }
  return out;
}

const files = walk(DIST).filter((f) => f !== join(DIST, 'index.html'));

/* ---------- images, stored once ---------- */
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const images = new Map();

function collectImage(rel) {
  if (images.has(rel)) return true;
  const file = join(DIST, rel.replace(/^\//, ''));
  if (!existsSync(file)) return false;
  images.set(rel, `data:${MIME[extname(rel)] ?? 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`);
  return true;
}

/* ---------- styles and fonts ---------- */
const cssName = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'));
let css = readFileSync(join(DIST, '_astro', cssName), 'utf8');

// Swedish letters are in the basic Latin subset; the extended one is not needed.
css = css.replace(/@font-face\s*\{[^}]*latin-ext[^}]*\}/g, '');
css = css.replace(/url\(([^)]*?\.woff2)\)/g, (m, p) => {
  const clean = p.replace(/['"]/g, '');
  const file = join(DIST, clean.replace(/^\//, ''));
  if (!existsSync(file)) return m;
  return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
});

/* ---------- extract pages ---------- */
const routes = {};

for (const file of files) {
  const path = file.replace(DIST, '').replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');

  const bodyStart = html.indexOf('<body');
  let inner = html.slice(html.indexOf('>', bodyStart) + 1, html.lastIndexOf('</body>'));

  inner = inner.replace(/<script[\s\S]*?<\/script>/g, '');

  // images become references into the shared map
  inner = inner.replace(/src="(\/[^"]+\.(?:webp|png|jpg|svg))"/g, (m, p) =>
    collectImage(p) ? `data-img="${p}" src=""` : m
  );

  // internal links become hash routes for the in-file router
  inner = inner.replace(/href="(\/[^"#]*)"/g, (m, p) => {
    if (/\.(css|js|png|jpg|webp|svg|xml|txt|ico|woff2?)$/i.test(p)) return 'href="#"';
    return `href="#${p}"`;
  });

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const slug = path.replace(/\/$/, '').split('/').pop();
  const stage = stages.get(slug) ?? null;
  // `written` is complete text awaiting the owner's review; `draft` is an empty skeleton.
  const ready = stage === 'written' || stage === 'reviewed';
  if (stage) {
    inner =
      `<p class="pv-draft${ready ? ' is-ready' : ''}">` +
      (ready ? 'Klar för granskning — inte publicerad' : 'Utkast — texten är inte skriven') +
      '</p>' +
      inner;
  }
  routes[path] = { html: inner, title: titleMatch ? titleMatch[1] : 'Eldebosh', stage, ready };
}

const home = routes['/sv/'] ? '/sv/' : Object.keys(routes)[0];

/* Review order = publishing order: a page is published before the pages that link to it. */
const REVIEW_ORDER = ['solutions', 'guides', 'compare', 'blog'];
const reviewRank = (path) => {
  const i = REVIEW_ORDER.findIndex((seg) => path.includes(`/${seg}/`));
  return i === -1 ? REVIEW_ORDER.length : i;
};

/* ---------- assemble ---------- */
const out = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Eldebosh</title>
<style>${css}</style>
<style>
  /* Nothing visible is added: the site as it is. */
  #app { min-height: 100dvh; }
  .pv-missing { padding: 4rem 1.25rem; text-align: center; font: 500 15px/1.6 system-ui, sans-serif; color: #67768a; }
  .pv-draft {
    margin: 0; padding: 0.6rem 1.25rem; text-align: center;
    font: 600 13px/1.5 system-ui, sans-serif; letter-spacing: .02em;
    background: #67768a; color: #fff;
  }
  .pv-draft.is-ready { background: #14456e; }
  .pv-bar {
    position: sticky; bottom: 0; z-index: 50; display: flex; gap: .5rem;
    overflow-x: auto; padding: .5rem .75rem;
    background: #14456e; box-shadow: 0 -2px 12px rgba(18,63,102,.35);
  }
  .pv-bar a {
    flex: 0 0 auto; padding: .35rem .7rem; border-radius: 999px;
    font: 600 12px/1.4 system-ui, sans-serif; text-decoration: none;
    background: #1273d1; color: #fff; white-space: nowrap;
  }
  .pv-bar b { flex: 0 0 auto; align-self: center; color: #b9d2e5; font: 600 12px/1.4 system-ui, sans-serif; }
</style>
</head>
<body>
<div id="app"></div>
<nav class="pv-bar" aria-label="Klara för granskning"><b>Granska:</b>${Object.entries(routes)
  .filter(([p, r]) => r.ready && p.startsWith('/sv/'))
  // Solutions, then guides and comparisons, then articles — no page is
  // published before the page it links to.
  .sort(([a], [b]) => reviewRank(a) - reviewRank(b) || a.localeCompare(b))
  .map(([p, r]) => `<a href="#${p}">${r.title.replace(/ \| Eldebosh.*/, '').replace(/ [—-] .*/, '')}</a>`)
  .join('')}</nav>

<script id="pv-routes" type="application/json">${JSON.stringify(routes).replace(/</g, '\\u003c')}</script>
<script id="pv-images" type="application/json">${JSON.stringify(Object.fromEntries(images)).replace(/</g, '\\u003c')}</script>

<script>${uiScript}</script>
<script>
(() => {
  const routes = JSON.parse(document.getElementById('pv-routes').textContent);
  const images = JSON.parse(document.getElementById('pv-images').textContent);
  const app = document.getElementById('app');
  const HOME = ${JSON.stringify(home)};

  function normalise(p) {
    if (!p || p === '/' || p === '#') return HOME;
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p += '/';
    return p;
  }

  function render(path) {
    const route = routes[path] || routes[normalise(path)];
    if (!route) {
      app.innerHTML = '<p class="pv-missing">Sidan finns inte i förhandsvisningen:<br>' + path + '</p>';
      return;
    }
    app.innerHTML = route.html;
    document.title = route.title;

    // resolve images from the shared map
    for (const img of app.querySelectorAll('[data-img]')) {
      const uri = images[img.dataset.img];
      if (uri) img.src = uri;
    }

    window.scrollTo({ top: 0 });
    wireFilter();
  }

  function go() {
    render(normalise(location.hash.slice(1)));
  }

  // The product filter is the site's own code, inlined once below — not a copy.
  function wireFilter() {
    if (window.EldeboshUI) window.EldeboshUI.initGearFilter(app);
  }

  // simple local search over page titles and text
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[type=search]');
    const q = (input?.value || '').trim().toLowerCase();
    if (!q) return;

    const hits = Object.entries(routes)
      .filter(([p]) => !p.startsWith('/en/'))
      .map(([p, r]) => {
        const text = r.html.replace(/<[^>]+>/g, ' ').toLowerCase();
        return { p, title: r.title.replace(/ \| Eldebosh.*/, ''), hit: text.includes(q) };
      })
      .filter((x) => x.hit);

    app.innerHTML =
      '<div class="wrap page-body page-body-top"><header class="page-head"><h1>Sök: ' + q + '</h1>' +
      '<p class="lead">' + hits.length + ' träffar</p></header>' +
      (hits.length
        ? '<div class="grid grid-3" style="margin-top:1.5rem">' +
          hits.map((h) => '<article class="card card-link"><h3><a class="stretch" href="#' + h.p + '">' + h.title + '</a></h3></article>').join('') +
          '</div>'
        : '<p class="notice">Inget hittades.</p>') +
      '<p style="margin-top:1.5rem"><a class="btn btn-ghost" href="#' + HOME + '">Till startsidan</a></p></div>';
    window.scrollTo({ top: 0 });
  });

  window.addEventListener('hashchange', go);
  go();
})();
</script>
</body>
</html>`;

writeFileSync(join(ROOT, 'eldebosh-preview.html'), out, 'utf8');
const ready = Object.entries(routes).filter(([p, r]) => r.ready && p.startsWith('/sv/')).length;
console.log(
  `\n✓ ${(out.length / 1024).toFixed(0)} KB · ${Object.keys(routes).length} pages · ${images.size} images\n` +
    `  ${ready} page(s) ready for review — the bottom bar jumps to them\n` +
    `  eldebosh-preview.html — opens on a phone, offline\n`,
);
