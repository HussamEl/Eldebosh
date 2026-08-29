<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/logo-png/eldebosh-logo-horizontal-inverse-1200w.png">
  <img src="brand/logo-png/eldebosh-logo-horizontal-1200w.png" alt="Eldebosh" width="380">
</picture>

**موقع Eldebosh وهويته البصرية في مستودع واحد**

[التوثيق](docs/) · [دليل الهوية](brand/GUIDELINES.md) · [سجل التغييرات](CHANGELOG.md) · [المساهمة](CONTRIBUTING.md)

</div>

---

## ما هذا

مستودع يجمع شيئين: **الموقع الجاهز للرفع** و**نظام الهوية البصرية** الذي يولّده
سطر أوامر واحد. الموقع دليل شرائي سويدي/إنجليزي لملحقات الشحن والتقنية اليومية.

| المجلد | المحتوى |
|---|---|
| [`src/`](src/) | مصدر Astro: الصفحات، المكوّنات، المحتوى، البيانات، التنسيق |
| [`public/`](public/) | ما يُنسخ كما هو: لوحة التحكم، الشعار، الخطوط، `.htaccess` |
| [`scripts/`](scripts/) | أدوات المشروع: التحقق، فحص CSS، التدقيق، التقارير |
| [`site/`](site/) | ناتج البناء — يُولَّد بـ`npm run build` ويُرفع كما هو |
| [`brand/`](brand/) | الهوية: مصادر متجهية، مخرجات، ومولّداتها في [`brand/src/`](brand/src/) |
| [`tools/`](tools/) | فحص آلي للموقع في متصفح حقيقي |
| [`docs/`](docs/) | البنية، نظام التصميم، سجل الإصلاحات، النشر، خارطة الطريق |

## البدء

```bash
npm install
npm run dev                  # خادم تطوير Astro
npm run build                # يتحقق ثم يبني إلى site/ ثم يفهرس البحث
npm run verify               # خط الفحص الكامل — لا تدمج قبل أن يمرّ
```

لإعادة توليد الهوية:

```bash
pip install -r brand/src/requirements.txt
npm run brand:all            # الشعار ← الدُكوك ← PNG و PDF
```

## الأوامر

| الأمر | ماذا يفعل |
|---|---|
| `npm run dev` | خادم تطوير Astro مع إعادة تحميل حيّة |
| `npm run build` | `validate` ← `astro build` إلى `site/` ← فهرسة Pagefind |
| `npm run verify` | البناء + فحص CSS + اختبار jsdom + **فحص المتصفح** + تدقيق الصفحات + التقارير |
| `npm run test:browser` | [`tools/verify-site.mjs`](tools/verify-site.mjs) وحده: 24 كنترول في كروم |
| `npm run serve` | يقدّم `site/` محليًا |
| `npm run brand:logo` | يبني نسخ الشعار المتجهية |
| `npm run brand:canvas` | يبني دُكوك السوشال والمطبوعات |
| `npm run brand:render` | يصوّرها إلى PNG و PDF |
| `npm run brand:all` | الثلاثة بالترتيب |

## نظرة سريعة

**الموقع** — Astro 5، مخرجات ثابتة: لا Node ولا قاعدة بيانات على الخادم.
تنسيق واحد، جافاسكربت واحد (~4 ك.ب)، خطوط ذاتية الاستضافة، وبحث Pagefind.
لغتان من قوالب واحدة عبر `src/pages/[lang]/`. يعمل كاملًا بدون جافاسكربت —
عارض الصور يرتد إلى `:target` في CSS.

**لوحة التحكم** — Sveltia CMS على `/admin/`، تكتب مباشرة إلى `src/` في هذا
المستودع. المحرّر يدخل برمز GitHub، يملأ الحقول، ينشر — فيصير commit.

**الهوية** — حرف E من ثلاثة أعمدة، أوسطها سماوي: نفس «شريط الشحن» في تصميم
الموقع. الكلمة مسارات متجهية مستخرجة من خط Inter Tight عبر HarfBuzz، فلا تحتاج
تثبيت خط في أي برنامج أو مطبعة.

> [!IMPORTANT]
> **عدّل `src/` و`public/` — لا `site/`.** الأخير ناتج بناء يُمحى ويُعاد توليده عند كل
> `npm run build`، وحارس في CI يرفض أي `site/` لا يطابق بناءً نظيفًا.
> يُتابَع في Git لأن الرفع إلى الاستضافة يدوي حاليًا (النشر التلقائي معطّل —
> [`docs/06-roadmap.md`](docs/06-roadmap.md) بند 1).

## حالة المشروع

| | |
|---|---|
| خط الفحص | يمرّ كاملًا ✅ — بناء + CSS + jsdom + **24/24 في المتصفح** + تدقيق 31 صفحة |
| الصفحات | 18 سويدية · 13 إنجليزية |
| المنتجات | 20 منتجًا · منشور 2 من 32 صفحة محتوى |
| ملفات الهوية | 57 |
| يحجب كل شيء | النشر التلقائي معطّل (FTP) — [`docs/06-roadmap.md`](docs/06-roadmap.md) بند 1 |
| يمنع الإطلاق | بيانات اتصال حقيقية — البند 6 |
