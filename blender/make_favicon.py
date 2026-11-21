# Ícone da aba: círculo vermelho com o casco 2L (mesmo perfil do Blender) em branco e tampa verde.
import sys, os
from PIL import Image, ImageDraw
S = sys.argv[1]
P = [(0.0, 7.0), (16, 4.0), (30, 0.3), (34, 0.0), (43, 3.2), (48.4, 14), (49.4, 34), (49.0, 48), (46.6, 82), (46.4, 96), (47.6, 129), (48.0, 172), (47.9, 210), (47.6, 224), (44.4, 242), (36.0, 262), (24.4, 280), (15.2, 294), (12.6, 301), (12.6, 309)]
def outline(scale, cx, base):
    right = [(cx + r * scale, base - z * scale) for r, z in P[3:]]
    left = [(cx - r * scale, base - z * scale) for r, z in reversed(P[3:])]
    return right + left

# SVG
sc = 0.155; cx = 32; base = 57
pts = outline(sc, cx, base)
d = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z'
cap_y = base - 327 * sc; cap_h = (327 - 308) * sc; cap_w = 2 * 16.9 * sc
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<circle cx="32" cy="32" r="32" fill="#F40009"/>
<path d="{d}" fill="#fff"/>
<rect x="{cx - cap_w / 2:.2f}" y="{cap_y:.2f}" width="{cap_w:.2f}" height="{cap_h:.2f}" rx="1" fill="#1E8A3A"/>
<path d="M{cx - 7.4:.1f} {base - 175 * sc:.1f} q 7.4 -3 14.8 0 v 6 q -7.4 3 -14.8 0 z" fill="#F40009"/>
</svg>'''
open(os.path.join(S, 'favicon.svg'), 'w', encoding='utf-8').write(svg)

# PNGs (desenhados em 8x e reduzidos, para borda lisa)
for size, name in ((32, 'favicon-32.png'), (180, 'apple-touch-icon.png'), (512, 'icon-512.png')):
    k = 8; N = size * k
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); g = ImageDraw.Draw(im)
    if name == 'apple-touch-icon.png':
        g.rectangle((0, 0, N, N), fill='#F40009')
    else:
        g.ellipse((0, 0, N - 1, N - 1), fill='#F40009')
    f = N / 64
    g.polygon([(x * f, y * f) for x, y in pts], fill='white')
    g.rounded_rectangle(((cx - cap_w / 2) * f, cap_y * f, (cx + cap_w / 2) * f, (cap_y + cap_h) * f), radius=f, fill='#1E8A3A')
    y0 = (base - 175 * sc) * f
    g.rectangle(((cx - 7.4) * f, y0, (cx + 7.4) * f, y0 + 6 * f), fill='#F40009')
    im.resize((size, size), Image.LANCZOS).save(os.path.join(S, name))
print('ok')
