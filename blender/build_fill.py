import sys, os, glob
from PIL import Image
B, S, prev = sys.argv[1], sys.argv[2], sys.argv[3]
out = os.path.join(S, 'seq')
fs = sorted(glob.glob(os.path.join(B, 'fill', 'e*.png')))
tot = 0
for f in fs:
    im = Image.open(f).convert('RGBA').crop((60, 40, 700, 1100)).resize((480, 795), Image.LANCZOS)
    p = os.path.join(out, os.path.basename(f)[:-4] + '.webp')
    im.save(p, 'WEBP', quality=80, method=4)
    tot += os.path.getsize(p)
print(len(fs), 'quadros', tot // 1024, 'KB')
pick = [fs[0], fs[len(fs) // 2], fs[-1]]
ims = [Image.open(f).convert('RGBA') for f in pick]
w, h = ims[0].size
sheet = Image.new('RGBA', (w * 3, h), (200, 0, 12, 255))
for i, im in enumerate(ims):
    sheet.alpha_composite(im, (w * i, 0))
sheet.convert('RGB').resize((w * 3 // 2, h // 2)).save(prev)
