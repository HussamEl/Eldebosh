# SPEC.md — المواصفات التقنية v1.0

## بنية الملفات
```
src/
  content.config.ts        مخطط كل المجموعات (zod) — مصدر الحقيقة للبيانات
  i18n/ui.ts               الترجمات + أجزاء المسارات + المسارات المحجوزة
  lib/content.ts           بناء الروابط + جلب المحتوى + منطق المنتجات والأفلييت
  lib/seo.ts               hreflang + Schema.org
  layouts/BaseLayout.astro رأس الصفحة، الميتا، hreflang، JSON-LD
  components/              Header, Footer, AffiliateDisclosure, ProductCard,
                           CompareTable, ContentCard, SectionHead, Breadcrumbs
  pages/[lang]/            كل المسارات، تُولَّد للغتين من نفس الملف
  pages/sv/sok.astro       البحث (سويدي)
  pages/en/search.astro    البحث (إنجليزي)
  data/products/{sv,en}/   منتج = ملف YAML واحد
  data/categories/         فئة = ملف YAML واحد (كل اللغات داخله)
  content/{solutions,guides,comparisons,posts,pages}/{sv,en}/   MDX
scripts/validate.mjs       فحص القواعد الملزمة قبل البناء
public/admin/              لوحة التحرير المرئية
```

## بنية الروابط
| النوع | المسار |
|---|---|
| رئيسية | `/sv/` |
| فئة | `/sv/[category]/` |
| فئة فرعية | `/sv/[category]/[subcategory]/` |
| حل | `/sv/solutions/[slug]/` |
| دليل | `/sv/guides/[slug]/` |
| مقارنة | `/sv/compare/[slug]/` |
| مقال | `/sv/blog/[slug]/` |
| صفحة ثابتة | `/sv/info/[slug]/` |
| بحث | `/sv/sok/` · `/en/search/` |
| منتج | معطّل |

`trailingSlash: 'always'`. `/` يعيد التوجيه إلى `/sv/`.
مسارات محجوزة لا يجوز أن تحملها فئة: `solutions, guides, compare, blog, info, sok, search, admin, sv, en, pagefind`.

## المكوّنات
- `ProductCard(id, lang, badge?, reason?, compact?)` — يجلب المنتج، يتحقق من `verified`، يبني رابط الأفلييت. منتج غير موثق ⇒ لا يُعرض.
- `CompareTable(ids, lang)` — يبني الجدول من `key_specs` تلقائياً. أقل من منتجين موثقين ⇒ لا جدول.
- `AffiliateDisclosure(lang)` — أعلى كل صفحة تجارية.
- الوسوم (`best-overall` …) تُحفظ على **علاقة المنتج بالدليل** في `picks[]`، لا على المنتج.

## SEO
- `hreflang` لكل لغة + `x-default` على السويدية.
- `canonical` مطلق على كل صفحة.
- JSON-LD: `BreadcrumbList` على كل صفحة داخلية، `Article` على المحتوى، `FAQPage` على صفحات الحلول.
- `sitemap-index.xml` مولّد آلياً. `robots.txt` يمنع `/admin/` و `/pagefind/`.

## الأداء
- صفر JavaScript على كل الصفحات ما عدا صفحة البحث.
- CSS واحد عبر tokens في `global.css`. لا إطار CSS خارجي.
- الصور: `loading="lazy"` + `width/height` إلزاميان.
- هدف: LCP < 2.0s على 4G، CLS < 0.05، صفر long tasks.

## البحث
Pagefind بعد البناء. النطاق المفهرس: `<main data-pagefind-body>` فقط؛ الرأس والفوتر وفتات الخبز والإفصاح مستثناة.

## النشر
`main` push → GitHub Actions → `npm ci` → `npm run build` (يتضمن الفحص) → FTP إلى Hostinger.
الأسرار المطلوبة: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_REMOTE_DIR`.
