# -*- coding: utf-8 -*-
"""Tryckfärdiga underlag: visitkort (med utfall), brevpapper A4 och ett
logotypark till tryckeriet. Renderas till PDF av print.mjs."""
import os
from assets import logo, FONTS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'build', 'canvas')
os.makedirs(OUT, exist_ok=True)

CSS = f'''<style>
@font-face{{font-family:"Inter Tight";src:url("file://{FONTS}/inter-tight-latin-wght-normal.woff2") format("woff2-variations");font-weight:100 900}}
@font-face{{font-family:"Inter";src:url("file://{FONTS}/inter-latin-wght-normal.woff2") format("woff2-variations");font-weight:100 900}}
*{{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font-family:"Inter",sans-serif;color:#123F66}}
@page{{margin:0}}
.page{{position:relative;overflow:hidden;page-break-after:always}}
.navy{{background:linear-gradient(150deg,#17527F,#0D2F4D 70%);color:#fff}}
.safe{{position:absolute;inset:6mm;border:.2mm dashed rgba(255,0,0,.35)}}
.mini{{font-size:2.4mm;letter-spacing:.02em;line-height:1.55}}
.acc{{color:#55C6F2}}
h1,h2,h3{{font-family:"Inter Tight";font-weight:700;letter-spacing:-.02em}}
</style>'''

# ---------------- visitkort 85x55 mm + 3 mm utfall = 91x61 mm --------------
CARD = f'''<!doctype html><meta charset="utf-8">{CSS}
<div class="page" style="width:91mm;height:61mm;background:#fff">
  <div style="position:absolute;left:3mm;top:3mm;width:85mm;height:55mm;padding:7mm 8mm;display:flex;flex-direction:column;justify-content:space-between">
    <div>{logo('eldebosh-logo-horizontal.svg', width=None).replace('<svg ', '<svg style="width:44mm;height:auto" ',1)}</div>
    <div>
      <div style="font-family:Inter Tight;font-weight:700;font-size:4.2mm">Hussam</div>
      <div class="mini" style="color:#66727F">Eldebosh</div>
      <div class="mini" style="margin-top:3mm">
        <span class="acc" style="color:#1273D1">eldebosh.com</span> · info@eldebosh.com<br>
        072-778 25 53 · Karlstad, Sverige
      </div>
    </div>
  </div>
</div>
<div class="page navy" style="width:91mm;height:61mm;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;width:70mm;height:70mm;border-radius:50%;right:-18mm;top:-26mm;background:radial-gradient(circle,rgba(85,198,242,.28),rgba(85,198,242,0) 70%)"></div>
  <div style="text-align:center">
    {logo('eldebosh-logo-stacked-inverse.svg').replace('<svg ', '<svg style="width:46mm;height:auto" ',1)}
  </div>
</div>'''

# ---------------- brevpapper A4 --------------------------------------------
LETTER = f'''<!doctype html><meta charset="utf-8">{CSS}
<div class="page" style="width:210mm;height:297mm;padding:18mm 20mm;display:flex;flex-direction:column">
  <header style="display:flex;align-items:flex-start;justify-content:space-between">
    {logo('eldebosh-logo-horizontal.svg').replace('<svg ', '<svg style="width:52mm;height:auto" ',1)}
    <div class="mini" style="text-align:right;color:#66727F">eldebosh.com<br>Karlstad, Sverige</div>
  </header>
  <div style="height:.6mm;background:#BCD2E3;border-radius:1mm;margin:8mm 0 0;position:relative">
    <i style="position:absolute;left:0;top:0;height:100%;width:22mm;background:#55C6F2;border-radius:1mm"></i>
  </div>
  <main style="flex:1;padding-top:12mm;color:#3F4C59;font-size:3.4mm;line-height:1.7;max-width:150mm">
    <h2 style="font-size:6mm;color:#123F66;margin-bottom:5mm">Rubrik</h2>
    <p>Brödtext. Marginalerna, linjen och logotypens storlek utgör mallen — byt bara ut texten.</p>
  </main>
  <footer class="mini" style="color:#66727F;border-top:.2mm solid #D7E3EE;padding-top:4mm;display:flex;justify-content:space-between">
    <span>Eldebosh</span><span>eldebosh.com</span><span>Sida 1</span>
  </footer>
</div>'''

# ---------------- logotypark till tryckeriet -------------------------------
def swatch(hexv, name, note, dark=False):
    return f'''<div style="border:.2mm solid #D7E3EE;border-radius:2mm;overflow:hidden">
      <div style="height:18mm;background:{hexv}"></div>
      <div style="padding:2.5mm 3mm">
        <div style="font-family:Inter Tight;font-weight:700;font-size:3mm">{name}</div>
        <div class="mini" style="color:#66727F">{hexv} · {note}</div>
      </div></div>'''

SHEET = f'''<!doctype html><meta charset="utf-8">{CSS}
<div class="page" style="width:210mm;height:297mm;padding:16mm 18mm">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.4mm solid #123F66;padding-bottom:4mm">
    <h1 style="font-size:8mm">Eldebosh — logotypark</h1>
    <span class="mini" style="color:#66727F">Vektor: SVG/PDF · Alla mått skalbara</span>
  </div>

  <h3 style="font-size:4mm;margin:8mm 0 3mm;letter-spacing:.1em;text-transform:uppercase;color:#66727F">Huvudlogotyp</h3>
  {logo('eldebosh-logo-horizontal.svg').replace('<svg ', '<svg style="width:110mm;height:auto" ',1)}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:8mm">
    <div style="background:#0D2F4D;border-radius:3mm;padding:7mm;display:flex;align-items:center">
      {logo('eldebosh-logo-horizontal-inverse.svg').replace('<svg ', '<svg style="width:100%;height:auto" ',1)}
    </div>
    <div style="border:.2mm solid #D7E3EE;border-radius:3mm;padding:7mm;display:flex;align-items:center">
      {logo('eldebosh-logo-mono-navy.svg').replace('<svg ', '<svg style="width:100%;height:auto" ',1)}
    </div>
  </div>

  <h3 style="font-size:4mm;margin:9mm 0 3mm;letter-spacing:.1em;text-transform:uppercase;color:#66727F">Stående · ikon · minsta storlek</h3>
  <div style="display:flex;align-items:flex-end;gap:12mm">
    {logo('eldebosh-logo-stacked.svg').replace('<svg ', '<svg style="width:52mm;height:auto" ',1)}
    {logo('eldebosh-icon.svg').replace('<svg ', '<svg style="width:24mm;height:auto" ',1)}
    <div>
      {logo('eldebosh-logo-horizontal.svg').replace('<svg ', '<svg style="width:28mm;height:auto" ',1)}
      <div class="mini" style="color:#66727F;margin-top:2mm">Minsta bredd i tryck: 28 mm<br>Ikon: 8 mm</div>
    </div>
  </div>

  <h3 style="font-size:4mm;margin:9mm 0 3mm;letter-spacing:.1em;text-transform:uppercase;color:#66727F">Färger</h3>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4mm">
    {swatch('#123F66','Marinblå','Huvudfärg · CMYK 92/68/33/17')}
    {swatch('#1273D1','Azur','Ordmärkets andra hälft · CMYK 82/48/0/0')}
    {swatch('#55C6F2','Himmelsblå','Accent · CMYK 60/6/0/0')}
    {swatch('#E7F2FD','Ljus botten','Bakgrund · CMYK 8/2/0/0')}
  </div>
  <p class="mini" style="color:#66727F;margin-top:4mm">
    CMYK-värdena är riktvärden för obestruket/bestruket papper — begär alltid ett provtryck.
    Frizon runt logotypen: minst höjden på ikonens mittstapel. Placera aldrig logotypen på en
    bakgrund med mindre än 4,5:1 kontrast.
  </p>
</div>'''

for name, html in [('business-card.html', CARD), ('letterhead-a4.html', LETTER), ('logo-sheet-a4.html', SHEET)]:
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(html)
print('tryckunderlag skrivna')
