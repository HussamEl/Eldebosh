/**
 * Skriver ut tryckunderlagen till PDF i exakta millimetermått.
 * Kör `python3 print.py` först — den bygger HTML-dukarna.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.dirname(new URL(import.meta.url).pathname);
const CANVAS = path.join(SRC, 'build', 'canvas');
const OUT = path.join(SRC, '..', 'print');
fs.mkdirSync(OUT, { recursive: true });

const JOBS = [
  ['business-card', { width: '91mm', height: '61mm' }],   // 85x55 + 3 mm utfall
  ['letterhead-a4', { format: 'A4' }],
  ['logo-sheet-a4', { format: 'A4' }],
];

const browser = await chromium.launch();
for (const [name, opts] of JOBS) {
  const page = await browser.newPage();
  await page.goto('file://' + path.join(CANVAS, name + '.html'));
  await page.waitForTimeout(400);
  await page.pdf({ path: path.join(OUT, `eldebosh-${name}.pdf`), printBackground: true, ...opts });
  await page.close();
  console.log('print/eldebosh-' + name + '.pdf');
}
await browser.close();
