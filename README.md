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
| [`site/`](site/) | الموقع كاملًا — ملفات ثابتة، ارفع محتوياته كما هي |
| [`brand/`](brand/) | الهوية: مصادر متجهية، مخرجات، ومولّداتها في [`src/`](brand/src/) |
| [`tools/`](tools/) | فحص آلي للموقع في متصفح حقيقي |
| [`docs/`](docs/) | البنية، نظام التصميم، سجل الإصلاحات، النشر، خارطة الطريق |

## البدء

```bash
npm install                  # Playwright (لأدوات الفحص والتوليد)
npm run serve                # http://localhost:8080
npm run verify               # 22 كنترول في متصفح حقيقي
```

لإعادة توليد الهوية:

```bash
pip install -r brand/src/requirements.txt
npm run brand:all            # الشعار ← الدُكوك ← PNG و PDF
```

## الأوامر

| الأمر | ماذا يفعل |
|---|---|
| `npm run serve` | يقدّم `site/` محليًا |
| `npm run verify` | يشغّل [`tools/verify-site.mjs`](tools/verify-site.mjs): الصفحات، الباليتة، العارض، الارتداد بدون JS، الجوال، الفلتر |
| `npm run brand:logo` | يبني نسخ الشعار المتجهية |
| `npm run brand:canvas` | يبني دُكوك السوشال والمطبوعات |
| `npm run brand:render` | يصوّرها إلى PNG و PDF |
| `npm run brand:all` | الثلاثة بالترتيب |

## نظرة سريعة

**الموقع** — مخرجات بناء Astro (dist)، لا Node ولا قاعدة بيانات على الخادم.
تنسيق واحد (`site.v2.css`)، جافاسكربت واحد (`js/eldebosh-ui.js`)، خطوط ذاتية
الاستضافة، وبحث Pagefind. يعمل كاملًا بدون جافاسكربت — عارض الصور يرتد إلى
`:target` في CSS.

**الهوية** — حرف E من ثلاثة أعمدة، أوسطها سماوي: نفس «شريط الشحن» في تصميم
الموقع. الكلمة مسارات متجهية مستخرجة من خط Inter Tight عبر HarfBuzz، فلا تحتاج
تثبيت خط في أي برنامج أو مطبعة.

> [!IMPORTANT]
> `site/` **مخرجات بناء وليست شيفرة مصدرية.** أي `astro build` من مصدر خارجي
> سيمسح ما هنا. كل إصلاح موثّق بصيغته الأصلية في
> [`docs/03-fixes-log.md`](docs/03-fixes-log.md) ليُنقل إلى المصدر.
> الوضع المستقر: نقل مصدر Astro إلى هذا المستودع — [`docs/06-roadmap.md`](docs/06-roadmap.md).

## حالة المشروع

| | |
|---|---|
| الفحص الآلي | 22/22 ✅ ([`npm run verify`](tools/verify-site.mjs)) |
| الصفحات | 18 سويدية · 13 إنجليزية |
| حجم الموقع | 3.1 م.ب (منها 884 ك.ب فهرس بحث) |
| ملفات الهوية | 57 |
| يمنع الإطلاق | بيانات اتصال حقيقية — [`docs/06-roadmap.md`](docs/06-roadmap.md) بند 2 |
