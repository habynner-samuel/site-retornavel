# Monta site/index.html e converte imagens para WebP.
# Uso: python build.py <pasta_blender> <pasta_site> [frames]
import sys, os, glob, io
from PIL import Image

B, S = sys.argv[1], sys.argv[2]
what = sys.argv[3] if len(sys.argv) > 3 else 'html'

if what in ('html', 'all'):
    t = io.open(os.path.join(B, 'template.html'), encoding='utf-8').read()
    sheets = io.open(os.path.join(B, 'sheets.html'), encoding='utf-8').read()
    wave = ('<svg class="ribbon" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">'
            '<path d="M0 70 C 340 150 760 160 1080 80 C 1240 40 1360 24 1440 20 L1440 48 C 1360 52 1240 68 1080 108 C 760 188 340 178 0 98 Z"/>'
            '<path d="M0 150 C 380 210 800 190 1100 120 C 1260 84 1370 74 1440 78 L1440 201 L0 201 Z"/></svg>')
    lock = '''<div class="ios">
  <svg class="ios__wall" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="wg" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="#FF2B30"/><stop offset=".38" stop-color="#E4000B"/><stop offset=".75" stop-color="#9A0007"/><stop offset="1" stop-color="#4A0004"/></radialGradient>
      <linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".25" stop-color="#fff" stop-opacity=".95"/><stop offset=".8" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
    </defs>
    <rect width="390" height="844" fill="url(#wg)"/>
    <path d="M-40 560 C 80 470 210 610 330 520 S 430 420 460 430 L460 470 C 420 462 360 560 300 600 S 90 560 -40 640 Z" fill="#7A0006" opacity=".55"/>
    <path d="M-40 600 C 90 520 220 650 340 560 S 440 470 470 470 L470 492 C 430 494 360 590 320 616 S 110 590 -40 628 Z" fill="url(#rb)"/>
    <g fill="#fff" opacity=".16"><circle cx="300" cy="140" r="5"/><circle cx="330" cy="210" r="3"/><circle cx="270" cy="250" r="7"/><circle cx="350" cy="300" r="4"/><circle cx="60" cy="700" r="6"/><circle cx="110" cy="760" r="3"/><circle cx="300" cy="720" r="5"/><circle cx="250" cy="790" r="8"/></g>
  </svg>
  <div class="ios__status"><span>TIM</span><span class="ios__icons"><svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg><svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.2 0 4.2.8 5.7 2.2l1.1-1.1A9.6 9.6 0 0 0 7.5.6 9.6 9.6 0 0 0 .7 3.3l1.1 1.1a8 8 0 0 1 5.7-2.2zm0 3.2c1.3 0 2.5.5 3.4 1.3l1.1-1.1a6.4 6.4 0 0 0-9 0L4.1 6.7c.9-.8 2.1-1.3 3.4-1.3zm0 3.2c.5 0 .9.2 1.2.5L7.5 10.3 6.3 9.1c.3-.3.7-.5 1.2-.5z"/></svg><span class="ios__batt"><i></i></span></span></div>
  <svg class="ios__lock" width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><path d="M3 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="1.8"/><rect x="0.5" y="7" width="13" height="10.5" rx="2.5" fill="#fff"/></svg>
  <p class="ios__date">segunda-feira, 9 de novembro</p>
  <p class="ios__clock">19:00</p>
  <div class="ios__stack">
  <div class="ios__notif">
    <span class="ios__app" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4C7 4 3 7.3 3 11.3c0 2.3 1.3 4.3 3.3 5.6-.2 1-.8 2.2-1.8 3 2 0 3.7-.8 4.8-1.8.9.2 1.8.3 2.7.3 5 0 9-3.3 9-7.1S17 4 12 4z" fill="#fff"/></svg></span>
    <div class="ios__body">
      <div class="ios__top"><b>Retornável</b><time>agora</time></div>
      <p>Amanhã é seu dia de compra, Ana. Seu saldo: 2 garrafas. Veja as lojas: retornavel.app/l</p>
    </div>
  </div>
  <div class="ios__notif ios__notif--old">
    <span class="ios__app" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4C7 4 3 7.3 3 11.3c0 2.3 1.3 4.3 3.3 5.6-.2 1-.8 2.2-1.8 3 2 0 3.7-.8 4.8-1.8.9.2 1.8.3 2.7.3 5 0 9-3.3 9-7.1S17 4 12 4z" fill="#fff"/></svg></span>
    <div class="ios__body">
      <div class="ios__top"><b>Retornável</b><time>sáb., 16:42</time></div>
      <p>Recebemos 2 garrafas no coletor da Mercearia do Seu Zé. Seu saldo agora é de 2 garrafas.</p>
    </div>
  </div>
  </div>
  <div class="ios__dock"><span class="ios__round"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M8 2h8l-1 6H9z"/><path d="M9 8h6v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg></span><span class="ios__round"><svg width="20" height="18" viewBox="0 0 24 20" fill="none" stroke="#fff" stroke-width="1.8"><path d="M3 6h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="11.5" r="3.6"/></svg></span></div>
  <span class="ios__home"></span>
</div>'''
    # Tela de carregamento: o mesmo perfil do casco usado no Blender (mm), desenhado em SVG
    P = [(0.0, 7.0), (8, 6.2), (16, 4.0), (24, 1.6), (30, 0.3), (34, 0.0), (39, 0.9), (43, 3.2), (46.2, 7.5), (48.4, 14), (49.3, 22), (49.4, 34), (49.0, 48), (47.6, 66), (46.6, 82), (46.4, 96), (46.8, 112), (47.4, 124), (47.6, 129), (46.6, 131.5), (46.6, 133.5), (47.9, 136), (48.0, 172), (47.9, 210), (46.8, 212.5), (46.8, 214.5), (47.9, 217), (47.6, 224), (46.6, 232), (44.4, 242), (40.8, 252), (36.0, 262), (30.4, 271), (24.4, 280), (19.0, 288), (15.2, 294), (13.2, 298), (12.6, 301), (12.6, 304.5), (16.6, 305), (16.8, 306.6), (13.4, 307.2), (13.2, 309)]
    X = lambda r: 60 + r; Y = lambda z: 335 - z
    Q = P[[z for r, z in P].index(0):]  # fundo reto: tira o domo central do perfil
    right = [f'{X(r):.1f} {Y(z):.1f}' for r, z in Q]
    left = [f'{120 - X(r):.1f} {Y(z):.1f}' for r, z in reversed(Q)]
    body = 'M60 335 L' + ' L'.join(right) + ' L' + ' L'.join(left) + ' Z'
    loader = f'''<div class="loader" id="loader" role="status" aria-label="Carregando">
  <svg viewBox="0 0 120 345" width="96" height="276" aria-hidden="true">
    <defs><clipPath id="lc"><path d="{body}"/></clipPath></defs>
    <g clip-path="url(#lc)">
      <rect x="0" y="0" width="120" height="345" fill="rgba(255,255,255,.14)"/>
      <g class="loader__liquid"><path d="M-60 0 Q -30 -6 0 0 T 60 0 T 120 0 T 180 0 V 360 H -60 Z" fill="#2A0605"/><path d="M-60 2 Q -30 -4 0 2 T 60 2 T 120 2 T 180 2 V 8 H -60 Z" fill="#6B1A10" opacity=".7"/></g>
    </g>
    <path d="{body}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="43" y="7.5" width="34" height="19" rx="3" fill="#1E8A3A"/>
  </svg>
  <p>Enchendo a sua retornável…</p>
</div>'''
    out = t.replace('{{SHEETS}}', sheets).replace('{{WAVE}}', wave).replace('{{LOADER}}', loader)
    # cada cópia da tela de bloqueio ganha ids próprios: com ids repetidos, a cópia fora da página
    # visível perde o degradê vermelho (o navegador usa o primeiro id, que está numa página oculta)
    k = 0
    while '{{LOCK}}' in out:
        k += 1
        uniq = lock.replace('id="wg"', f'id="wg{k}"').replace('url(#wg)', f'url(#wg{k})').replace('id="rb"', f'id="rb{k}"').replace('url(#rb)', f'url(#rb{k})')
        out = out.replace('{{LOCK}}', uniq, 1)
    io.open(os.path.join(S, 'index.html'), 'w', encoding='utf-8').write(out)
    print('index ok')

if what in ('photos', 'all'):
    for f in glob.glob(os.path.join(S, 'img', '*.jpg')):
        im = Image.open(f).convert('RGB')
        im.thumbnail((1600, 1600))
        im.save(f[:-4] + '.webp', 'WEBP', quality=74, method=6)
        print(os.path.basename(f), os.path.getsize(f[:-4] + '.webp') // 1024, 'KB')

if what in ('frames', 'all'):
    out = os.path.join(S, 'seq'); os.makedirs(out, exist_ok=True)
    tot = 0
    for f in sorted(glob.glob(os.path.join(B, 'turn', 'f*.png'))):
        im = Image.open(f).convert('RGBA')
        bbox = (60, 40, 700, 1100)  # recorta sobra lateral, mantendo a mesma caixa em todos os quadros
        im = im.crop(bbox).resize((480, 795), Image.LANCZOS)
        p = os.path.join(out, os.path.basename(f)[:-4] + '.webp')
        im.save(p, 'WEBP', quality=80, method=4)
        tot += os.path.getsize(p)
    for name in ('still-empty', 'still-full'):
        f = os.path.join(B, 'stills', name + '.png')
        if os.path.exists(f):
            im = Image.open(f).convert('RGBA').crop((60, 40, 700, 1100)).resize((480, 795), Image.LANCZOS)
            im.save(os.path.join(out, {'still-empty': 'vazia', 'still-full': 'cheia'}[name] + '.webp'), 'WEBP', quality=82, method=6)
    print('frames', tot // 1024, 'KB')
