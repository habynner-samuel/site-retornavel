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
      <p>Amanhã é dia de retornável, Ana. Deixa o casco perto da porta e passa na máquina da Estação Nova Iguaçu na ida. retornavel.app/l</p>
    </div>
  </div>
  <div class="ios__notif ios__notif--old">
    <span class="ios__app" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4C7 4 3 7.3 3 11.3c0 2.3 1.3 4.3 3.3 5.6-.2 1-.8 2.2-1.8 3 2 0 3.7-.8 4.8-1.8.9.2 1.8.3 2.7.3 5 0 9-3.3 9-7.1S17 4 12 4z" fill="#fff"/></svg></span>
    <div class="ios__body">
      <div class="ios__top"><b>Retornável</b><time>sáb., 16:42</time></div>
      <p>Pronto, Ana! Seu lembrete da retornável está ativo: toda segunda, às 19h. Para parar, responda PARAR.</p>
    </div>
  </div>
  </div>
  <div class="ios__dock"><span class="ios__round"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M8 2h8l-1 6H9z"/><path d="M9 8h6v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg></span><span class="ios__round"><svg width="20" height="18" viewBox="0 0 24 20" fill="none" stroke="#fff" stroke-width="1.8"><path d="M3 6h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="11.5" r="3.6"/></svg></span></div>
  <span class="ios__home"></span>
</div>'''
    # Tela de carregamento: o casco do Blender (mm) desenhado em SVG com curvas suaves,
    # fundo petaloide, rótulo com a onda branca e tampa verde com estrias
    loader = '''<div class="loader" id="loader" role="status" aria-label="Carregando">
  <svg viewBox="0 0 120 345" width="96" height="276" aria-hidden="true">
    <defs>
      <path id="lb" d="M73.2 26 L73.4 27.6 L76.8 28.2 L76.8 30.2 L72.8 30.8 C72.8 31.3 72.5 32.9 72.6 34.0 C72.7 35.1 72.8 36.2 73.4 37.5 C74.0 38.8 74.7 40.1 76.0 42.0 C77.3 43.9 79.1 46.3 81.0 49.0 C82.9 51.7 85.3 54.8 87.5 58.0 C89.7 61.2 92.0 64.5 94.0 68.0 C96.0 71.5 98.0 75.3 99.6 79.0 C101.2 82.7 102.7 86.3 103.8 90.0 C104.9 93.7 105.8 97.5 106.4 101.0 C107.0 104.5 107.3 108.2 107.6 111.0 C107.8 113.8 107.9 116.4 107.9 117.5 L106.7 120.0 L106.7 122.8 L107.9 125.4 C107.9 131.5 108.0 149.8 108.0 162.0 C108.0 174.2 107.9 192.5 107.9 198.6 L106.6 201.2 L106.6 203.8 C106.8 204.2 107.6 204.6 107.7 206.5 C107.8 208.4 107.4 211.4 107.2 215.0 C107.0 218.6 106.7 223.8 106.5 228.0 C106.3 232.2 106.3 235.8 106.3 240.0 C106.3 244.2 106.5 248.3 106.7 253.0 C107.0 257.7 107.4 262.5 107.8 268.0 C108.2 273.5 108.8 280.5 109.1 286.0 C109.4 291.5 109.5 296.5 109.5 301.0 C109.5 305.5 109.4 309.7 109.2 313.0 C109.0 316.3 108.8 318.6 108.2 321.0 C107.6 323.4 106.8 325.7 105.8 327.4 C104.8 329.1 102.6 330.6 102.0 331.2 C100 333.6 96 334.8 90 335 C85 335.2 81 333.2 78 331.4 C75 330 72 333.2 68 334.6 C63 335.6 57 335.6 52 334.6 C48 333.2 45 330 42 331.4 C39 333.2 35 335.2 30 335 C24 334.8 20 333.6 18 331.2 C17.4 330.6 15.2 329.1 14.2 327.4 C13.2 325.7 12.4 323.4 11.8 321.0 C11.2 318.6 11.0 316.3 10.8 313.0 C10.6 309.7 10.5 305.5 10.5 301.0 C10.5 296.5 10.6 291.5 10.9 286.0 C11.2 280.5 11.8 273.5 12.2 268.0 C12.6 262.5 13.0 257.7 13.3 253.0 C13.5 248.3 13.7 244.2 13.7 240.0 C13.7 235.8 13.7 232.2 13.5 228.0 C13.3 223.8 13.0 218.6 12.8 215.0 C12.6 211.4 12.2 208.4 12.3 206.5 C12.4 204.6 13.2 204.2 13.4 203.8 L13.4 201.2 L12.1 198.6 C12.1 192.5 12.0 174.2 12.0 162.0 C12.0 149.8 12.1 131.5 12.1 125.4 L13.3 122.8 L13.3 120.0 L12.1 117.5 C12.1 116.4 12.2 113.8 12.4 111.0 C12.7 108.2 13.0 104.5 13.6 101.0 C14.2 97.5 15.1 93.7 16.2 90.0 C17.3 86.3 18.8 82.7 20.4 79.0 C22.0 75.3 24.0 71.5 26.0 68.0 C28.0 64.5 30.3 61.2 32.5 58.0 C34.7 54.8 37.1 51.7 39.0 49.0 C40.9 46.3 42.7 43.9 44.0 42.0 C45.3 40.1 46.0 38.8 46.6 37.5 C47.2 36.2 47.3 35.1 47.4 34.0 C47.5 32.9 47.2 31.3 47.2 30.8 L43.2 30.2 L43.2 28.2 L46.6 27.6 L46.8 26.0 Z"/>
      <clipPath id="lc"><use href="#lb"/></clipPath>
      <linearGradient id="lg-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      <linearGradient id="lg-label" x1="0" x2="1"><stop offset="0" stop-color="#B5000A"/><stop offset=".3" stop-color="#F40009"/><stop offset=".55" stop-color="#FF2A2F"/><stop offset="1" stop-color="#A30008"/></linearGradient>
      <linearGradient id="lg-cap" x1="0" x2="1"><stop offset="0" stop-color="#0F5E25"/><stop offset=".35" stop-color="#25A246"/><stop offset=".6" stop-color="#1E8A3A"/><stop offset="1" stop-color="#0C4F1F"/></linearGradient>
    </defs>
    <g clip-path="url(#lc)">
      <rect x="0" y="0" width="120" height="345" fill="rgba(255,255,255,.16)"/>
      <g class="loader__liquid"><path d="M-60 0 Q -30 -6 0 0 T 60 0 T 120 0 T 180 0 V 360 H -60 Z" fill="#3A0A06"/><path d="M-60 2 Q -30 -4 0 2 T 60 2 T 120 2 T 180 2 V 8 H -60 Z" fill="#8A2A14" opacity=".7"/></g>
      <rect x="0" y="0" width="120" height="345" fill="url(#lg-shade)"/>
      <rect x="11" y="125.4" width="98" height="73.2" fill="url(#lg-label)"/>
      <path d="M11 181 C35 170 60 192 109 174 V180 C62 197 36 177 11 187 Z" fill="#fff"/>
      <path d="M11 125.4 H109 M11 198.6 H109" stroke="#fff" stroke-width="1" opacity=".5"/>
      <path d="M24 58 C19 70 17 84 17.5 100 M20 210 C19 240 19 280 21 318" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".42"/>
      <path d="M100 96 C102 104 103 112 103 118 M103 212 C104 250 104 290 102 316" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".35"/>
    </g>
    <use href="#lb" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    <path d="M44 31 H76" stroke="#fff" stroke-width="1.2" opacity=".6"/>
    <rect x="43.6" y="21.6" width="32.8" height="5.4" rx="1.2" fill="#145E28"/>
    <rect x="43" y="7" width="34" height="15.4" rx="2.6" fill="url(#lg-cap)"/>
    <path d="M46 9.5 V20 M49.5 9.5 V20 M53 9.5 V20 M56.5 9.5 V20 M60 9.5 V20 M63.5 9.5 V20 M67 9.5 V20 M70.5 9.5 V20 M74 9.5 V20" stroke="#0A3F18" stroke-width=".9" opacity=".55"/>
    <path d="M44 22.6 H76" stroke="#0A3F18" stroke-width=".8" stroke-dasharray="2 1.2" opacity=".7"/>
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
