# -*- coding: utf-8 -*-
"""Bygger HTML-dukar i exakt pixelstorlek för sociala medier och tryck.
Renderas till PNG/PDF av render.mjs."""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, 'svg')
FONTS = os.path.abspath(os.path.join(HERE, '..', 'site', 'fonts'))
OUT = os.path.join(HERE, 'canvas')
os.makedirs(OUT, exist_ok=True)

def logo(name, width=None, height=None):
    s = open(os.path.join(SVG, name), encoding='utf-8').read()
    s = s.split('\n', 1)[1] if s.startswith('<?xml') else s
    if width:
        s = s.replace('<svg ', f'<svg style="width:{width}px;height:auto" ', 1)
    if height:
        s = s.replace('<svg ', f'<svg style="height:{height}px;width:auto" ', 1)
    return s

BASE = f'''<style>
@font-face{{font-family:"Inter Tight";src:url("file://{FONTS}/inter-tight-latin-wght-normal.woff2") format("woff2-variations");font-weight:100 900}}
@font-face{{font-family:"Inter";src:url("file://{FONTS}/inter-latin-wght-normal.woff2") format("woff2-variations");font-weight:100 900}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{overflow:hidden}}
body{{font-family:"Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
.c{{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center}}
.navy{{background:linear-gradient(150deg,#17527F 0%,#0D2F4D 62%,#0A2740 100%);color:#fff}}
.light{{background:linear-gradient(150deg,#FFFFFF 0%,#E7F2FD 100%);color:#123F66}}
.glow{{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(85,198,242,.30),rgba(85,198,242,0) 68%);pointer-events:none}}
.grid-lines{{position:absolute;inset:0;opacity:.10;
  background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);
  background-size:64px 64px;mask-image:radial-gradient(ellipse at 70% 0%,#000,transparent 72%)}}
.eyebrow{{font-family:"Inter Tight";font-weight:640;text-transform:uppercase;color:#55C6F2}}
.claim{{font-family:"Inter Tight";font-weight:720;letter-spacing:-.03em;line-height:1.04}}
.sub{{color:rgba(255,255,255,.72);font-weight:450}}
.url{{font-family:"Inter Tight";font-weight:620;color:#55C6F2}}
.rule{{background:rgba(255,255,255,.22);border-radius:99px}}
.rule i{{display:block;height:100%;background:#55C6F2;border-radius:99px}}
</style>'''

def page(w, h, inner, cls='navy'):
    return (f'<!doctype html><meta charset="utf-8">{BASE}'
            f'<body><div class="c {cls}" style="width:{w}px;height:{h}px">{inner}</div></body>')

CANVAS = {}

# ---- profilbild / avatar (kvadrat, tål cirkelbeskärning) -------------------
def _avatar_E(size):
    """E:et centrerat i duken, med accenten kvar — samma geometri som brickan."""
    k = size / 120.0
    def u(v): return round(v * k, 2)
    ox, oy = (120 - 58) / 2 - 29, (120 - 62) / 2 - 29   # centrera E:ets 58x62-block
    def bar(x, y, w, h, fill):
        r = min(w, h) / 2
        return (f'<rect x="{u(x + ox)}" y="{u(y + oy)}" width="{u(w)}" height="{u(h)}" '
                f'rx="{u(r)}" fill="{fill}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 {size} {size}">'
            + bar(29, 29, 13, 62, '#F2F8FE') + bar(29, 29, 57, 13, '#F2F8FE')
            + bar(29, 53.5, 38, 13, '#55C6F2') + bar(29, 78, 48, 13, '#F2F8FE')
            + '</svg>')

CANVAS['avatar-1000.png'] = (1000, 1000, page(1000, 1000, f"""
  <div class="glow" style="width:1000px;height:1000px;left:-190px;top:-320px"></div>
  <div style="display:flex;align-items:center;justify-content:center;height:100%">
    <div style="width:470px;height:470px">{_avatar_E(470)}</div>
  </div>"""))

CANVAS['avatar-light-1000.png'] = (1000, 1000, page(1000, 1000, f"""
  <div style="display:flex;align-items:center;justify-content:center;height:100%">
    {logo('eldebosh-icon.svg', width=560)}
  </div>""", cls='light'))

# ---- Open Graph / delningsbild --------------------------------------------
CANVAS['og-default.png'] = (1200, 630, page(1200, 630, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:760px;height:760px;right:-190px;top:-250px"></div>
  <div style="padding:0 84px">
    {logo('eldebosh-logo-horizontal-inverse.svg', width=470)}
    <div class="claim" style="font-size:60px;margin-top:52px;max-width:15ch">Teknik som gör vardagen enklare</div>
    <div class="sub" style="font-size:25px;margin-top:22px;max-width:44ch">Börja med problemet, inte produktnamnet. Vi visar vad som faktiskt löser det.</div>
    <div style="display:flex;align-items:center;gap:20px;margin-top:46px">
      <div class="rule" style="width:120px;height:5px"><i style="width:42%"></i></div>
      <span class="url" style="font-size:25px">eldebosh.com</span>
    </div>
  </div>'''))

# ---- LinkedIn-omslag -------------------------------------------------------
CANVAS['linkedin-cover-1584x396.png'] = (1584, 396, page(1584, 396, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:620px;height:620px;right:60px;top:-230px"></div>
  <div style="padding:0 92px;display:flex;align-items:center;justify-content:space-between;height:100%">
    <div>{logo('eldebosh-logo-horizontal-inverse.svg', width=430)}
      <div class="sub" style="font-size:22px;margin-top:26px">Laddning, hållare och smarta tillbehör — testade i vardagen.</div>
    </div>
    <div style="text-align:right">
      <div class="eyebrow" style="font-size:15px;letter-spacing:.16em">Karlstad · Sverige</div>
      <div class="url" style="font-size:30px;margin-top:10px">eldebosh.com</div>
    </div>
  </div>'''))

# ---- X / Twitter-header ----------------------------------------------------
CANVAS['x-header-1500x500.png'] = (1500, 500, page(1500, 500, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:700px;height:700px;left:52%;top:-300px"></div>
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center">
    {logo('eldebosh-logo-horizontal-inverse.svg', width=520)}
    <div class="sub" style="font-size:24px;margin-top:34px;letter-spacing:.01em">Börja med problemet, inte produktnamnet.</div>
  </div>'''))

# ---- Facebook-omslag -------------------------------------------------------
CANVAS['facebook-cover-1640x624.png'] = (1640, 624, page(1640, 624, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:820px;height:820px;right:-160px;top:-280px"></div>
  <div style="padding:0 110px">
    {logo('eldebosh-logo-horizontal-inverse.svg', width=500)}
    <div class="claim" style="font-size:52px;margin-top:44px">Teknik som gör vardagen enklare</div>
    <div class="url" style="font-size:26px;margin-top:26px">eldebosh.com</div>
  </div>'''))

# ---- YouTube-banner (säker yta i mitten) -----------------------------------
CANVAS['youtube-banner-2560x1440.png'] = (2560, 1440, page(2560, 1440, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:1200px;height:1200px;left:50%;top:-420px;transform:translateX(-50%)"></div>
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center">
    {logo('eldebosh-logo-horizontal-inverse.svg', width=760)}
    <div class="sub" style="font-size:34px;margin-top:44px">Laddning · Hållare · Smarta tillbehör</div>
  </div>'''))

# ---- Instagram: inlägg -----------------------------------------------------
CANVAS['instagram-post-1080.png'] = (1080, 1080, page(1080, 1080, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:900px;height:900px;left:-220px;bottom:-380px"></div>
  <div style="padding:96px;height:100%;display:flex;flex-direction:column;justify-content:space-between">
    {logo('eldebosh-icon-mono-white.svg', width=112).replace('stroke-width','stroke-width')}
    <div>
      <div class="eyebrow" style="font-size:20px;letter-spacing:.18em">Bäst och smart</div>
      <div class="claim" style="font-size:88px;margin-top:24px">Teknik som gör vardagen enklare</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      {logo('eldebosh-wordmark-inverse.svg', width=300)}
      <span class="url" style="font-size:26px">eldebosh.com</span>
    </div>
  </div>'''))

# ---- Instagram: story ------------------------------------------------------
CANVAS['instagram-story-1080x1920.png'] = (1080, 1920, page(1080, 1920, f'''
  <div class="grid-lines"></div>
  <div class="glow" style="width:1000px;height:1000px;right:-300px;top:120px"></div>
  <div style="padding:180px 96px;height:100%;display:flex;flex-direction:column;justify-content:space-between;text-align:center;align-items:center">
    {logo('eldebosh-logo-stacked-inverse.svg', width=470)}
    <div>
      <div class="claim" style="font-size:82px">Börja med problemet, inte produktnamnet.</div>
      <div class="sub" style="font-size:30px;margin-top:34px">Vi visar vad som faktiskt löser det.</div>
    </div>
    <div class="url" style="font-size:32px">eldebosh.com</div>
  </div>'''))

# ---- Ljus variant för annonser --------------------------------------------
CANVAS['instagram-post-light-1080.png'] = (1080, 1080, page(1080, 1080, f'''
  <div style="padding:96px;height:100%;display:flex;flex-direction:column;justify-content:space-between">
    {logo('eldebosh-icon.svg', width=112)}
    <div>
      <div style="font-family:Inter Tight;font-weight:640;font-size:20px;letter-spacing:.18em;text-transform:uppercase;color:#1273D1">Bäst och smart</div>
      <div class="claim" style="font-size:88px;margin-top:24px;color:#123F66">Teknik som gör vardagen enklare</div>
      <div style="display:flex;align-items:center;gap:18px;margin-top:40px">
        <div style="width:150px;height:5px;border-radius:99px;background:#BCD2E3"><i style="display:block;width:42%;height:100%;border-radius:99px;background:#55C6F2"></i></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      {logo('eldebosh-wordmark.svg', width=300)}
      <span style="font-family:Inter Tight;font-weight:620;font-size:26px;color:#1273D1">eldebosh.com</span>
    </div>
  </div>''', cls='light'))

for name, (w, h, html) in CANVAS.items():
    open(os.path.join(OUT, name.replace('.png', '.html')), 'w', encoding='utf-8').write(html)

json.dump({k: [v[0], v[1]] for k, v in CANVAS.items()},
          open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print(f'{len(CANVAS)} dukar skrivna')
