"""Sätter text som SVG-banor ur den variabla Inter Tight-filen som redan
ligger i sajten. Ger bokstäverna som <path>, så logotypen fungerar överallt
(tryck, e-post, tredjepartsverktyg) utan att fonten behöver finnas."""
import os, tempfile
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
import uharfbuzz as hb

FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site', 'fonts')
_cache = {}

def _instance(family, weight):
    key = (family, weight)
    if key in _cache:
        return _cache[key]
    src = os.path.join(FONTS, f'{family}-latin-wght-normal.woff2')
    font = TTFont(src)
    font.flavor = None                       # woff2 -> ttf
    instantiateVariableFont(font, {'wght': weight}, inplace=True, updateFontNames=False)
    path = os.path.join(tempfile.gettempdir(), f'{family}-{weight}.ttf')
    font.save(path)
    blob = hb.Blob.from_file_path(path)
    face = hb.Face(blob)
    hbfont = hb.Font(face)
    _cache[key] = (font, hbfont, face.upem)
    return _cache[key]

def typeset(text, family='inter-tight', weight=800, size=100, tracking=0.0):
    """tracking anges i em (som CSS letter-spacing). Returnerar (path_d, bredd)."""
    font, hbfont, upem = _instance(family, weight)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {'kern': True, 'liga': True})

    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()
    scale = size / upem
    track = tracking * size

    d, x = [], 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(glyph_set, ntos=lambda v: f'{v:.2f}')
        # y speglas: fontens y pekar uppåt, SVG:s nedåt
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale,
                                           x + pos.x_offset * scale,
                                           -pos.y_offset * scale))
        glyph_set[name].draw(tpen)
        seg = pen.getCommands()
        if seg:
            d.append(seg)
        x += pos.x_advance * scale + track
    return ' '.join(d), x - track

def typeset_glyphs(text, family='inter-tight', weight=800, size=100, tracking=0.0):
    """Som typeset(), men en post per tecken: {ch, d, x, adv}.
    Behovs nar en bokstav ska bytas mot ritad grafik — ringen i stallet for O."""
    font, hbfont, upem = _instance(family, weight)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {'kern': True, 'liga': True})

    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()
    scale = size / upem
    track = tracking * size

    out, x = [], 0.0
    for ch, info, pos in zip(text, buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(glyph_set, ntos=lambda v: f'{v:.2f}')
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale,
                                           x + pos.x_offset * scale,
                                           -pos.y_offset * scale))
        glyph_set[name].draw(tpen)
        adv = pos.x_advance * scale
        out.append({'ch': ch, 'd': pen.getCommands(), 'x': x, 'adv': adv})
        x += adv + track
    return out, x - track

def metrics(family='inter-tight', weight=800, size=100):
    font, _, upem = _instance(family, weight)
    hhea = font['hhea']
    os2 = font['OS/2']
    return {
        'cap': os2.sCapHeight * size / upem,
        'ascender': hhea.ascender * size / upem,
        'descender': hhea.descender * size / upem,
    }

if __name__ == '__main__':
    d, w = typeset('ELDEBOSH', size=100, tracking=0.02)
    print('width', round(w, 2), 'metrics', {k: round(v, 2) for k, v in metrics().items()})
    print('path chars', len(d))
