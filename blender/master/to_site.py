# Converte os quadros do modelo v2 para o site (WebP, mesmo recorte em todos os quadros).
#   seq_turn/f###.png -> site/seq/t###.webp   (giro da home)
#   seq_fill/e###.png -> site/seq/g###.webp   (garrafa enchendo)
# Uso: python to_site.py <pasta_site>
import sys, os, glob, shutil
from PIL import Image
S = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(S, 'seq')
old = os.path.join(HERE, '..', 'seq-v1-backup'); os.makedirs(old, exist_ok=True)
PARTS = sys.argv[2].split(',') if len(sys.argv) > 2 else ['turn', 'fill']
old_prefix = {'turn': ('f', 'h', 't'), 'fill': ('e', 'g')}
for f in glob.glob(os.path.join(out, '*.webp')):           # guarda os quadros antigos fora do site
    name = os.path.basename(f)
    if any(name.startswith(p) and name[len(p):len(p) + 3].isdigit() for part in PARTS for p in old_prefix[part]):
        shutil.move(f, os.path.join(old, name))

def run(src, prefix, height, every=1, q=84):
    fs = sorted(glob.glob(os.path.join(HERE, src, '*.png')))
    box = None
    for f in fs:
        b = Image.open(f).getchannel('A').getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    # mesma folga do recorte antigo (garrafa ≈ 79% da altura do quadro), para o layout não mudar
    im0 = Image.open(fs[0])
    ph = int((box[3] - box[1]) * 0.13); pw = int((box[2] - box[0]) * 0.12)  # recorte estreito: menos memória por quadro
    box = (max(0, box[0] - pw), max(0, box[1] - ph), min(im0.width, box[2] + pw), min(im0.height, box[3] + ph // 2))
    tot = 0; n = 0
    for i, f in enumerate(fs[::every]):
        im = Image.open(f).convert('RGBA').crop(box)
        if im.height > height:
            im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
        p = os.path.join(out, f'{prefix}{i:03d}.webp')
        im.save(p, 'WEBP', quality=q, method=5)
        tot += os.path.getsize(p); n += 1
    print(prefix, n, 'quadros', im.size, tot // 1024, 'KB', 'memória decodificada', n * im.width * im.height * 4 // 2**20, 'MB')
    return im.size, n

# computador e celular: todos os quadros; no celular, imagens menores (memória do aparelho)
res = []
if 'turn' in PARTS: res += [run('seq_turn', 't', 900), run('seq_turn', 'tm', 600)]
if 'fill' in PARTS: res += [run('seq_fill', 'g', 900), run('seq_fill', 'gm', 560)]
open(os.path.join(HERE, 'seq_sizes.txt'), 'a').write(''.join(f'{w} {h} {n}' + chr(10) for (w, h), n in res))
