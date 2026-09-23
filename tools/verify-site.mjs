/**
 * Browser test of the built site in ../site.
 *
 * Starts its own static server (no dependency beyond Playwright), runs the
 * checks below in Chromium, and exits with code 1 if any fails. Covers what
 * only a real browser shows: layout, focus, scroll locking, the no-JavaScript
 * fallback, and the brand files actually served.
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

/* 1. every page loads cleanly ----------------------------------------- */
console.log('\n· pages');
{
  const page = await browser.newPage();
  const problems = [];
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  page.on('pageerror', (e) => problems.push('js: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  for (const p of PAGES) await page.goto(BASE + p, { waitUntil: 'networkidle' });
  check(`${PAGES.length} pages load without errors or 404s`, problems.length === 0, problems.slice(0, 4).join(' | '));
  await page.close();
}

/* 2. palette and logo ------------------------------------------------- */
console.log('\n· identity');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const theme = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    header: getComputedStyle(document.querySelector('.masthead')).backgroundColor,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--volt').trim(),
  }));
  check('the palette is the blue one', theme.accent.toUpperCase() === '#55C6F2' && theme.body === 'rgb(231, 242, 253)',
        `--volt ${theme.accent}, body ${theme.body}`);
  const logo = await page.evaluate(() => {
    const img = document.querySelector('.brand img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), loaded: img.naturalWidth > 0,
             label: img.closest('a').getAttribute('aria-label') };
  });
  check('the header logo loads', !!logo && logo.loaded && logo.h === 26,
        logo ? `${logo.w}x${logo.h}` : 'saknas');
  check('the logo link has a readable aria-label',
        !!logo && typeof logo.label === 'string' && logo.label.length > 3 && !/undefined|null/.test(logo.label),
        logo ? `"${logo.label}"` : '');
  await page.close();
}

/* 3. photo viewer ------------------------------------------------------ */
console.log('\n· photo viewer');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  check('viewers are moved out of the tiles',
        await page.evaluate(() => [...document.querySelectorAll('.viewer')].every((v) => v.parentElement === document.body)));

  const tile = page.locator('.tile:has(.tile-photos)').first();
  await tile.hover();                       // a real click always hovers first
  // Playwright scrolls the element into view itself — measure after that, before the click.
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
  check('the dialog fills the viewport, not the tile',
        !!open && open.veilW === 1440 && open.veilH === 900 && open.boxW > 400,
        open ? `ruta ${open.boxW}px, slöja ${open.veilW}x${open.veilH}` : 'öppnades inte');
  check('no hash jump and no scroll when opening',
        !!open && open.hash === '' && open.scrollY === scrollBefore,
        open ? `hash "${open.hash}", scroll ${scrollBefore} → ${open.scrollY}` : '');
  check('background locked and focus moved', !!open && open.locked && open.focus === 'viewer-close');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => ({
    open: !!document.querySelector('.viewer.is-open'),
    locked: document.body.classList.contains('viewer-open'),
    focus: document.activeElement.className,
  }));
  check('Escape closes and focus returns', !closed.open && !closed.locked && closed.focus === 'tile-face');

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
  check('hover shows one photo, not two half-faded',
        !photos || (hovered && hovered.filter((o) => o > 0.02).length <= 1), JSON.stringify(hovered));
  await page.close();
}

/* 4. without JavaScript ------------------------------------------------ */
console.log('\n· without JavaScript');
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // open via the hash — exactly what the :target fallback does without JS
  await page.goto(BASE + '/sv/#v-P-11', { waitUntil: 'load' });
  // hover the tile: its transform would clip a fixed dialog inside it;
  // the fallback must survive that
  await page.locator('#t-P-11').hover();
  await page.waitForTimeout(300);
  const veil = await page.evaluate(() => {
    const v = document.querySelector('.viewer:target');
    if (!v) return null;
    const r = v.querySelector('.viewer-veil').getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  check('the :target fallback covers the viewport', !!veil && veil.w === 1440 && veil.h === 900,
        veil ? `${veil.w}x${veil.h}` : 'öppnades inte');
  await ctx.close();
}

/* 5. mobile ------------------------------------------------------------ */
console.log('\n· mobile');
{
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const head = await page.evaluate(() => {
    const img = document.querySelector('.brand img').getBoundingClientRect();
    const nav = document.querySelector('.nav-mobile').getBoundingClientRect();
    return { overlap: img.right > nav.left, logoW: Math.round(img.width) };
  });
  check('the logo does not collide with the mobile menu', !head.overlap, `${head.logoW}px wide`);
  await page.locator('.tile-face').first().tap();
  await page.waitForTimeout(300);
  const fits = await page.evaluate(() => {
    const v = document.querySelector('.viewer.is-open');
    if (!v) return null;
    const b = v.querySelector('.viewer-box').getBoundingClientRect();
    return b.width <= innerWidth && b.left >= 0;
  });
  check('the dialog fits on a phone', fits === true);
  await ctx.close();
}

/* 6. filter buttons ---------------------------------------------------- */
console.log('\n· filter');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/sv/', { waitUntil: 'networkidle' });
  const all = await page.evaluate(() => document.querySelectorAll('.tile:not([hidden])').length);
  // the first group button — any except "Alla"
  await page.locator('[data-gearbar] [data-filter]:not([data-filter="all"])').first().click();
  await page.waitForTimeout(150);
  const some = await page.evaluate(() => ({
    visible: document.querySelectorAll('.tile:not([hidden])').length,
    label: document.querySelector('[data-gear-count]').textContent.trim(),
  }));
  check('the filter hides tiles and recounts', some.visible < all && some.label.startsWith(String(some.visible)),
        `${all} → ${some.visible} (${some.label})`);
  await page.close();
}

/* 7. no leaked placeholders -------------------------------------------- */
console.log('\n· output');
{
  const leaks = [];
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, p.slice(1), 'index.html'), 'utf8');
    // a missing translation key or empty field renders as the literal
    // string "undefined" in the page
    if (/>\s*undefined\s*</.test(html) || /="[^"]*\bundefined\b[^"]*"/.test(html)) leaks.push(p);
  }
  check('no page renders "undefined"', leaks.length === 0, leaks.slice(0, 5).join(' '));
}

/* 8. brand files are the right artwork, not merely present ------------- */
console.log('\n· brand files');
{
  // A file existing is not enough: a recoloured copy of an old logo would
  // pass that check. Each shipped file must equal its master in brand/.
  const pairs = [
    ['favicon.svg', '../brand/logo/favicon.svg'],
    ['logo.svg', '../brand/logo/eldebosh-logo-horizontal.svg'],
    ['brand/eldebosh-logo-header.svg', '../brand/logo/eldebosh-logo-header.svg'],
    ['brand/eldebosh-icon.svg', '../brand/logo/eldebosh-icon.svg'],
  ];
  for (const [shipped, master] of pairs) {
    const a = path.join(ROOT, shipped);
    const b = path.join(ROOT, master);
    const same = fs.existsSync(a) && fs.existsSync(b) &&
      fs.readFileSync(a, 'utf8').trim() === fs.readFileSync(b, 'utf8').trim();
    check(`${shipped} equals its master in brand/`, same);
  }
}

/* 9. files that must exist ------------------------------------------- */
console.log('\n· files');
for (const f of ['favicon.svg', 'logo.svg', 'og-default.png', 'apple-touch-icon.png',
                 'icon-192.png', 'icon-512.png', 'brand/eldebosh-logo-header.svg',
                 'js/eldebosh-ui.js', '.htaccess']) {
  check(f, fs.existsSync(path.join(ROOT, f)));
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
