# Coca-Cola Retornável (Sabor Original) — modelo mestre reproduzível, versão 2.
# Blender 5.x, Cycles. Uso:
#   blender -b -P master.py -- <pasta_saida> <modo> [frames]
#   modos: build (só salva o .blend), diag (renders de validação), turntable, fill, still
# Unidades: 1 unidade = 1 "mm estimado". A escala NÃO é medida: o perfil vem de pixels da
# foto 02 (frente) multiplicados por PX. Ver README.md para o que é observado x estimado.
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(__file__), 'renders')
MODE = argv[1] if len(argv) > 1 else 'build'
FRAMES = int(argv[2]) if len(argv) > 2 else 72
HERE = os.path.dirname(os.path.abspath(__file__))
if not os.path.isabs(OUT): OUT = os.path.join(HERE, OUT)
# LOOK=antigo (padrão, escolhido pelo usuário): rótulo, materiais, luz e gotas da versão 1 sobre o formato novo
# LOOK=limpo: rótulo extraído da foto, sem gotas (versão de diagnóstico)
LOOK = os.environ.get('LOOK', 'antigo')
LABEL_TEX = os.path.join(HERE, 'textures', 'rotulo_v1.png' if LOOK == 'antigo' else 'rotulo_original_frente_provisorio.png')

# ------------------------------------------------------------------ parâmetros editáveis
P = dict(
    PX=0.645,            # unidades por pixel da foto 02 (ESTIMADO: raio máx. ≈ 50)
    WALL=0.45,           # espessura do PET (ESTIMADA, não medida)
    LABEL_Y=(176, 301),  # topo/base do rótulo na foto 02 (OBSERVADO)
    LABEL_GAP=0.10,      # folga do rótulo sobre o PET
    FILL_Y=88,           # nível da bebida na foto 02 (OBSERVADO, início do ombro claro)
    CAP_TOP_Y=-14,       # topo da tampa (ESTIMADO: a foto corta a tampa; proporção da foto 01)
    CAP_R_PX=22.6,       # raio aparente da tampa (OBSERVADO, y 0..20)
    RIBS=96,             # estrias da tampa (ESTIMADO, sem macro)
)
PX = P['PX']
Y0 = 534  # linha de apoio na foto 02
def Z(y): return (Y0 - y) * PX

# Perfil externo em pixels da foto 02: (raio_px, y_px, quina). Bordas medidas coluna a coluna
# na foto (eixo x=270,5). Base por baixo é ESTIMADA (não aparece em nenhuma foto).
PROFILE_PX = [
    (0.0, 528.5, 0), (10, 529.0, 0), (22, 530.6, 0), (33, 532.6, 0),   # fundo levemente côncavo (estimado)
    (40, 534.0, 1),                                                     # anel de apoio (estimado no raio)
    (46, 532.2, 0), (53, 527.6, 0), (62, 521.0, 0), (70, 512.0, 0), (74.6, 502, 0), (76.8, 492, 0),
    (77.6, 480, 0), (77.4, 467, 0), (76.0, 455, 0), (74.0, 442, 0), (72.0, 430, 0), (70.6, 418, 0),
    (70.1, 405, 0), (70.3, 392, 0), (71.6, 378, 0), (73.4, 362, 0), (74.8, 348, 0), (76.0, 334, 0),
    (76.7, 318, 0), (77.0, 301, 1),                                     # base do rótulo: corpo cilíndrico
    (77.0, 176, 1),                                                     # topo do rótulo
    (76.9, 165, 0), (76.2, 156, 0), (75.0, 148, 0), (73.3, 140, 0), (71.4, 133, 0), (69.0, 126, 0),
    (66.4, 119, 0), (63.6, 112, 0), (60.6, 105, 0), (57.4, 98, 0), (53.8, 90, 0), (50.0, 82, 0),
    (45.6, 74, 0), (40.6, 66, 0), (35.6, 59, 0), (30.4, 53, 0), (26.4, 48.5, 0), (24.6, 45, 1),  # ombro longo até o gargalo
    (24.6, 36.5, 1), (28.2, 35.2, 1), (28.2, 31.2, 1), (24.4, 30.0, 1),  # anel de sustentação (observado)
    (23.0, 28.6, 1), (22.6, 22.0, 1), (21.4, 21.4, 1),                 # gargalo/rosca sob a tampa (estimado)
    (20.0, 21.4, 1),                                                    # boca (lábio plano, estimado)
]

def densify(pts, n=6):
    """Catmull-Rom entre pontos; quinas (flag 1) quebram a tangente."""
    out = []
    runs, cur = [], [pts[0]]
    for p in pts[1:]:
        cur.append(p)
        if p[2]:
            runs.append(cur); cur = [p]
    if len(cur) > 1: runs.append(cur)
    for run in runs:
        q = [(r, y) for r, y, _ in run]
        for i in range(len(q) - 1):
            p0 = q[i - 1] if i > 0 else q[i]
            p1, p2 = q[i], q[i + 1]
            p3 = q[i + 2] if i + 2 < len(q) else q[i + 1]
            steps = n if len(q) > 2 else 1
            for k in range(steps):
                t = k / steps
                t2, t3 = t * t, t * t * t
                pt = [0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                             + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)]
                if not out or (abs(out[-1][0] - pt[0]) + abs(out[-1][1] - pt[1])) > 1e-6:
                    out.append(tuple(pt))
    out.append((pts[-1][0], pts[-1][1]))
    return [(r * PX, Z(y)) for r, y in out]

OUTER = densify(PROFILE_PX)

def radius_at(z):
    best = None
    for (r0, z0), (r1, z1) in zip(OUTER, OUTER[1:]):
        lo, hi = min(z0, z1), max(z0, z1)
        if lo <= z <= hi and hi > lo and r0 > 5 and r1 > 5:
            t = (z - z0) / (z1 - z0); best = r0 + (r1 - r0) * t
    return best

# ------------------------------------------------------------------ cena
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'; scene.unit_settings.scale_length = 0.001

def lathe(name, prof, steps=144, cap_top=False, cap_bottom=False, smooth=True, recalc=False):
    bm = bmesh.new(); rings = []
    for r, z in prof:
        if r < 1e-4:
            rings.append([bm.verts.new((0, 0, z))])
            continue
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / steps), r * math.sin(2 * math.pi * i / steps), z)) for i in range(steps)])
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1: continue
        if len(a) == 1:
            for i in range(steps): bm.faces.new((a[0], b[(i + 1) % steps], b[i]))
        elif len(b) == 1:
            for i in range(steps): bm.faces.new((a[i], a[(i + 1) % steps], b[0]))
        else:
            for i in range(steps): bm.faces.new((a[i], a[(i + 1) % steps], b[(i + 1) % steps], b[i]))
    if cap_top and len(rings[-1]) > 1: bm.faces.new(rings[-1])
    if cap_bottom and len(rings[0]) > 1: bm.faces.new(list(reversed(rings[0])))
    # a ordem dos vértices já dá normais para fora; recalcular em malha aberta pode inverter tudo
    if recalc: bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    return ob

def principled(name, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    for k, v in kw.items(): p.inputs[k].default_value = v
    return m, p

def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

# materiais (valores de trabalho, ajustados visualmente — não são medidas de laboratório)
m_pet, _ = principled('PET', **{'Base Color': (0.97, 1.0, 0.985, 1), 'Roughness': 0.035, 'IOR': 1.57, 'Transmission Weight': 1.0})
m_cola, _ = principled('Bebida', **{'Base Color': (1, 1, 1, 1), 'Roughness': 0.0, 'IOR': 1.34, 'Transmission Weight': 1.0})
va = m_cola.node_tree.nodes.new('ShaderNodeVolumeAbsorption')
va.inputs['Color'].default_value = (0.60, 0.14, 0.035, 1); va.inputs['Density'].default_value = 1.1
if LOOK == 'antigo':
    m_pet.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (1, 1, 1, 1)
    m_pet.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.03
    m_cola.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.9, 0.75, 0.6, 1)
    va.inputs['Color'].default_value = (0.55, 0.16, 0.04, 1); va.inputs['Density'].default_value = 0.24
m_cola.node_tree.links.new(va.outputs['Volume'], m_cola.node_tree.nodes['Material Output'].inputs['Volume'])
m_cap, _ = principled('Tampa_verde', **{'Base Color': (lin(0.19), lin(0.56), lin(0.34), 1), 'Roughness': 0.45, 'Specular IOR Level': 0.45})
if LOOK == 'antigo':
    m_cap.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (lin(0.12), lin(0.54), lin(0.23), 1)
    m_cap.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.38
m_lab, lp = principled('Rotulo', **({'Roughness': 0.46, 'Coat Weight': 0.0} if LOOK == 'antigo' else {'Roughness': 0.42, 'Coat Weight': 0.08, 'Coat Roughness': 0.15}))
tex = m_lab.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(LABEL_TEX); tex.image.colorspace_settings.name = 'sRGB'
tex.interpolation = 'Cubic'
m_lab.node_tree.links.new(tex.outputs['Color'], lp.inputs['Base Color'])
m_clay, _ = principled('Clay', **{'Base Color': (0.16, 0.16, 0.155, 1), 'Roughness': 0.6})

root = bpy.data.objects.new('COCA_RETORNAVEL', None); scene.collection.objects.link(root)

# BODY_PET: casca de revolução com parede (Solidify para dentro = parede externa + interna)
body = lathe('BODY_PET', OUTER, steps=160)
body.data.materials.append(m_pet)
so = body.modifiers.new('Parede', 'SOLIDIFY'); so.thickness = P['WALL']; so.offset = -1; so.use_even_offset = True; so.use_rim = True
body.parent = root

# CAP_GREEN: tampa com estrias e topo levemente rebaixado (forma estimada)
cr = P['CAP_R_PX'] * PX
z_cb, z_ct = Z(22.0), Z(P['CAP_TOP_Y'])
bm = bmesh.new(); N = P['RIBS'] * 2
prof_cap = [(cr - 0.5, z_cb), (cr, z_cb + 0.4), (cr, z_ct - 1.6), (cr - 0.9, z_ct - 0.2), (cr - 2.2, z_ct), (cr - 3.2, z_ct - 0.35), (0, z_ct - 0.35)]
rings = []
for r, z in prof_cap:
    if r == 0: rings.append([bm.verts.new((0, 0, z))]); continue
    ring = []
    for i in range(N):
        a = 2 * math.pi * i / N
        rr = r + (0.32 if (i % 2 == 0 and z_cb + 1.0 < z < z_ct - 1.8) else 0)
        ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z)))
    rings.append(ring)
for a, b in zip(rings, rings[1:]):
    if len(b) == 1:
        for i in range(N): bm.faces.new((a[i], a[(i + 1) % N], b[0]))
    else:
        for i in range(N): bm.faces.new((a[i], a[(i + 1) % N], b[(i + 1) % N], b[i]))
me = bpy.data.meshes.new('CAP_GREEN'); bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
cap = bpy.data.objects.new('CAP_GREEN', me); scene.collection.objects.link(cap)
sc = cap.modifiers.new('Espessura', 'SOLIDIFY'); sc.thickness = 1.0; sc.offset = -1
cap.data.materials.append(m_cap); cap.parent = root

# TAMPER_RING: lacre separado, logo abaixo da tampa (com pontes não modeladas: sem macro)
tr = [(cr - 1.3, Z(27.6)), (cr - 0.1, Z(27.4)), (cr - 0.1, Z(23.0)), (cr - 1.3, Z(22.8))]
ring = lathe('TAMPER_RING', tr + [tr[0]], steps=N)
ring.data.materials.append(m_cap); ring.parent = root

# LABEL_ORIGINAL: faixa cilíndrica no trecho reto do corpo, emenda atrás (+Y)
def label_band():
    r = 77.0 * PX + P['LABEL_GAP']
    z0, z1 = Z(P['LABEL_Y'][1]), Z(P['LABEL_Y'][0])
    steps = 240
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    bot, top = [], []
    for i in range(steps + 1):
        a = -math.pi / 2 + 2 * math.pi * i / steps - math.pi  # u=0.5 fica em -Y (frente da câmera)
        bot.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z0)))
        top.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z1)))
    for i in range(steps):
        f = bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
        for lo, (u, v) in zip(f.loops, ((i / steps, 0), ((i + 1) / steps, 0), ((i + 1) / steps, 1), (i / steps, 1))):
            lo[uv].uv = (u, v)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    me = bpy.data.meshes.new('LABEL_ORIGINAL'); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new('LABEL_ORIGINAL', me); scene.collection.objects.link(ob)
    s = ob.modifiers.new('Filme', 'SOLIDIFY'); s.thickness = 0.06; s.offset = 1
    return ob
label = label_band(); label.data.materials.append(m_lab); label.parent = root

# LIQUID: volume fechado dentro da parede, com menisco discreto
def make_liquid(level_z):
    if level_z < 1.0: return None
    gap = P['WALL'] + 0.08
    prof = []
    for r, z in OUTER:
        if z >= level_z: break
        prof.append((max(0.0, r - gap), z + gap) if z < 3.8 else (r - gap, z))
    rl = (radius_at(level_z) or 20) - gap
    prof += [(rl, level_z), (rl - 0.6, level_z + 0.35), (rl - 1.6, level_z + 0.12), (0.0, level_z + 0.1)]
    ob = lathe('LIQUID', prof, steps=160, recalc=True)
    ob.data.materials.append(m_cola); ob.parent = root
    return ob

# ------------------------------------------------------------------ luz, mundo, câmera
def area(name, loc, rot, size, energy, sy=None):
    L = bpy.data.lights.new(name, 'AREA'); L.shape = 'RECTANGLE'; L.size = size; L.size_y = sy or size; L.energy = energy
    ob = bpy.data.objects.new(name, L); scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = rot; ob.visible_camera = False
    ob.visible_transmission = False  # a lâmpada não aparece através do PET (senão a garrafa vazia fica branca)
    return ob
if LOOK == 'antigo':  # luz da versão 1 (contraluz aparece através do PET: brilho da garrafa)
    for nm, loc, rot, size, e, sy in (
        ('Chave', (-460, -420, 300), (70, 0, -48), 420, 1.5e7, 700), ('Recorte D', (360, 160, 220), (80, 0, 112), 140, 0.9e7, 700),
        ('Recorte E', (-360, 180, 220), (80, 0, -112), 140, 0.6e7, 700), ('Topo', (0, -60, 720), (0, 0, 0), 300, 2.5e6, None),
        ('Fundo', (0, 520, 150), (-90, 0, 0), 520, 2.2e7, 420)):
        o = area(nm, loc, tuple(math.radians(a) for a in rot), size, e, sy); o.visible_transmission = True
else:
    area('Lateral_E', (-520, -300, 260), (math.radians(75), 0, math.radians(-60)), 300, 1.3e7, 800)
    area('Lateral_D', (520, -260, 240), (math.radians(78), 0, math.radians(63)), 220, 0.8e7, 800)
    area('Recorte', (0, 560, 200), (math.radians(-90), 0, 0), 520, 2.0e7, 460)   # contraluz: acende a bebida
    area('Topo', (0, -80, 760), (0, 0, 0), 320, 2.2e6)
world = bpy.data.worlds.new('Mundo'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']

cam_d = bpy.data.cameras.new('CAM'); cam_d.lens = 85; cam_d.clip_start = 1; cam_d.clip_end = 20000
cam = bpy.data.objects.new('CAM', cam_d); scene.collection.objects.link(cam); scene.camera = cam
H_TOTAL = Z(P['CAP_TOP_Y'])
def aim(dist, height, yaw_deg=0.0, pitch_extra=0.0, target_z=None):
    tz = H_TOTAL / 2 if target_z is None else target_z
    a = math.radians(yaw_deg)
    cam.location = (dist * math.sin(a), -dist * math.cos(a), height)
    d = Vector((0, 0, tz)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

# ------------------------------------------------------------------ render
cy = scene.cycles; scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for backend in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = backend; prefs.get_devices()
            if [d for d in prefs.devices if d.type == backend]:
                for d in prefs.devices: d.use = d.type == backend
                cy.device = 'GPU'; break
        except Exception: pass
except Exception: pass
cy.samples = int(os.environ.get('SAMPLES', '64')); cy.use_denoising = True
cy.denoiser = 'OPTIX' if cy.device == 'GPU' else 'OPENIMAGEDENOISE'
cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.015
cy.max_bounces = 16; cy.transmission_bounces = 16; cy.transparent_max_bounces = 16; cy.glossy_bounces = 6
cy.caustics_reflective = False; cy.caustics_refractive = False
scene.view_settings.view_transform = 'Standard'
if LOOK == 'antigo': scene.view_settings.exposure = -0.15
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
os.makedirs(OUT, exist_ok=True)

def set_bg(kind):
    """site: transparente com reflexo vermelho; claro/escuro: fundos de validação."""
    scene.render.film_transparent = kind == 'site'
    cy.film_transparent_glass = kind == 'site'
    col = {'site': (0.30, 0.004, 0.006), 'claro': (0.85, 0.85, 0.85), 'escuro': (0.012, 0.012, 0.014)}[kind]
    bg.inputs['Color'].default_value = (*col, 1); bg.inputs['Strength'].default_value = 0.55 if kind == 'site' else 0.7

def res(w, h):
    k = float(os.environ.get('RES', '1'))
    scene.render.resolution_x = int(w * k); scene.render.resolution_y = int(h * k)

def shot(name):
    scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True); print('render', name, flush=True)

def clay(on):
    for ob in (body, cap, ring, label) + tuple(o for o in [bpy.data.objects.get('LIQUID')] if o):
        ob.hide_render = False
        if on:
            ob.data.materials.clear(); ob.data.materials.append(m_clay)
    if on:
        for o in [bpy.data.objects.get('LIQUID')]:
            if o: o.hide_render = True

def restore():
    for ob, m in ((body, m_pet), (cap, m_cap), (ring, m_cap), (label, m_lab)):
        ob.data.materials.clear(); ob.data.materials.append(m)
    l = bpy.data.objects.get('LIQUID')
    if l: l.hide_render = False

liq = make_liquid(Z(P['FILL_Y']))

# condensação (versão 1): gotas achatadas sobre o PET; o rótulo tem gotas próprias, menores
if LOOK == 'antigo':
    import random
    random.seed(11)
    m_gota, _ = principled('Gota', **{'Base Color': (1, 1, 1, 1), 'Roughness': 0.0, 'IOR': 1.33, 'Transmission Weight': 1.0})
    def slope_at(z):
        r0, r1 = radius_at(z - 0.5), radius_at(z + 0.5)
        return (r1 - r0) if (r0 and r1) else 0
    lz0, lz1 = Z(P['LABEL_Y'][1]), Z(P['LABEL_Y'][0])
    def droplets(count, zmin, zmax, smin, smax, on_label, name):
        bm = bmesh.new(); placed = 0
        while placed < count:
            z = random.uniform(zmin, zmax); r = radius_at(z)
            if not r or r < 16: continue
            if not on_label and lz0 - 1 < z < lz1 + 1: continue
            a = random.uniform(0, 2 * math.pi)
            size = random.uniform(smin, smax) * (2.2 if random.random() < 0.08 else 1)
            geom = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0); vs = geom['verts']
            n = Vector((math.cos(a), math.sin(a), -slope_at(z))).normalized()
            bmesh.ops.scale(bm, vec=(size, size * 1.15, size * 0.42), verts=vs)
            bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Vector((0, 0, 1)).rotation_difference(n).to_matrix(), verts=vs)
            extra = P['LABEL_GAP'] + 0.08 if on_label else 0
            bmesh.ops.translate(bm, vec=Vector((math.cos(a) * (r + extra), math.sin(a) * (r + extra), z)) + n * (size * 0.05), verts=vs)
            placed += 1
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for poly in me.polygons: poly.use_smooth = True
        ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
        ob.data.materials.append(m_gota); ob.parent = root
    droplets(int(os.environ.get('GOTAS', '1700')), 4, Z(60), 0.4, 1.3, False, 'CONDENSACAO')
    droplets(int(int(os.environ.get('GOTAS', '1700')) * 0.21), lz0 + 0.5, lz1 - 0.5, 0.3, 0.85, True, 'CONDENSACAO_ROTULO')
DIST = 1350

if MODE == 'build':
    pass
elif MODE == 'clay':
    res(700, 1100); set_bg('claro'); clay(True)
    aim(DIST, H_TOTAL * 0.55); shot('diag_clay_frente')
    restore(); set_bg('claro'); shot('teste_cheia_frente')
elif MODE == 'vtest':
    res(700, 1100); liq.hide_render = True
    set_bg('escuro'); aim(DIST, H_TOTAL * 0.55); shot('teste_vazia_escuro')
    set_bg('site'); shot('teste_vazia_site')
elif MODE == 'diag':
    res(700, 1100)
    set_bg('claro')
    clay(True)
    aim(DIST, H_TOTAL * 0.55); shot('diag_clay_frente')
    aim(DIST, H_TOTAL * 0.85, yaw_deg=35); shot('diag_clay_3-4')
    # wireframe: modificador para render
    for ob in (body, cap, label):
        w = ob.modifiers.new('Wire', 'WIREFRAME'); w.thickness = 0.35; w.use_replace = True
    aim(DIST, H_TOTAL * 0.55); shot('diag_wireframe')
    for ob in (body, cap, label): ob.modifiers.remove(ob.modifiers['Wire'])
    restore()
    for kind in ('claro', 'escuro'):
        set_bg(kind)
        for nm, yaw in (('frente', 0), ('lado_direito', 90), ('costas', 180), ('lado_esquerdo', 270)):
            aim(DIST, H_TOTAL * 0.55, yaw_deg=yaw); shot(f'cheia_{kind}_{nm}')
        aim(DIST, H_TOTAL * 0.85, yaw_deg=35); shot(f'cheia_{kind}_3-4')
    set_bg('claro')
    res(900, 900)
    cam.location = (0, -0.01, H_TOTAL + 900); cam.rotation_euler = (0, 0, 0); shot('cheia_claro_topo')
    cam.location = (0, 0.01, -900); cam.rotation_euler = (math.radians(180), 0, 0); shot('cheia_claro_fundo')
    res(900, 700)
    cam_d.lens = 200
    aim(900, Z(5), target_z=Z(5)); shot('macro_tampa')
    cam_d.lens = 140
    aim(1000, Z(238), target_z=Z(238)); shot('macro_rotulo')
    cam_d.lens = 85
    if liq: liq.hide_render = True
    res(700, 1100)
    for kind in ('claro', 'escuro'):
        set_bg(kind); aim(DIST, H_TOTAL * 0.55); shot(f'vazia_{kind}_frente')
        aim(DIST, H_TOTAL * 0.85, yaw_deg=35); shot(f'vazia_{kind}_3-4')
    if liq: liq.hide_render = False
elif MODE in ('turntable', 'fill', 'still'):
    set_bg('site')
    res(int(os.environ.get('W', '1064')), int(os.environ.get('H', '1596')))
    aim(1180, H_TOTAL * 0.56, target_z=H_TOTAL * 0.5)
    cam_d.lens = 85
    if MODE == 'turntable':
        for f in range(FRAMES):
            root.rotation_euler = (0, 0, -2 * math.pi * f / FRAMES)
            scene.render.filepath = os.path.join(OUT, f'f{f:03d}.png')
            bpy.ops.render.render(write_still=True); print('frame', f, flush=True)
    elif MODE == 'fill':
        root.rotation_euler = (0, 0, math.radians(-10))
        top = Z(P['FILL_Y'])
        for f in range(FRAMES):
            t = f / (FRAMES - 1)
            t = t * t * (3 - 2 * t) * 0.15 + t * 0.85     # leve ease nas pontas
            old = bpy.data.objects.get('LIQUID')
            if old: bpy.data.objects.remove(old, do_unlink=True)
            make_liquid(2.0 + (top - 2.0) * t)
            scene.render.filepath = os.path.join(OUT, f'e{f:03d}.png')
            bpy.ops.render.render(write_still=True); print('fill', f, flush=True)
    else:
        root.rotation_euler = (0, 0, math.radians(-10)); shot('still')

tex.image.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'coca_cola_retornavel_master.blend'))
print('done', MODE)
