/**
 * Rökprov för den byggda sajten i ../site.
 *
 * Startar en egen statisk server (inga beroenden utöver Playwright), kör
 * kontrollerna nedan i Chromium och avslutar med kod 1 om något faller.
 *
 *   node tools/verify-site.mjs [--keep-open]
 */
import { chromium, devices } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain', '.pagefind': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream', '.pf_index': 'application/octet-stream',
  '.pf_meta': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ------------------------------------------------------------------ */
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`);
};

const PAGES = fs.readdirSync(ROOT, { recursive: true })
  .filter((f) => f.endsWith('index.html') && !f.startsWith('admin'))
  .map((f) => '/' + f.replace(/index\.html$/, ''));

const browser = await chromium.launch();

/* 1. varje sida laddar rent -------------------------------------------- */
console.log('\n· sidor');
{
  const page = await browser.newPage();
  const problems = [];
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  page.on('pageerror', (e) => problems.push('js: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  for (const p of PAGES) await page.goto(BASE + p, { waitUntil: 'networkidle' });
  check(`${PAGES.length} sidor utan fel eller 404`, problems.length === 0, problems.slice(0, 4).join(' | '));
  await page.close();
}

/* 2. paletten och logotypen -------------------------------------------- */
console.log('\n· identitet');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const theme = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    header: getComputedStyle(document.querySelector('.masthead')).backgroundColor,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--volt').trim(),
  }));
  check('paletten är den blå', theme.accent.toUpperCase() === '#55C6F2' && theme.body === 'rgb(231, 242, 253)',
        `--volt ${theme.accent}, body ${theme.body}`);
  const logo = await page.evaluate(() => {
    const img = document.querySelector('.brand img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), loaded: img.naturalWidth > 0,
             label: img.closest('a').getAttribute('aria-label') };
  });
  check('logotypen i headern laddar', !!logo && logo.loaded && logo.h === 26,
        logo ? `${logo.w}x${logo.h} · ${logo.label}` : 'saknas');
  await page.close();
}

/* 3. bildvisaren -------------------------------------------------------- */
console.log('\n· bildvisare');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  check('visarna flyttas ut ur korten',
        await page.evaluate(() => [...document.querySelectorAll('.viewer')].every((v) => v.parentElement === document.body)));

  const tile = page.locator('.tile:has(.tile-photos)').first();
  await tile.hover();                       // hovern är aktiv vid varje riktig klick
  // Playwright rullar själv fram elementet — mät efter det, före klicket.
  const scrollBefore = await page.evaluate(() => Math.round(scrollY));
  await tile.locator('.tile-face').click();
  await page.waitForTimeout(300);
  const open = await page.evaluate(() => {
    const v = document.querySelector('.viewer.is-open');
    if (!v) return null;
    const box = v.querySelector('.viewer-box').getBoundingClientRect();
    const veil = v.querySelector('.viewer-veil').getBoundingClientRect();
    return { boxW: Math.round(box.width), veilW: Math.round(veil.width), veilH: Math.round(veil.height),
             locked: document.body.classList.contains('viewer-open'), hash: location.hash,
             focus: document.activeElement.className, scrollY: Math.round(scrollY) };
  });
  check('dialogen fyller vyn i stället för kortet',
        !!open && open.veilW === 1440 && open.veilH === 900 && open.boxW > 400,
        open ? `ruta ${open.boxW}px, slöja ${open.veilW}x${open.veilH}` : 'öppnades inte');
  check('inget hash-hopp och ingen scroll vid öppning',
        !!open && open.hash === '' && open.scrollY === scrollBefore,
        open ? `hash "${open.hash}", scroll ${scrollBefore} → ${open.scrollY}` : '');
  check('bakgrunden är låst och fokus flyttat', !!open && open.locked && open.focus === 'viewer-close');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => ({
    open: !!document.querySelector('.viewer.is-open'),
    locked: document.body.classList.contains('viewer-open'),
    focus: document.activeElement.className,
  }));
  check('Escape stänger och fokus återvänder', !closed.open && !closed.locked && closed.focus === 'tile-face');

  const photos = await page.evaluate(() => {
    const t = document.querySelector('.tile:has(.tile-photos[data-n="3"])');
    return t ? [...t.querySelectorAll('.tile-photo')].map((i) => getComputedStyle(i).opacity) : null;
  });
  await tile.hover();
  await page.waitForTimeout(400);
  const hovered = await page.evaluate(() => {
    const t = document.querySelector('.tile:has(.tile-photos[data-n="3"])');
    return t ? [...t.querySelectorAll('.tile-photo')].map((i) => Number(getComputedStyle(i).opacity)) : null;
  });
  check('hovern visar en bild, inte två halvtonade',
        !photos || (hovered && hovered.filter((o) => o > 0.02).length <= 1), JSON.stringify(hovered));
  await page.close();
}

/* 4. utan JavaScript ---------------------------------------------------- */
console.log('\n· utan JavaScript');
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Öppna via hash — det är precis vad :target-reserven gör utan JS.
  await page.goto(BASE + '/sv/#v-P-11', { waitUntil: 'load' });
  // Hovra kortet: transformen på .tile är det som gjorde att dialogen
  // klipptes inuti kortet i den gamla bygget. Reserven måste klara den.
  await page.locator('#t-P-11').hover();
  await page.waitForTimeout(300);
  const veil = await page.evaluate(() => {
    const v = document.querySelector('.viewer:target');
    if (!v) return null;
    const r = v.querySelector('.viewer-veil').getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  check(':target-reserven täcker hela vyn', !!veil && veil.w === 1440 && veil.h === 900,
        veil ? `${veil.w}x${veil.h}` : 'öppnades inte');
  await ctx.close();
}

/* 5. mobil -------------------------------------------------------------- */
console.log('\n· mobil');
{
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const head = await page.evaluate(() => {
    const img = document.querySelector('.brand img').getBoundingClientRect();
    const nav = document.querySelector('.nav-mobile').getBoundingClientRect();
    return { overlap: img.right > nav.left, logoW: Math.round(img.width) };
  });
  check('logotypen krockar inte med mobilmenyn', !head.overlap, `${head.logoW}px bred`);
  await page.locator('.tile-face').first().tap();
  await page.waitForTimeout(300);
  const fits = await page.evaluate(() => {
    const v = document.querySelector('.viewer.is-open');
    if (!v) return null;
    const b = v.querySelector('.viewer-box').getBoundingClientRect();
    return b.width <= innerWidth && b.left >= 0;
  });
  check('dialogen får plats på mobilen', fits === true);
  await ctx.close();
}

/* 6. filterknapparna ---------------------------------------------------- */
console.log('\n· filter');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const all = await page.evaluate(() => document.querySelectorAll('.tile:not([hidden])').length);
  await page.locator('[data-toggle="tested"]').click();
  await page.waitForTimeout(150);
  const some = await page.evaluate(() => ({
    visible: document.querySelectorAll('.tile:not([hidden])').length,
    label: document.querySelector('[data-gear-count]').textContent.trim(),
  }));
  check('filtret döljer korten och räknar om', some.visible < all && some.label.startsWith(String(some.visible)),
        `${all} → ${some.visible} (${some.label})`);
  await page.close();
}

/* 7. filer som måste finnas -------------------------------------------- */
console.log('\n· filer');
for (const f of ['favicon.svg', 'logo.svg', 'og-default.png', 'apple-touch-icon.png',
                 'icon-192.png', 'icon-512.png', 'brand/eldebosh-logo-header.svg',
                 'js/eldebosh-ui.js', '.htaccess']) {
  check(f, fs.existsSync(path.join(ROOT, f)));
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} kontroller gick igenom`);
process.exit(failed.length ? 1 : 0);
