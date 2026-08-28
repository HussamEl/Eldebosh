# النشر

## الرفع

الموقع ملفات ثابتة — لا Node ولا قاعدة بيانات على الخادم.

1. انسخ **محتويات** `site/` (لا المجلد نفسه) إلى جذر النطاق (`public_html/`).
2. تأكد أن `.htaccess` رُفع — الملفات التي تبدأ بنقطة تُخفى في كثير من عملاء FTP.
3. لا ترفع `site/README.md` إن أردت جذرًا نظيفًا (وجودها غير ضار).

```bash
rsync -av --delete site/ user@host:~/public_html/
```

`--delete` يحذف ما لم يعد موجودًا — استخدمه فقط إذا كان الجذر مخصصًا لهذا الموقع.

## ما يفعله `.htaccess`

| القاعدة | الأثر |
|---|---|
| `DirectoryIndex index.html` | يقدّم `index.html` من كل مجلد |
| `ErrorDocument 404 /sv/` | صفحات مفقودة تعود للرئيسية السويدية |
| `mod_deflate` | ضغط HTML و CSS و JS و SVG |
| CSS/JS/woff2 | كاش سنة كاملة `immutable` — **لذلك أي تعديل يجب أن يغيّر اسم الملف** |
| الصور | كاش 30 يومًا |
| HTML | `max-age=0, must-revalidate` — التحديثات تظهر فورًا |
| `X-Content-Type-Options`, `Referrer-Policy` | رؤوس أمان أساسية |
| `Options -Indexes` | يمنع تصفّح المجلدات |

الموقع لا يعتمد على WordPress — إن وُجد `.htaccess` قديم يحوّل كل الطلبات إلى
`index.php` فسيعطّل الموقع. استبدله بالكامل.

## قائمة فحص بعد النشر

```bash
npm run verify          # 22 كنترول محليًا قبل الرفع
```

ثم على النطاق الحقيقي:

- [ ] `https://eldebosh.com/sv/` تفتح، والشعار يظهر في الترويسة.
- [ ] النقر على صورة منتج يفتح النافذة في منتصف الشاشة، وEscape يغلقها.
- [ ] `https://eldebosh.com/favicon.svg` و`/og-default.png` يفتحان مباشرة.
- [ ] صورة المشاركة صحيحة في أداة معاينة فيسبوك أو LinkedIn.
- [ ] `https://eldebosh.com/sv/sok/` تعطي نتائج بحث (Pagefind يعمل).
- [ ] `https://eldebosh.com/` تحوّل إلى `/sv/`.
- [ ] بعد تغيير CSS: تأكد أن اسم الملف تغيّر، وإلا فالزوّار القدامى لن يروا التحديث.

## متى تُعاد أصول الهوية

عند تعديل الشعار: أعد التوليد ثم انسخ إلى الموقع.

```bash
npm run brand:all
cp brand/logo/eldebosh-logo-header.svg site/brand/
cp brand/logo/favicon.svg site/favicon.svg
cp brand/social/og-default.png site/og-default.png
cp brand/icons/eldebosh-icon-180.png site/apple-touch-icon.png
```
