// Sequências renderizadas no Blender, tocadas de forma suave:
// - muitos quadros (giro de 2° em 2°), cada um mostrado inteiro num <canvas>, sem mistura entre quadros;
// - quadros decodificados antes (ImageBitmap), então nada decodifica durante a rolagem;
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
    const frames = new Array(N);   // ImageBitmap já decodificado (nada decodifica durante a rolagem)
    let target = opts.start || 0, cur = target, drawn = -1, running = false, ready = false, tok = 0, last = 0;
    const mod = i => ((i % N) + N) % N;

    // ordem de carga do grosso para o fino (a cada 16, 8, 4, 2, 1 quadros): a animação já gira
    // inteira com poucos quadros e vai ficando mais fluida conforme o resto chega
    const st = Math.round(opts.start || 0), dist = i => loop ? Math.min(mod(i - st), mod(st - i)) : Math.abs(i - st);
    const order = [], seen = new Set();
    [16, 8, 4, 2, 1].forEach(step => {
      const lvl = [];
      for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); lvl.push(i); }
      if (!loop && !seen.has(N - 1)) { seen.add(N - 1); lvl.push(N - 1); }
      lvl.sort((x, y) => dist(x) - dist(y)); order.push(...lvl);
    });
    order.forEach((i, k) => {
      const im = new Image();
      im.decoding = 'async';
      if (k < 12 && 'fetchPriority' in im) im.fetchPriority = 'high';
      im.onload = () => {
        const done = bm => {
          frames[i] = bm;
          if (!ready) { ready = true; cv.height = bm.height; cv.width = opts.box ? Math.round(bm.height * opts.box) : bm.width; ox = (cv.width - bm.width) / 2; ctx.imageSmoothingQuality = 'high'; box.classList.add('seq-ready'); }
          drawn = -1; shown = null; kick();
        };
        if (window.createImageBitmap) createImageBitmap(im).then(done, () => done(im)); else done(im);
      };
      im.src = url(i);
    });

    // quadro carregado mais próximo abaixo/acima de v (enquanto o resto ainda chega)
    function near(v, dir) {
      let i = dir < 0 ? Math.floor(v) : Math.floor(v) + 1;
      for (let n = 0; n < N; n++, i += dir) {
        if (!loop && (i < 0 || i > N - 1)) return null;
        const f = frames[loop ? mod(i) : i];
        if (f) return { i, f };
      }
      return null;
    }
    // sem mistura entre quadros: mostra só o quadro exato mais próximo (como um vídeo)
    let shown = null, ox = 0;  // ox: quadro estreito centralizado numa caixa mais larga (layout igual ao antigo)
    function draw(v) {
      const A = near(N < 100 ? v : v + 0.5, -1), B = near(N < 100 ? v : v + 0.5, 1);
      if (N < 100 && A && B) {  // sequência antiga, com poucos quadros: mistura suave entre eles
        const t = (v - A.i) / Math.max(1e-6, B.i - A.i);
        ctx.clearRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; ctx.drawImage(A.f, ox, 0, A.f.width, cv.height);
        if (t > 0.01) { ctx.globalAlpha = t; ctx.drawImage(B.f, ox, 0, B.f.width, cv.height); }
        ctx.globalAlpha = 1; shown = null; return true;
      }
      const pick = !A ? B : !B ? A : (v - A.i <= B.i - v ? A : B);
      if (!pick) return false;
      if (pick.f === shown) return true;
      shown = pick.f;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(pick.f, ox, 0, pick.f.width, cv.height);
      return true;
    }
    function tick() {
      running = false;
      if (!ready) return;
      const now = performance.now(), dt = last ? Math.min(64, now - last) : 16.7; last = now;
      const d = target - cur, k = 1 - Math.pow(1 - (opts.ease || 0.14), dt / 16.7);
      cur = Math.abs(d) < 0.002 || reduce ? target : cur + d * k;
      const key = N < 100 ? Math.round(cur * 100) : Math.round(cur);
      if (key !== drawn) { if (draw(cur)) drawn = key; }
      if (cur !== target) kick(); else last = 0;
    }
    // um passo por quadro de tela; o temporizador só entra se o navegador não chamar o rAF (aba oculta)
    function kick() {
      if (running) return;
      running = true; const id = ++tok;
      requestAnimationFrame(() => { if (id === tok && running) tick(); });
      setTimeout(() => { if (id === tok && running) tick(); }, 120);
    }
    return {
      set(v) { target = loop ? v : Math.max(0, Math.min(N - 1, v)); kick(); },
      jump(v) { target = cur = loop ? v : Math.max(0, Math.min(N - 1, v)); drawn = -1; kick(); },
      get N() { return N; }
    };
  }
  window.SeqPlayer = SeqPlayer;
  // celular: jogo de quadros menor (metade dos quadros, imagem menor) para caber na memória
  const small = matchMedia('(max-width: 760px)').matches;
  window.SeqPick = (el, n0, p0) => ({
    frames: parseInt((small && el.dataset.framesM) || el.dataset.frames || n0, 10),
    prefix: (small && el.dataset.prefixM) || el.dataset.prefix || p0
  });

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
  const pick = window.SeqPick(img, '36', 'seq/f'), N = pick.frames;
  const player = SeqPlayer(img, { frames: N, loop: true, url: i => pick.prefix + String(i).padStart(3, '0') + '.webp', start: reduce ? 0 : N / 2, ease: 0.12, box: img.dataset.box ? parseFloat(img.dataset.box) : 0 });
  const scrollFrame = () => (window.scrollY / (window.innerHeight * 1.6)) * N;
  // entrada: meia volta até ficar de frente
  player.set(scrollFrame());
  addEventListener('scroll', () => player.set(scrollFrame()), { passive: true });
})();
