# Casco PET 2L da Coca-Cola Retornável (garrafa universal), modelado a partir de fotos.
# Uso: blender -b -P casco.py -- <pasta_saida> <label.png> <modo> [frames]
#   modo: test (1 frame), turntable (N frames girando), still-empty, still-full
# Medidas em milímetros (1 unidade = 1 mm), perfil tirado da foto frontal da garrafa vazia.
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, LABEL, MODE = argv[0], argv[1], argv[2]
FRAMES = int(argv[3]) if len(argv) > 3 else 36
BG = (0x12 / 255, 0x0C / 255, 0x0D / 255)  # fundo do hero do site (#120C0D)

def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- perfil externo (raio, altura) em mm ----------
PROFILE = [
    (0.0, 7.0), (8, 6.2), (16, 4.0), (24, 1.6), (30, 0.3), (34, 0.0), (39, 0.9), (43, 3.2),
    (46.2, 7.5), (48.4, 14), (49.3, 22), (49.4, 34), (49.0, 48), (47.6, 66), (46.6, 82),
    (46.4, 96), (46.8, 112), (47.4, 124), (47.6, 129),
    (46.6, 131.5), (46.6, 133.5), (47.9, 136),            # friso inferior do rótulo
    (48.0, 172), (47.9, 210),
    (46.8, 212.5), (46.8, 214.5), (47.9, 217),             # friso superior do rótulo
    (47.6, 224), (46.6, 232), (44.4, 242), (40.8, 252), (36.0, 262), (30.4, 271),
    (24.4, 280), (19.0, 288), (15.2, 294), (13.2, 298), (12.6, 301),
    (12.6, 304.5), (16.6, 305), (16.8, 306.6), (13.4, 307.2),  # anel de sustentação do gargalo
    (13.2, 309),
]
WALL = 0.55  # parede grossa: PET retornável aguenta 25 ciclos

def lathe(name, prof, steps=128, close_top=False, close_bottom=False):
    bm = bmesh.new()
    rings = []
    for r, z in prof:
        ring = []
        for i in range(steps):
            a = 2 * math.pi * i / steps
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]
        for i in range(steps):
            j = (i + 1) % steps
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if close_bottom:
        bm.faces.new(list(reversed(rings[0])))
    if close_top:
        bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob

def principled(name, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    for k, v in kw.items():
        p.inputs[k].default_value = v
    return m, p

# ---------- materiais ----------
pet, _ = principled('PET', **{'Base Color': (1, 1, 1, 1), 'Roughness': 0.03, 'IOR': 1.57,
                             'Transmission Weight': 1.0})
cola, cp = principled('Cola', **{'Base Color': (0.9, 0.75, 0.6, 1), 'Roughness': 0.0, 'IOR': 1.34,
                                'Transmission Weight': 1.0})
vol = cola.node_tree.nodes.new('ShaderNodeVolumeAbsorption')
vol.inputs['Color'].default_value = (0.55, 0.16, 0.04, 1)
vol.inputs['Density'].default_value = 0.24
cola.node_tree.links.new(vol.outputs['Volume'], cola.node_tree.nodes['Material Output'].inputs['Volume'])
cap_m, _ = principled('Tampa', **{'Base Color': (srgb_to_lin(0.12), srgb_to_lin(0.54), srgb_to_lin(0.23), 1),
                                  'Roughness': 0.38, 'Coat Weight': 0.2})
label_m, lp = principled('Rotulo', **{'Roughness': 0.46, 'Coat Weight': 0.0})  # papel fosco
tex = label_m.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(LABEL)
label_m.node_tree.links.new(tex.outputs['Color'], lp.inputs['Base Color'])

# ---------- garrafa ----------
root = bpy.data.objects.new('Casco', None)
scene.collection.objects.link(root)

bottle = lathe('Garrafa', PROFILE, close_bottom=False)
bottle.data.materials.append(pet)
sol = bottle.modifiers.new('Parede', 'SOLIDIFY'); sol.thickness = WALL; sol.offset = -1
sub = bottle.modifiers.new('Suave', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
bottle.parent = root

# rosca do gargalo (fica quase toda sob a tampa)
thread = lathe('Rosca', [(13.4, 309), (14.4, 309.6), (14.4, 323), (13.0, 324)], close_top=True)
thread.data.materials.append(pet); thread.parent = root

# tampa amarela com estrias
bm = bmesh.new()
N = 120
prof_cap = [(15.2, 308.2), (16.8, 308.6), (16.9, 324.5), (16.2, 326.2), (14.0, 326.8), (0, 326.8)]
rings = []
for r, z in prof_cap:
    ring = []
    for i in range(N):
        a = 2 * math.pi * i / N
        rr = r
        if 309.5 < z < 324 and r > 16:  # estrias verticais
            rr = r + (0.35 if i % 2 == 0 else -0.05)
        ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z)))
    rings.append(ring)
# anel extra no meio para as estrias
for k in range(len(rings) - 1):
    a, b = rings[k], rings[k + 1]
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((a[i], a[j], b[j], b[i]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
me = bpy.data.meshes.new('Tampa'); bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
cap = bpy.data.objects.new('Tampa', me); scene.collection.objects.link(cap)
cap.data.materials.append(cap_m); cap.parent = root
# lacre (anel inviolável) logo abaixo da tampa
seal = lathe('Lacre', [(15.0, 307.4), (16.4, 307.6), (16.4, 308.4), (15.0, 308.6)], close_top=True, close_bottom=True)
seal.data.materials.append(cap_m); seal.parent = root

# ---------- rótulo (faixa envolvente com UV cilíndrico) ----------
def label_band(r=48.25, z0=136.6, z1=209.4, steps=180):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    top, bot = [], []
    for i in range(steps + 1):
        a = 2 * math.pi * i / steps + math.pi / 2  # u=0.5 fica de frente para a câmera (-Y)
        bot.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z0)))
        top.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z1)))
    for i in range(steps):
        f = bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
        us = (i / steps, (i + 1) / steps)
        for loop, (u, v) in zip(f.loops, ((us[0], 0), (us[1], 0), (us[1], 1), (us[0], 1))):
            loop[uv].uv = (u, v)
    me = bpy.data.meshes.new('Rotulo'); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new('Rotulo', me); scene.collection.objects.link(ob)
    return ob

full = MODE != 'still-empty'
if full:
    lab = label_band(); lab.data.materials.append(label_m); lab.parent = root
    # líquido: perfil interno, cheio até o começo do ombro
    inner = [(max(0.0, r - WALL - 0.15), z + (WALL if z < 8 else 0)) for r, z in PROFILE if z <= 258]
    fill = 258
    r_fill = 47.9 - 0.15
    for r, z in PROFILE:
        if z >= fill:
            r_fill = r - WALL - 0.15; break
    inner.append((r_fill, fill))
    liq = lathe('Liquido', inner, close_top=True)
    liq.data.materials.append(cola); liq.parent = root

# ---------- condensação: gotas espalhadas pela superfície, como na foto de geladeira ----------
import random
random.seed(11)
agua, _ = principled('Gota', **{'Base Color': (1, 1, 1, 1), 'Roughness': 0.0, 'IOR': 1.33, 'Transmission Weight': 1.0})
def radius_at(z):
    for (r0, z0), (r1, z1) in zip(PROFILE, PROFILE[1:]):
        if z0 <= z <= z1 and z1 > z0:
            t = (z - z0) / (z1 - z0)
            return r0 + (r1 - r0) * t, (r1 - r0) / (z1 - z0)
    return None, 0
def droplets(count, zmin, zmax, smin, smax, extra=0.0, name='Gotas'):
    bm = bmesh.new()
    placed = 0
    while placed < count:
        z = random.uniform(zmin, zmax)
        r, slope = radius_at(z)
        if not r or r < 14:
            continue
        if MODE != 'still-empty' and 133 < z < 213 and extra == 0:  # rótulo: gotas próprias
            continue
        a = random.uniform(0, 2 * math.pi)
        size = random.uniform(smin, smax) ** 1.0
        if random.random() < 0.08:
            size *= 2.2  # algumas gotas maiores
        geom = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        vs = geom['verts']
        n = Vector((math.cos(a), math.sin(a), -slope)).normalized()
        # achata a gota no sentido da normal e escorre um pouco para baixo
        bmesh.ops.scale(bm, vec=(size, size * 1.15, size * 0.42), verts=vs)
        rot = Vector((0, 0, 1)).rotation_difference(n).to_matrix()
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=vs)
        pos = Vector((math.cos(a) * (r + extra), math.sin(a) * (r + extra), z)) + n * (size * 0.05)
        bmesh.ops.translate(bm, vec=pos, verts=vs)
        placed += 1
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for poly in me.polygons: poly.use_smooth = True
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    ob.data.materials.append(agua); ob.parent = root
    return ob
droplets(1700, 4, 292, 0.4, 1.3)
if MODE != 'still-empty':
    droplets(360, 137, 209, 0.3, 0.85, extra=0.25, name='GotasRotulo')

# ---------- luz de estúdio (não aparece na câmera, só no reflexo) ----------
def area(name, loc, rot, size, energy, sx=None):
    L = bpy.data.lights.new(name, 'AREA')
    L.shape = 'RECTANGLE'; L.size = size; L.size_y = sx or size; L.energy = energy
    ob = bpy.data.objects.new(name, L); scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = rot
    ob.visible_camera = False
    return ob

area('Chave', (-460, -420, 300), (math.radians(70), 0, math.radians(-48)), 420, 1.5e7, 700)
area('Recorte D', (360, 160, 220), (math.radians(80), 0, math.radians(112)), 140, 0.9e7, 700)
area('Recorte E', (-360, 180, 220), (math.radians(80), 0, math.radians(-112)), 140, 0.6e7, 700)
area('Topo', (0, -60, 720), (0, 0, 0), 300, 2.5e6)
area('Fundo', (0, 520, 150), (math.radians(-90), 0, 0), 520, 2.2e7, 420)  # contraluz atrás, acende o líquido

world = bpy.data.worlds.new('Mundo'); scene.world = world
world.use_nodes = True
bgn = world.node_tree.nodes['Background']
bgn.inputs['Color'].default_value = (0.30, 0.004, 0.006, 1)  # reflete o vermelho do site
bgn.inputs['Strength'].default_value = 0.55

# chão invisível que só recebe sombra
# sem chão: a garrafa flutua sobre a cor do fundo do site

# ---------- câmera ----------
cam_d = bpy.data.cameras.new('Cam'); cam_d.lens = 85
cam_d.clip_start = 1; cam_d.clip_end = 10000
cam = bpy.data.objects.new('Cam', cam_d); scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (0, -1080, 168)
cam.rotation_euler = (math.radians(89.5), 0, 0)

# ---------- render ----------
scene.render.engine = 'CYCLES'
cy = scene.cycles
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for backend in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == backend]
            if devs:
                for d in prefs.devices: d.use = d.type == backend
                cy.device = 'GPU'; print('device', backend); break
        except Exception:
            pass
except Exception as e:
    print('gpu off', e)
cy.samples = int(os.environ.get('SAMPLES', '56'))
cy.use_denoising = True
cy.max_bounces = 14; cy.transmission_bounces = 14; cy.transparent_max_bounces = 14
cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.02
cy.denoiser = 'OPTIX' if cy.device == 'GPU' else 'OPENIMAGEDENOISE'
cy.glossy_bounces = 8; cy.caustics_reflective = False; cy.caustics_refractive = False
scene.render.film_transparent = True
cy.film_transparent_glass = True  # PET some no fundo; o site põe o vermelho por trás
scene.view_settings.view_transform = 'Standard'
try:
    scene.view_settings.look = 'None'
except Exception:
    pass
scene.view_settings.exposure = -0.15
RES = float(os.environ.get('RES', '1'))
scene.render.resolution_x = int(760 * RES)
scene.render.resolution_y = int(1140 * RES)
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

os.makedirs(OUT, exist_ok=True)
if MODE == 'turntable':
    for f in range(FRAMES):
        root.rotation_euler = (0, 0, -2 * math.pi * f / FRAMES)
        scene.render.filepath = os.path.join(OUT, f'f{f:03d}.png')
        bpy.ops.render.render(write_still=True)
        print('frame', f, flush=True)
elif MODE == 'fill':
    # garrafa com rótulo enchendo: quadro 0 vazio, último cheio até o ombro
    root.rotation_euler = (0, 0, math.radians(-8))
    old = bpy.data.objects.get('Liquido')
    if old: bpy.data.objects.remove(old, do_unlink=True)
    for f in range(FRAMES):
        t = f / (FRAMES - 1)
        level = 3 + (258 - 3) * t
        liq = bpy.data.objects.get('Liquido')
        if liq: bpy.data.objects.remove(liq, do_unlink=True)
        if level > 6:
            pts = [(max(0.0, r - WALL - 0.15), z + (WALL if z < 8 else 0)) for r, z in PROFILE if z < level]
            rl, _ = radius_at(level)
            pts.append((rl - WALL - 0.15, level))
            liq = lathe('Liquido', pts, close_top=True)
            liq.data.materials.append(cola); liq.parent = root
        scene.render.filepath = os.path.join(OUT, f'e{f:03d}.png')
        bpy.ops.render.render(write_still=True)
        print('fill', f, flush=True)
else:
    root.rotation_euler = (0, 0, math.radians(-8))
    scene.render.filepath = os.path.join(OUT, MODE + '.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'casco.blend'))
print('done')
