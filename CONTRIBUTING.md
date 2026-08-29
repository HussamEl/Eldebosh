# المساهمة

## قبل أي تعديل

اقرأ [`docs/01-architecture.md`](docs/01-architecture.md). أهم سطر فيه:
**عدّل `src/` و`public/` — لا `site/`.** الأخير ناتج بناء يُمحى عند كل
`npm run build`. حدث هذا فعلًا: إصلاح ألوان لوحة التحكم طُبِّق على `site/admin/`
فمُحي في أول بناء.

## دورة العمل

```bash
git switch -c fix/وصف-قصير
npm run dev                    # عدّل مع إعادة تحميل حيّة
npm run verify                 # خط الفحص الكامل — يجب أن يمرّ قبل أي commit
git add -A && git commit       # مع site/ المُعاد بناؤه
```

`npm run verify` يشغّل بالترتيب: `validate` (قواعد المحتوى) ← `astro build` ←
Pagefind ← `check:css` ← `test:ui` (jsdom) ← `test:browser` (24 كنترول في كروم)
← `audit` (31 صفحة) ← تقارير الحالة.

## الفروع

| النمط | متى |
|---|---|
| `fix/…` | إصلاح عطل |
| `feat/…` | إضافة |
| `docs/…` | توثيق فقط |
| `brand/…` | تعديل على الهوية |

## رسائل الـcommit

سطر أول ≤ 72 حرفًا بصيغة الأمر، ثم سطر فارغ، ثم **السبب** لا الوصف.
الفرق واضح في الشيفرة؛ ما ليس واضحًا هو لماذا.

```
Lock the body while the photo viewer is open

focus({preventScroll:true}) is ignored by Chrome when focus lands inside a
scrollable box, so the page jumped ~305px on every open. Pinning the body
with position:fixed also fixes background scrolling on iOS Safari.
```

## قواعد لا تُكسر

1. **لا تكتب لونًا مباشرًا في CSS** — استخدم رموز `:root`
   ([`docs/02-design-system.md`](docs/02-design-system.md)).
2. **`site/` يُبنى، لا يُحرَّر.** التزم بالمصدر، وابنِ قبل الـcommit — حارس CI
   يرفض أي `site/` لا يطابق بناءً نظيفًا. (بصمة اسم CSS يتولاها Astro تلقائيًا.)
3. **لا تضع عنصرًا `position:fixed` داخل `.tile`** — البطاقة تأخذ `transform`
   عند المرور فتقصّه. السبب كاملًا في [`docs/03-fixes-log.md`](docs/03-fixes-log.md) بند 2.
4. **لا تعطّل فحصًا لتمرير الاختبار.** إن كشف الفحص عطلًا فهو يقوم بعمله.
5. **كل تأثير مرور داخل `@media(hover:hover)`** حتى لا يعلق على شاشات اللمس.
6. **الموقع يعمل بدون جافاسكربت** — لا تكسر ارتداد `:target` في عارض الصور.
7. **لا مستضيفات خارجية** للخطوط أو CSS أو JS. (الاستثناء الوحيد الباقي هو
   لوحة التحكم، وهو مسجّل كبند مفتوح.)
8. **مفتاح ترجمة ناقص يوقف البناء** — `t()` يرمي استثناءً بدل أن يطبع `undefined`.

## تعديل المحتوى

من لوحة التحكم على `/admin/` (تكتب إلى `src/` مباشرة)، أو بتحرير الملفات:

| النوع | المكان |
|---|---|
| منتج | `src/data/products/sv/*.yaml` |
| فئة | `src/data/categories/*.yaml` |
| صفحة حل · دليل · مقارنة · مقال | `src/content/*/sv/*.mdx` |
| نصوص الواجهة | `src/i18n/ui.ts` |

منتج لا يظهر إلا بـ`verified: true` مع `asin` و`source_url` و`last_verified`.
صفحة لا تظهر إلا بـ`published: true`. `validate.mjs` يوقف البناء عند المخالفة.

## تعديل الهوية

عدّل المولّد لا الملف الناتج:

```bash
# غيّر brand/src/build_logo.py ثم
npm run brand:all
cp brand/logo/eldebosh-logo-header.svg public/brand/    # لاحظ: public/ لا site/
npm run build
```

## قبل فتح Pull Request

- [ ] `npm run verify` يمرّ كاملًا، و`site/` مُعاد بناؤه ومضمَّن في الـcommit.
- [ ] التوثيق محدَّث إن تغيّر سلوك.
- [ ] إن أُصلح عطل سلوكي: أُضيف كنترول في `tools/verify-site.mjs` يمنع عودته.
