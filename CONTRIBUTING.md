# المساهمة

## قبل أي تعديل

اقرأ [`docs/01-architecture.md`](docs/01-architecture.md). أهم سطر فيه:
**`site/` مخرجات بناء** — أي تعديل هنا مؤقت حتى يُنقل إلى مصدر Astro.

## دورة العمل

```bash
git switch -c fix/وصف-قصير
# عدّل
npm run verify                 # يجب أن تمرّ 22/22 قبل أي commit
git commit
```

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
2. **أي تعديل على CSS يغيّر اسم الملف** — الكاش سنة كاملة `immutable`،
   وإلا لن يصل التحديث للزوّار الحاليين. حدّث وسم `<link>` في كل الصفحات.
3. **لا تضع عنصرًا `position:fixed` داخل `.tile`** — البطاقة تأخذ `transform`
   عند المرور فتقصّه. السبب كاملًا في [`docs/03-fixes-log.md`](docs/03-fixes-log.md) بند 2.
4. **لا تعطّل فحصًا لتمرير الاختبار.** إن كشف الفحص عطلًا فهو يقوم بعمله.
5. **كل تأثير مرور داخل `@media(hover:hover)`** حتى لا يعلق على شاشات اللمس.
6. **الموقع يعمل بدون جافاسكربت** — لا تكسر ارتداد `:target` في عارض الصور.

## تعديل الهوية

عدّل المولّد لا الملف الناتج:

```bash
# غيّر brand/src/build_logo.py ثم
npm run brand:all
# وانسخ إلى الموقع — الأوامر في docs/05-deployment.md
```

## قبل فتح Pull Request

- [ ] `npm run verify` يمرّ 22/22.
- [ ] التوثيق محدَّث إن تغيّر سلوك.
- [ ] إن كان الإصلاح في `site/`: أُضيف إلى [`docs/03-fixes-log.md`](docs/03-fixes-log.md)
      بصيغته الأصلية ليُنقل إلى مصدر Astro.
