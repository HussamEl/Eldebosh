/**
 * Renderar alla rasterfiler ur vektorkällorna.
 *   brand/logo        -> brand/logo-png   (transparenta PNG)
 *   brand/logo        -> brand/icons      (app- och favicon-storlekar)
 *   brand/src/build   -> brand/social     (dukar i plattformarnas mått)
 *
 * Kräver Chromium via Playwright. Kör `python3 assets.py` först.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.dirname(new URL(import.meta.url).pathname);
const LOGO = path.join(SRC, '..', 'logo');
const dirs = {
  png: path.join(SRC, '..', 'logo-png'),
  icons: path.join(SRC, '..', 'icons'),
  social: path.join(SRC, '..', 'social'),
  canvas: path.join(SRC, 'build', 'canvas'),
};
for (const d of [dirs.png, dirs.icons, dirs.social]) fs.mkdirSync(d, { recursive: true });

const LOGO_PNGS = [
  ['eldebosh-logo-horizontal.svg', [1200, 2400, 3600]],
  ['eldebosh-logo-horizontal-inverse.svg', [1200, 2400]],
  ['eldebosh-logo-stacked.svg', [1200, 2400]],
  ['eldebosh-logo-stacked-inverse.svg', [1200]],
  ['eldebosh-logo-mono-navy.svg', [2400]],
  ['eldebosh-logo-mono-white.svg', [2400]],
  ['eldebosh-logo-mono-black.svg', [2400]],
  ['eldebosh-logo-green-alt.svg', [2400]],
  ['eldebosh-wordmark.svg', [1600]],
];
const ICON_SIZES = [1024, 512, 256, 192, 180, 128, 64, 48, 32, 16];

const browser = await chromium.launch();

const shotSvg = async (svg, w, h, out) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(
    `<style>*{margin:0}body{width:${w}px;height:${h}px}svg{width:${w}px;height:${h}px;display:block}</style>${svg}`);
  await page.waitForTimeout(120);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
};

// 1. sociala dukar
const manifest = JSON.parse(fs.readFileSync(path.join(dirs.canvas, 'manifest.json'), 'utf8'));
for (const [name, [w, h]] of Object.entries(manifest)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(dirs.canvas, name.replace('.png', '.html')));
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(dirs.social, name), clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  console.log('social/' + name, `${w}x${h}`);
}

// 2. logotyper som transparent PNG
for (const [file, widths] of LOGO_PNGS) {
  const svg = fs.readFileSync(path.join(LOGO, file), 'utf8');
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  for (const w of widths) {
    const h = Math.round((w * Number(vh)) / Number(vw));
    const out = path.join(dirs.png, `${file.replace('.svg', '')}-${w}w.png`);
    await shotSvg(svg, w, h, out);
    console.log('logo-png/' + path.basename(out), `${w}x${h}`);
  }
}

// 3. ikoner — den förenklade faviconen under 64px, den fulla ikonen över
const icon = fs.readFileSync(path.join(LOGO, 'eldebosh-icon.svg'), 'utf8');
const favicon = fs.readFileSync(path.join(LOGO, 'favicon.svg'), 'utf8');
for (const s of ICON_SIZES) {
  await shotSvg(s <= 64 ? favicon : icon, s, s, path.join(dirs.icons, `eldebosh-icon-${s}.png`));
}
fs.copyFileSync(path.join(LOGO, 'eldebosh-icon.svg'), path.join(dirs.icons, 'eldebosh-icon.svg'));
fs.copyFileSync(path.join(LOGO, 'favicon.svg'), path.join(dirs.icons, 'favicon.svg'));
console.log('icons:', ICON_SIZES.join(', '));

await browser.close();
