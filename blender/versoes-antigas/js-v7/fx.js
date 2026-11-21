// Efeitos:
// 1) carregamento: a garrafa retornável enche enquanto o site abre;
// 2) troca de página: só um fade rápido (as animações ficam na rolagem);
// 3) Início: o topo reage à rolagem (foto aproxima, texto sobe e some antes da onda, garrafa gira e cresce);
// 4) "Do casco vazio à garrafa cheia": a garrafa com rótulo enche de Coca conforme a rolagem;
// 5) Como funciona: o celular troca de tela e o fundo muda de cor a cada passo.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) carregamento */
  const loader = document.getElementById('loader');
  const t0 = performance.now();
  function hideLoader() {
    if (!loader) return;
    const wait = Math.max(0, 1300 - (performance.now() - t0));
    setTimeout(() => { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 600); }, reduce ? 0 : wait);
  }
  if (document.readyState === 'complete') hideLoader(); else addEventListener('load', hideLoader);
  setTimeout(hideLoader, 4500); // nunca prende a tela

  /* 2) troca de página */
  const main = document.getElementById('conteudo');
  function go(swap) {
    if (reduce || !main) { swap(); return; }
    main.classList.add('is-leaving');
    setTimeout(() => {
      const html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      swap();
      html.style.scrollBehavior = prev;
      main.classList.remove('is-leaving');
    }, 160);
  }

  /* 3) topo do Início */
  const hero = document.getElementById('hero');
  /* 4) garrafa enchendo */
  const band = document.getElementById('fillband');
  const fillImg = document.getElementById('fill');
  const NF = 20;
  const fillFrames = [];
  let fillShown = -1, fillWant = 0, fillLoaded = false;
  function loadFill() {
    if (fillLoaded || !fillImg) return; fillLoaded = true;
    for (let i = 0; i < NF; i++) { const im = new Image(); im.src = 'seq/e' + String(i).padStart(3, '0') + '.webp'; im.onload = () => { if (i === fillWant) paintFill(); }; fillFrames[i] = im; }
  }
  function paintFill() {
    const im = fillFrames[fillWant];
    if (fillWant !== fillShown && im && im.complete && im.naturalWidth) { fillShown = fillWant; fillImg.src = im.src; }
  }
  let ticking = false;
  function onScroll() {
    ticking = false;
    const vh = innerHeight;
    if (hero && hero.offsetParent) {
      const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.9)));
      hero.style.setProperty('--p', p.toFixed(3));
    }
    if (band && band.offsetParent && fillImg) {
      const r = band.getBoundingClientRect();
      // começa a encher quando a faixa entra na tela e termina quando o meio dela passa do meio da tela
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5 + r.height * 0.5)));
      if (p > 0) loadFill();
      fillWant = Math.round(p * (NF - 1));
      paintFill();
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  if (band && 'IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting) loadFill(); }, { rootMargin: '600px' }).observe(band);

  /* 5) Como funciona */
  const story = document.getElementById('story');
  const steps = story ? [...story.querySelectorAll('.story__steps li')] : [];
  let io = null;
  function watchStory() {
    if (!story || io) return;
    io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        story.dataset.step = e.target.dataset.i;
        steps.forEach(li => li.classList.toggle('is-on', li === e.target));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(li => io.observe(li));
  }

  function enter(name) {
    if (name === 'como-funciona') { watchStory(); if (story) story.dataset.step = '1'; steps.forEach((li, k) => li.classList.toggle('is-on', k === 0)); }
    if (name === 'lojas' && window.RetMap) window.RetMap.reset();
    requestAnimationFrame(onScroll);
  }

  window.RetFx = { go, enter };
  const first = document.querySelector('.page:not([hidden])');
  if (first) enter(first.dataset.page);
})();
