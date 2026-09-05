/**
 * بصمة محتوى للملفات المخدومة من `public/` بمسار ثابت.
 *
 * السبب — `I-025`: `.htaccess` يعطي كل ملف `.js` و`.css` عاماً كاملاً من
 * التخزين المؤقت بوسم `immutable`، وهو صحيح لملفات `_astro/*` لأن اسمها يحمل
 * بصمتها، **وخاطئ لملف `/js/eldebosh-ui.js`** — مساره ثابت ومحتواه يتغيّر.
 * فأول تعديل على الجزيرة التفاعلية وصل الزوّار بصفحة جديدة وسكربت قديم:
 * الأزرار ظهرت ولم تعمل.
 *
 * فالبصمة تدخل في الرابط: `/js/eldebosh-ui.js?v=<بصمة>`. تغيّر الملف ← تغيّر
 * الرابط ← جلبٌ جديد. ولم يتغيّر ← بقي التخزين المؤقت يعمل بكامل فائدته.
 *
 * ⚠️ ويندوز: `fileURLToPath` لا `.pathname` — الأخير يُنتج `/C:/...`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** بصمة من ثمانية أحرف لملف داخل `public/`. */
export function assetHash(publicPath: string): string {
  const file = join(ROOT, 'public', publicPath.replace(/^\//, ''));
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
}

/** رابط الملف ومعه بصمته — يُستعمل في `src` مباشرة. */
export function hashedAsset(publicPath: string): string {
  return `${publicPath}?v=${assetHash(publicPath)}`;
}
