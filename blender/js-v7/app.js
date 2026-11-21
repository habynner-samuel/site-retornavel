// Protótipo: todo o estado fica no navegador. Na versão real, saldo, códigos e
// login são validados no servidor (ver PESQUISA.md, seção Segurança).
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const KEY = 'retornavel-demo-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const fresh = () => ({
    phone: null, bal: 2, history: [
      { t: 'Devolução no coletor', where: 'Mercearia do Seu Zé', at: '2026-10-21T08:10' },
      { t: 'Saldo usado', where: 'Prezunic Nova Iguaçu', at: '2026-10-14T18:40' }
    ],
    rem: null, code: null, returnsToday: { day: '', n: 0 },
    shop: { cold: true, loja: 18, vales: 3 }
  });
  let state = Object.assign(fresh(), load() || {});

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

  /* Sheets */
  let lastFocus = null;
  function openSheet(name, tab) {
    const sheet = $('#sheet-' + name);
    if (!sheet) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    if (name !== 'chat') document.body.style.overflow = 'hidden';
    document.body.classList.toggle('chat-open', name === 'chat');
    if (name === 'conta') { renderConta(); if (tab && state.phone) selectTab(tab); }
    if (name === 'lojista') renderShop();
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

  function toast(el, msg) {
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.textContent = '', 4200);
  }
  const fmtDate = iso => new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const plural = n => n === 1 ? 'garrafa' : 'garrafas';

  /* Login: celular + código. No servidor real o código vai por SMS e expira. */
  let pendingOtp = null, otpTries = 0;
  $('#form-phone').addEventListener('submit', e => {
    e.preventDefault();
    const digits = $('#phone').value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      $('#phone-err').textContent = 'Confira o número com DDD. Exemplo: (21) 99999-0000.';
      return;
    }
    $('#phone-err').textContent = '';
    pendingOtp = { phone: digits, code: String(Math.floor(100000 + Math.random() * 900000)) };
    otpTries = 0;
    $('#otp-demo').textContent = 'Demonstração: o código seria enviado por SMS. Use ' + pendingOtp.code + '.';
    $('#form-phone').hidden = true;
    $('#form-otp').hidden = false;
    $('#otp').value = '';
    $('#otp').focus();
  });
  $('#otp-back').addEventListener('click', () => {
    $('#form-otp').hidden = true; $('#form-phone').hidden = false; $('#phone').focus();
  });
  $('#form-otp').addEventListener('submit', e => {
    e.preventDefault();
    if (!pendingOtp) return;
    if (++otpTries > 5) { $('#otp-err').textContent = 'Muitas tentativas. Peça um novo código.'; return; }
    if ($('#otp').value.trim() !== pendingOtp.code) { $('#otp-err').textContent = 'Código não confere.'; return; }
    $('#otp-err').textContent = '';
    state.phone = pendingOtp.phone;
    pendingOtp = null;
    save();
    renderConta();
    // Primeiro acesso: leva direto às perguntas do lembrete
    selectTab(state.rem ? 'saldo' : 'lembretes');
  });

  function renderConta() {
    const logged = !!state.phone;
    $('[data-view="login"]').hidden = logged;
    $('[data-view="app"]').hidden = !logged;
    if (!logged) { $('#form-phone').hidden = false; $('#form-otp').hidden = true; return; }
    const p = state.phone;
    $('#hello').textContent = 'Celular final ' + p.slice(-4);
    $('#bal').textContent = state.bal;
    $('#bal-unit').textContent = plural(state.bal);
    renderCode();
    renderRem();
    renderHistory();
  }

  function selectTab(name) {
    $$('[data-tab-btn]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tabBtn === name)));
    $$('#sheet-conta .tab').forEach(t => t.hidden = t.dataset.tab !== name);
  }
  $$('[data-tab-btn]').forEach(b => b.addEventListener('click', () => selectTab(b.dataset.tabBtn)));

  /* Devolver no coletor: teto de 6 por dia por número */
  $('#act-devolver').addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    if (state.returnsToday.day !== today) state.returnsToday = { day: today, n: 0 };
    if (state.returnsToday.n >= 6) {
      toast($('#toast'), 'Limite de 6 garrafas por dia no coletor. O resto dá para registrar amanhã.');
      return;
    }
    state.returnsToday.n++;
    state.bal++;
    state.history.unshift({ t: 'Devolução no coletor', where: 'Mercearia do Seu Zé', at: new Date().toISOString() });
    save(); renderConta();
    toast($('#toast'), 'Casco recebido. Saldo atual: ' + state.bal + ' ' + plural(state.bal) + '.');
  });

  /* Usar saldo: código de uso único, 2 horas */
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function newCode() {
    const buf = new Uint32Array(6);
    crypto.getRandomValues(buf);
    return [...buf].map(n => ALPHA[n % ALPHA.length]).join('');
  }
  $('#act-usar').addEventListener('click', () => {
    if (state.bal < 1) {
      toast($('#toast'), 'Você ainda não tem saldo. Esqueceu o casco? Posso passar o lembrete para a manhã do dia.');
      return;
    }
    state.code = { v: newCode(), exp: Date.now() + 2 * 60 * 60 * 1000 };
    save(); renderCode();
  });
  function renderCode() {
    const box = $('#code-box');
    const c = state.code;
    if (!c || c.exp < Date.now()) { box.hidden = true; state.code = null; return; }
    box.hidden = false;
    $('#code-txt').textContent = c.v.slice(0, 3) + ' ' + c.v.slice(3);
    $('#code-exp').textContent = new Date(c.exp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const qr = $('#qr');
    qr.textContent = '';
    if (window.QRCode) new QRCode(qr, { text: 'RET:' + c.v, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
  }

  /* Lembretes */
  const DAY_BEFORE = { segunda: 'domingo', 'terça': 'segunda', quarta: 'terça', quinta: 'quarta', sexta: 'quinta', 'sábado': 'sexta', domingo: 'sábado' };
  function remSentence(r) {
    if (!r || r.off) return 'Lembretes desligados. Seu saldo continua guardado.';
    if (r.pausedUntil && r.pausedUntil > Date.now()) return 'Lembretes pausados até ' + new Date(r.pausedUntil).toLocaleDateString('pt-BR') + '.';
    if (r.freq === 'ocasioes') return 'Sem lembrete fixo. Quando for comprar, é só avisar o dia.';
    const every = { 7: 'Toda', 15: 'A cada 15 dias, na', 30: 'Uma vez por mês, na', varia: 'Quando completar o seu intervalo, na' }[r.freq] || 'Toda';
    if (r.dia === 'varia') return 'Lembrete às 19h, um dia antes de completar o seu intervalo médio.';
    const when = r.hora === 'vespera' ? 'lembrete ' + (DAY_BEFORE[r.dia] || 'na véspera') + ' às 19h' : 'lembrete no dia às 7h30';
    return every + ' ' + r.dia + ', ' + when + '.';
  }
  function renderRem() {
    const r = state.rem;
    $('#rem-summary').textContent = r ? remSentence(r) : 'Quatro perguntas rápidas e pronto.';
    const f = $('#form-rem');
    if (r) {
      f.freq.value = r.freq; f.dia.value = r.dia;
      f.querySelector(`[name=hora][value=${r.hora}]`).checked = true;
      f.ok.checked = !r.off;
    }
  }
  $('#form-rem').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    state.rem = { freq: f.freq.value, dia: f.dia.value, hora: f.hora.value, off: !f.ok.checked, consentAt: f.ok.checked ? new Date().toISOString() : null };
    save(); renderRem();
    const hint = $('#push-hint');
    if (!f.ok.checked) { hint.textContent = 'Salvo sem lembrete. Você pode ligar quando quiser.'; return; }
    const p = state.phone || '';
    hint.textContent = 'Pronto. O lembrete chega por SMS no celular final ' + p.slice(-4) + '. Para parar, responda PARAR.';
  });
  $('#rem-pause').addEventListener('click', () => {
    state.rem = Object.assign({ freq: '7', dia: 'terça', hora: 'vespera' }, state.rem, { pausedUntil: Date.now() + 30 * 864e5, off: false });
    save(); renderRem();
  });
  $('#rem-off').addEventListener('click', () => {
    state.rem = Object.assign({ freq: '7', dia: 'terça', hora: 'vespera' }, state.rem, { off: true, pausedUntil: null });
    save(); renderRem();
  });

  function renderHistory() {
    const ul = $('#history');
    ul.textContent = '';
    if (!state.history.length) { ul.innerHTML = '<li><span>Nenhuma troca ainda.</span></li>'; return; }
    state.history.slice(0, 20).forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = h.t + ' · ' + h.where;
      const b = document.createElement('span'); b.textContent = fmtDate(h.at);
      li.append(a, b); ul.append(li);
    });
  }

  $('#logout').addEventListener('click', () => { state.phone = null; save(); renderConta(); });
  $('#erase').addEventListener('click', () => {
    if (!confirm('Apagar cadastro, saldo e histórico deste aparelho?')) return;
    try { localStorage.removeItem(KEY); localStorage.removeItem('retornavel-chat-v2'); } catch {}
    state = fresh();
    if (window.RetChat) window.RetChat.reset();
    renderConta();
  });

  /* Lojas: lista + mapa ilustrativo (map.js). Dados de exemplo; a localização é simulada. */
  const STORES = (window.RetMap && window.RetMap.STORES) || [];
  let storeFilter = 'todas';
  function renderStores(filter) {
    const list = $('#stores');
    if (!list) return;
    list.textContent = '';
    const q = (filter || '').toLowerCase().trim();
    const rows = STORES
      .map(s => Object.assign({}, s, { coldNow: s.id === 'ze' ? state.shop.cold : s.cold }))
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
      li.innerHTML = '<span class="store__n"></span><h3></h3><span class="store__km"></span><p class="b"></p><span class="store__state"></span>';
      li.querySelector('.store__n').textContent = s.n;
      li.querySelector('h3').textContent = s.name;
      li.querySelector('.store__km').textContent = s.km.toLocaleString('pt-BR') + ' km';
      li.querySelector('.b').textContent = s.kind + ' · ' + s.bairro;
      const st = li.querySelector('.store__state');
      st.textContent = s.coldNow ? 'Disponível hoje' : 'Em falta hoje';
      st.classList.add(s.coldNow ? 'store__state--ok' : 'store__state--off');
      li.addEventListener('click', () => window.RetMap && window.RetMap.select(s.id));
      li.addEventListener('keydown', e => { if (e.key === 'Enter') window.RetMap && window.RetMap.select(s.id); });
      list.append(li);
    });
  }
  if (window.RetMap) window.RetMap.onSelect((id, fromMap) => {
    document.querySelectorAll('#stores .store').forEach(li => li.classList.toggle('is-sel', li.dataset.id === id));
    if (fromMap) { const li = document.querySelector('#stores .store[data-id="' + id + '"]'); if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
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

  /* Área do lojista */
  function renderShop() {
    const s = state.shop;
    $('#cold').checked = s.cold;
    $('#cold-txt').textContent = s.cold ? 'Sua loja aparece na busca.' : 'Sua loja está fora da busca hoje.';
    $('#st-loja').textContent = s.loja;
    $('#st-vales').textContent = s.vales;
    const total = s.loja + s.vales;
    $('#st-cx').textContent = Math.floor(total / 12);
    const falta = (12 - (total % 12)) % 12;
    $('#st-falta').textContent = falta ? 'faltam ' + falta + ' para a próxima' : 'caixas fechadas';
  }
  $('#cold').addEventListener('change', e => { state.shop.cold = e.target.checked; save(); renderShop(); renderStores($('#bairro').value); });
  $('#st-add').addEventListener('click', () => { state.shop.loja++; save(); renderShop(); toast($('#toast-loja'), 'Casco registrado.'); });
  $('#st-recolher').addEventListener('click', () => toast($('#toast-loja'), 'Pedido de recolhimento enviado ao distribuidor (exemplo).'));
  $('#form-vale').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#vale').value.replace(/\s/g, '').toUpperCase();
    const c = state.code;
    if (!c || c.exp < Date.now() || v !== c.v) {
      toast($('#toast-loja'), 'Código inválido ou vencido. Peça para o cliente gerar outro.');
      return;
    }
    // Dupla confirmação simplificada: na versão real o cliente confirma no celular dele
    state.bal--; state.code = null; state.shop.vales++;
    state.history.unshift({ t: 'Saldo usado', where: 'Mercearia do Seu Zé', at: new Date().toISOString() });
    save(); renderShop();
    $('#vale').value = '';
    toast($('#toast-loja'), 'Troca confirmada. O vale entra na próxima prestação de contas.');
  });

  /* Ponte com o Retornável Chat (chat.js): o chat usa o mesmo saldo, histórico
     e lembretes da conta. O QR (?o=rotulo, ?o=coletor...) é tratado em chat.js. */
  window.Ret = {
    get state() { return state; },
    set state(v) { state = v; },
    fresh, save, openSheet, closeSheets,
    refresh() { renderConta(); renderShop(); renderStores($('#bairro').value); }
  };

  /* Páginas: #/inicio, #/como-funciona, #/lojas, #/lojistas, #/duvidas.
     #/chat abre o chat por cima da página atual. Âncoras antigas (#lojas...) continuam valendo. */
  const ROUTES = {
    inicio: 'Retornável · Troca Fácil',
    'como-funciona': 'Como funciona · Retornável',
    lojas: 'Lojas · Retornável',
    lojistas: 'Para lojistas · Retornável',
    duvidas: 'Dúvidas · Retornável'
  };
  const LEGACY = { topo: 'inicio', como: 'inicio', saldo: 'inicio', lembretes: 'como-funciona', privacidade: 'como-funciona', fluxo: 'como-funciona', pontos: 'lojas', lojas: 'lojas', lojista: 'lojistas', duvidas: 'duvidas' };
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
