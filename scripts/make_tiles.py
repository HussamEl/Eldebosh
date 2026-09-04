"""يخبز شكل بطاقة المنتج داخل الصورة نفسها.

الفكرة: المنتج يظهر كاملاً، والفراغ حوله يُملأ بضبابية من الصورة ذاتها
ممزوجة بلون الهوية، وحواف الصورة تتلاشى فيها فلا يظهر أي إطار.

    صورة واحدة:  python3 scripts/make_tiles.py <الصورة> P-21-1 [ASIN]
    دفعة كاملة:  python3 scripts/make_tiles.py            (من /tmp/src-orig)

في 2026-09-04 كتبتُ سكربتاً ثانياً للصور يقصّ من المركز — ولم أكن قد قرأت
هذا. فخرجت أربع بطاقات بمظهر لا يشبه العشرين الأخرى: قصٌّ حادّ بدل منتجٍ
كاملٍ في ضبابيةٍ ملوّنة. المشكلة لم تكن في الوصفة بل في وجود وصفتين.
فحُذف الثاني، وصار هذا يقبل ملفاً واحداً بالسطر أعلاه.
"""

from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import os
import re
import sys
import glob

SRC = "/tmp/src-orig"
OUT = "public/uploads"
MAX_KB = 300                    # السقف في docs/project/PHOTO_NAMING.md §4
SIZE = 720
BRAND_SOFT = (240, 247, 254)   # --brand-soft
BRAND_TINT = (211, 231, 250)   # --brand-tint

# نسبة عرض المنتج داخل المربع. الأصغر = فراغ أكثر حول المنتج.
FIT = 0.93
FEATHER = 54                    # نعومة تلاشي الحواف


def tile(path: str, code: str) -> None:
    im = Image.open(path)

    # الصور الشفافة تُركّب على خلفية الهوية أولاً
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        base = Image.new("RGBA", im.size, BRAND_SOFT + (255,))
        im = Image.alpha_composite(base, im).convert("RGB")
    else:
        im = im.convert("RGB")

    # ---------- الخلفية: نفس الصورة، مكبّرة ومموّهة وممزوجة بلون الهوية ----------
    r = max(SIZE / im.width, SIZE / im.height) * 1.45
    bg = im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
    bg = bg.crop((
        (bg.width - SIZE) // 2, (bg.height - SIZE) // 2,
        (bg.width - SIZE) // 2 + SIZE, (bg.height - SIZE) // 2 + SIZE,
    ))
    bg = bg.filter(ImageFilter.GaussianBlur(SIZE // 16))

    # مزج مع نغمة الهوية — يوحّد شكل البطاقات مهما اختلفت الخلفيات
    tintlayer = Image.new("RGB", (SIZE, SIZE), BRAND_TINT)
    bg = Image.blend(bg, tintlayer, 0.30)

    # تعتيم خفيف وتشبّع أعلى — يجعل المنتج يبرز بدل أن يغرق في ضباب أبيض
    bg = ImageEnhance.Brightness(bg).enhance(0.88)
    bg = ImageEnhance.Color(bg).enhance(1.15)

    # ---------- المنتج كاملاً ----------
    fit = int(SIZE * FIT)
    r2 = min(fit / im.width, fit / im.height)
    fg = im.resize((int(im.width * r2), int(im.height * r2)), Image.LANCZOS)
    ox, oy = (SIZE - fg.width) // 2, (SIZE - fg.height) // 2

    # قناع بحواف متلاشية — يذيب حافة الصورة في الضبابية فلا يظهر إطار
    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle(
        [ox + FEATHER // 2, oy + FEATHER // 2,
         ox + fg.width - FEATHER // 2, oy + fg.height - FEATHER // 2],
        radius=int(min(fg.width, fg.height) * 0.10),
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(FEATHER))

    layer = bg.copy()
    layer.paste(fg, (ox, oy))

    out = Image.composite(layer, bg, mask)

    # الجودة تنزل بالتدريج حتى يقع الملف تحت السقف
    target = os.path.join(OUT, code + ".webp")
    for q in (86, 78, 70, 62):
        out.save(target, quality=q, method=6)
        if os.path.getsize(target) <= MAX_KB * 1024:
            break
    kb = os.path.getsize(target) // 1024
    print("  %-24s ✓  %d KB" % (code, kb))
    return target


def check_name(code: str) -> None:
    if not re.fullmatch(r"P-\d{2}-[123]", code):
        sys.exit('\nاسم غير صالح "%s" — الصيغة P-NN-K حيث K واحد من 1 2 3\n' % code)


if __name__ == "__main__":
    args = sys.argv[1:]

    if args:
        # صورة واحدة: <الصورة> <الرمز> [ASIN]
        src, code = args[0], args[1] if len(args) > 1 else ""
        asin = args[2] if len(args) > 2 else ""
        if not code:
            sys.exit("\nالاستعمال:  python3 scripts/make_tiles.py <الصورة> P-21-1 [ASIN]\n")
        check_name(code)
        if asin:
            if not re.fullmatch(r"[A-Z0-9]{10}", asin):
                sys.exit('\nASIN غير صالح "%s" — عشر خانات، حروف كبيرة وأرقام\n' % asin)
            if not code.endswith("-1"):
                sys.exit('\n"%s" ليست الصورة الأولى — لاحقة ASIN للأولى وحدها\n' % code)
            # اسم واحد لا اثنان: الصورة الأولى لمنتج له رقم تحمل الرقم في اسمها
            code = code + "-" + asin
        print("")
        path = tile(src, code)
        print("""
الخطوة التالية:
  own_photos في ملف المنتج ← src: "%s" مع alt سويدي
  npm run assets   ثم   npm run verify
""" % path.replace("public", ""))
    else:
        files = sorted(glob.glob(os.path.join(SRC, "*")))
        print("\nخبز بطاقات المنتجات\n" + "-" * 32)
        for f in files:
            tile(f, os.path.splitext(os.path.basename(f))[0])
        print("-" * 32)
        print("%d بطاقة\n" % len(files))
