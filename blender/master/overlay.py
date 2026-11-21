# Sobreposição de diagnóstico: contorno do clay frontal (azul) sobre a foto 02 (escala pela largura do corpo e base).
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
ref = Image.open('ref/referencia-02-original-frente.png').convert('RGB')
cl = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
bgc = cl[5, 5]
mask = (np.abs(cl - bgc).sum(2) > 18)
ys, xs = np.where(mask)
y_bot = ys.max()
# largura no trecho do rótulo (a 60% da altura do objeto)
h = y_bot - ys.min()
row = mask[int(y_bot - 0.52 * h)]
xr = np.where(row)[0]; w_px = xr.max() - xr.min(); cx = (xr.max() + xr.min()) / 2
k = 153.0 / w_px                     # corpo na foto: 194..347
m = Image.fromarray((mask * 255).astype(np.uint8))
m = m.resize((int(m.width * k), int(m.height * k)), Image.LANCZOS)
edge = m.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 60 else 0)
ox = int(270.5 - cx * k); oy = int(534 - y_bot * k)
out = ref.copy()
blue = Image.new('RGB', edge.size, (0, 90, 255))
out.paste(blue, (ox, oy), edge)
out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS)
out.save(sys.argv[2]); print('escala', k)
