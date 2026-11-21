# Rótulo Coca-Cola Sabor Original Retornável — textura PROVISÓRIA (só a frente é observada).
# Fonte da arte: referencia-02-original-frente.png (foto real, frontal, baixa resolução).
#  - O logotipo é extraído da própria foto (máscara do branco), desenrolado do cilindro
#    (x = R·sen θ  ->  u = R·θ) e suavizado. Não é redesenhado nem trocado por fonte.
#  - "SABOR ORIGINAL" e a faixa "RETORNAVEL" são recompostos na mesma posição e proporção da
#    foto, com a fonte TCCC Unity Bold, porque na foto as letras têm ~6 px de altura.
#  - O verso fica vermelho liso: não há foto do verso, então nada foi inventado
#    (sem tabela, código de barras, selos ou "2 L").
# Uso: python make_label_original.py <ref02.png> <fonte TCCC Unity Bold> <saida.png> [px_por_px_da_foto]
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REF, FONT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
K = int(sys.argv[4]) if len(sys.argv) > 4 else 8

# --- medidas tiradas da foto 02 (pixels da foto) ---
CX, R = 270.5, 77.0          # eixo e raio aparente na altura do rótulo (bordas 194..347)
TOP, BOT = 176, 301          # topo e base do vermelho no centro
LOGO_Y = (186, 247)          # faixa de linhas onde está o logotipo (com a fita)
SABOR_Y = (251.5, 257.5)     # altura das letras de SABOR ORIGINAL
BAND_Y = (285.0, 298.0)      # faixa verde
BAND_HALF_PROJ = 54          # meia largura aparente da faixa verde

H = int((BOT - TOP) * K)
W = int(round(2 * np.pi * R * K))
RED = (226, 6, 19)
WHITE = (255, 255, 255)
MINT = (168, 224, 186)
INK = (52, 70, 58)

ref = np.asarray(Image.open(REF).convert('RGB')).astype(np.float32)

def unwrap(y0, y1, theta_max=1.15):
    """Desenrola um trecho da foto: devolve (imagem, x0 no rótulo)."""
    h = int((y1 - y0) * K)
    half = int(theta_max * R * K)
    th = (np.arange(-half, half) + 0.5) / (R * K)
    xs = CX + R * np.sin(th)
    ys = y0 + (np.arange(h) + 0.5) / K
    X, Y = np.meshgrid(xs, ys)
    x0 = np.clip(np.floor(X).astype(int), 0, ref.shape[1] - 2); fx = X - x0
    y0i = np.clip(np.floor(Y).astype(int), 0, ref.shape[0] - 2); fy = Y - y0i
    c = (ref[y0i, x0] * ((1 - fx) * (1 - fy))[..., None] + ref[y0i, x0 + 1] * (fx * (1 - fy))[..., None]
         + ref[y0i + 1, x0] * ((1 - fx) * fy)[..., None] + ref[y0i + 1, x0 + 1] * (fx * fy)[..., None])
    return c, W // 2 - half

# --- logotipo: máscara do branco, suavizada (limiar sobre versão desfocada = bordas lisas) ---
c, lx0 = unwrap(*LOGO_Y)
white = np.clip((c.min(axis=2) - 45) / (190 - 45), 0, 1)
m = Image.fromarray((white * 255).astype(np.uint8))
m = m.filter(ImageFilter.GaussianBlur(K * 0.30))
a = np.asarray(m).astype(np.float32) / 255
a = np.clip((a - 0.30) / 0.12, 0, 1)          # limiar macio: traço nítido sem serrilhado
cols = np.where(a.max(axis=0) > 0.5)[0]
a[:, :max(0, cols.min() - K * 2)] = 0; a[:, cols.max() + K * 2:] = 0
logo = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(K * 0.08))

im = Image.new('RGB', (W, H), RED)
im.paste(Image.new('RGB', logo.size, WHITE), (lx0, int((LOGO_Y[0] - TOP) * K)), logo)
d = ImageDraw.Draw(im)

def spaced(text, cy, cap_h, fill, track):
    f = ImageFont.truetype(FONT, 100)
    bb = f.getbbox('H'); scale = cap_h / (bb[3] - bb[1])
    f = ImageFont.truetype(FONT, max(8, int(100 * scale)))
    ws = [d.textlength(ch, font=f) for ch in text]
    tr = track * f.size
    total = sum(ws) + tr * (len(text) - 1)
    x = W / 2 - total / 2
    for ch, w in zip(text, ws):
        d.text((x, cy), ch, font=f, fill=fill, anchor='lm')
        x += w + tr
    return total

# SABOR ORIGINAL (largura aparente na foto ~ 98 px -> desenrolada ~ 108 px)
cap = (SABOR_Y[1] - SABOR_Y[0]) * K
spaced('SABOR ORIGINAL', ((SABOR_Y[0] + SABOR_Y[1]) / 2 - TOP) * K, cap * 1.05, WHITE, 0.07)

# faixa verde com cantos arredondados; meia largura desenrolada = R·asen(meia/R)
half = R * np.arcsin(BAND_HALF_PROJ / R) * K
by0, by1 = (BAND_Y[0] - TOP) * K, (BAND_Y[1] - TOP) * K
d.rounded_rectangle((W / 2 - half, by0, W / 2 + half, by1), radius=(by1 - by0) * 0.32, fill=MINT)
spaced('RETORNAVEL', (by0 + by1) / 2, (by1 - by0) * 0.66, INK, 0.20)

# filetes finos de impressão no topo e na base (observados como borda mais escura na foto 01)
d.rectangle((0, 0, W, max(2, K // 3)), fill=(170, 0, 14))
d.rectangle((0, H - max(2, K // 3), W, H), fill=(170, 0, 14))
im.save(OUT)

# prévia lado a lado com a foto desenrolada (diagnóstico)
full, fx0 = unwrap(TOP, BOT, 1.2)
pv = Image.new('RGB', (full.shape[1], H * 2 + 10), 'white')
pv.paste(Image.fromarray(full.clip(0, 255).astype(np.uint8)), (0, 0))
pv.paste(im.crop((fx0, 0, fx0 + full.shape[1], H)), (0, H + 10))
pv.save(OUT.replace('.png', '-comparacao.png'))
print('rotulo', im.size, 'logo largura', cols.max() - cols.min(), 'px')
