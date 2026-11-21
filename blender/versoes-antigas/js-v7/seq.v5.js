// Sequências renderizadas no Blender, tocadas de forma suave:
// - cada quadro é desenhado num <canvas> misturando o quadro atual com o próximo (sem "pulos" de 6°);
// - a posição persegue o alvo com inércia leve, então a rolagem não dá trancos;
// - o quadro desejado entra assim que carregar, então nunca fica preso de lado.
document.documentElement.classList.add('js');
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function SeqPlayer(img, opts) {
    const N = opts.frames, loop = !!opts.loop, url = opts.url;
    const box = img.parentElement;
    const cv = document.createElement('canvas');
    cv.className = 'seq-canvas';
    cv.setAttribute('aria-hidden', 'true');
    box.appendChild(cv);
    const ctx = cv.getContext('2d');
    const frames = new Array(N);
    let target = opts.start || 0, cur = target, drawn = -1, running = false, ready = false;
    const mod = i => ((i % N) + N) % N;
    const ok = i => { const f = frames[loop ? mod(i) : Math.max(0, Math.min(N - 1, i))]; return f && f.complete && f.naturalWidth > 0 ? f : null; };

    // carrega primeiro os quadros perto do início, depois o resto
    const order = [...Array(N).keys()].sort((a, b) => (loop ? Math.min(a, N - a) - Math.min(b, N - b) : a - b));
    order.forEach(i => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        if (!ready) { ready = true; cv.width = im.naturalWidth; cv.height = im.naturalHeight; box.classList.add('seq-ready'); }
        drawn = -1; kick();
      };
      im.src = url(i);
      frames[i] = im;
    });

    function draw(v) {
      const a = Math.floor(v), t = v - a;
      const fa = ok(a), fb = ok(a + 1);
      if (!fa && !fb) return false;
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (fa) { ctx.globalAlpha = 1; ctx.drawImage(fa, 0, 0, cv.width, cv.height); }
      if (fb && t > 0.01) { ctx.globalAlpha = fa ? t : 1; ctx.drawImage(fb, 0, 0, cv.width, cv.height); }
      ctx.globalAlpha = 1;
      return true;
    }
    function tick() {
      running = false;
      if (!ready) return;
      const d = target - cur;
      cur = Math.abs(d) < 0.002 || reduce ? target : cur + d * (opts.ease || 0.14);
      const key = Math.round(cur * 100);
      if (key !== drawn) { if (draw(cur)) drawn = key; }
      if (cur !== target) kick();
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(tick); setTimeout(() => { if (running) tick(); }, 60); } }
    return {
      set(v) { target = loop ? v : Math.max(0, Math.min(N - 1, v)); kick(); },
      jump(v) { target = cur = loop ? v : Math.max(0, Math.min(N - 1, v)); drawn = -1; kick(); },
      get N() { return N; }
    };
  }
  window.SeqPlayer = SeqPlayer;

  /* topo da home: garrafa girando */
  const hero = document.querySelector('.hero');
  function fitHero() {
    if (!hero) return;
    hero.classList.remove('hero--flow');
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top')) || 64;
    if (hero.offsetHeight > innerHeight - top + 2) hero.classList.add('hero--flow');
  }
  addEventListener('resize', fitHero);
  addEventListener('load', fitHero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
  fitHero();

  const img = document.getElementById('seq');
  if (!img) return;
  const N = parseInt(img.dataset.frames || '36', 10);
  const pad = String(N > 99 ? 3 : 3);
  const player = SeqPlayer(img, { frames: N, loop: true, url: i => (img.dataset.prefix || 'seq/f') + String(i).padStart(3, '0') + '.webp', start: reduce ? 0 : N / 2, ease: 0.12 });
  const scrollFrame = () => (window.scrollY / (window.innerHeight * 1.6)) * N;
  // entrada: meia volta até ficar de frente
  player.set(scrollFrame());
  addEventListener('scroll', () => player.set(scrollFrame()), { passive: true });
})();
