# فهرس الأصول — الرموز المرجعية

> **بدل إرسال صورة، اكتب رمزها.**
> مثال: «عدّل بطاقة `P-03`» أو «الشعار `B-02` صغير جداً».
> الصور موجودة في المستودع، وتُقرأ من مسارها بلا رفع ولا استهلاك.

> يُولَّد آلياً بـ `npm run assets` · آخر تحديث: 2026-09-03

---

## P — صور المنتجات

**التسمية:** `P-NN-K` — رقم المنتج ثم رقم الصورة. **من صورة إلى ثلاث لكل منتج.**

| الرمز | المنتج | الملف | الصورة | الحجم |
|---|---|---|---|---|
| `P-01-1` | Anker MagGo Powerbank 10000 mAh | `P-01-1-B0CFDPQXN4.webp` | 1 من 3 | 9 KB |
| `P-01-2` | Anker MagGo Powerbank 10000 mAh | `P-01-2.webp` | 2 من 3 | 8 KB |
| `P-01-3` | Anker MagGo Powerbank 10000 mAh | `P-01-3.webp` | 3 من 3 | 18 KB |
| `P-02-1` | INIU Magnetisk Powerbank 10000 mAh | `P-02-1-B0DMT6FMT7.webp` | 1 من 2 | 15 KB |
| `P-02-2` | INIU Magnetisk Powerbank 10000 mAh | `P-02-2.webp` | 2 من 2 | 18 KB |
| `P-03-1` | UGREEN Nexode Powerbank 25000 mAh 165 W | `P-03-1-B0DSPX4RQ5.webp` | 1 من 2 | 8 KB |
| `P-03-2` | UGREEN Nexode Powerbank 25000 mAh 165 W | `P-03-2.webp` | 2 من 2 | 20 KB |
| `P-04-1` | UGREEN Zapix Magnetisk Powerbank 10000 mAh | `P-04-1-B0CH33F5P2.webp` | 1 من 2 | 6 KB |
| `P-04-2` | UGREEN Zapix Magnetisk Powerbank 10000 mAh | `P-04-2.webp` | 2 من 2 | 46 KB |
| `P-05` | Baseus MagPro magnetisk bilhållare | — | **بلا صورة** | — |
| `P-06` | Cooper MagStand höjdjusterbart stativ | — | **بلا صورة** | — |
| `P-07-1` | Vikbart magnetiskt mobilstativ | `P-07-1.webp` | 1 من 1 | 29 KB |
| `P-08` | simarro självhäftande magnetringar, 10-pack | — | **بلا صورة** | — |
| `P-09` | UGREEN MagFlow 2-i-1 magnetiskt laddställ | — | **بلا صورة** | — |
| `P-10` | UGREEN MagSafe magnetställ för bord | — | **بلا صورة** | — |
| `P-11-1` | Anker 735 Nano II 65W | `P-11-1-B09LLRNGSD.webp` | 1 من 1 | 39 KB |
| `P-12` | Anker Nano Reseadapter | — | **بلا صورة** | — |
| `P-13` | Baseus USB-C-kabel med digital skärm 100W | — | **بلا صورة** | — |
| `P-14-1` | EasyAcc bordsfläkt 4000 mAh | `P-14-1.webp` | 1 من 1 | 26 KB |
| `P-15` | GIANAC USB-C till USB-C 100W, 3 m | — | **بلا صورة** | — |
| `P-18-1` | HUAWEI öppna hörlurar (ljusblå) | `P-18-1.webp` | 1 من 2 | 28 KB |
| `P-18-2` | HUAWEI öppna hörlurar (ljusblå) | `P-18-2.webp` | 2 من 2 | 59 KB |
| `P-16` | LENCENT Reseadapter Sverige till Storbritannien | — | **بلا صورة** | — |
| `P-17` | Ocetea USB-C till USB-C 100W, 30 cm | — | **بلا صورة** | — |
| `P-19-1` | UGREEN snabbladdare USB-C | `P-19-1.webp` | 1 من 1 | 34 KB |
| `P-20-1` | UGREEN USB-C 240W / 40 Gbps, 1 m | `P-20-1.webp` | 1 من 1 | 45 KB |

## B — أصول الهوية

| الرمز | العنصر | المسار | الحجم |
|---|---|---|---|
| `B-01` | favicon.svg | `/favicon.svg` | 1 KB |
| `B-02` | logo.svg | `/logo.svg` | 10 KB |
| `B-03` | og-default.png | `/og-default.png` | 76 KB |
| `B-04` | qr-card.png | `/qr-card.png` | 187 KB |
| `B-05` | qr-eldebosh.png | `/qr-eldebosh.png` | 10 KB |

## S — لقطات الشاشة

المكان المخصص للقطات التي يرسلها صاحب المشروع.

**القاعدة:** كل لقطة تُحفظ في `assets/screens/` باسم رمزها، وتُضاف هنا بسطر واحد.

| الرمز | ما تُظهره | التاريخ | الحالة |
|---|---|---|---|
| — | لا يوجد بعد | — | — |

---

## كيف يعمل هذا

**١.** ترسل الحزمة مرة واحدة في بداية المحادثة.

**٢.** بعدها تكتب الرمز بدل إرفاق الصورة:

```
P-03-1 الصورة مائلة قليلاً
P-07 أضفت له صورتين
B-02 الشعار صغير على الجوال
```

**٣.** تُقرأ الصورة من مسارها في المستودع.

## للقطات الجديدة

إن أردت إرسال لقطة شاشة جديدة:

**احفظها في** `assets/screens/S-01.png` **وأضف سطراً في جدول `S`** ثم أرسل الحزمة.

أو أرسلها مباشرة في المحادثة — **مرة واحدة فقط** — واطلب حفظها بالرمز.
