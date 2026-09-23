/**
 * Compose one photo into a product tile in public/uploads.
 *
 *   npm run tile -- <photo> P-24-1 [ASIN]
 *
 * The build composes untouched uploads by itself, so this is only needed to
 * preview a tile, or to commit the finished tile instead of the raw photo.
 * The ASIN, when given, is added to the first photo's name (P-24-1-<ASIN>).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/repo.mjs';
import { composeTile } from './lib/tile.mjs';

const [src, code, asin] = process.argv.slice(2);
const fail = (m) => { console.error(`\n✗ ${m}\n`); process.exit(1); };
if (!src || !code) fail('Usage: npm run tile -- <photo> P-NN-K [ASIN]');
if (!/^P-\d{2}-[123]$/.test(code)) fail(`"${code}" must look like P-NN-K, with K = 1, 2 or 3.`);
if (asin && !/^[A-Z0-9]{10}$/.test(asin)) fail(`ASIN "${asin}" must be 10 characters: capital letters and digits.`);
if (asin && !code.endsWith('-1')) fail('Only the first photo carries the ASIN in its name.');

const name = `${code}${asin ? `-${asin}` : ''}.webp`;
const out = join(ROOT, 'public/uploads', name);
const bytes = await composeTile(readFileSync(src));
writeFileSync(out, bytes);
console.log(`\n✓ public/uploads/${name}  ·  ${Math.round(bytes.length / 1024)} KB`);
console.log(`\n  In the product file:\n    own_photos:\n      - src: "/uploads/${name}"\n        alt: "<Swedish description of the photo>"\n`);
