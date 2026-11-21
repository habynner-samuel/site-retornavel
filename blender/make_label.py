# Gera a textura do rótulo envolvente (360°) do casco PET 2L.
# 10 px por mm: faixa de 76 mm de altura e 302 mm de circunferência.
import sys
from PIL import Image, ImageDraw, ImageFont

out, script_font, bold_font = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 3020, 760
RED = (228, 0, 26)
YEL = (255, 196, 0)
WHITE = (255, 255, 255)

im = Image.new('RGB', (W, H), RED)
d = ImageDraw.Draw(im)

def centered(text, font, cx, cy, fill, spacing=0):
    if spacing:
        widths = [d.textlength(c, font=font) for c in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = cx - total / 2
        for c, w in zip(text, widths):
            d.text((x, cy), c, font=font, fill=fill, anchor='lm')
            x += w + spacing
    else:
        d.text((cx, cy), text, font=font, fill=fill, anchor='mm')

f_logo = ImageFont.truetype(script_font, 300)
f_top = ImageFont.truetype(bold_font, 62)
f_sub = ImageFont.truetype(bold_font, 44)
f_small = ImageFont.truetype(bold_font, 30)

# Painel da frente (u = 0.5) e de trás (u = 0.0/1.0): faixa preta fina no topo, como no rótulo real
for cx in (W * 0.5,):
    centered('RETORNÁVEL', f_top, cx, 112, YEL, spacing=10)
    centered('SABOR ORIGINAL', f_sub, cx, 190, WHITE, spacing=6)
    centered('Coca-Cola', ImageFont.truetype(script_font, 360), cx, 420, WHITE)
    # fita branca sob o logo
    import math as _m
    pts_top = [(cx - 700 + i * 14, 610 - 46 * _m.sin((i * 14) / 1400 * _m.pi)) for i in range(101)]
    pts_bot = [(x, y + 16 + 10 * _m.sin((x - cx + 700) / 1400 * _m.pi)) for x, y in pts_top]
    d.polygon(pts_top + pts_bot[::-1], fill=WHITE)
    # selo redondo amarelo à esquerda do logo
    r = 52
    bx, by = cx - 560, 300
    d.ellipse((bx - r, by - r, bx + r, by + r), fill=YEL)
    centered('RET', f_small, bx, by, RED)

# Lateral: informações (lado direito e verso)
side = W * 0.82
centered('2L', ImageFont.truetype(bold_font, 90), side, 200, WHITE)
for i, line in enumerate(['DEVOLVA O CASCO', 'E PAGUE SÓ O LÍQUIDO', 'ESCANEIE O QR', 'retornavel-chat.vercel.app']):
    centered(line, f_small, side, 330 + i * 52, WHITE)

back = W * 0.08
centered('Coca-Cola', ImageFont.truetype(script_font, 170), back + 120, 300, WHITE)
centered('RETORNÁVEL', f_sub, back + 120, 470, YEL, spacing=6)

# QR ilustrativo no verso esquerdo
qx, qy, s = 560, 250, 260
d.rectangle((qx, qy, qx + s, qy + s), fill=WHITE)
import random
random.seed(7)
cell = s // 26
for yy in range(1, 25):
    for xx in range(1, 25):
        if (xx < 8 and yy < 8) or (xx > 16 and yy < 8) or (xx < 8 and yy > 16):
            continue
        if random.random() < 0.5:
            d.rectangle((qx + xx * cell, qy + yy * cell, qx + (xx + 1) * cell, qy + (yy + 1) * cell), fill=(20, 20, 20))
for fx, fy in ((1, 1), (17, 1), (1, 17)):
    d.rectangle((qx + fx * cell, qy + fy * cell, qx + (fx + 7) * cell, qy + (fy + 7) * cell), fill=(20, 20, 20))
    d.rectangle((qx + (fx + 1) * cell, qy + (fy + 1) * cell, qx + (fx + 6) * cell, qy + (fy + 6) * cell), fill=WHITE)
    d.rectangle((qx + (fx + 2) * cell, qy + (fy + 2) * cell, qx + (fx + 5) * cell, qy + (fy + 5) * cell), fill=(20, 20, 20))

# filetes finos no topo e na base do rótulo
d.rectangle((0, 0, W, 10), fill=(150, 0, 15))
d.rectangle((0, H - 10, W, H), fill=(150, 0, 15))
im.save(out)
print('label ok', im.size)
