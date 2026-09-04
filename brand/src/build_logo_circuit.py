# -*- coding: utf-8 -*-
"""Bygger emblemvarianten: kretsspar, kabel, USB-C-kontakt och stromsymbol.

Motivet ar hamtat fran agarens skiss, men i projektets bla palett i stallet
for skissens grona. Bokstaverna kommer ur samma Inter Tight-fil som resten av
logotypfamiljen, sa vikt och kerning stammer med build_logo.py.

O:et i BOSH ar inte en bokstav har utan en ritad ring: kontakten ska kunna
plugga in i den, och en font-O gar inte att plugga in i. Ringen far samma
ytterdiameter och samma stapelbredd som fontens O, sa ordet lases likadant.
Alla mattenheter nedan ar i ordmarkets koordinater: baslinjen ar y = 0 och
versalerna gar upp till y = -78.
"""
import os
from typeset import typeset, typeset_glyphs, metrics

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logo')
os.makedirs(OUT, exist_ok=True)

CAP = 78.0
SIZE = CAP / (metrics()['cap'] / 100.0)
TRACK = 0.018
TAG_SIZE = 15.5
TAG_TRACK = 0.30

WORD = 'ELDEBOSH'
O_INDEX = 5                       # bokstaven som byts mot ringen

# Fontens O, matt en gang och skrivet hit: ytterbredd 74.4, hojd 80.1 med
# overskjutning, stapelbredd 18.8 (matt pa L:s stapel vid samma versalhojd).
O_LEFT, O_TOP, O_W, O_H = 3.5, -79.0, 74.4, 80.1
STEM = 18.8

PAD_X = 30.0
TOP = 90.0                        # luft ovanfor versalerna — kabeln bagar dar
BASE = TOP + CAP
TAG_DROP = 46.0

# ---------------------------------------------------------------- paletter
LIGHT = dict(
    name='', ink='#123F66', ink_2='#1273D1',
    wire='#123F66', wire_core='#1273D1', wire_hi='#55C6F2',
    trace='#55C6F2', halo='#123F66', disc='#0D2F4D', bolt='#55C6F2',
    word_end='#2FB2E6',
    metal_a='#F2F8FE', metal_b='#BCD2E3', slot='#123F66',
    tag='#66727F', rule='#BCD2E3',
)
DARK = dict(
    name='-inverse', ink='#FFFFFF', ink_2='#55C6F2',
    wire='#0D2F4D', wire_core='#1273D1', wire_hi='#55C6F2',
    trace='#55C6F2', halo='#0D2F4D', disc='#0D2F4D', bolt='#55C6F2',
    word_end='#55C6F2',        # platt pa morkt: en toning mot vitt aker ihop med ELDE
    metal_a='#F2F8FE', metal_b='#BCD2E3', slot='#0D2F4D',
    tag='rgba(255,255,255,.66)', rule='rgba(255,255,255,.28)',
)


def r2(v):
    return round(v, 2)


# ---------------------------------------------------------------- kretsspar
# Ett enda spar bar historien: det borjar nere till vanster, trappar upp at
# hoger i 45 grader och slutar i hylsan dar det blir rund kabel. De tva korta
# sparen ar avslutade med genomforingar — de gar ingenstans, precis som pa ett
# riktigt kort.
MAIN_TRACE = [(52, -16), (84, -16), (108, -40), (162, -40), (186, -64),
              (214, -64), (232, -96), (248, -96)]
SIDE_TRACES = [
    [(100, -14), (130, -14), (146, -30), (176, -30)],
    [(74, -52), (98, -52), (116, -72), (150, -72)],
]
VIAS = [(52, -16), (100, -14), (176, -30), (74, -52), (150, -72)]


def _polyline(points):
    d = [f'M {r2(points[0][0])} {r2(points[0][1])}']
    for x, y in points[1:]:
        d.append(f'L {r2(x)} {r2(y)}')
    return ' '.join(d)


def traces(p):
    """Varje spar ritas tva ganger: en mork gloria under, den ljusa karnan over.

    Utan glorian forsvinner sparet mot pappret; utan karnan forsvinner det mot
    bokstaverna. Tva lager loser bada halvorna med samma geometri.
    """
    out = []
    for line, w in [(MAIN_TRACE, 3.6)] + [(l, 3.0) for l in SIDE_TRACES]:
        d = _polyline(line)
        out.append(f'<path d="{d}" fill="none" stroke="{p["halo"]}" '
                   f'stroke-width="{r2(w + 2.4)}" stroke-linecap="round" stroke-linejoin="round"/>')
    for line, w in [(MAIN_TRACE, 3.6)] + [(l, 3.0) for l in SIDE_TRACES]:
        d = _polyline(line)
        out.append(f'<path d="{d}" fill="none" stroke="{p["trace"]}" '
                   f'stroke-width="{r2(w)}" stroke-linecap="round" stroke-linejoin="round"/>')
    for x, y in VIAS:
        out.append(f'<circle cx="{r2(x)}" cy="{r2(y)}" r="5.0" fill="{p["halo"]}"/>')
        out.append(f'<circle cx="{r2(x)}" cy="{r2(y)}" r="4.6" fill="none" '
                   f'stroke="{p["trace"]}" stroke-width="2.6"/>')
    return out


def ferrule(x, y, p, idp):
    """Hylsan dar det platta sparet blir rund kabel."""
    return [
        f'<rect x="{r2(x - 13)}" y="{r2(y - 9.5)}" width="26" height="19" rx="6" '
        f'fill="url(#metal{idp})" stroke="{p["ink"]}" stroke-opacity=".22" stroke-width="1"/>',
        f'<rect x="{r2(x - 5)}" y="{r2(y - 9.5)}" width="3.4" height="19" '
        f'fill="{p["ink"]}" opacity=".18"/>',
    ]


# ---------------------------------------------------------------- kontakten
def usb_c(cx, tip, p, idp):
    """USB-C sedd snett framifran pa vag ner i ringen.

    Den vagrata pillerformen ar hela poangen: utan den blir kontakten en stav
    som kan vara vad som helst. Darfor ar skalet brett och munnen stor nog att
    lasas aven nar market krymper till header-storlek.
    """
    sw, sh = 34.0, 34.0                 # skalets bredd och hojd
    top = tip - sh
    return [
        # kabelavlastning — den mjuka kragen dar kabeln gar in
        f'<rect x="{r2(cx - 12)}" y="{r2(top - 32)}" width="24" height="29" rx="9" '
        f'fill="{p["wire"]}"/>',
        f'<rect x="{r2(cx - 8)}" y="{r2(top - 27)}" width="16" height="3.4" rx="1.7" '
        f'fill="{p["wire_hi"]}" opacity=".5"/>',
        f'<rect x="{r2(cx - 8)}" y="{r2(top - 20)}" width="16" height="3.4" rx="1.7" '
        f'fill="{p["wire_hi"]}" opacity=".5"/>',
        f'<rect x="{r2(cx - 8)}" y="{r2(top - 13)}" width="16" height="3.4" rx="1.7" '
        f'fill="{p["wire_hi"]}" opacity=".5"/>',
        # flansen mellan krage och skal
        f'<rect x="{r2(cx - sw / 2 - 3)}" y="{r2(top - 7)}" width="{r2(sw + 6)}" height="10" '
        f'rx="5" fill="url(#metal{idp})" stroke="{p["ink"]}" stroke-opacity=".22" '
        f'stroke-width="1"/>',
        # skalet
        f'<rect x="{r2(cx - sw / 2)}" y="{r2(top)}" width="{r2(sw)}" height="{r2(sh)}" '
        f'rx="10" fill="url(#metal{idp})" stroke="{p["ink"]}" stroke-opacity=".28" '
        f'stroke-width="1.2"/>',
        # munnen — USB-C:s ovala oppning
        f'<rect x="{r2(cx - 11)}" y="{r2(top + 11)}" width="22" height="10" rx="5" '
        f'fill="{p["slot"]}"/>',
        f'<rect x="{r2(cx - 8)}" y="{r2(top + 14)}" width="16" height="3.6" rx="1.8" '
        f'fill="url(#metal{idp})" opacity=".55"/>',
        # dagerkant, sa skalet last som metall och inte som en platta
        f'<rect x="{r2(cx - sw / 2 + 3.2)}" y="{r2(top + 5)}" width="3.6" '
        f'height="{r2(sh - 12)}" rx="1.8" fill="#FFFFFF" opacity=".38"/>',
    ]


# ---------------------------------------------------------------- ringen
def power_ring(cx, cy, p, idp):
    rx_out = O_W / 2
    ry_out = O_H / 2
    rx_mid = rx_out - STEM / 2
    ry_mid = ry_out - STEM / 2
    rx_in = rx_out - STEM
    ry_in = ry_out - STEM

    # stromsymbolen: bruten cirkel med ett streck upp, som IEC 5009
    r = 10.6
    gap = 0.66                     # halva oppningen i radianer
    import math
    sx, sy = r * math.sin(gap), -r * math.cos(gap)
    bolt = (
        f'M {r2(sx)} {r2(sy)} A {r2(r)} {r2(r)} 0 1 1 {r2(-sx)} {r2(sy)}'
        f' M 0 {r2(-r - 4.6)} V -2.6'
    )
    return [
        f'<ellipse cx="{r2(cx)}" cy="{r2(cy)}" rx="{r2(rx_in)}" ry="{r2(ry_in)}" '
        f'fill="{p["disc"]}"/>',
        f'<ellipse cx="{r2(cx)}" cy="{r2(cy)}" rx="{r2(rx_in)}" ry="{r2(ry_in)}" '
        f'fill="url(#glow{idp})"/>',
        f'<ellipse cx="{r2(cx)}" cy="{r2(cy)}" rx="{r2(rx_mid)}" ry="{r2(ry_mid)}" '
        f'fill="none" stroke="{p["ink_2"]}" stroke-width="{r2(STEM)}"/>',
        f'<ellipse cx="{r2(cx)}" cy="{r2(cy)}" rx="{r2(rx_in - 2.6)}" ry="{r2(ry_in - 2.6)}" '
        f'fill="none" stroke="{p["bolt"]}" stroke-width="2" opacity=".5"/>',
        f'<path transform="translate({r2(cx)} {r2(cy)})" d="{bolt}" fill="none" '
        f'stroke="{p["bolt"]}" stroke-width="4.4" stroke-linecap="round"/>',
    ]


# ---------------------------------------------------------------- lockup
def defs(p, idp):
    return f'''<defs>
    <linearGradient id="metal{idp}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{p['metal_a']}"/><stop offset="1" stop-color="{p['metal_b']}"/>
    </linearGradient>
    <linearGradient id="word{idp}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{p['ink_2']}"/><stop offset="1" stop-color="{p['word_end']}"/>
    </linearGradient>
    <radialGradient id="glow{idp}" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="{p['bolt']}" stop-opacity=".38"/>
      <stop offset="1" stop-color="{p['bolt']}" stop-opacity="0"/>
    </radialGradient>
  </defs>'''


def tag_row(cx, y, width, p):
    d, w = typeset('BÄST OCH SMART', weight=620, size=TAG_SIZE, tracking=TAG_TRACK)
    gap = 15.0
    rule_w = max(0.0, (width - w) / 2 - gap)
    ry = y - TAG_SIZE * 0.36
    out = [f'<path transform="translate({r2(cx - w / 2)} {r2(y)})" fill="{p["tag"]}" d="{d}"/>']
    if rule_w > 8:
        lx = cx - width / 2
        out.append(f'<rect x="{r2(lx)}" y="{r2(ry)}" width="{r2(rule_w)}" height="2.5" '
                   f'rx="1.25" fill="{p["rule"]}"/>')
        out.append(f'<rect x="{r2(lx)}" y="{r2(ry)}" width="{r2(min(rule_w, 22))}" height="2.5" '
                   f'rx="1.25" fill="{p["bolt"]}"/>')
        out.append(f'<rect x="{r2(cx + width / 2 - rule_w)}" y="{r2(ry)}" width="{r2(rule_w)}" '
                   f'height="2.5" rx="1.25" fill="{p["rule"]}"/>')
    return out


def emblem(p, idp, tag=False, bg=None):
    glyphs, word_w = typeset_glyphs(WORD, size=SIZE, tracking=TRACK)
    o = glyphs[O_INDEX]
    ox = o['x'] + O_LEFT
    cx = ox + O_W / 2
    cy = O_TOP + O_H / 2

    left = ''.join(g['d'] for g in glyphs[:4])
    right = ''.join(g['d'] for g in glyphs[O_INDEX + 1:])
    b = glyphs[4]['d']

    body = []
    body += traces(p)

    # kabeln: ut ur hylsan, over BO, ner i kontakten
    hx, hy = MAIN_TRACE[-1][0], MAIN_TRACE[-1][1]
    plug_tip = cy - (O_H / 2 - STEM / 2)          # slutar mitt i ringens stapel
    cable_end = plug_tip - 34 - 26                # inne i kabelavlastningen
    cable = (f'M {r2(hx)} {r2(hy)} C {r2(hx + 62)} {r2(hy - 76)} '
             f'{r2(cx - 48)} {r2(cable_end - 30)} {r2(cx)} {r2(cable_end)}')
    body.append(f'<path d="{cable}" fill="none" stroke="{p["wire"]}" stroke-width="15" '
                f'stroke-linecap="round"/>')
    body.append(f'<path d="{cable}" fill="none" stroke="{p["wire_core"]}" stroke-width="8.5" '
                f'stroke-linecap="round"/>')
    body.append(f'<path d="{cable}" fill="none" stroke="{p["wire_hi"]}" stroke-width="2.6" '
                f'stroke-linecap="round" opacity=".7"/>')
    body += ferrule(hx, hy, p, idp)

    body.append(f'<path fill="{p["ink"]}" d="{left}"/>')
    body.append(f'<path fill="{p["ink_2"]}" d="{b}"/>')
    body.append(f'<path fill="url(#word{idp})" d="{right}"/>')

    body += power_ring(cx, cy, p, idp)
    body += usb_c(cx, plug_tip, p, idp)

    w = PAD_X * 2 + word_w
    h = BASE + (TAG_DROP + 20 if tag else 22)
    inner = f'<g transform="translate({r2(PAD_X)} {r2(BASE)})">\n    ' + '\n    '.join(body) + '\n  </g>'
    if tag:
        inner += '\n  ' + '\n  '.join(tag_row(w / 2, BASE + TAG_DROP, word_w, p))

    back = f'<rect width="{r2(w)}" height="{r2(h)}" fill="{bg}"/>\n  ' if bg else ''
    title = 'Eldebosh'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{r2(w)}" height="{r2(h)}" '
            f'viewBox="0 0 {r2(w)} {r2(h)}" role="img" aria-label="{title}">\n'
            f'  <title>{title}</title>\n  {defs(p, idp)}\n  {back}{inner}\n</svg>\n')


def write(name, text):
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('  ', name, len(text), 'tecken')


if __name__ == '__main__':
    print('Emblem — kretsspar, kabel, USB-C:')
    write('eldebosh-emblem.svg', emblem(LIGHT, 'e'))
    write('eldebosh-emblem-inverse.svg', emblem(DARK, 'ei'))
    write('eldebosh-emblem-tagline.svg', emblem(LIGHT, 'et', tag=True))
