// Site da Coca-Cola Retornável: páginas, abas e lojas. Protótipo: nada sai do navegador.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // o site troca de página pelo endereço: o navegador não deve devolver a rolagem antiga ao recarregar
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* Header e reveal */
  const topbar = $('.topbar');
  addEventListener('scroll', () => topbar.classList.toggle('is-scrolled', scrollY > 8), { passive: true });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }
  // o botão flutuante do chat sai de cena quando o rodapé aparece (não cobre os links)
  const launch = $('.chat-launch'), foot = $('.footer');
  if (launch && foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => launch.classList.toggle('is-away', es[0].isIntersecting)).observe(foot);
  }

  /* Sheets */
  let lastFocus = null;
  function openSheet(name, tab) {
    const sheet = $('#sheet-' + name);
    if (!sheet) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    if (name !== 'chat') document.body.style.overflow = 'hidden';
    document.body.classList.toggle('chat-open', name === 'chat');
    if (name === 'chat' && window.RetChat) { window.RetChat.open(); return; }
    const f = sheet.querySelector('input, button:not([data-close])');
    if (f) f.focus();
  }
  function closeSheets() {
    $$('.sheet').forEach(s => s.hidden = true);
    document.body.style.overflow = '';
    document.body.classList.remove('chat-open');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openSheet(o.dataset.open, o.dataset.tab); return; }
    if (e.target.closest('[data-close]') || e.target.classList.contains('sheet')) closeSheets();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

  /* Lojas: lista + mapa ilustrativo (map.js). Dados de exemplo; a localização é simulada. */
  const STORES = (window.RetMap && window.RetMap.STORES) || [];
  let storeFilter = 'todas';
  function renderStores(filter) {
    const list = $('#stores');
    if (!list) return;
    list.textContent = '';
    const q = (filter || '').toLowerCase().trim();
    const rows = STORES
      .map(s => Object.assign({}, s, { coldNow: s.cold !== false }))
      .filter(s => !q || (s.name + ' ' + s.bairro).toLowerCase().includes(q))
      .filter(s => storeFilter === 'todas' || (storeFilter === 'disponivel' ? s.coldNow : s.tags.includes(storeFilter)))
      .sort((a, b) => (b.coldNow - a.coldNow) || (a.km - b.km));
    if (window.RetMap) window.RetMap.render(rows);
    if (!rows.length) { $('#finder-status').textContent = 'Nenhuma loja parceira com esse filtro.'; return; }
    rows.forEach(s => {
      const li = document.createElement('li');
      li.className = 'store' + (s.coldNow ? '' : ' is-off');
      li.dataset.id = s.id;
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.innerHTML = '<span class="store__n"></span><h3></h3><span class="store__km"></span><p class="b"></p><span class="store__state"></span>';
      li.querySelector('.store__n').textContent = s.n;
      li.querySelector('h3').textContent = s.name;
      li.querySelector('.store__km').textContent = s.km.toLocaleString('pt-BR') + ' km';
      li.querySelector('.b').textContent = s.bairro;
      const st = li.querySelector('.store__state');
      st.textContent = s.coldNow ? 'Disponível hoje' : 'Em falta hoje';
      st.classList.add(s.coldNow ? 'store__state--ok' : 'store__state--off');
      const open = () => { if (window.RetMap) window.RetMap.select(s.id); if (window.RetShop) window.RetShop.open(s.id); };
      li.addEventListener('click', open);
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      list.append(li);
    });
  }
  if (window.RetMap) window.RetMap.onSelect((id, fromMap) => {
    document.querySelectorAll('#stores .store').forEach(li => li.classList.toggle('is-sel', li.dataset.id === id));
    if (fromMap) { const li = document.querySelector('#stores .store[data-id="' + id + '"]'); if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); if (window.RetShop) window.RetShop.open(id); }
  });
  $('#btn-locate').addEventListener('click', () => {
    // Protótipo: posição simulada no Centro, sem pedir a localização real ao navegador
    $('#finder-status').textContent = 'Mostrando lojas perto do Centro de Nova Iguaçu (localização simulada).';
    if (window.RetMap) window.RetMap.showMe();
    renderStores($('#bairro').value);
  });
  $('#bairro').addEventListener('input', e => { $('#finder-status').textContent = ''; renderStores(e.target.value); });
  const fsel = document.getElementById('filter-sel');
  if (fsel) fsel.addEventListener('change', () => { storeFilter = fsel.value; renderStores($('#bairro').value); });
  document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
    storeFilter = b.dataset.f;
    document.querySelectorAll('.filter').forEach(x => x.classList.toggle('is-on', x === b));
    renderStores($('#bairro').value);
  }));
  renderStores();

  window.Ret = { openSheet, closeSheets };

  /* Páginas: #/inicio, #/como-funciona, #/lojas, #/duvidas.
     #/chat abre o chat por cima da página atual. Âncoras antigas (#lojas...) continuam valendo. */
  const ROUTES = {
    inicio: 'Coca-Cola Retornável',
    'como-funciona': 'Como funciona · Retornável',
    lojas: 'Lojas · Retornável',
    duvidas: 'Dúvidas · Retornável'
  };
  const LEGACY = { topo: 'inicio', como: 'inicio', saldo: 'inicio', lembretes: 'como-funciona', privacidade: 'como-funciona', fluxo: 'como-funciona', pontos: 'lojas', lojas: 'lojas', duvidas: 'duvidas' };
  let current = null;
  const menuBtn = $('#menu-btn'), nav = $('#nav');
  function closeMenu() { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  function show(name) {
    if (name === current) { closeMenu(); return; }
    if (current && window.RetFx && !show._swap) { closeMenu(); window.RetFx.go(() => { show._swap = true; show(name); show._swap = false; }); return; }
    current = name;
    $$('.page').forEach(p => { p.hidden = p.dataset.page !== name; });
    $$('[data-route]').forEach(a => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = ROUTES[name];
    closeMenu();
    window.scrollTo(0, 0);
    if (name === 'inicio') dispatchEvent(new Event('resize'));
    if (window.RetFx) window.RetFx.enter(name);
  }
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    let name = h.startsWith('/') ? h.slice(1).split(/[/?]/)[0] : LEGACY[h];
    if (name === 'chat') {
      if (!current) show('inicio');
      if (window.RetChat) openSheet('chat');
      return;
    }
    if (!name) { if (!current) show('inicio'); return; } // ex.: #conteudo, link de pular
    show(ROUTES[name] ? name : 'inicio');
  }
  addEventListener('hashchange', route);
  // Ao fechar o chat aberto por #/chat, volta o endereço para a página atual
  document.addEventListener('click', e => {
    if ((e.target.closest('[data-close]') || e.target.classList.contains('sheet')) && location.hash === '#/chat') history.replaceState(null, '', '#/' + current);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); if (location.hash === '#/chat') history.replaceState(null, '', '#/' + current); } });
  route();
})();
