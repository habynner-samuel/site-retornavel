import io, os, sys
W = sys.argv[1]
p = os.path.join(W, 'site/fx.js')
s = io.open(p, encoding='utf-8').read()
a = s.index('  const NF = 20;')
b = s.index('  let ticking = false;')
s = s[:a] + '''  const NF = 20;
  let fillPlayer = null, fillWant = 0;
  function loadFill() {
    if (fillPlayer || !fillImg || !window.SeqPlayer) return;
    fillPlayer = window.SeqPlayer(fillImg, { frames: NF, loop: false, url: i => 'seq/e' + String(i).padStart(3, '0') + '.webp', start: 0, ease: 0.16 });
    fillPlayer.set(fillWant);
  }
''' + s[b:]
old = """      if (p > 0) loadFill();
      fillWant = Math.round(p * (NF - 1));
      paintFill();"""
assert old in s
s = s.replace(old, """      fillWant = p * (NF - 1);
      if (p > 0) loadFill();
      if (fillPlayer) fillPlayer.set(fillWant);""")
io.open(p, 'w', encoding='utf-8').write(s)

c = os.path.join(W, 'site/styles.css')
css = io.open(c, encoding='utf-8').read()
css += '''
/* =================== v9: sequências em canvas (suaves) =================== */
.steps-band__img { position: relative; }
.seq-canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
.hero__bottle .seq-canvas { filter: drop-shadow(0 40px 40px rgba(50,0,0,.45)); }
.steps-band__img .seq-canvas { filter: drop-shadow(0 30px 34px rgba(40,0,0,.45)); }
.seq-ready > img { opacity: 0; }
'''
io.open(c, 'w', encoding='utf-8').write(css)

t = os.path.join(W, 'blender/template.html')
h = io.open(t, encoding='utf-8').read()
old = '<img id="seq" src="seq/f000.webp" width="480" height="795"'
assert old in h
h = h.replace(old, '<img id="seq" src="seq/f000.webp" width="480" height="795" data-frames="36" data-prefix="seq/f"')
h = h.replace('seq.js?v=4', 'seq.js?v=5').replace('fx.js?v=5', 'fx.js?v=6').replace('styles.css?v=50', 'styles.css?v=51')
io.open(t, 'w', encoding='utf-8').write(h)
print('ok')
