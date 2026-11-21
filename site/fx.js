// Efeitos:
// 1) carregamento: a garrafa retornável enche enquanto o site abre;
// 2) troca de página: só um fade rápido (as animações ficam na rolagem);
// 3) Início: o topo reage à rolagem (foto aproxima, texto sobe e some antes da onda, garrafa gira e cresce);
// 4) "Do casco vazio à garrafa cheia": a garrafa com rótulo enche de Coca conforme a rolagem;
// 5) Como funciona: o celular troca de tela e o fundo muda de cor a cada passo.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) carregamento */
  // só na primeira visita da sessão; sai assim que a página carrega (mínimo curto para não piscar)
  const loader = document.getElementById('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('ret-loaded') === '1'; sessionStorage.setItem('ret-loaded', '1'); } catch {}
  if (loader && (seen || reduce)) loader.remove();
  if (loader && loader.isConnected) document.documentElement.classList.add('is-loading');
  const t0 = performance.now();
  let hidden = false;
  function hideLoader() {
    if (!loader || hidden || !loader.isConnected) return;
    hidden = true;
    const wait = Math.max(0, 500 - (performance.now() - t0));
    setTimeout(() => { loader.classList.add('is-done'); document.documentElement.classList.remove('is-loading'); setTimeout(() => loader.remove(), 400); }, wait);
  }
  // sai quando o HTML e as fontes estão prontos (não espera os quadros 3D, que carregam depois)
  const ready = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(hideLoader);
  if (document.readyState !== 'loading') ready(); else addEventListener('DOMContentLoaded', ready);
  setTimeout(hideLoader, 1800); // nunca prende a tela

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
  const story = document.getElementById('story');
  const steps = story ? [...story.querySelectorAll('.story__steps li')] : [];

  /* 4) garrafa enchendo */
  const band = document.getElementById('fillband');
  const fillImg = document.getElementById('fill');
  const fpick = fillImg && window.SeqPick ? window.SeqPick(fillImg, '20', 'seq/e') : { frames: 20, prefix: 'seq/e' };
  const NF = fpick.frames;
  let fillPlayer = null, fillWant = 0;
  function loadFill() {
    if (fillPlayer || !fillImg || !window.SeqPlayer) return;
    fillPlayer = window.SeqPlayer(fillImg, { frames: NF, loop: false, url: i => fpick.prefix + String(i).padStart(3, '0') + '.webp', start: 0, ease: 0.16 });
    fillPlayer.set(fillWant);
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
      // começa quando 35% da garrafa já está visível e termina quando ela está inteira no alto da tela
      const r = fillImg.getBoundingClientRect();
      const start = vh - r.height * 0.35, end = Math.min(vh * 0.18, vh - r.height - 20);
      const p = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, start - end)));
      fillWant = p * (NF - 1);
      if (p > 0) loadFill();
      if (fillPlayer) fillPlayer.set(fillWant);
    }
    // Como funciona: passo ativo = o último cujo topo já passou da linha de leitura
    // (meio da tela no computador; alto da tela no celular, onde o texto fica em cima do iPhone)
    // celular: ao abrir a página o iPhone começa mais baixo (texto do topo inteiro à vista)
    // e sobe para a posição normal nos primeiros ~20% de tela rolados
    if (story && story.offsetParent) story.style.setProperty('--drop', innerWidth <= 860 ? Math.max(0, 1 - scrollY / (vh * 0.2)).toFixed(3) : '0');
    if (story && story.offsetParent && steps.length) {
      const line = innerWidth <= 860 ? vh * 0.3 : vh * 0.5;
      let act = steps[0];
      steps.forEach(li => { if (li.getBoundingClientRect().top < line) act = li; });
      if (story.dataset.step !== act.dataset.i) {
        story.dataset.step = act.dataset.i;
        steps.forEach(li => li.classList.toggle('is-on', li === act));
      }
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  if (band && 'IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting) loadFill(); }, { rootMargin: '600px' }).observe(band);

  /* 5) Como funciona */
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
