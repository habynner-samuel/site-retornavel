# Troca a tampa amarela por verde nos quadros já renderizados (só na região da tampa,
# para não mexer no amarelo do rótulo). Mantém luz, brilho e transparência.
import sys, os, glob, colorsys
from PIL import Image
import numpy as np

seq = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else 'apply'
files = sorted(glob.glob(os.path.join(seq, '*.webp')))

def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.max(a, axis=-1); mn = np.min(a, axis=-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = ((b - r)[gm] / d[gm]) + 2
    h[bm] = ((r - g)[bm] / d[bm]) + 4
    h = h / 6.0
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,))
    for k, (a, b, c) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        sel = i == k
        out[sel, 0] = a[sel]; out[sel, 1] = b[sel]; out[sel, 2] = c[sel]
    return out

if mode == 'find':
    im = np.asarray(Image.open(files[0]).convert('RGBA')).astype(float) / 255
    h, s, v = rgb_to_hsv(im[..., :3])
    ys, xs = np.where((h > 0.08) & (h < 0.18) & (s > 0.45) & (v > 0.35) & (im[..., 3] > 0.5))
    print('amarelo y', ys.min(), ys.max(), 'x', xs.min(), xs.max(), 'altura', im.shape[0])
    sys.exit()

TOP = int(sys.argv[3])  # linhas da tampa: tudo acima disso
n = 0
for f in files:
    img = Image.open(f).convert('RGBA')
    a = np.asarray(img).astype(float) / 255
    h, s, v = rgb_to_hsv(a[..., :3])
    rows = np.zeros(h.shape, bool); rows[:TOP, :] = True
    sel = rows & (h > 0.04) & (h < 0.22) & (s > 0.07) & (a[..., 3] > 0.05)
    # verde da tampa da retornável: matiz ~0,37, um pouco mais escuro
    nh = np.where(sel, 0.365, h)
    ns = np.where(sel, np.clip(s * 1.08, 0, 1), s)
    nv = np.where(sel, v * 0.6, v)
    rgb = hsv_to_rgb(nh, ns, nv)
    out = np.dstack([rgb, a[..., 3:4]])
    Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'), 'RGBA').save(f, 'WEBP', quality=82, method=4)
    n += 1
print('recoloridos', n)
