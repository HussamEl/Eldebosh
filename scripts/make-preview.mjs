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
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'site');

if (!existsSync(DIST)) {
  console.error('✗ لا يوجد بناء. شغّل npm run build أولاً.');
  process.exit(1);
}

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
  routes[path] = { html: inner, title: titleMatch ? titleMatch[1] : 'Eldebosh' };
}

const home = routes['/sv/'] ? '/sv/' : Object.keys(routes)[0];

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
</style>
</head>
<body>
<div id="app"></div>

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
    const allBtn = bar.querySelector('[data-filter="all"]');
    const testedBtn = bar.querySelector('[data-toggle="tested"]');
    let testedOnly = false;

    bar.hidden = false;
    if (countEl) countEl.hidden = false;

    const apply = () => {
      let shown = 0;
      for (const el of tiles) {
        const on = !testedOnly || el.dataset.tested === 'true';
        el.hidden = !on;
        if (on) shown++;
      }
      if (allBtn) { allBtn.classList.toggle('is-on', !testedOnly); allBtn.setAttribute('aria-pressed', String(!testedOnly)); }
      if (testedBtn) { testedBtn.classList.toggle('is-on', testedOnly); testedBtn.setAttribute('aria-pressed', String(testedOnly)); }
      if (countEl) countEl.textContent = (grid.dataset.countTemplate || '{n}').replace('{n}', shown);
    };

    if (allBtn) allBtn.addEventListener('click', () => { testedOnly = false; apply(); });
    if (testedBtn) testedBtn.addEventListener('click', () => { testedOnly = !testedOnly; apply(); });
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
console.log(`\n✓ ${(out.length / 1024).toFixed(0)} KB · ${Object.keys(routes).length} صفحة · ${images.size} صورة\n`);
