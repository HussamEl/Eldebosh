/**
 * Content hash for files served from public/ at a fixed path.
 *
 * .htaccess lets browsers cache .js files for a year. A fixed path such as
 * /js/eldebosh-ui.js would then keep serving an old script alongside new pages.
 * Adding the file's hash to the URL (/js/eldebosh-ui.js?v=<hash>) makes every
 * change a new URL, while an unchanged file stays cached.
 * scripts/audit.mjs fails on any fixed-path asset without this hash.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Eight-character hash of a file under public/. */
export function assetHash(publicPath: string): string {
  const file = join(ROOT, 'public', publicPath.replace(/^\//, ''));
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
}

/** The file's URL with its hash, ready for src/href. */
export function hashedAsset(publicPath: string): string {
  return `${publicPath}?v=${assetHash(publicPath)}`;
}
