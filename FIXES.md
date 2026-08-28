# إصلاحات موقع Eldebosh — الألوان + مشاكل الصور

هذه النسخة هي **مخرجات البناء (dist)** وليست شيفرة Astro المصدرية.
كل التعديلات مطبّقة ومختبَرة هنا، ويجب نقلها إلى المصدر حتى لا تضيع مع أول `npm run build`.

الملفات التي تغيّرت:

| الملف | ماذا حدث |
|---|---|
| `_astro/site.v2.css` | بديل `_astro/_subcategory_.DBnoV-zu.css` (اسم جديد لكسر الكاش، لأن `.htaccess` يخزّن CSS سنة كاملة كـ `immutable`) |
| `js/eldebosh-ui.js` | ملف جديد: فلتر المنتجات + عارض الصور، بدل السكربت المكرر داخل الصفحات |
| 31 صفحة HTML | تحديث رابط الـCSS، حذف السكربت المضمّن، وإضافة `<script src="/js/eldebosh-ui.js" defer>` في الصفحات التي فيها عارض صور |

---

## 1) الألوان (مطابقة للصورة المرسلة)

استُبدل اللون الليموني `--volt` بالأزرق السماوي، وصار الترويسة/الهيرو كحليًا وخلفية الصفحة زرقاء فاتحة:

```css
:root{
  --page: #e7f2fd;        /* جديد: خلفية الصفحة (كانت أبيض) */
  --brand: #1273d1;       /* كان #2563eb */
  --brand-deep: #123f66;  /* كان #1e4d8f — الترويسة والفوتر */
  --brand-hero: #14456e;  /* كان #2a63ab */
  --brand-soft: #f0f7fe;  /* كان #eff5fe */
  --brand-tint: #d3e7fa;  /* كان #dbe9fb */
  --volt: #55c6f2;        /* كان #c4f04e (ليموني) */
  --volt-deep: #2fb2e6;   /* جديد: حالة hover لزر --volt */
  --mist: #f2f7fc; --mist-2: #e4eef7;
  --line: #d7e3ee; --line-2: #bcd2e3;
  --ink-2: #3f4c59; --muted: #66727f;
}
body{ background: var(--page) }                                   /* كان var(--paper) */
.hero{ background: linear-gradient(168deg,var(--brand-hero),var(--brand-deep)) }
.hero .charge{ background:#2f6a9b }                                /* كان #4a86cc */
.btn-volt:hover{ background: var(--volt-deep) }                    /* كان #b6e63f */
.tile-dot{ box-shadow:0 0 0 2px #55c6f259 }                        /* كان #c4f04e59 */
.handson-badge .dot{ box-shadow:0 0 0 3px #55c6f24d }              /* كان #c4f04e4d */
.nav-panel{ box-shadow:0 20px 44px -14px #123f663d }               /* كان #1e4d8f3d */
```

## 2) مشاكل الصور (نقر / مرور) — وما سببها فعليًا

### أ. النافذة المنبثقة كانت تُقصّ داخل البطاقة (العطل الأساسي)

`.viewer` عنصر `position:fixed` لكنه موجود **داخل** `article.tile`، و`.tile:hover` يطبّق
`transform:translateY(-2px)`. أي عنصر عليه `transform` يصبح containing block لأبنائه
`position:fixed` — ومع `overflow:hidden` على البطاقة تُقصّ النافذة داخلها.

قياسات فعلية من النسخة القديمة عند النقر (متصفح حقيقي، 1440×900):
`viewer-box: 204×729 عند x=365, y=-73` و`viewer-veil: 236×434` بدل ملء الشاشة.
وبما أن المؤشر يكون فوق البطاقة وقت النقر دائمًا، كان العطل يظهر في كل نقرة على سطح المكتب.

الحل (طبقتان):
- JS ينقل كل `.viewer` إلى `<body>` عند التحميل، فلا تبقى داخل أي بطاقة.
- وللمتصفحات بدون JS: `.tile:has(.viewer:target){transform:none}`.

### ب. تجميد الأنيميشن عند المرور كان يترك صورتين نصف شفافتين

```css
/* قبل */ .tile:hover .tile-photos .tile-photo{ animation-play-state: paused }
```
التجميد يحدث عند أي لحظة من الـcross-fade، فتظهر صورة «شبح» فوق أخرى.

```css
/* بعد */
@media(hover:hover){
  .tile:hover .tile-photos .tile-photo,
  .tile:focus-within .tile-photos .tile-photo{ animation:none; opacity:0; transition:opacity .18s ease }
  .tile:hover .tile-photos .tile-photo:first-child,
  .tile:focus-within .tile-photos .tile-photo:first-child{ opacity:1 }
}
```

### ج. الشريط الأزرق أسفل الصورة كان يختفي

قاعدتان تتنازعان على نفس الـpseudo-element:
`.tile-face:after` (الشريط) و`.tile-face[href^="#"]:after` (طبقة التعتيم عند المرور).
نُقلت طبقة التعتيم إلى `.tile-photos:before` فعاد الشريط للظهور على بطاقات الصور.

### د. سلوك النافذة نفسها

كانت تعتمد على `:target` وحده: تغيير الهاش يقفز بالصفحة (سُجّل `scrollY: 305` عند الفتح)،
ولا تُغلق بـEscape، وكل فتح/إغلاق يضيف سجلًا في تاريخ التصفح.
الآن `js/eldebosh-ui.js` يتولى الأمر: `preventDefault` بدل الهاش، إغلاق بـEscape/الخلفية/زر ×،
`role="dialog"` و`aria-modal` و`aria-labelledby`، حصر التركيز داخل النافذة وإعادته للصورة عند الإغلاق،
قفل تمرير الخلفية، وتحويل صور النافذة من `loading="lazy"` إلى `eager` عند الفتح
(الصور الكسولة داخل حاوية `display:none` لا تُحمَّل قبل الظهور).
ما زال `:target` يعمل كخطة بديلة عند تعطّل JS.

### هـ. تنظيف

- سكربت الفلتر كان مكررًا حرفيًا داخل `sv/index.html` و`en/index.html` → صار ملفًا واحدًا مشتركًا.
- إضافة حارس على `data-count-template` (كان يرمي استثناء لو غاب).
- تأثيرات hover الخاصة بالبطاقات صارت داخل `@media(hover:hover)` حتى لا تعلق على شاشات اللمس.
- `cursor:zoom-in` على الصورة القابلة للنقر.

---

## الفحص المُجرى (Chromium حقيقي)

سطح المكتب 1440×900، وiPhone 13، ومع تعطيل JS، وعلى 10 صفحات:
النافذة تفتح في منتصف الشاشة (470×776) بلا قصّ، Escape/الخلفية/× تغلقها، التركيز يعود للصورة،
الهاش لا يتغير والصفحة لا تقفز، الفلتر يعمل (10 → 3 منتجات)، الرابط المباشر `/sv/#v-P-01` يفتح النافذة،
ولا يوجد أي خطأ في الـconsole ولا أي طلب فاشل (404).

---

# الهوية البصرية (جولة ثانية)

الشعار الجديد مبني بالكامل بصيغة متجهية: أعمدة مستديرة تكوّن حرف **E**، عمودها الأوسط
باللون السماوي — نفس «شريط الشحن» في تصميم الموقع. الكلمة مسارات متجهية مستخرجة من خط
Inter Tight (وزن 800) بمحاذاة وتقنين حقيقيين عبر HarfBuzz، فلا تعتمد على وجود الخط.

## ما أُضيف إلى الموقع

| الملف | الحالة |
|---|---|
| `/brand/*.svg` | جديد — 10 نسخ من الشعار |
| `/logo.svg` | استُبدل بالشعار الأفقي الجديد |
| `/favicon.svg` | استُبدل (نسخة مبسّطة تقرأ عند 16px) |
| `/og-default.png` | صورة المشاركة أعيد تصميمها بالهوية الجديدة |
| `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` | جديدة |
| 31 صفحة HTML | الترويسة: `elde<span>bosh</span>` ← `<img src="/brand/eldebosh-logo-header.svg">` + رابط `apple-touch-icon` |
| `_astro/site.v2.css` | `.brand{display:inline-flex}` و`.brand img{height:26px}` |

## ملاحظة تقنية على SVG

في التوليد الأول كان العمود الرأسي للحرف يُرسم بـ `rx` = نصف **الارتفاع**، ولأن SVG يقصّ
`rx` إلى نصف العرض بينما يُبقي `ry` على قيمته، كانت الزوايا تتحول إلى أقواس بيضوية ويظهر
الحرف منتفخًا. القاعدة: `rx = min(width, height) / 2`.

## ما يحتاج قرارك

- بيانات كرت العمل (اسم، بريد، هاتف) نموذجية — صفحة `sv/info/kontakt` نفسها ما زالت مكتوبًا
  فيها «UTKAST — أضف بيانات اتصال حقيقية قبل الإطلاق».
- النسخة الخضراء محفوظة كبديل مبني على تصميمك الأصلي، لكن الموقع كله أزرق الآن فالأزرق هو الأساس.
