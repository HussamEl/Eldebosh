/**
 * فحص القواعد الملزمة قبل كل بناء.
 * يفشل البناء إذا خُرقت قاعدة. هذا يطبّق قواعد CLAUDE.md آلياً
 * بدل الاعتماد على الانضباط اليدوي.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { findUnbackedClaim, findOwnedOnlyUseClaim, findBannedPhrase } from './lib/claim-rule.mjs';
import { findOverclaimedCount } from '../src/lib/overclaim.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function frontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { errors.push(`${file}: لا يوجد frontmatter`); return { data: null, body: raw }; }
  try {
    return { data: YAML.parse(m[1]), body: raw.slice(m[0].length) };
  } catch (err) {
    errors.push(`${file}: frontmatter غير صالح — ${err.message}`);
    return { data: null, body: '' };
  }
}

/* ---------- تحميل ---------- */

const productFiles = (await walk(join(ROOT, 'src/data/products'))).filter((f) => /\.ya?ml$/.test(f));
const products = [];
for (const f of productFiles) {
  const data = YAML.parse(await readFile(f, 'utf8'));
  if (data) products.push({ file: f, data });
}

const docs = [];
for (const coll of ['solutions', 'guides', 'comparisons', 'posts', 'pages']) {
  for (const f of (await walk(join(ROOT, 'src/content', coll))).filter((f) => ['.md', '.mdx'].includes(extname(f)))) {
    const raw = await readFile(f, 'utf8');
    const { data, body } = frontmatter(raw, f);
    if (data) docs.push({ file: f, coll, data, body });
  }
}

const categories = [];
for (const f of (await walk(join(ROOT, 'src/data/categories'))).filter((f) => /\.ya?ml$/.test(f))) {
  categories.push({ file: f, data: YAML.parse(await readFile(f, 'utf8')) });
}

const RESERVED = new Set(['solutions', 'guides', 'compare', 'blog', 'info', 'sok', 'search', 'admin', 'sv', 'en', 'pagefind']);

/* ---------- 1. تصادم مسارات الفئات ---------- */
for (const c of categories) {
  for (const [lang, slug] of Object.entries(c.data.slugs ?? {})) {
    if (RESERVED.has(slug)) errors.push(`${c.file}: slug "${slug}" (${lang}) محجوز ويسبب تصادم مسارات`);
  }
}

/* ---------- 2. كل منتج منشور يحتاج مصدراً وتاريخ تحقق ---------- */
for (const p of products) {
  const d = p.data;
  if (d.verified === true && !d.demo) {
    if (!d.source_url) errors.push(`${p.file}: verified=true بلا source_url`);
    if (!d.last_verified) errors.push(`${p.file}: verified=true بلا last_verified`);
  }
  if ('price' in d) errors.push(`${p.file}: حقل price ممنوع — استخدم price_band`);

  // ASIN بصيغة صحيحة، وإلا الرابط المولّد سيكسر
  if (d.asin && !/^[A-Z0-9]{10}$/.test(d.asin)) {
    errors.push(`${p.file}: ASIN غير صالح "${d.asin}" — عشر خانات، حروف كبيرة وأرقام`);
  }
  // منتج موثق بلا وسيلة ربط = بطاقة بلا زر
  if (d.verified === true && !d.demo && !d.asin && !d.affiliate?.url) {
    warnings.push(`${p.file}: منتج موثق بلا asin ولا رابط أفلييت — لن يظهر زر الشراء`);
  }
  // تعارض: رابط أمازون ملصوق يدوياً بدل ASIN
  if (d.affiliate?.url && /amazon\./i.test(d.affiliate.url)) {
    errors.push(`${p.file}: رابط أمازون ملصوق يدوياً — استخدم حقل asin ليبنيه النظام بالوسم الصحيح`);
  }
  if (d.demo) warnings.push(`${p.file}: محتوى DEMO — يجب حذفه قبل الإطلاق`);

  // التجربة الفعلية تحتاج دليلاً، لا إعلاناً
  if (d.tested === true) {
    if (d.owned !== true) errors.push(`${p.file}: tested=true بينما owned=false — لا يجوز ادعاء استخدام منتج لا نملكه`);
    if (!d.owned_since) errors.push(`${p.file}: tested=true بلا owned_since`);
    if (!d.usage_period) errors.push(`${p.file}: tested=true بلا usage_period (مدة الاستخدام)`);
    if (!Array.isArray(d.own_photos) || d.own_photos.length === 0) {
      errors.push(`${p.file}: tested=true بلا صورة واحدة من تصويرنا (own_photos)`);
    }
    if (!Array.isArray(d.hands_on_limits) || d.hands_on_limits.length === 0) {
      errors.push(`${p.file}: tested=true بلا hands_on_limits — يجب ذكر ما لا تُظهره تجربتنا`);
    }
  }
}

/* ---------- 3. كل صفحة تجارية تربط بصفحة حل ---------- */
const solutionIds = new Set(docs.filter((d) => d.coll === 'solutions').map((d) => `${d.data.lang}:${d.data.problem_id}`));
for (const d of docs) {
  if (d.coll === 'solutions') continue;
  // الصفحات الثابتة (سياسة، اتصال، عنّا) ليست صفحات تجارية ولا تعود إلى حل
  if (d.coll === 'pages') continue;
  if (!d.data.solution) { errors.push(`${d.file}: حقل solution مفقود — كل صفحة يجب أن تعود إلى صفحة حل`); continue; }
  if (!solutionIds.has(`${d.data.lang}:${d.data.solution}`)) {
    errors.push(`${d.file}: solution="${d.data.solution}" لا توجد له صفحة حل بلغة ${d.data.lang}`);
  }
}

/* ---------- 4. كل معرّف منتج مذكور موجود وموثق ---------- */
const byId = new Map();
for (const p of products) byId.set(`${p.data.lang}:${p.data.id}`, p.data);
const svById = new Map(products.filter((p) => p.data.lang === 'sv').map((p) => [p.data.id, p.data]));

function checkProductRef(id, d) {
  const hit = byId.get(`${d.data.lang}:${id}`) ?? svById.get(id);
  if (!hit) { errors.push(`${d.file}: يشير إلى منتج غير موجود "${id}"`); return; }
  if (!hit.verified) errors.push(`${d.file}: يشير إلى منتج غير موثق "${id}" (verified=false)`);
}
for (const d of docs) {
  if (d.data.published !== true) continue; // المسودات لا تُفحص
  for (const id of d.data.products ?? []) checkProductRef(id, d);
  for (const pick of d.data.picks ?? []) checkProductRef(pick.product, d);
  if (d.coll === 'guides' && (d.data.picks ?? []).length < 2) {
    errors.push(`${d.file}: دليل منشور بأقل من ترشيحين`);
  }
  if (d.coll === 'comparisons') {
    const n = (d.data.products ?? []).length;
    if (n < 2 || n > 4) errors.push(`${d.file}: مقارنة منشورة بعدد منتجات ${n} (المطلوب 2–4)`);
  }
}

/* ---------- 5. لا روابط أفلييت خام داخل نص المقال ---------- */
const RAW = /\((https?:\/\/[^)]*?(?:tag=|aff(?:iliate)?|[?&]ref=|adtraction|awin|tradedoubler|amzn\.to)[^)]*)\)/i;
for (const d of docs) {
  const m = d.body.match(RAW);
  if (m) errors.push(`${d.file}: رابط أفلييت خام داخل النص (${m[1].slice(0, 60)}…) — الروابط تعيش في ملف المنتج فقط`);
}

/* ---------- 5b. خط الإنتاج ---------- */
for (const d of docs) {
  const stage = d.data.stage ?? 'draft';
  const pub = d.data.published === true;
  if (pub && stage !== 'published') {
    errors.push(`${d.file}: published=true لكن stage="${stage}" — اضبط stage: published`);
  }
  if (!pub && stage === 'published') {
    errors.push(`${d.file}: stage=published لكن published=false — تناقض`);
  }
}

const testedIds = new Set(products.filter((p) => p.data.tested === true).map((p) => p.data.id));

/* ---------- 5c. نصّ التجربة لا يتكرر بين منتجين ---------- */
// جملة تجربة متطابقة حرفياً في منتجين تقول للقارئ إن أحداً لم يكتبها عن تجربة.
// وهذا نفسه ما نأخذه على المنافسين. تنبيه اليوم، وخطأ يوم تصل جمل حسام الحقيقية.
{
  // التاريخ وحده لا يجعل الجملتين مختلفتين: «منذ يونيو ٢٠٢٥» و«منذ يناير ٢٠٢٦»
  // قالبٌ واحد. تُقنَّع الشهور والأرقام قبل المقارنة.
  const MONTHS = /\b(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/g;
  const shape = (line) =>
    line.trim().toLowerCase().replace(/\s+/g, ' ').replace(MONTHS, '§').replace(/\d+/g, '#');

  const seen = new Map();
  for (const p of products) {
    for (const line of p.data.hands_on ?? []) {
      const key = shape(line);
      (seen.get(key) ?? seen.set(key, []).get(key)).push(p.data.code ?? p.data.id);
    }
  }
  for (const [line, owners] of seen) {
    if (owners.length < 2) continue;
    warnings.push(
      `نصّ تجربة مكرر حرفياً في ${owners.length} منتجات (${owners.join('، ')}): "${line.slice(0, 60)}…" — التجربة تُكتب مرة واحدة عن منتج واحد`
    );
  }
}

/* ---------- 5d. عبارة «Bäst i test» ممنوعة في كل مكان ---------- */
// المادة 6.2 تمنعها صراحةً — ادعاء اختبار مقارن أمام قانون التسويق السويدي.
// وتفحص ملفات الترجمة أيضاً: أول ظهور لها كان في تسمية شارة، لا في مقال.
{
  const uiFile = join(ROOT, 'src/i18n/ui.ts');
  const scan = [
    ...docs.map((d) => [d.file, `${d.data.title ?? ''}\n${d.data.description ?? ''}\n${d.body}`]),
    ...products.map((p) => [p.file, JSON.stringify(p.data)]),
    [uiFile, await readFile(uiFile, 'utf8').catch(() => '')],
  ];
  for (const [file, text] of scan) {
    const hit = findBannedPhrase(text);
    if (hit) errors.push(`${file}: عبارة "${hit}" ممنوعة — المادة 6.2`);
  }
}

/* ---------- 5f. سلسلة «مملوك غير مُختبَر» لا تدّعي استخدامه ---------- */
// هذان المفتاحان لا يُعرضان إلا تحت منتج tested=false. أي ادعاء استخدام فيهما
// كذبٌ بحكم موضعه، مهما كان صادقاً في مكان آخر.
{
  const text = await readFile(join(ROOT, 'src/i18n/ui.ts'), 'utf8').catch(() => '');
  for (const key of ['handson.owned_only', 'handson.not_tested']) {
    for (const m of text.matchAll(new RegExp(`'${key}':\\s*'((?:[^'\\\\]|\\\\.)*)'`, 'g'))) {
      const hit = findOwnedOnlyUseClaim(m[1]);
      if (hit) errors.push(`src/i18n/ui.ts: "${key}" يدّعي استخدام منتج غير مُختبَر ("${hit}")`);
    }
  }
}

/* ---------- 5e. لا ادعاء جماعي على مجموعة غير مُختبَرة ---------- */
for (const d of docs) {
  const ids = [...(d.data.products ?? []), ...(d.data.picks ?? []).map((x) => x?.product)].filter(Boolean);
  if (!ids.length) continue;
  const total = ids.length;
  const tested = ids.filter((id) => testedIds.has(id)).length;
  const hit = findOverclaimedCount(`${d.data.title ?? ''}\n${d.body}`, { total, tested });
  if (hit) {
    errors.push(
      `${d.file}: ادعاء استخدام على المجموعة كلها ("${hit.text}") بينما ${hit.tested} من ${hit.total} فقط tested=true`
    );
  }
}

/* ---------- 6. لا ادعاء تجربة في النص ---------- */
// المنطق وحالاته في scripts/lib/claim-rule.mjs — node scripts/test-claim-rule.mjs
function pageHasTestedProduct(d) {
  const ids = [...(d.data.products ?? []), ...(d.data.picks ?? []).map((x) => x?.product)].filter(Boolean);
  return ids.some((id) => testedIds.has(id));
}
for (const d of docs) {
  const hit = findUnbackedClaim(d.body);
  if (!hit) continue;
  if (d.data.hands_on === true && pageHasTestedProduct(d)) continue; // مسموح: تجربة حقيقية موثقة
  errors.push(
    hit.kind === 'comparative'
      ? `${d.file}: مقارنة تدّعي تجربةً ضمناً ("${hit.text}") — النفي فيها يقع على غيرنا والادعاء علينا`
      : `${d.file}: ادعاء تجربة ("${hit.text}") بلا سند. اضبط hands_on: true واربط الصفحة بمنتج tested=true، أو أعد الصياغة إلى استشهاد بمصدر`
  );
}

/* ---------- 7. المصادر الخارجية: إسناد كامل ---------- */
for (const d of docs) {
  for (const [i, src] of (d.data.sources ?? []).entries()) {
    if (!src?.publisher || !src?.url || !src?.accessed) {
      errors.push(`${d.file}: المصدر رقم ${i + 1} ناقص — يلزم publisher و url و accessed`);
    }
  }
}

/* ---------- 8. طول الوصف ---------- */
for (const d of docs) {
  const len = (d.data.description ?? '').length;
  if (len < 50 || len > 165) {
    const msg = `${d.file}: description بطول ${len} حرفاً (المطلوب 50–165)`;
    if (d.data.published === true) errors.push(msg); else warnings.push(msg);
  }
}

/* ---------- 9. بيانات الساحة ---------- */
try {
  const tor = YAML.parse(await readFile(join(ROOT, 'src/data/torget/torget.yaml'), 'utf8'));
  if (tor?.active) {
    if (!tor.phone || /0{6,}/.test(String(tor.phone))) {
      errors.push('src/data/torget/torget.yaml: رقم هاتف نائب — ضع الرقم الحقيقي أو اجعل active: false');
    }
    if (!/^\+\d{8,15}$/.test(String(tor.phone || ''))) {
      errors.push('src/data/torget/torget.yaml: الهاتف يجب أن يكون بصيغة دولية تبدأ بـ+');
    }
  }
} catch { /* الملف اختياري */ }

/* ---------- النتيجة ---------- */
const line = '─'.repeat(52);
console.log(`\n${line}\nفحص القواعد الملزمة\n${line}`);
console.log(`منتجات: ${products.length} · مستندات: ${docs.length} · فئات: ${categories.length}`);
for (const w of warnings) console.log(`  تنبيه: ${w}`);
if (errors.length) {
  console.error(`\n✗ فشل الفحص — ${errors.length} خطأ:`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`\n✓ اجتاز الفحص${warnings.length ? ` (${warnings.length} تنبيه)` : ''}\n`);
