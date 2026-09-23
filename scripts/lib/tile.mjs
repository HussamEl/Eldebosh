/**
 * Compose a product photo into the site's 720×720 tile.
 *
 * Every product photo on the site has the same look: the whole product at 93%
 * of the square, on a blurred, brand-tinted enlargement of the same photo, with
 * feathered edges so no frame shows. That look makes photos taken on different
 * tables and in different light read as one set.
 *
 * Used in two places:
 *   - at build time (astro.config.mjs) on every upload that is not already a
 *     720×720 tile, so a photo added in the admin panel needs no manual step;
 *   - by hand: npm run tile -- <photo> P-NN-K [ASIN]
 */
import sharp from 'sharp';

export const TILE = 720;
const FIT = 0.93; // share of the square the product may fill
const FEATHER = 54; // softness of the product's edge
const MAX_BYTES = 300 * 1024;
// Brand tokens from src/styles/global.css: --brand-soft and --brand-tint.
const BRAND_SOFT = { r: 240, g: 247, b: 254 };
const BRAND_TINT = [211, 231, 250];

/** True when an image is already a finished tile and must not be recomposed. */
export async function isTile(input) {
  const { width, height } = await sharp(input).metadata();
  return width === TILE && height === TILE;
}

/** Compose any photo into a tile. Returns encoded image bytes. */
export async function composeTile(input, format = 'webp') {
  // Apply the camera's rotation tag, and put transparent areas on the brand
  // background, before measuring anything.
  const src = await sharp(input).rotate().flatten({ background: BRAND_SOFT }).toBuffer();
  const { width: w, height: h } = await sharp(src).metadata();

  // Background: the same photo, enlarged past the square, blurred, tinted.
  const r = Math.max(TILE / w, TILE / h) * 1.45;
  const bg = await sharp(src)
    .resize(Math.round(w * r), Math.round(h * r))
    .extract({
      left: Math.floor((Math.round(w * r) - TILE) / 2),
      top: Math.floor((Math.round(h * r) - TILE) / 2),
      width: TILE,
      height: TILE,
    })
    .blur(TILE / 16)
    .linear([0.7, 0.7, 0.7], BRAND_TINT.map((c) => 0.3 * c)) // 30% blend towards the tint
    .linear(0.88, 0) // slightly darker, so the product stands out
    .modulate({ saturation: 1.15 })
    .toBuffer();

  // Foreground: the whole product, centred.
  const fit = Math.round(TILE * FIT);
  const r2 = Math.min(fit / w, fit / h);
  const fw = Math.round(w * r2), fh = Math.round(h * r2);
  const ox = Math.floor((TILE - fw) / 2), oy = Math.floor((TILE - fh) / 2);
  const fg = await sharp(src).resize(fw, fh).toBuffer();
  const layer = await sharp(bg).composite([{ input: fg, left: ox, top: oy }]).removeAlpha().toBuffer();

  // Mask with soft edges: the photo's border dissolves into the background.
  const inset = FEATHER / 2;
  const radius = Math.round(Math.min(fw, fh) * 0.1);
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">
    <rect width="100%" height="100%" fill="black"/>
    <rect x="${ox + inset}" y="${oy + inset}" width="${fw - FEATHER}" height="${fh - FEATHER}" rx="${radius}" fill="white"/>
  </svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).blur(FEATHER).extractChannel(0).toBuffer();
  const top = await sharp(layer).joinChannel(mask).png().toBuffer();
  const composed = sharp(bg).composite([{ input: top }]);

  // Step quality down until the file is under the size budget.
  let out;
  for (const quality of [86, 78, 70, 62]) {
    out = await composed.clone()[format === 'jpeg' || format === 'jpg' ? 'jpeg' : format]({ quality, ...(format === 'webp' ? { effort: 6 } : {}) }).toBuffer();
    if (out.length <= MAX_BYTES) break;
  }
  return out;
}
