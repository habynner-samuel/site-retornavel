# Prancha de revisão: renders lado a lado com legenda.
import sys, glob, os
from PIL import Image, ImageDraw
files = sys.argv[2:]; out = sys.argv[1]
th = 420; ims = []
for f in files:
    im = Image.open(f).convert('RGB'); im.thumbnail((th * 2, th)); ims.append((os.path.basename(f)[:-4], im))
cols = 6; cw = max(i.width for _, i in ims) + 10; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * cw, rows * (th + 30)), (255, 255, 255)); d = ImageDraw.Draw(S)
for k, (n, im) in enumerate(ims):
    x, y = (k % cols) * cw, (k // cols) * (th + 30)
    S.paste(im, (x + (cw - im.width) // 2, y)); d.text((x + 6, y + th + 6), n, fill=(0, 0, 0))
S.save(out)
