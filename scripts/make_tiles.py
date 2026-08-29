"""يخبز شكل بطاقة المنتج داخل الصورة نفسها.

الفكرة: المنتج يظهر كاملاً، والفراغ حوله يُملأ بضبابية من الصورة ذاتها
ممزوجة بلون الهوية، وحواف الصورة تتلاشى فيها فلا يظهر أي إطار.

    python3 scripts/make_tiles.py
"""

from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import os
import glob

SRC = "/tmp/src-orig"
OUT = "public/uploads"
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

    out.save(os.path.join(OUT, code + ".webp"), quality=86, method=6)
    print("  %-8s ✓" % code)


if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(SRC, "*")))
    print("\nخبز بطاقات المنتجات\n" + "-" * 32)
    for f in files:
        tile(f, os.path.splitext(os.path.basename(f))[0])
    print("-" * 32)
    print("%d بطاقة\n" % len(files))
