# سجل الإصلاحات

كل إصلاح مكتوب بسببه الجذري وبصيغته الأصلية، لأن `site/` مخرجات بناء ويجب نقل
هذه التعديلات إلى مصدر Astro (انظر [06-roadmap.md](06-roadmap.md) بند 1).

---

## 1. الألوان: من الليموني إلى الأزرق

البناء المُستلم كان يحمل لون تمييز ليمونيًا `#C4F04E` بينما التصميم المعتمد أزرق.

```css
:root{
  --page: #E7F2FD;        /* جديد — خلفية الصفحة، كانت أبيض */
  --brand: #1273D1;       /* كان #2563EB */
  --brand-deep: #123F66;  /* كان #1E4D8F */
  --brand-hero: #14456E;  /* كان #2A63AB */
  --brand-soft: #F0F7FE;  /* كان #EFF5FE */
  --brand-tint: #D3E7FA;  /* كان #DBE9FB */
  --volt: #55C6F2;        /* كان #C4F04E */
  --volt-deep: #2FB2E6;   /* جديد — hover للون التمييز */
  --mist: #F2F7FC; --mist-2: #E4EEF7;
  --line: #D7E3EE; --line-2: #BCD2E3;
  --ink-2: #3F4C59; --muted: #66727F;
}
body{ background: var(--page) }                                    /* كان var(--paper) */
.hero{ background: linear-gradient(168deg,var(--brand-hero),var(--brand-deep)) }
.hero .charge{ background:#2F6A9B }                                 /* كان #4A86CC */
.btn-volt:hover{ background: var(--volt-deep) }                     /* كان #B6E63F */
.tile-dot{ box-shadow:0 0 0 2px #55C6F259 }                         /* كان #C4F04E59 */
.handson-badge .dot{ box-shadow:0 0 0 3px #55C6F24D }               /* كان #C4F04E4D */
.nav-panel{ box-shadow:0 20px 44px -14px #123F663D }                /* كان #1E4D8F3D */
```

---

## 2. النافذة كانت تُقصّ داخل البطاقة

**الأثر:** كل نقرة على صورة منتج على سطح المكتب تفتح نافذة مشوّهة داخل البطاقة.

**السبب:** `.viewer` عنصر `position:fixed` لكنه داخل `article.tile`، والبطاقة
تحمل `overflow:hidden` وتأخذ `transform:translateY(-2px)` عند المرور. أي عنصر
عليه `transform` يصبح containing block لأبنائه المثبّتين، فيقصّه `overflow:hidden`.
ولأن المؤشر فوق البطاقة وقت النقر دائمًا، كان العطل يقع في كل مرة.

**القياس على البناء القديم** (كروم حقيقي، 1440×900):

| العنصر | قبل | بعد |
|---|---|---|
| `.viewer-box` | `204×729` عند `y = -73` | `480×776` في المنتصف |
| `.viewer-veil` | `236×434` (حجم البطاقة) | `1440×900` (حجم الشاشة) |

**الإصلاح:** طبقتان —
- جافاسكربت ينقل كل `.viewer` إلى `<body>` عند التحميل.
- ولمن لا يعمل عنده JS: `.tile:has(.viewer:target){transform:none}`.

---

## 3. تجميد التلاشي عند المرور

```css
/* قبل */ .tile:hover .tile-photos .tile-photo{ animation-play-state: paused }
```

التجميد يقع في أي لحظة من التلاشي المتقاطع، فتظهر صورتان نصف شفافتين فوق بعضهما.

```css
/* بعد */
@media(hover:hover){
  .tile:hover .tile-photos .tile-photo,
  .tile:focus-within .tile-photos .tile-photo{ animation:none; opacity:0; transition:opacity .18s ease }
  .tile:hover .tile-photos .tile-photo:first-child,
  .tile:focus-within .tile-photos .tile-photo:first-child{ opacity:1 }
}
```

---

## 4. الشريط الأزرق يختفي من بطاقات الصور

قاعدتان تتنازعان على نفس العنصر الزائف: `.tile-face:after` (الشريط) و
`.tile-face[href^="#"]:after` (طبقة التعتيم عند المرور). الثانية تلغي الأولى.
نُقلت طبقة التعتيم إلى `.tile-photos:before` فعاد الشريط.

---

## 5. سلوك النافذة نفسها

كانت تعتمد على `:target` وحده: قفزة في الصفحة عند الفتح (`scrollY: 305` مقيسة)،
ولا تُغلق بـEscape، وكل فتح/إغلاق يضيف سجلًا في تاريخ التصفح.

`site/js/eldebosh-ui.js` الآن يتولّى: `preventDefault` بدل تغيير الهاش، إغلاق
بـEscape والخلفية وزر ×، `role="dialog"` و`aria-modal` و`aria-labelledby`، حصر
التركيز داخل النافذة وإعادته إلى الصورة عند الإغلاق، وتحويل صور النافذة من
`loading="lazy"` إلى `eager` عند الفتح (الصور الكسولة داخل حاوية `display:none`
لا تُحمَّل قبل الظهور). `:target` باقٍ كخطة بديلة.

---

## 6. قفل التمرير: `overflow:hidden` لا يكفي

**الأثر:** الصفحة تنزلق ~305px تحت النافذة لحظة فتحها.

**السبب:** عند فتح النافذة يُنقل التركيز إلى زر الإغلاق بـ
`focus({ preventScroll: true })`. كروم **يتجاهل** هذا الخيار حين يقع التركيز داخل
حاوية قابلة للتمرير (`.viewer-box{overflow-y:auto}`)، ومع
`html{scroll-behavior:smooth}` يظهر الانزلاق بعد جزء من الثانية لا فورًا.

**الإصلاح:** تثبيت الجسم مكانه بدل إخفاء التمرير فقط —

```css
body.viewer-open{ position:fixed; inset-inline:0; width:100%; overflow:hidden }
```
```js
lockedScrollY = window.scrollY;
document.body.style.top = `-${lockedScrollY}px`;
document.body.classList.add('viewer-open');
// عند الإغلاق
document.body.style.top = '';
window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
```

هذا يحلّ أيضًا مشكلة قديمة: `overflow:hidden` وحده لا يمنع التمرير على iOS Safari.

اكتُشف العطل أثناء كتابة `tools/verify-site.mjs` — الفحص الآلي أمسك ما لم تمسكه
المراجعة اليدوية.

---

## 7. تنظيف

- سكربت الفلتر كان مكرّرًا حرفيًا في `sv/index.html` و`en/index.html` → صار ملفًا
  واحدًا `js/eldebosh-ui.js`، مع حارس على `data-count-template` (كان يرمي استثناءً لو غاب).
- تأثيرات المرور على البطاقات صارت داخل `@media(hover:hover)` حتى لا تعلق على اللمس.
- `cursor:zoom-in` على الصورة القابلة للنقر.
- اسم ملف CSS صار `site.v2.css` لكسر كاش السنة (انظر [01-architecture.md](01-architecture.md)).

---

## 8. تركيب الهوية

| الملف | الحالة |
|---|---|
| `site/brand/*.svg` | جديد — 10 نسخ من الشعار |
| `site/logo.svg`, `site/favicon.svg` | استُبدلا |
| `site/og-default.png` | أعيد تصميمه |
| `site/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | جديدة |
| 31 صفحة | `elde<span>bosh</span>` ← `<img src="/brand/eldebosh-logo-header.svg">` + رابط `apple-touch-icon` |
| `site/_astro/site.v2.css` | `.brand{display:inline-flex}` و`.brand img{height:26px}` |

خلل في توليد SVG أُصلح في المولّد: `rx` كان يساوي نصف الارتفاع للعمود الرأسي،
وSVG يقصّه إلى نصف العرض مع إبقاء `ry`، فتصير الزوايا بيضوية.
القاعدة: `rx = min(width, height) / 2`.

---

## الحالة الحالية

`npm run verify` — **22/22 كنترول تمرّ**: 32 صفحة بلا أخطاء أو 404، الباليتة،
الشعار، النافذة (بلا قصّ، بلا قفزة، Escape، التركيز)، الارتداد بدون JS، الجوال،
الفلتر، ووجود كل ملفات الهوية.
