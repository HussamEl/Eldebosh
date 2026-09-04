/**
 * هل تعرف لوحة التحرير كل حقل موجود في الملفات؟
 *
 * `Sveltia` تكتب الحقول المُعرَّفة في `public/admin/config.yml` وحدها. فأيّ
 * حقل موجود في ملف ولا تعرفه اللوحة **يُحذف عند أول حفظ من اللوحة** — بصمت،
 * وبيد حسام لا بيدنا.
 *
 * وهذا ليس افتراضاً: `code` في المنتجات و`stage` في الصفحات كانا ناقصين من
 * اللوحة يوم 2026-09-04. الأول تُبنى عليه أسماء الصور (`C-09`)، والثاني هو
 * الفرق بين صفحة منشورة وهيكل معلَن (`I-020`). حفظٌ واحد كان يمحوهما.
 *
 * فالفحص يقارن الحقول الحاضرة في الملفات نفسها — لا في مخطّط نقرؤه — بما
 * تُعرّفه اللوحة، ويسمّي الناقص.
 *
 *   node scripts/check-admin.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** أزواج: مجلد الملفات ← اسم المجموعة في اللوحة */
const PAIRS = [
  ['src/data/products/sv', 'products_sv'],
  ['src/content/solutions/sv', 'solutions_sv'],
  ['src/content/guides/sv', 'guides_sv'],
  ['src/content/comparisons/sv', 'comparisons_sv'],
  ['src/content/posts/sv', 'posts_sv'],
  ['src/content/pages/sv', 'pages_sv'],
];

/** حقول تُدار من الكود لا من اللوحة، فغيابها مقصود */
const EXEMPT = new Set(['body']);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** أسماء الحقول العليا في ملف — من الواجهة الأمامية أو من الـYAML كاملاً */
function topKeys(file) {
  const raw = readFileSync(file, 'utf8');
  const front = /\.(md|mdx)$/.test(file) ? (raw.match(/^---\n([\s\S]*?)\n---/) ?? [])[1] : raw;
  if (!front) return [];
  let data;
  try { data = YAML.parse(front); } catch { return []; }
  return data && typeof data === 'object' ? Object.keys(data) : [];
}

function panelFields(coll) {
  const out = new Set();
  const walkFields = (fs) => {
    for (const f of fs ?? []) {
      if (f?.name) out.add(f.name);
      // الحقول المتداخلة لا تُقارن هنا: المقارنة على المستوى الأعلى وحده
    }
  };
  if (coll.fields) walkFields(coll.fields);
  for (const f of coll.files ?? []) walkFields(f.fields);
  return out;
}

const cfg = YAML.parse(readFileSync(join(ROOT, 'public/admin/config.yml'), 'utf8'));
const byName = new Map((cfg.collections ?? []).map((c) => [c.name, c]));

const missing = [];

for (const [dir, name] of PAIRS) {
  const coll = byName.get(name);
  if (!coll) { missing.push({ name, field: '—', note: 'المجموعة غير معرّفة في اللوحة أصلاً' }); continue; }
  const known = panelFields(coll);
  const seen = new Map();                       // الحقل ← أول ملف ظهر فيه
  for (const file of walk(join(ROOT, dir))) {
    for (const k of topKeys(file)) if (!seen.has(k)) seen.set(k, file.replace(ROOT, ''));
  }
  for (const [field, file] of seen) {
    if (EXEMPT.has(field) || known.has(field)) continue;
    missing.push({ name, field, note: file });
  }
}

if (!missing.length) {
  console.log('\n✓ لوحة التحرير تعرف كل حقل في الملفات\n');
  process.exit(0);
}

console.log('\n✗ حقول موجودة في الملفات ولا تعرفها اللوحة — أول حفظ منها يمحوها:\n');
for (const m of missing) console.log(`  ${m.name.padEnd(16)} ${m.field.padEnd(18)} ${m.note}`);
console.log('\n  أضِفها في public/admin/config.yml\n');
process.exit(1);
