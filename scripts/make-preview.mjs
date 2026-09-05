/**
 * يولّد ملف HTML واحداً يتصفّح كالموقع تماماً — بلا إنترنت وبلا خادم.
 *
 * كل صفحات الموقع مضمّنة داخله، والروابط تعمل: الضغط ينقلك بين الصفحات،
 * وزر الرجوع في الجوال يعمل أيضاً.
 *
 * الصور تُخزَّن مرة واحدة في خريطة مشتركة بدل تكرارها في كل صفحة.
 *
 *   npm run preview:file        (بعد npm run build)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, '.preview-site');

/* ---------- بناء يشمل المسوّدات، إلى مجلّد منفصل ----------
   المراجعة كانت مستحيلة: `published: false` تعني أن الصفحة لا تُبنى، فلا
   تدخل المعاينة، فلا يقرأها حسام إلا في `git`. البناء هنا يُشغَّل بعلَم
   `ELDEBOSH_PREVIEW=1` الذي يفتح المسوّدات ويحوّل المخرجات إلى
   `.preview-site` — فلا تلمس هذه العملية النسخة المنشورة إطلاقاً. */
const build = spawnSync(process.execPath, [join(ROOT, 'node_modules/astro/astro.js'), 'build'], {
  cwd: ROOT,
  env: { ...process.env, ELDEBOSH_PREVIEW: '1' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
if (build.status !== 0) {
  console.error('✗ فشل بناء المعاينة.');
  process.exit(1);
}
if (!existsSync(DIST)) {
  console.error('✗ لم يُنتج بناء المعاينة مجلّداً.');
  process.exit(1);
}

/* ---------- أي الصفحات مسوّدة، وأيها جاهزة للمراجعة؟ ---------- */
const stages = new Map();
(function scan(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) scan(f);
    else if (e.endsWith('.mdx') || e.endsWith('.md')) {
      const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      if (/^published:\s*true\s*$/m.test(fm[1])) continue;
      const slug = fm[1].match(/^slug:\s*"?([a-z0-9-]+)"?\s*$/m);
      const stage = fm[1].match(/^stage:\s*(\w+)\s*$/m);
      if (slug) stages.set(slug[1], stage ? stage[1] : 'draft');
    }
  }
})(join(ROOT, 'src/content'));

/* ---------- جمع كل الصفحات ---------- */
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

/* ---------- الصور: مرة واحدة في خريطة مشتركة ---------- */
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const images = new Map();

function collectImage(rel) {
  if (images.has(rel)) return true;
  const file = join(DIST, rel.replace(/^\//, ''));
  if (!existsSync(file)) return false;
  images.set(rel, `data:${MIME[extname(rel)] ?? 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`);
  return true;
}

/* ---------- الأنماط والخطوط ---------- */
const cssName = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'));
let css = readFileSync(join(DIST, '_astro', cssName), 'utf8');

// الحروف السويدية داخل المجموعة الأساسية — الموسّعة غير لازمة
css = css.replace(/@font-face\s*\{[^}]*latin-ext[^}]*\}/g, '');
css = css.replace(/url\(([^)]*?\.woff2)\)/g, (m, p) => {
  const clean = p.replace(/['"]/g, '');
  const file = join(DIST, clean.replace(/^\//, ''));
  if (!existsSync(file)) return m;
  return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
});

/* ---------- استخراج الصفحات ---------- */
const routes = {};

for (const file of files) {
  const path = file.replace(DIST, '').replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');

  const bodyStart = html.indexOf('<body');
  let inner = html.slice(html.indexOf('>', bodyStart) + 1, html.lastIndexOf('</body>'));

  inner = inner.replace(/<script[\s\S]*?<\/script>/g, '');

  // الصور تُستبدل بمرجع إلى الخريطة
  inner = inner.replace(/src="(\/[^"]+\.(?:webp|png|jpg|svg))"/g, (m, p) =>
    collectImage(p) ? `data-img="${p}" src=""` : m
  );

  // الروابط الداخلية تصبح مسارات مجزّأة يفهمها الموجّه
  inner = inner.replace(/href="(\/[^"#]*)"/g, (m, p) => {
    if (/\.(css|js|png|jpg|webp|svg|xml|txt|ico|woff2?)$/i.test(p)) return 'href="#"';
    return `href="#${p}"`;
  });

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const slug = path.replace(/\/$/, '').split('/').pop();
  const stage = stages.get(slug) ?? null;
  // `written` نصّ مكتمل ينتظر مراجعة حسام. `draft` هيكل فارغ لم يُكتب بعد.
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

/* ترتيب المراجعة — نفس ترتيب النشر المُلزم في CONTEXT §13 */
const REVIEW_ORDER = ['solutions', 'guides', 'compare', 'blog'];
const reviewRank = (path) => {
  const i = REVIEW_ORDER.findIndex((seg) => path.includes(`/${seg}/`));
  return i === -1 ? REVIEW_ORDER.length : i;
};

/* ---------- التجميع ---------- */
const out = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Eldebosh</title>
<style>${css}</style>
<style>
  /* المعاينة المحلية: لا شيء مرئي يُضاف — الموقع كما هو */
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
  // ترتيب المراجعة هو ترتيب النشر: حلول ثم أدلة ومقارنات ثم مقالات،
  // فلا يُنشر رابط قبل الصفحة التي يقود إليها.
  .sort(([a], [b]) => reviewRank(a) - reviewRank(b) || a.localeCompare(b))
  .map(([p, r]) => `<a href="#${p}">${r.title.replace(/ \| Eldebosh.*/, '').replace(/ [—-] .*/, '')}</a>`)
  .join('')}</nav>

<script id="pv-routes" type="application/json">${JSON.stringify(routes).replace(/</g, '\\u003c')}</script>
<script id="pv-images" type="application/json">${JSON.stringify(Object.fromEntries(images)).replace(/</g, '\\u003c')}</script>

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
      app.innerHTML = '<p class="pv-missing">الصفحة غير موجودة في المعاينة:<br>' + path + '</p>';
      return;
    }
    app.innerHTML = route.html;
    document.title = route.title;

    // ربط الصور من الخريطة المشتركة
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

  // تصفية المنتجات — نفس منطق الموقع
  function wireFilter() {
    const bar = app.querySelector('[data-gearbar]');
    const grid = app.querySelector('[data-gear-grid]');
    if (!bar || !grid) return;

    const countEl = app.querySelector('[data-gear-count]');
    const tiles = [...grid.querySelectorAll('.tile')];
    const buttons = [...bar.querySelectorAll('[data-filter]')];
    let active = 'all';

    bar.hidden = false;
    if (countEl) countEl.hidden = false;

    const apply = () => {
      let shown = 0;
      for (const el of tiles) {
        const on = active === 'all' || el.dataset.category === active;
        el.hidden = !on;
        if (on) shown++;
      }
      for (const btn of buttons) {
        const on = btn.dataset.filter === active;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', String(on));
      }
      if (countEl) countEl.textContent = (grid.dataset.countTemplate || '{n}').replace('{n}', shown);
    };

    for (const btn of buttons) {
      btn.addEventListener('click', () => { active = btn.dataset.filter || 'all'; apply(); });
    }
    apply();
  }

  // بحث محلي بسيط في عناوين الصفحات ونصوصها
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
  `\n✓ ${(out.length / 1024).toFixed(0)} KB · ${Object.keys(routes).length} صفحة · ${images.size} صورة\n` +
    `  ${ready} صفحة جاهزة للمراجعة — شريط سفلي يقفز إليها مباشرة\n` +
    `  eldebosh-preview.html — يُفتح على الجوال بلا إنترنت\n`,
);
