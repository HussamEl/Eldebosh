# -*- coding: utf-8 -*-
"""Bygger hela Eldeboshs logotypfamilj som ren SVG.
Bokstäverna är banor (inga <text>), så filerna ser likadana ut överallt."""
import os
from typeset import typeset, metrics

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'svg')
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- palett
BLUE = dict(
    name='blue',
    ink='#123F66',        # navy — huvudfärg
    ink_2='#1273D1',      # azurblå — "BOSH"
    accent='#55C6F2',     # himmelsblå — laddningsaccent
    accent_2='#2FB2E6',
    badge_a='#17527F', badge_b='#0D2F4D',
    muted='#66727F',
    rule='#BCD2E3',
)
GREEN = dict(                     # alternativ, från den uppladdade skissen
    name='green',
    ink='#1E4620', ink_2='#4E8C2B', accent='#8CC63F', accent_2='#6FA82F',
    badge_a='#255C2A', badge_b='#123018', muted='#5C6B58', rule='#C3D9AE',
)

CAP = 78.0                        # versalhöjd för ordmärket
SIZE = CAP / (metrics()['cap'] / 100.0)
TRACK = 0.018
TAG_SIZE = 15.5
TAG_TRACK = 0.30

# ---------------------------------------------------------------- delar
def badge(x, y, s, p, flat=None, idp='', sheen=True):
    """Kvadratisk bricka med ett 'E' byggt av rundade staplar.
    Mittarmen är laddningsaccenten — samma motiv som sajtens .charge."""
    k = s / 120.0
    def u(v):
        return round(v * k, 2)
    bar_fill = flat or '#F2F8FE'
    mid_fill = flat or f'url(#acc{idp})'
    out = []
    if flat:
        out.append(f'<rect x="{x + u(3.5)}" y="{y + u(3.5)}" width="{s - u(7)}" height="{s - u(7)}" '
                   f'rx="{u(30)}" fill="none" stroke="{flat}" stroke-width="{u(7)}"/>')
    else:
        out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="{u(33)}" fill="url(#badge{idp})"/>')
        if sheen:
            out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="{u(33)}" fill="url(#sheen{idp})"/>')
        out.append(f'<rect x="{x + u(1.25)}" y="{y + u(1.25)}" width="{s - u(2.5)}" height="{s - u(2.5)}" '
                   f'rx="{u(31.8)}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="{u(2.5)}"/>')
    def bar(bx, by, bw, bh, fill):
        # rx = halva kortsidan; annars klipper SVG hörnen till ellipser
        r = min(bw, bh) / 2
        return (f'<rect x="{x + u(bx)}" y="{y + u(by)}" width="{u(bw)}" height="{u(bh)}" '
                f'rx="{u(r)}" fill="{fill}"/>')
    out.append(bar(29, 29, 13, 62, bar_fill))          # ryggen
    out.append(bar(29, 29, 57, 13, bar_fill))          # övre arm
    out.append(bar(29, 53.5, 38, 13, mid_fill))        # mittarm = laddningen
    out.append(bar(29, 78, 48, 13, bar_fill))          # nedre arm
    return '\n  '.join(out)

def wordmark(x, baseline, p, mono=None, scale=1.0):
    """ELDE + BOSH, tvåfärgat som i sajtens header."""
    d1, w1 = typeset('ELDE', size=SIZE * scale, tracking=TRACK)
    d2, w2 = typeset('BOSH', size=SIZE * scale, tracking=TRACK)
    gap = SIZE * scale * TRACK
    parts = [
        f'<path transform="translate({round(x,2)} {round(baseline,2)})" fill="{mono or p["ink"]}" d="{d1}"/>',
        f'<path transform="translate({round(x + w1 + gap,2)} {round(baseline,2)})" fill="{mono or p["ink_2"]}" d="{d2}"/>',
    ]
    return '\n  '.join(parts), w1 + gap + w2

def tagline(x, baseline, p, mono=None, scale=1.0, anchor='start'):
    d, w = typeset('BÄST OCH SMART', family='inter-tight', weight=620,
                   size=TAG_SIZE * scale, tracking=TAG_TRACK)
    if anchor == 'middle':
        x -= w / 2
    return (f'<path transform="translate({round(x,2)} {round(baseline,2)})" '
            f'fill="{mono or p["muted"]}" d="{d}"/>'), w

def chargebar(x, y, w, p, mono=None, scale=1.0):
    h = 4 * scale
    fill_track = mono or p['rule']
    fill_on = mono or p['accent']
    op = ' opacity=".45"' if mono else ''
    return (f'<rect x="{round(x,2)}" y="{round(y,2)}" width="{round(w,2)}" height="{h}" '
            f'rx="{h/2}" fill="{fill_track}"{op}/>\n  '
            f'<rect x="{round(x,2)}" y="{round(y,2)}" width="{round(w*.42,2)}" height="{h}" '
            f'rx="{h/2}" fill="{fill_on}"/>')

def defs(p, idp=''):
    return f'''<defs>
    <linearGradient id="badge{idp}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{p['badge_a']}"/><stop offset="1" stop-color="{p['badge_b']}"/>
    </linearGradient>
    <linearGradient id="acc{idp}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{p['accent']}"/><stop offset="1" stop-color="{p['accent_2']}"/>
    </linearGradient>
    <linearGradient id="sheen{idp}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".13"/>
      <stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>'''

def svg(w, h, body, title, bg=None, extra=''):
    back = f'<rect width="{w}" height="{h}" fill="{bg}"/>\n  ' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}" role="img" aria-label="{title}">\n'
            f'  <title>{title}</title>\n  {extra}{back}{body}\n</svg>\n')

# ---------------------------------------------------------------- lockups
def _tag_row(cx, y, width, p, mono, on_dark, scale=1.0):
    """— BÄST OCH SMART — centrerad, med linjer som fyller ut till given bredd."""
    tag_d, tag_w = typeset('BÄST OCH SMART', weight=620,
                           size=TAG_SIZE * scale, tracking=TAG_TRACK)
    tag_col = mono or ('rgba(255,255,255,.66)' if on_dark else p['muted'])
    rule_col = mono or ('rgba(255,255,255,.28)' if on_dark else p['rule'])
    rule_op = ' opacity=".5"' if mono else ''
    acc_col = mono or (p['accent'] if on_dark else p['accent'])
    gap = 15 * scale
    rule_w = max(0.0, (width - tag_w) / 2 - gap)
    h = 2.5 * scale
    ry = y - TAG_SIZE * scale * 0.36
    out = [f'<path transform="translate({round(cx - tag_w/2,2)} {round(y,2)})" fill="{tag_col}" d="{tag_d}"/>']
    if rule_w > 8 * scale:
        lx = cx - width / 2
        out.append(f'<rect x="{round(lx,2)}" y="{round(ry,2)}" width="{round(rule_w,2)}" '
                   f'height="{h}" rx="{h/2}" fill="{rule_col}"{rule_op}/>')
        out.append(f'<rect x="{round(lx,2)}" y="{round(ry,2)}" width="{round(min(rule_w, 22*scale),2)}" '
                   f'height="{h}" rx="{h/2}" fill="{acc_col}"/>')
        out.append(f'<rect x="{round(cx + width/2 - rule_w,2)}" y="{round(ry,2)}" '
                   f'width="{round(rule_w,2)}" height="{h}" rx="{h/2}" fill="{rule_col}"{rule_op}/>')
    return '\n  '.join(out), tag_w

def _words(p, mono, on_dark, scale=1.0):
    d1, w1 = typeset('ELDE', size=SIZE * scale, tracking=TRACK)
    d2, w2 = typeset('BOSH', size=SIZE * scale, tracking=TRACK)
    g = SIZE * scale * TRACK
    ink = mono or ('#FFFFFF' if on_dark else p['ink'])
    ink2 = mono or (p['accent'] if on_dark else p['ink_2'])
    return (d1, w1, d2, w2, g, ink, ink2)

def horizontal(p, mono=None, bg=None, on_dark=False, idp=''):
    """[bricka]  ELDEBOSH / — BÄST OCH SMART —"""
    pad, bs, gap = 26.0, 112.0, 42.0
    tx = pad + bs + gap
    d1, w1, d2, w2, g, ink, ink2 = _words(p, mono, on_dark)
    ww = w1 + g + w2
    baseline = pad + 20 + CAP
    tag_baseline = baseline + 40
    h = max(pad * 2 + bs, tag_baseline + 10 + pad)
    by = (h - bs) / 2
    w = tx + ww + pad
    badge_fill = mono or ('#FFFFFF' if on_dark else None)
    tag_svg, _ = _tag_row(tx + ww / 2, tag_baseline, ww, p, mono, on_dark)
    body = [
        badge(pad, by, bs, p, flat=badge_fill, idp=idp),
        f'<path transform="translate({round(tx,2)} {round(baseline,2)})" fill="{ink}" d="{d1}"/>',
        f'<path transform="translate({round(tx + w1 + g,2)} {round(baseline,2)})" fill="{ink2}" d="{d2}"/>',
        tag_svg,
    ]
    return svg(round(w), round(h), '\n  '.join(body), 'Eldebosh — Bäst och smart',
               bg=bg, extra=('' if mono else defs(p, idp) + '\n  '))

def wordmark_only(p, mono=None, bg=None, on_dark=False, idp=''):
    pad = 20.0
    d1, w1, d2, w2, g, ink, ink2 = _words(p, mono, on_dark)
    ww = w1 + g + w2
    baseline = pad + CAP
    tag_baseline = baseline + 38
    w, h = ww + pad * 2, tag_baseline + 10 + pad
    tag_svg, _ = _tag_row(pad + ww / 2, tag_baseline, ww, p, mono, on_dark)
    body = [
        f'<path transform="translate({round(pad,2)} {round(baseline,2)})" fill="{ink}" d="{d1}"/>',
        f'<path transform="translate({round(pad + w1 + g,2)} {round(baseline,2)})" fill="{ink2}" d="{d2}"/>',
        tag_svg,
    ]
    return svg(round(w), round(h), '\n  '.join(body), 'Eldebosh — Bäst och smart', bg=bg)

def stacked(p, mono=None, bg=None, on_dark=False, idp=''):
    pad, bs = 30.0, 138.0
    d1, w1, d2, w2, g, ink, ink2 = _words(p, mono, on_dark)
    ww = w1 + g + w2
    w = ww + pad * 2
    cx = w / 2
    by = pad
    baseline = by + bs + 46 + CAP
    tag_baseline = baseline + 40
    h = tag_baseline + 10 + pad
    badge_fill = mono or ('#FFFFFF' if on_dark else None)
    tag_svg, _ = _tag_row(cx, tag_baseline, ww, p, mono, on_dark)
    body = [
        badge(cx - bs / 2, by, bs, p, flat=badge_fill, idp=idp),
        f'<path transform="translate({round(cx - ww/2,2)} {round(baseline,2)})" fill="{ink}" d="{d1}"/>',
        f'<path transform="translate({round(cx - ww/2 + w1 + g,2)} {round(baseline,2)})" fill="{ink2}" d="{d2}"/>',
        tag_svg,
    ]
    return svg(round(w), round(h), '\n  '.join(body), 'Eldebosh — Bäst och smart',
               bg=bg, extra=('' if mono else defs(p, idp) + '\n  '))

def icon(p, size=512, mono=None, idp='', sheen=True):
    body = badge(0, 0, size, p, flat=mono, idp=idp, sheen=sheen)
    return svg(size, size, body, 'Eldebosh', extra=('' if mono else defs(p, idp) + '\n  '))

# ---------------------------------------------------------------- filer
files = {
    'eldebosh-logo-horizontal.svg':        horizontal(BLUE, idp='h'),
    'eldebosh-logo-horizontal-inverse.svg': horizontal(BLUE, on_dark=True, idp='hi'),
    'eldebosh-logo-stacked.svg':           stacked(BLUE, idp='s'),
    'eldebosh-logo-stacked-inverse.svg':   stacked(BLUE, on_dark=True, idp='si'),
    'eldebosh-logo-mono-navy.svg':         horizontal(BLUE, mono='#123F66'),
    'eldebosh-logo-mono-white.svg':        horizontal(BLUE, mono='#FFFFFF'),
    'eldebosh-logo-mono-black.svg':        horizontal(BLUE, mono='#000000'),
    'eldebosh-logo-green-alt.svg':         horizontal(GREEN, idp='g'),
    'eldebosh-icon.svg':                   icon(BLUE, 512, idp='i'),
    'eldebosh-icon-mono-white.svg':        icon(BLUE, 512, mono='#FFFFFF'),
    'eldebosh-icon-mono-navy.svg':         icon(BLUE, 512, mono='#123F66'),
    'eldebosh-wordmark.svg':               wordmark_only(BLUE),
    'eldebosh-wordmark-inverse.svg':       wordmark_only(BLUE, on_dark=True),
}
for name, data in files.items():
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(data)
    print(f'{name:42} {len(data):6} B')

# ---------------------------------------------------------------- header
def compact(p, on_dark=True, idp='c', mono=None):
    """Kompakt variant utan tagline — för sajtens header och små ytor."""
    bs = 108.0
    gap = 30.0
    d1, w1, d2, w2, g, ink, ink2 = _words(p, mono, on_dark)
    ww = w1 + g + w2
    h = bs
    by = 0.0
    baseline = (h + CAP) / 2 - 1
    badge_fill = mono or ('#FFFFFF' if on_dark else None)
    body = [
        badge(0, by, bs, p, flat=badge_fill, idp=idp),
        f'<path transform="translate({round(bs + gap,2)} {round(baseline,2)})" fill="{ink}" d="{d1}"/>',
        f'<path transform="translate({round(bs + gap + w1 + g,2)} {round(baseline,2)})" fill="{ink2}" d="{d2}"/>',
    ]
    return svg(round(bs + gap + ww), round(h), '\n  '.join(body), 'Eldebosh',
               extra=('' if mono else defs(p, idp) + '\n  '))

for n, data in {
    'eldebosh-logo-header.svg': compact(BLUE, on_dark=True, idp='c'),
    'eldebosh-logo-compact.svg': compact(BLUE, on_dark=False, idp='cl'),
}.items():
    open(os.path.join(OUT, n), 'w', encoding='utf-8').write(data)
    print(f'{n:42} {len(data):6} B')
