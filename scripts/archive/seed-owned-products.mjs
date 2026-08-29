/**
 * يولّد ملفات المنتجات المملوكة فعلاً، من سجل مشتريات أمازون.
 *
 * ⚠️ قاعدة ملزمة: كل قيمة هنا مأخوذة حرفياً من عنوان المنتج في صفحة أمازون.
 * لا مواصفة مستنتجة، ولا رقم مقدَّر. الحقول التي تحتاج مصدراً تُترك فارغة.
 *
 * ما يبقى على صاحب المشروع: ASIN + source_url + ملاحظات الاستخدام + الصور.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const OUT = fileURLToPath(new URL('../src/data/products/sv/', import.meta.url));
const LADD = 'laddning-och-strom';
const HALL = 'hallare-och-ordning';

const products = [
  /* ===== شحن وطاقة ===== */
  {
    id: 'anker-735-nano-ii-65w', name: 'Anker 735 Nano II 65W', brand: 'Anker',
    cat: LADD, sub: 'snabbladdare', band: 'mid', since: '2026-02-01',
    specs: { Effekt: '65 W', Portar: '3 (USB-C + USB-A)', Teknik: 'GaN, PPS' },
    problems: ['mobilen-laddar-langsamt', 'sladdar-overallt'],
  },
  {
    id: 'iniu-magnetisk-powerbank-10000', name: 'INIU Magnetisk Powerbank 10000 mAh', brand: 'INIU',
    cat: LADD, sub: 'powerbanks', band: 'mid', since: '2025-05-01',
    specs: { Kapacitet: '10 000 mAh', 'Trådlöst': 'Qi2-certifierad, 15 W', 'Via kabel': '45 W USB-C' },
    problems: ['batteriet-tar-slut', 'ingen-eluttag-pa-resan'],
  },
  {
    id: 'anker-maggo-powerbank-10000', name: 'Anker MagGo Powerbank 10000 mAh', brand: 'Anker',
    cat: LADD, sub: 'powerbanks', band: 'premium', since: '2025-06-01',
    specs: { Kapacitet: '10 000 mAh', 'Trådlöst': 'Qi2, 15 W', Display: 'Smart Display', 'Fäste': 'MagSafe-kompatibel' },
    problems: ['batteriet-tar-slut', 'ingen-eluttag-pa-resan'],
  },
  {
    id: 'ugreen-zapix-powerbank-10000', name: 'UGREEN Zapix Magnetisk Powerbank 10000 mAh', brand: 'UGREEN',
    cat: LADD, sub: 'powerbanks', band: 'mid', since: '2025-06-01',
    specs: { Kapacitet: '10 000 mAh', 'Trådlöst': '7,5 W', 'Fäste': 'Magnetiskt' },
    problems: ['batteriet-tar-slut'],
  },
  {
    id: 'ugreen-nexode-powerbank-25000', name: 'UGREEN Nexode Powerbank 25000 mAh 165W', brand: 'UGREEN',
    cat: LADD, sub: 'powerbanks', band: 'premium', since: '2026-01-01',
    specs: { Kapacitet: '25 000 mAh', Effekt: '165 W', Kablar: '2 inbyggda USB-C-kablar' },
    problems: ['ingen-eluttag-pa-resan', 'batteriet-tar-slut'],
  },
  {
    id: 'anker-nano-reseadapter', name: 'Anker Nano Reseadapter', brand: 'Anker',
    cat: LADD, sub: 'snabbladdare', band: 'mid', since: '2025-08-01',
    specs: { Portar: '4 USB (2×USB-C + 2×USB-A) + AC', 'Ström': '5 A', 'Länder': 'Tyskland, USA, England m.fl.' },
    problems: ['ingen-eluttag-pa-resan', 'sladdar-overallt'],
  },
  {
    id: 'gianac-usb-c-kabel-100w-3m', name: 'GIANAC USB-C till USB-C 100W, 3 m', brand: 'GIANAC',
    cat: LADD, sub: 'kablar', band: 'budget', since: '2026-07-01',
    specs: { Effekt: '100 W', 'Längd': '3 m', Kontakt: '90 grader', Chip: 'E-Mark' },
    problems: ['laddkabeln-gar-sonder', 'sladdar-overallt'],
  },
  {
    id: 'ocetea-usb-c-kabel-30cm', name: 'Ocetea USB-C till USB-C 100W, 30 cm', brand: 'Ocetea',
    cat: LADD, sub: 'kablar', band: 'budget', since: '2025-06-01',
    specs: { Effekt: '100 W', 'Längd': '30 cm', Display: 'LED-display' },
    problems: ['laddkabeln-gar-sonder', 'sladdar-overallt'],
  },
  {
    id: 'baseus-usb-c-kabel-digital-100w', name: 'Baseus USB-C-kabel med digital skärm 100W', brand: 'Baseus',
    cat: LADD, sub: 'kablar', band: 'budget', since: '2025-05-01',
    specs: { Effekt: '100 W', Display: 'Digital skärm' },
    problems: ['laddkabeln-gar-sonder'],
  },
  {
    id: 'ugreen-usb4-kabel-240w', name: 'UGREEN USB-C 240W / 40 Gbps, 1 m', brand: 'UGREEN',
    cat: LADD, sub: 'kablar', band: 'mid', since: '2025-08-01',
    specs: { Effekt: '240 W', 'Dataöverföring': '40 Gbps (USB4)', Video: '8K-signal', 'Längd': '1 m' },
    problems: ['laddkabeln-gar-sonder'],
  },
  {
    id: 'lencent-reseadapter-uk', name: 'LENCENT Reseadapter Sverige till Storbritannien', brand: 'LENCENT',
    cat: LADD, sub: 'snabbladdare', band: 'budget', since: '2025-08-01',
    specs: { Portar: '2×USB-C + 2×USB-A', Typ: 'EU Schuko till UK Type G', 'Hopfällbar': 'Ja' },
    problems: ['ingen-eluttag-pa-resan'],
  },

  /* ===== حوامل وتنظيم ===== */
  {
    id: 'baseus-magpro-bilhallare', name: 'Baseus MagPro magnetisk bilhållare', brand: 'Baseus',
    cat: HALL, sub: 'bilhallare', band: 'mid', since: '2025-06-01',
    specs: { 'Fäste': 'Magnetiskt', Justering: '180 grader', 'Hopfällbar': 'Ja' },
    problems: ['mobilen-glider-i-bilen'],
  },
  {
    id: 'ugreen-magflow-2i1', name: 'UGREEN MagFlow 2-i-1 magnetiskt laddställ', brand: 'UGREEN',
    cat: HALL, sub: 'skrivbordsstall', band: 'mid', since: '2025-06-01',
    specs: { Funktion: 'Laddställ för telefon och hörlurar', 'Trådlöst': 'Ja', Kabel: 'USB-C medföljer' },
    problems: ['skrivbordet-ar-rorigt', 'sladdar-overallt'],
  },
  {
    id: 'ugreen-magsafe-magnetstall', name: 'UGREEN MagSafe magnetställ för bord', brand: 'UGREEN',
    cat: HALL, sub: 'skrivbordsstall', band: 'mid', since: '2025-08-01',
    specs: { 'Fäste': 'Starkt magnetiskt', Placering: 'Bord' },
    problems: ['skrivbordet-ar-rorigt'],
  },
  {
    id: 'cooper-magstand-skrivbordsstall', name: 'Cooper MagStand höjdjusterbart stativ', brand: 'Cooper',
    cat: HALL, sub: 'skrivbordsstall', band: 'budget', since: '2025-07-01',
    specs: { Justering: 'Höjdjusterbart', Placering: 'Skrivbord' },
    problems: ['skrivbordet-ar-rorigt'],
  },
  {
    id: 'simarro-magnetringar', name: 'simarro självhäftande magnetringar, 10-pack', brand: 'simarro',
    cat: HALL, sub: 'bilhallare', band: 'budget', since: '2025-06-28',
    specs: { Antal: '10 st', Typ: 'Självhäftande metallringar', 'Användning': 'För magnetiska hållare' },
    problems: ['mobilen-glider-i-bilen'],
  },
];

const yamlList = (arr) => (arr.length ? '\n' + arr.map((x) => `  - ${x}`).join('\n') : ' []');
const specs = (o) => Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join('\n');

let created = 0;
await mkdir(OUT, { recursive: true });

for (const p of products) {
  const file = join(OUT, `${p.id}.yaml`);
  try { await access(file); console.log(`  تخطٍ: ${p.id}`); continue; } catch {}

  const body = `# المنتج بحوزة صاحب المشروع فعلاً (سجل مشتريات أمازون).
# ⚠️ ناقص قبل النشر: asin · source_url · own_photos · hands_on · hands_on_limits
# عند إدخال ASIN يبني النظام رابط الأفلييت تلقائياً — لا تلصق رابطاً طويلاً.
id: ${p.id}
lang: sv
name: ${JSON.stringify(p.name)}
brand: ${JSON.stringify(p.brand)}
category: ${p.cat}
subcategory: ${p.sub}
problems_solved:${yamlList(p.problems)}

# مأخوذة حرفياً من عنوان المنتج على أمازون — لا مواصفة مستنتجة
key_specs:
${specs(p.specs)}

pros: []
cons: []
best_for: ""
price_band: ${p.band}

# === الملكية والتجربة ===
owned: true
owned_since: ${p.since}
tested: false          # اجعلها true بعد إضافة الصور والملاحظات والحدود
usage_period: ""
own_photos: []
hands_on: []
hands_on_limits: []

# === الربط ===
asin: ""               # ← الصق ASIN هنا (10 خانات من رابط المنتج)
source_url: ""         # ← رابط صفحة المنتج على أمازون
last_verified:
verified: false        # ← اجعلها true بعد اكتمال asin و source_url و last_verified
`;
  await writeFile(file, body, 'utf8');
  console.log(`  ✚ ${p.id}`);
  created++;
}

console.log(`\nتم إنشاء ${created} ملف منتج مملوك.`);
