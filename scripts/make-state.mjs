/**
 * لوحة الحالة — تُحسب من المستودع نفسه فلا تتقادم أبداً.
 *
 *   npm run state
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import YAML from 'yaml';
import { now } from '../src/lib/clock.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const exists = (p) => existsSync(join(ROOT, p));

/* ---------- المنتجات ---------- */
const prodDir = join(ROOT, 'src/data/products/sv');
const products = readdirSync(prodDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => YAML.parse(readFileSync(join(prodDir, f), 'utf8')))
  .filter(Boolean);

const P = {
  total: products.length,
  verified: products.filter((p) => p.verified).length,
  tested: products.filter((p) => p.tested).length,
  owned: products.filter((p) => p.owned).length,
  photographed: products.filter((p) => p.own_photos?.length).length,
  withAsin: products.filter((p) => p.asin).length,
};
P.waitingAsin = products.filter((p) => !p.asin && (p.owned || p.own_photos?.length)).length;
const missingAsin = products.filter((p) => !p.asin && (p.owned || p.own_photos?.length)).map((p) => p.id);

/* ---------- المحتوى ---------- */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try { return YAML.parse(m[1]); } catch { return null; }
}

const collections = ['solutions', 'guides', 'comparisons', 'posts'];
const content = {};
let published = 0, drafts = 0;
const stages = { draft: 0, written: 0, reviewed: 0, published: 0 };

for (const c of collections) {
  const dir = join(ROOT, 'src/content', c, 'sv');
  if (!existsSync(dir)) { content[c] = { total: 0, published: 0 }; continue; }
  const docs = readdirSync(dir)
    .filter((f) => ['.md', '.mdx'].includes(extname(f)))
    .map((f) => frontmatter(readFileSync(join(dir, f), 'utf8')))
    .filter(Boolean);
  for (const d of docs) stages[d.stage ?? 'draft']++;
  const pub = docs.filter((d) => d.published === true).length;
  content[c] = { total: docs.length, published: pub };
  published += pub;
  drafts += docs.length - pub;
}

/* ---------- الموجة الأولى: عنقود البطارية ---------- */
/* الموجة الأولى — عنقود البطارية. المصدر: KEYWORD_MAP.md القسم 8.
   ⚠️ `liten-powerbank-for-fickan` خرجت في v1.1 ودخلت مكانها
   `magsafe-vs-qi2-vs-tradlos`. نسيان هذا التبديل هنا هو ما جعل العدّ خاطئاً
   في وثيقتين، فالقائمة تُحدَّث مع الخريطة لا بعدها. */
const wave1 = [
  'batteriet-tar-slut', 'ingen-eluttag-pa-resan', 'mobilen-dor-i-kylan',
  'basta-powerbank-2026', 'magsafe-vs-qi2-vs-tradlos', 'powerbank-for-resa',
  'magnetisk-powerbank', '10000-vs-20000-mah', 'mah-och-watt-vad-betyder-siffrorna',
  'powerbank-pa-flyget', 'darfor-laddar-mobilen-samre-pa-vintern',
];

/* «مكتوبة» تعني: لها نصّ حقيقي — أي stage عند written فما فوق. والمنشور
   مكتوبٌ أيضاً. تعريف واحد، فلا يعود العدّ يختلف بين وثيقة وأخرى. */
const HAS_TEXT = new Set(['written', 'reviewed', 'published']);
const wave1State = { published: 0, text: 0, draft: 0, missing: [] };
const wave1Seen = new Set();
for (const c of collections) {
  const dir = join(ROOT, 'src/content', c, 'sv');
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => ['.md', '.mdx'].includes(extname(f)))) {
    const d = frontmatter(readFileSync(join(dir, f), 'utf8'));
    if (!d || !wave1.includes(d.slug)) continue;
    wave1Seen.add(d.slug);
    if (d.published === true) wave1State.published++;
    if (HAS_TEXT.has(d.stage ?? 'draft')) wave1State.text++;
    else wave1State.draft++;
  }
}
wave1State.missing = wave1.filter((s) => !wave1Seen.has(s));
const wave1Done = wave1State.published;

/* ---------- الفئات ---------- */
const catDir = join(ROOT, 'src/data/categories');
const cats = readdirSync(catDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => YAML.parse(readFileSync(join(catDir, f), 'utf8')));
const activeCats = cats.filter((c) => c.active).length;

/* ---------- التواجد في الساحة ---------- */
let torget = { active: false, ready: false };
if (exists('src/data/torget/torget.yaml')) {
  const t = YAML.parse(read('src/data/torget/torget.yaml'));
  torget = { active: !!t?.active, ready: /^\+\d{8,15}$/.test(String(t?.phone || '')) };
}

/* ---------- النصوص القانونية ---------- */
const legalDir = join(ROOT, 'src/content/pages/sv');
const legal = readdirSync(legalDir)
  .filter((f) => ['.md', '.mdx'].includes(extname(f)))
  .map((f) => ({ f, raw: readFileSync(join(legalDir, f), 'utf8') }));
const drafts_legal = legal.filter((x) => /UTKAST/i.test(x.raw)).map((x) => x.f.replace(/\.mdx?$/, ''));

/* ---------- البناء ---------- */
const distPages = existsSync(join(ROOT, 'site'))
  ? (function count(dir) {
      let n = 0;
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) n += count(p);
        else if (e === 'index.html') n++;
      }
      return n;
    })(join(ROOT, 'site'))
  : 0;

const bar = (done, total, width = 20) => {
  const filled = total ? Math.round((done / total) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/* ---------- الكتابة ---------- */
const out = `# لوحة الحالة

> **تُحسب آلياً من المستودع — لا تُحرَّر يدوياً.**
> \`npm run state\` · آخر تحديث: ${now()}

---

## سطر واحد للمحادثة الجديدة

\`\`\`
منتجات ${P.total} (موثقة ${P.verified} · مصوَّرة ${P.photographed} · تنتظر ASIN ${P.waitingAsin}) ·
صفحات ${published + drafts} (منشورة ${published}) · الموجة الأولى ${wave1Done}/11 ·
فئات مفعّلة ${activeCats}/${cats.length} · الساحة ${torget.active && torget.ready ? 'مفعّلة' : 'معطّلة'}
\`\`\`

---

## المنتجات

| البند | العدد |
|---|---|
| المجموع | ${P.total} |
| موثقة وتظهر | ${P.verified} |
| بحوزتنا | ${P.owned} |
| مجرَّبة بدليل | ${P.tested} |
| مصوَّرة | ${P.photographed} |
| لها رابط أمازون | ${P.withAsin} |
| **تنتظر ASIN** | **${P.waitingAsin}** |

${missingAsin.length ? '**تنتظر رابطاً:**\n\n```\n' + missingAsin.join('\n') + '\n```' : '✓ كل المنتجات المملوكة مربوطة.'}

---

## المحتوى

| النوع | المجموع | منشور |
|---|---|---|
| صفحات الحلول | ${content.solutions.total} | ${content.solutions.published} |
| أدلة الشراء | ${content.guides.total} | ${content.guides.published} |
| المقارنات | ${content.comparisons.total} | ${content.comparisons.published} |
| المقالات | ${content.posts.total} | ${content.posts.published} |
| **المجموع** | **${published + drafts}** | **${published}** |

**خط الإنتاج**

| المرحلة | العدد | الوصف |
|---|---|---|
| \`draft\` | ${stages.draft} | هيكل فقط |
| \`written\` | ${stages.written} | مكتوب، ينتظر مراجعة سويدية |
| \`reviewed\` | ${stages.reviewed} | جاهز للنشر |
| \`published\` | ${stages.published} | منشور |

\`\`\`
${bar(stages.published, stages.draft + stages.written + stages.reviewed + stages.published)}  ${stages.published} منشور من ${stages.draft + stages.written + stages.reviewed + stages.published}
\`\`\`

**الموجة الأولى — عنقود البطارية**

\`\`\`
${bar(wave1Done, 11)}  ${wave1Done}/11 منشورة  (${pct(wave1Done, 11)}%)
${wave1State.text}/11 لها نصّ حقيقي · ${wave1State.text - wave1State.published} تنتظر المراجعة · ${wave1State.draft} هيكل
\`\`\`

**إجمالي النشر**

\`\`\`
${bar(published, published + drafts)}  ${published}/${published + drafts}  (${pct(published, published + drafts)}%)
\`\`\`

---

## البنية

| البند | الحالة |
|---|---|
| الفئات المفعّلة | ${activeCats} من ${cats.length} |
| الصفحات المولّدة | ${distPages || '— (شغّل npm run build)'} |
| قسم الساحة | ${torget.active ? (torget.ready ? '✅ مفعّل' : '⚠️ مفعّل برقم غير صالح') : '⬜ معطّل — ينتظر رقم هاتف'} |
| نصوص قانونية مسوّدة | ${drafts_legal.length} |

${drafts_legal.length ? '```\n' + drafts_legal.join('\n') + '\n```' : ''}

---

## الحواجز

انظر \`ISSUES.md\` للأدلة والخطوات.

---

## ماذا تفعل اليوم

${
  P.waitingAsin > 0
    ? `**١.** أضف ASIN لـ${P.waitingAsin} منتجات — أسرع مكسب، وكل واحد يصبح قابلاً للشراء فوراً.`
    : '**١.** كل المنتجات مربوطة ✓'
}
${
  wave1Done < 11
    ? `**٢.** اكتب ${11 - wave1Done} صفحة من الموجة الأولى — انظر \`KEYWORD_MAP.md\`.`
    : '**٢.** الموجة الأولى مكتملة ✓ — ابدأ الثانية.'
}
${
  torget.active && torget.ready
    ? '**٣.** قسم الساحة يعمل ✓'
    : '**٣.** ضع رقم الهاتف في `src/data/torget/torget.yaml` وفعّل القسم.'
}
${drafts_legal.length ? `**٤.** أكمل ${drafts_legal.length} نصاً قانونياً.` : '**٤.** النصوص القانونية مكتملة ✓'}
`;

writeFileSync(join(ROOT, 'docs/project/STATE.md'), out, 'utf8');
console.log(`\n✓ STATE.md`);
console.log(`  منتجات ${P.total} · منشور ${published}/${published + drafts}`);
console.log(
  `  الموجة الأولى: ${wave1State.text}/11 لها نصّ ` +
    `(${wave1State.published} منشورة · ${wave1State.text - wave1State.published} تنتظر المراجعة) · ` +
    `${wave1State.draft} هيكل` +
    (wave1State.missing.length ? `  ⚠ مفقود: ${wave1State.missing.join('، ')}` : '') +
    '\n',
);
