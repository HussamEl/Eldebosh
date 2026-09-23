/**
 * Admin panel test: load the built /admin/ in Chromium and open real entries.
 *
 * A mistake in public/admin/config.yml does not break the build — it breaks
 * the admin panel, silently, and only the owner would find out, by opening it.
 * This test catches that before publishing.
 *
 * Signing in to GitHub is not possible here, so the CMS is given the repository
 * through "Work with Local Repository": the content files are copied into the
 * browser's private file system and handed to the CMS as the picked folder.
 * The CMS then reads real entries exactly as it would from GitHub.
 *
 * Checks:
 *   1. the CMS file shipped in site/admin/ is the version pinned in package.json
 *   2. the config loads without a configuration error
 *   3. a product and a buying guide open, and their real values are shown
 *
 *   npm run test:admin        (after npm run build)
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SITE = path.join(ROOT, 'site');
const PORT = 8719;

const fails = [];
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(label);
};

if (!fs.existsSync(path.join(SITE, 'admin', 'index.html'))) {
  console.error('✗ site/admin is missing — run npm run build first.');
  process.exit(1);
}

console.log('\nAdmin panel');
console.log('─'.repeat(40));

// 1. Shipped CMS = pinned CMS
const pinned = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies['@sveltia/cms'];
const installed = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/@sveltia/cms/package.json'), 'utf8')).version;
const shipped = fs.readFileSync(path.join(SITE, 'admin', 'sveltia-cms.js'));
const source = fs.readFileSync(path.join(ROOT, 'node_modules/@sveltia/cms/dist/sveltia-cms.js'));
check('shipped CMS is the pinned version', pinned === installed && shipped.equals(source), `${pinned}`);

// Serve the built site as-is.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.yml': 'text/yaml', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let f = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => server.listen(PORT, ok));

// The folders the CMS reads, plus the `.git` marker it requires.
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const files = ['src/content', 'src/data', 'public/uploads']
  .flatMap((d) => walk(path.join(ROOT, d)))
  .map((f) => ({ path: path.relative(ROOT, f).split(path.sep).join('/'), b64: fs.readFileSync(f).toString('base64') }));
files.push({ path: '.git/HEAD', b64: Buffer.from('ref: refs/heads/main\n').toString('base64') });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 7000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  // External fonts and the CMS's update check may be unreachable offline.
  if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errors.push(m.text());
});

// Text inside shadow roots too — the CMS renders parts of its UI there.
const pageText = () => page.evaluate(() => {
  const walk = (n) => (n.shadowRoot ? walk(n.shadowRoot) : '') +
    [...n.childNodes].map((c) => (c.nodeType === 3 ? c.textContent : c.nodeType === 1 ? walk(c) : '')).join(' ');
  return walk(document.body).replace(/\s+/g, ' ');
});

try {
  const base = `http://localhost:${PORT}`;
  await page.goto(`${base}/sv/`);
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory();
    for (const f of files) {
      const parts = f.path.split('/');
      let dir = root;
      for (const seg of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(seg, { create: true });
      const w = await (await dir.getFileHandle(parts.at(-1), { create: true })).createWritable();
      await w.write(Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0)));
      await w.close();
    }
  }, files);
  await page.addInitScript(() => { window.showDirectoryPicker = async () => navigator.storage.getDirectory(); });

  // 2. Config loads
  await page.goto(`${base}/admin/`);
  const signIn = page.getByText('Work with Local Repository');
  await signIn.waitFor({ timeout: 20000 }).catch(() => {});
  const startText = await pageText();
  const configOk = !/errors? in the CMS configuration/i.test(startText) && (await signIn.count()) > 0;
  const at = startText.search(/There (is|are)/);
  check('config loads without errors', configOk, at >= 0 ? startText.slice(at, at + 200) : '');
  if (!configOk) throw new Error('config');

  // 3. Real entries open with their values
  await signIn.click();
  await page.waitForTimeout(3000);
  const entries = [
    ['product P-20', 'products_sv/entries/ugreen-usb4-kabel-240w', ['P-20', 'B0GV79Z1W6', 'Kablar och adaptrar', 'Varför slutar mina laddkablar fungera']],
    ['buying guide', 'guides_sv/entries/basta-laddkabel-usb-c', ['P-20', 'P-23', 'best-overall', 'Varför slutar mina laddkablar fungera']],
  ];
  for (const [label, route, expected] of entries) {
    await page.goto(`${base}/admin/#/collections/${route}`);
    await page.waitForTimeout(4000);
    const text = await pageText();
    const missing = expected.filter((e) => !text.includes(e));
    check(`${label} opens with its values`, missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : '');
  }
  check('no script errors', errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 300));
} catch (e) {
  if (e.message !== 'config') check('admin panel test ran', false, e.message.slice(0, 200));
} finally {
  await browser.close();
  server.close();
}

console.log('─'.repeat(40));
if (fails.length) {
  console.log(`✗ ${fails.length} admin check(s) failed\n`);
  process.exit(1);
}
console.log('✓ The admin panel loads and opens real entries\n');
