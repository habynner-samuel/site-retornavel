# Converte o giro em alta (turn_hd/f*.png, 1064x1596) para site/seq/h###.webp, sem reduzir.
import sys, os, glob
from PIL import Image
B, S = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(os.path.join(B, 'turn_hd', 'f*.png')))
tot = 0
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGBA').crop((84, 56, 980, 1540))  # mesma caixa do giro antigo, em 1,4x
    p = os.path.join(S, 'seq', f'h{i:03d}.webp')
    im.save(p, 'WEBP', quality=82, method=4)
    tot += os.path.getsize(p)
print(len(fs), 'quadros', tot // 1024, 'KB', im.size)
