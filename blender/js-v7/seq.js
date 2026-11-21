// Garrafa 3D do topo: 36 quadros renderizados no Blender (giro de 360°).
// A rolagem gira a garrafa; na entrada ela dá meia volta e termina de frente.
// O quadro desejado fica guardado em `target`: se ele ainda não carregou, entra assim que carregar,
// então a garrafa nunca fica presa num quadro intermediário (de lado).
document.documentElement.classList.add('js');
(function () {
  const img = document.getElementById('seq');
  const hero = document.querySelector('.hero');

  // Se o topo ficar mais alto que a tela, ele deixa de ficar parado; senão a onda cobriria o texto
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

  if (!img) return;
  const N = 36;
  const mod = i => ((Math.round(i) % N) + N) % N;
  const src = i => 'seq/f' + String(mod(i)).padStart(3, '0') + '.webp';
  let target = 0, shown = 0;
  const ready = i => cache[i] && cache[i].complete && cache[i].naturalWidth > 0;
  function paint() {
    if (target !== shown && ready(target)) { shown = target; img.src = cache[target].src; }
  }
  function show(i) { target = mod(i); paint(); }
  const cache = [];
  // carrega primeiro o quadro de frente e os vizinhos, depois o resto
  const order = [...Array(N).keys()].sort((a, b) => Math.min(a, N - a) - Math.min(b, N - b));
  order.forEach(i => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { if (i === target) paint(); };
    im.src = src(i);
    cache[i] = im;
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollFrame = () => (window.scrollY / (window.innerHeight * 1.6)) * N;

  let intro = !reduce;
  if (intro) {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1200);
      const e = 1 - Math.pow(1 - p, 3);
      show(18 - 18 * e + scrollFrame());
      if (p < 1) requestAnimationFrame(step); else { intro = false; show(scrollFrame()); }
    };
    requestAnimationFrame(step);
    // garantia: mesmo com a aba em segundo plano (sem animação), termina de frente
    setTimeout(() => { if (intro) { intro = false; show(scrollFrame()); } }, 1600);
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (intro || reduce || ticking) return;
    ticking = true;
    requestAnimationFrame(() => { show(scrollFrame()); ticking = false; });
  }, { passive: true });
})();
