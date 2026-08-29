# البنية

## ما الذي في المستودع

```
src/      مصدر Astro — الصفحات، المكوّنات، المحتوى، البيانات، التنسيق
public/   ملفات تُنسخ كما هي: لوحة التحكم، الشعار، الخطوط، السكربت، .htaccess
scripts/  أدوات المشروع: التحقق، الفحص، التوليد، التقارير
site/     ناتج البناء — يُولَّد بـ`npm run build` ويُرفع كما هو
brand/    الهوية البصرية: مصادر متجهية + مخرجات + المولّدات في src/
tools/    فحص المتصفح الآلي (Playwright)
docs/     هذا التوثيق · docs/project/ وثائق المشروع من مرحلة المصدر
csv/      جداول مولّدة للمراجعة البشرية
```

## أين الحقيقة المصدرية

**في `src/` و`public/`.** مجلد `site/` ناتج بناء: كل ما فيه يُعاد توليده، وأي تعديل
يدوي عليه يُمحى عند أول `npm run build`.

هذا ليس كلامًا نظريًا: إصلاح ألوان لوحة التحكم طُبِّق أولًا على `site/admin/` فمُحي
في أول بناء، وأُعيد تطبيقه على `public/admin/` حيث يجب أن يكون.

`site/` **يُتابَع في Git** رغم كونه ناتج بناء — لأن الرفع إلى الاستضافة يدوي حاليًا
(نشر FTP معطّل، انظر [06-roadmap.md](06-roadmap.md))، فوجود الناتج في المستودع هو
ما يجعل الرفع ممكنًا دون أدوات. وحارس في CI يرفض أي `site/` لا يطابق بناءً نظيفًا.

## سلسلة البناء

```
npm run build
  └─ node scripts/validate.mjs   قواعد المحتوى — يوقف البناء عند أي مخالفة
  └─ astro build                 يولّد site/ من src/ و public/
  └─ pagefind --site site        فهرس البحث
```

`validate.mjs` يعمل **قبل** Astro، فالمخالفة توقف البناء بدل أن تُنشر.

## تشريح `site/`

| المسار | ماذا فيه |
|---|---|
| `sv/` | 18 صفحة سويدية — اللغة الأساسية (`sv-SE`) |
| `en/` | 13 صفحة إنجليزية |
| `_astro/<hash>.css` | كل تنسيقات الموقع في ملف واحد، الاسم مبصوم بالمحتوى |
| `js/eldebosh-ui.js` | كل جافاسكربت الموقع: فلتر المنتجات + عارض الصور (منسوخ من `public/`) |
| `brand/` | نسخ الشعار التي تستدعيها الصفحات |
| `fonts/` | 4 ملفات woff2: Inter و Inter Tight، متغيّرة الوزن |
| `uploads/` | 16 صورة منتج بصيغة webp |
| `pagefind/` | فهرس البحث (884 ك.ب) — يُولَّد آليًا، لا يُحرَّر يدويًا |
| `.htaccess` | إعدادات Apache: DirectoryIndex، ضغط، كاش، رؤوس أمان |

## تدفق الصفحة

1. الخادم يقدّم `index.html` من المجلد المطلوب (`DirectoryIndex` في `.htaccess`).
2. الصفحة تحمّل `site.v2.css` وحدها — لا تنسيقات مضمّنة ولا شبكة توزيع خارجية.
3. الخطوط تُحمَّل مسبقًا (`rel="preload"`) من `/fonts/` — لا Google Fonts.
4. `js/eldebosh-ui.js` (بـ`defer`) يفعّل الفلتر وعارض الصور عند وجوده؛
   الصفحة تعمل كاملة بدونه — العارض يرتد إلى `:target` في CSS.
5. صفحات البحث تحمّل Pagefind من `/pagefind/`.

## بصمة اسم ملف CSS

`.htaccess` يخزّن CSS و JS سنة كاملة كـ`immutable`. تعديل ملف بالاسم نفسه لا يصل
للزوّار الحاليين أبدًا. **Astro يحلّ هذا بنفسه**: يبصم اسم الملف بمحتواه، فأي تعديل
يغيّر الاسم تلقائيًا. الاسم اليدوي `site.v2.css` الذي استُخدم قبل وصول المصدر لم يعد
موجودًا ولا حاجة له.

## عارض الصور — لماذا هو خارج البطاقات

`.viewer` عنصر `position:fixed`، لكنه في البناء الأصلي كان داخل
`article.tile` التي تحمل `overflow:hidden` و`transform` عند المرور. عنصر عليه
`transform` يصبح containing block لأبنائه المثبّتين، فتُقصّ النافذة داخل البطاقة.
لذلك يُنقل كل `.viewer` إلى `<body>` عند التحميل، ويبقى `:has()` في CSS كخطة بديلة
لمن لا يعمل عنده JS. التفاصيل والقياسات في [03-fixes-log.md](03-fixes-log.md).

## من أين يأتي كل ملف مبني

| الناتج | مصدره |
|---|---|
| `_astro/<hash>.css` | `src/styles/global.css` (ملف واحد، يبصمه Astro) |
| ترويسة كل الصفحات | `src/components/Header.astro` + `src/layouts/BaseLayout.astro` |
| الوسوم و canonical و hreflang و JSON-LD | `src/layouts/BaseLayout.astro` + `src/lib/seo.ts` |
| بطاقة المنتج وعارض الصور | `src/components/ProductTile.astro` |
| سلوك العارض والفلتر | `public/js/eldebosh-ui.js` (يُنسخ كما هو) |
| `sv/index.html` و`en/index.html` | `src/pages/[lang]/index.astro` |
| صفحات الأدلة | `src/pages/[lang]/guides/[slug].astro` ← `src/content/guides/sv/*.mdx` |
| صفحات الفئات | `src/pages/[lang]/[category]/index.astro` ← `src/data/categories/*.yaml` |
| `sv/pa-torget/` | `src/pages/sv/pa-torget.astro` ← `src/data/torget/torget.yaml` |
| لوحة التحكم، الشعار، الخطوط، `.htaccess` | `public/` كما هي |
| `pagefind/*` | مولّد — لا يُحرَّر |

## اللغتان

كل المسارات تحت `src/pages/[lang]/`، وملف واحد يولّد النسختين عبر `getStaticPaths`.
أجزاء المسار ليست مكتوبة يدويًا: جدول في `src/i18n/ui.ts` وبانِي روابط في
`src/lib/content.ts`. أربعة مسارات فقط تختلف تسميتها بين اللغتين ولها ملفات منفصلة
(`sok`/`search`، `pa-torget`/`on-the-square`).

`prefixDefaultLocale: true` يعني أن لا وجود لشجرة سويدية بلا بادئة — كل صفحة تحت
`/sv/` أو `/en/`، و`/` تحويل.

## بوابتا النشر

| العلم | يحكم | يُطبَّق في |
|---|---|---|
| `published` | الحلول والأدلة والمقارنات والمقالات والصفحات | `docs()` في `src/lib/content.ts` |
| `verified` | المنتجات | `getProduct()` و`verifiedProducts()` في نفس الملف |

استثناء مقصود: منتج غير موثّق لكنه **مملوك** وله صورة من تصويرنا يظهر بلا زر شراء
وبعبارة «Länk kommer» — القاعدة تمنع المواصفات بلا مصدر، لا إخفاء منتج بحوزتنا.
