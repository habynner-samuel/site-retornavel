// Retornável Chat: o mesmo roteiro do antigo canal de WhatsApp, agora dentro do site.
// Usa o mesmo saldo, histórico e lembretes da conta (window.Ret, em app.js).
// Os lembretes saem por SMS. Protótipo: nada sai do navegador.
(function () {
  const $ = s => document.querySelector(s);
  const KEY = 'retornavel-chat-v2';
  const Ret = window.Ret;
  const st = () => Ret.state;

  /* ---------- dados e utilidades ---------- */
  const ORIGENS = {
    rotulo: { txt: 'Oi! Quero usar minha retornável', onde: 'rótulo da garrafa', cod: 'ROT' },
    gondola: { txt: 'Oi! Quero usar minha retornável', onde: 'gôndola', cod: 'GON' },
    caixa: { txt: 'Oi! Quero usar minha retornável', onde: 'caixa do lojista', cod: 'CX' },
    coletor: { txt: 'Oi! Vim devolver garrafa', onde: 'coletor da Mercearia do Seu Zé', cod: 'COL' },
    maquina: { txt: 'Oi! Deixei um casco na máquina', onde: 'máquina da Estação Nova Iguaçu', cod: 'MAQ' },
    site: { txt: 'Oi! Quero usar minha retornável', onde: 'site', cod: 'SITE' }
  };
  const ALIAS = { rot: 'rotulo', 'rótulo': 'rotulo', gon: 'gondola', cx: 'caixa', col: 'coletor', maq: 'maquina', 'máquina': 'maquina' };
  function origemDaURL() {
    const q = new URLSearchParams(location.search);
    let o = (q.get('o') || q.get('origem') || '').toLowerCase().split('-')[0];
    o = ALIAS[o] || o;
    return ORIGENS[o] ? o : null;
  }
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIA_BTNS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Varia'];
  const FREQS = [['Toda semana', '7', 7], ['A cada 15 dias', '15', 14], ['Uma vez por mês', '30', 30], ['Varia', 'varia', 10], ['Só em ocasiões', 'ocasioes', 0]];
  const freqLabel = v => (FREQS.find(f => f[1] === v) || [''])[0];
  const freqDias = v => (FREQS.find(f => f[1] === v) || [0, 0, 0])[2];
  const STORES = ((window.RetMap && window.RetMap.STORES) || []).map(s => ({ id: s.id, n: s.name, k: s.kind, d: s.km < 1 ? Math.round(s.km * 1000) + ' m' : s.km.toLocaleString('pt-BR') + ' km', s }));
  const MENU = ['Devolver garrafa vazia', 'Guardar como saldo', 'Comprar retornável', 'Usar meu vale', 'Lojas perto de mim', 'Meus lembretes', 'Falar com uma pessoa'];

  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const digits = s => String(s).replace(/\D/g, '');
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const fmtCel = d => d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  const garrafas = n => n === 1 ? '1 garrafa' : n + ' garrafas';
  const ddmm = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  /* vale-casco: R$ 3,00 por casco aceito, 7 dias, uso único (regras em app.js) */
  const valesTxt = n => n === 1 ? '1 vale-casco' : n + ' vales-casco';
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ativos = () => Ret.activeVales();
  function saldoTxt() {
    const a = ativos();
    if (!a.length) return 'nenhum vale ativo';
    return `${valesTxt(a.length)} (${brl(a.length * Ret.VALOR)}), o próximo vence em ${ddmm(new Date(a[0].ate))}`;
  }
  const temTxt = () => ativos().length ? 'você tem ' + saldoTxt() : 'você não tem vale ativo';
  const na = d => (d === 'sábado' || d === 'domingo' ? 'no ' : 'na ') + d;
  function cpfValido(c) {
    c = digits(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +c[t]) return false; }
    return true;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- estado da conversa ---------- */
  const fresh = origem => ({ origem: origem || 'site', step: 'start', nome: null, cpf: null, cadastrado: false, log: [], replies: [], list: false, unknown: 0, ctx: {}, esquecimentos: 0, ofertas: 0, recusaEm: 0, ajusteAntes: null });
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  let C = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(C)); } catch {} Ret.save(); Ret.refresh(); };

  /* ---------- render ---------- */
  const $msgs = $('#chat-msgs'), $rep = $('#chat-replies'), $in = $('#chat-input');
  let queue = [], busy = false, started = false;
  let lastWho = null;
  function draw(m) {
    const el = document.createElement('div');
    const who = (m.t === 'me') ? 'me' : (m.t === 'sys' ? 'sys' : 'bot');
    if (who === 'bot' && lastWho !== 'bot') {
      const h = document.createElement('p');
      h.className = 'chat__who';
      h.innerHTML = '<span class="chat__who-ico" aria-hidden="true"></span>Retornável <time></time>';
      h.querySelector('time').textContent = new Date(m.at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      $msgs.append(h);
    }
    lastWho = who;
    if (m.t === 'card') { el.className = 'cardmsg'; el.innerHTML = m.h; }
    else if (m.t === 'carousel') {
      el.className = 'carousel';
      el.innerHTML = '<div class="carousel__track"></div><div class="carousel__nav"><button type="button" class="carousel__btn" data-d="-1" aria-label="Anterior">&#8249;</button><span class="carousel__dots"></span><button type="button" class="carousel__btn" data-d="1" aria-label="Próximo">&#8250;</button></div>';
      const track = el.querySelector('.carousel__track'), dots = el.querySelector('.carousel__dots');
      m.items.forEach((it, k) => {
        const c = document.createElement('article');
        c.className = 'ccard';
        c.innerHTML = '<img alt="" loading="lazy"><div class="ccard__body"><h4></h4><p></p><button type="button" class="ccard__btn"></button></div>';
        c.querySelector('img').src = it.img;
        c.querySelector('h4').textContent = it.t;
        c.querySelector('p').textContent = it.d;
        const b = c.querySelector('.ccard__btn'); b.textContent = it.label; b.addEventListener('click', () => send(it.send));
        track.append(c);
        dots.insertAdjacentHTML('beforeend', '<i' + (k === 0 ? ' class="on"' : '') + '></i>');
      });
      const go2 = d => track.scrollBy({ left: d * (track.clientWidth * 0.82), behavior: 'smooth' });
      el.querySelectorAll('.carousel__btn').forEach(b => b.addEventListener('click', () => go2(+b.dataset.d)));
      track.addEventListener('scroll', () => {
        const k = Math.round(track.scrollLeft / (track.clientWidth * 0.82));
        dots.querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === k));
      }, { passive: true });
    }
    else { el.className = 'bub bub--' + m.t; el.textContent = m.x; }
    $msgs.append(el);
    if (m.qr && window.QRCode) { const box = el.querySelector('.code__qr'); if (box) new QRCode(box, { text: 'RET:' + m.qr, width: 104, height: 104, correctLevel: QRCode.CorrectLevel.M }); }
    $msgs.scrollTop = $msgs.scrollHeight;
  }
  function drawReplies() {
    $rep.textContent = ''; $rep.classList.toggle('is-list', !!C.list);
    if (C.list && (C.replies || []).length) $rep.insertAdjacentHTML('afterbegin', '<p class="chat__replies-h">Escolha uma opção:</p>');
    (C.replies || []).forEach(r => {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = r;
      b.addEventListener('click', () => send(r)); $rep.append(b);
    });
  }
  function pump() {
    if (busy) return;
    const m = queue.shift();
    if (!m) { drawReplies(); save(); return; }
    busy = true;
    if (m.t === 'me' || m.t === 'sys') { C.log.push(m); draw(m); busy = false; pump(); return; }
    const ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<i></i><i></i><i></i>';
    $msgs.append(ty); $msgs.scrollTop = $msgs.scrollHeight;
    setTimeout(() => { ty.remove(); C.log.push(m); draw(m); busy = false; pump(); }, Math.min(1000, 320 + (m.x || '').length * 8));
  }
  const bot = (...xs) => xs.forEach(x => queue.push({ t: 'bot', x, at: Date.now() }));
  const sys = x => queue.push({ t: 'sys', x });
  const card = (h, qr) => queue.push({ t: 'card', h, qr, at: Date.now() });
  const carousel = items => queue.push({ t: 'carousel', items, at: Date.now() });
  const ask = (r, list) => { C.replies = r; C.list = !!list; };
  const go = s => { C.step = s; };

  /* ---------- lembrete (mesmo objeto rem da conta) ---------- */
  const rem = () => st().rem;
  const lembretesOn = () => { const r = rem(); return !!(r && r.consentAt && !r.off && !(r.pausedUntil && r.pausedUntil > Date.now())); };
  const trocas = () => (st().history || []).filter(h => /^Devolução|^Saldo usado|^Vale usado|^Gelada/.test(h.t));
  function proximo() {
    const r = rem(); if (!lembretesOn()) return null;
    const iv = freqDias(r.freq); if (!iv) return null;
    const now = new Date(), t = trocas(), last = t.length ? new Date(t[0].at) : null;
    let base = new Date(last || now); base.setHours(0, 0, 0, 0);
    if (r.dia && r.dia !== 'varia') {
      if (last) base.setDate(base.getDate() + Math.max(1, iv - 3));
      while (base.getDay() !== DIAS.indexOf(r.dia)) base.setDate(base.getDate() + 1);
    } else base.setDate(base.getDate() + iv);
    const d = new Date(base);
    if (r.hora === 'vespera') { d.setDate(d.getDate() - 1); d.setHours(19, 0); } else d.setHours(7, 30);
    while (d < now) d.setDate(d.getDate() + (iv >= 7 ? 7 : iv));
    return d;
  }
  function proximoTxt() {
    const d = proximo(); if (!d) return null;
    return `${DIAS[d.getDay()]}, ${ddmm(d)}, às ${d.getHours() === 19 ? '19h' : '7h30'}`;
  }
  function padraoFrase() {
    const r = rem();
    if (!r || !r.consentAt || r.off) return 'Seus lembretes estão desligados. Seus vales continuam guardados.';
    if (r.pausedUntil && r.pausedUntil > Date.now()) return `Seus lembretes estão pausados até ${ddmm(new Date(r.pausedUntil))}.`;
    if (r.freq === 'ocasioes') return 'Você compra em ocasiões, então não mando lembrete fixo. Me conta quando vai comprar, tipo "vou comprar sábado", que eu te lembro.';
    const quando = r.hora === 'vespera' ? 'na véspera, às 19h' : 'no dia, às 7h30';
    const dia = r.dia && r.dia !== 'varia' ? `, porque você costuma comprar ${na(r.dia)}` : '';
    return `Te lembro por SMS ${quando}${dia}. Frequência: ${freqLabel(r.freq).toLowerCase()}.${C.ajusteAntes ? ' Esse padrão foi ajustado pelo que você fez nas últimas semanas.' : ''}`;
  }
  function textoSMS() {
    const r = rem() || {}, n = C.nome || 'oi', a = ativos();
    if (r.hora === 'dia') return `Hoje é dia de retornável, ${n}. Leva o casco no caminho: na máquina da estação ele vira gelada na hora ou um vale de R$ 3,00. retornavel.app/l`;
    return a.length
      ? `Amanhã é seu dia de compra, ${n}. Você tem ${valesTxt(a.length)} de R$ 3,00. O próximo vence em ${ddmm(new Date(a[0].ate))}. Lojas e máquina: retornavel.app/l`
      : `Amanhã é seu dia de compra, ${n}. Deixa o casco perto da porta: na máquina ele vale R$ 3,00. retornavel.app/l`;
  }
  const smsHtml = (txt, hora) => `<div class="sms-preview"><div class="sms-preview__from"><span>SMS · Retornável</span><span>${esc(hora || '')}</span></div>${esc(txt)}</div>`;
  const setRem = patch => { st().rem = Object.assign({ freq: '7', dia: 'terça', hora: 'vespera', off: false, consentAt: null, pausedUntil: null }, st().rem, patch); };

  /* ---------- fluxos ---------- */
  function iniciar() {
    const o = C.origem;
    if (o === 'coletor' || o === 'maquina') {
      C.ctx.fluxo = 'devolucao'; C.ctx.local = ORIGENS[o].onde;
      if (o === 'maquina') {
        C.ctx.qtd = 1;
        sys('a máquina conferiu o casco: material, código, vazio e sem trinca');
        bot('Oi! Seu casco foi aceito e virou um vale-casco de R$ 3,00, válido por 7 dias.', 'Para guardar uma cópia do vale aqui no chat, qual é o seu nome?'); ask([]); go('nome'); return;
      }
      bot('Oi! Quantos cascos você deixou no coletor?'); ask(['1', '2', 'Mais']); go('devQtd'); return;
    }
    bot('Oi! Aqui você acompanha seus vales-casco e leva a próxima retornável pagando só o líquido.', 'Qual é o seu nome?'); ask([]); go('nome');
  }
  function perguntaFreq() { bot(`${C.nome ? C.nome + ', c' : 'C'}om que frequência você compra retornável?`); ask(FREQS.map(f => f[0])); go('freq'); }
  function perguntaConsent() { bot(`Posso te mandar esse lembrete por SMS no ${fmtCel(st().phone)}? Dá para parar quando quiser respondendo PARAR.`); ask(['Sim', 'Agora não']); go('consent'); }
  function fimCadastro() {
    C.cadastrado = true; C.ctx.fluxo = null;
    const r = rem();
    if (!r || !r.consentAt) { bot(`Tudo certo, ${C.nome}. Sem lembretes por enquanto. Seus vales funcionam normalmente.`, 'Digite MENU para ver tudo que dá para fazer aqui.'); ask(['Menu']); go('menu'); return; }
    if (r.freq === 'ocasioes') { bot(`Fechado, ${C.nome}. Como você compra em ocasiões, me conta quando for comprar, tipo "vou comprar sábado", que eu te lembro por SMS.`, 'Digite MENU para ver tudo que dá para fazer aqui.'); ask(['Menu']); go('menu'); return; }
    const p = proximoTxt();
    bot(`Fechado, ${C.nome}. Te lembro por SMS ${p ? na(p.split(',')[0]) + p.slice(p.indexOf(',')) : 'no seu dia'}, ${freqLabel(r.freq).toLowerCase()}.`);
    card(`<div class="cardmsg__k">Prévia do SMS para ${esc(fmtCel(st().phone))}</div>${smsHtml(textoSMS(), p || '')}`);
    bot('Digite MENU para ver tudo que dá para fazer aqui.'); ask(['Menu']); go('menu');
  }
  function menu() {
    bot(`${C.nome}, ${temTxt()}. Como posso ajudar?`);
    ask(['Devolver garrafa vazia', 'Usar meu vale', 'Meus vales', 'Lojas perto de mim', 'Meus lembretes', 'Comprar retornável', 'Falar com uma pessoa'], true); go('menu');
  }
  function registrar(t, where) { st().history.unshift({ t, where, at: new Date().toISOString() }); }
  function creditar(q, local, teto) {
    const s = st();
    Ret.addVales(q, local); registrar(/m[aá]quina/i.test(local) ? 'Devolução na máquina' : /coletor/i.test(local) ? 'Devolução no coletor' : 'Devolução no balcão', local.replace(/^(coletor|máquina|balcão) d[oa] /i, ''));
    if (/coletor/i.test(local)) { const today = new Date().toISOString().slice(0, 10); if (s.returnsToday.day !== today) s.returnsToday = { day: today, n: 0 }; s.returnsToday.n += q; }
    if (C.ctx.fluxo === 'devolucao') {
      C.cadastrado = true; C.ctx.fluxo = null;
      bot(`Pronto, ${C.nome}! ${q === 1 ? 'Seu casco virou 1 vale-casco' : 'Seus ' + q + ' cascos viraram ' + q + ' vales-casco'} de R$ 3,00, válido${q > 1 ? 's' : ''} até ${ddmm(new Date(Date.now() + Ret.PRAZO * 864e5))}.`, 'Quer que eu te avise por SMS quando for dia de comprar? São 3 perguntas rápidas.');
      ask(['Bora', 'Agora não']); go('oferta'); return;
    }
    bot(`Pronto! ${q === 1 ? 'Seu casco virou 1 vale-casco' : 'Seus ' + q + ' cascos viraram ' + q + ' vales-casco'} de R$ 3,00, válido${q > 1 ? 's' : ''} por 7 dias. Agora ${temTxt()}.`);
    // Ajuste do padrão: três trocas fortes seguidas no mesmo dia da semana, diferente do padrão
    const t = trocas(), ult = t.slice(0, 3).map(h => new Date(h.at).getDay()), r = rem();
    if (lembretesOn() && t.length >= 3 && t.length - C.recusaEm >= 3 && ult.every(x => x === ult[0]) && DIAS[ult[0]] !== r.dia && r.freq !== 'ocasioes') {
      const nd = DIAS[ult[0]], vesp = DIAS[(ult[0] + 6) % 7];
      C.ctx.proposta = { dia: nd, freq: '7' };
      bot(`Percebi que você tem trocado ${nd === 'sábado' || nd === 'domingo' ? 'todo' : 'toda'} ${nd}. Quer que eu te lembre ${r.hora === 'vespera' ? vesp + ' à noite' : nd + ' de manhã'}, toda semana?`);
      ask(['Sim, ajusta', 'Manter']); go('ajuste'); return;
    }
    if (!(r && r.consentAt) && C.ofertas < 1 && t.length >= 2) {
      C.ofertas = 1; bot('Quer que eu te avise por SMS quando for dia de comprar? São 3 perguntas rápidas.'); ask(['Bora', 'Agora não']); go('oferta'); return;
    }
    const p = proximoTxt(); if (p) bot(`Seu próximo lembrete: ${p}.`);
    ask(['Menu']); go('menu');
  }
  function devolver() { bot('Onde você está devolvendo?'); ask(['Máquina da estação', 'Balcão do lojista', 'Coletor na loja']); go('devLocal'); }
  function comprar() {
    bot('Primeira vez sem casco? Na máquina da estação, toque em "É minha primeira vez". Você paga o líquido mais R$ 3,00 de depósito do casco, no Pix ou por aproximação. A máquina não aceita dinheiro.',
      'Na próxima, traga o casco: ele vale R$ 3,00 e você paga só o líquido. Nas lojas parceiras funciona igual.');
    ask(['Lojas perto de mim', 'Usar meu vale', 'Menu']); go('menu');
  }
  function usarSaldo() {
    if (!ativos().length) { bot('Você não tem vale ativo agora. Devolva um casco na máquina, no balcão ou no coletor: cada casco aceito vira um vale de R$ 3,00.'); ask(['Devolver garrafa vazia', 'Menu']); go('menu'); return; }
    bot(`Você tem ${saldoTxt()}. Onde vai usar?`); ask(['Na máquina', 'Numa loja parceira', 'Menu']); go('usar');
  }
  function codigo() {
    const v = ativos()[0];
    st().code = { v: v.c, exp: v.ate }; // mesmo código que a área do lojista lê
    bot(`Mostra este código no caixa da loja parceira. É o seu vale de R$ 3,00, válido até ${ddmm(new Date(v.ate))}. Você paga só o líquido.`);
    card(`<div class="cardmsg__k">Vale-casco · R$ 3,00</div><div class="cardmsg__code"><div class="code__qr" aria-hidden="true"></div><div><strong>${esc(Ret.fmtVale(v.c))}</strong><span class="muted small">válido até ${ddmm(new Date(v.ate))} · uso único</span></div></div>`, v.c);
    ask(['Simular leitura do lojista', 'Menu']); go('uso');
  }
  function creditos() {
    const a = ativos();
    if (!a.length) { bot('Você não tem vale ativo agora. Cada casco aceito vira um vale de R$ 3,00, válido por 7 dias.'); ask(['Devolver garrafa vazia', 'Voltar ao menu']); go('menu'); return; }
    bot(`Você tem ${valesTxt(a.length)}, total de ${brl(a.length * Ret.VALOR)}.`);
    card('<div class="cardmsg__k">Seus vales-casco</div>' + a.map(v => `<div class="cardmsg__credit"><span><strong>${esc(Ret.fmtVale(v.c))}</strong><small>${esc(cap(v.local || 'Retornável'))} · válido até ${ddmm(new Date(v.ate))}</small></span><b>${brl(Ret.VALOR)}</b></div>`).join('') + `<div class="cardmsg__total"><span>Total</span><b>${brl(a.length * Ret.VALOR)}</b></div>`);
    bot('Cada vale desconta R$ 3,00 uma vez. Na máquina, use o vale impresso. Na loja parceira, mostre o código aqui do chat.');
    ask(['Usar meu vale', 'Voltar ao menu']); go('menu');
  }

  /* ficha da loja: fotos, mapa e rota no Google Maps */
  const panel = document.querySelector('.sheet__panel.chat');
  const modal = document.createElement('div');
  modal.className = 'shopmodal'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Detalhes da loja');
  modal.innerHTML = '<div class="shopmodal__box"><div class="shopmodal__gal"></div><button type="button" class="shopmodal__x" aria-label="Fechar">&times;</button><div class="shopmodal__body"><h3></h3><p class="shopmodal__kind"></p><p class="shopmodal__state"></p><dl><div><dt>Endereço</dt><dd class="a"></dd></div><div><dt>Horário</dt><dd class="h"></dd></div></dl><div class="shopmodal__map"></div><a class="btn btn--dark btn--block shopmodal__route" target="_blank" rel="noopener">Como chegar</a></div></div>';
  if (panel) panel.appendChild(modal);
  function openShop(id) {
    const it = STORES.find(x => x.id === id); if (!it) return;
    const s = it.s;
    const host = panel && document.body.classList.contains('chat-open') ? panel : document.body;
    if (modal.parentElement !== host) host.appendChild(modal);
    modal.classList.toggle('shopmodal--page', host === document.body);
    modal.querySelector('.shopmodal__gal').innerHTML = s.photos.map(src => `<img src="${src}" alt="Foto ilustrativa da loja" loading="lazy">`).join('');
    modal.querySelector('h3').textContent = s.name;
    modal.querySelector('.shopmodal__kind').textContent = s.kind + ' · ' + it.d;
    const cold = s.id === 'ze' ? st().shop.cold : s.cold !== false;
    const stt = modal.querySelector('.shopmodal__state');
    stt.textContent = cold ? 'Retornável disponível hoje' : 'Retornável em falta hoje';
    stt.classList.toggle('is-off', !cold);
    modal.querySelector('.a').textContent = s.addr;
    modal.querySelector('.h').textContent = s.hours;
    modal.querySelector('.shopmodal__map').innerHTML = `<iframe title="Mapa de ${esc(s.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${s.lat},${s.lng}&z=16&output=embed"></iframe>`;
    modal.querySelector('.shopmodal__route').href = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=walking`;
    modal.hidden = false;
    modal.querySelector('.shopmodal__x').focus();
  }
  function closeShop() { modal.hidden = true; modal.querySelector('.shopmodal__map').innerHTML = ''; }
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.shopmodal__x')) closeShop(); });
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeShop(); } });
  $msgs.addEventListener('click', e => { const b = e.target.closest('[data-shop]'); if (b) openShop(b.dataset.shop); });
  window.RetShop = { open: openShop };

  function lojas() { bot('Me manda sua localização que eu te mostro quais lojas têm retornável hoje.'); ask(['Enviar localização', 'Menu']); go('lojas'); }
  function meusLembretes() {
    if (!lembretesOn() && !(rem() && rem().pausedUntil > Date.now())) { bot(padraoFrase()); ask(['Ligar lembretes', 'Menu']); go('lembretes'); return; }
    bot(padraoFrase()); const p = proximoTxt(); if (p) bot(`Próximo SMS: ${p}.`);
    const r = ['Mudar lembrete', 'Pausar por 1 mês', 'Parar lembretes']; if (C.ajusteAntes) r.push('Voltar ao anterior');
    r.push('Voltar ao menu');
    ask(r); go('lembretes');
  }
  function atendente() {
    const h = new Date(), dentro = h.getDay() >= 1 && h.getDay() <= 6 && h.getHours() >= 8 && h.getHours() < 20;
    bot('Vou te passar para alguém da equipe.', dentro ? 'Nosso atendimento é de segunda a sábado, das 8h às 20h. Já já alguém responde por aqui.' : 'Nosso atendimento é de segunda a sábado, das 8h às 20h, então te respondem no próximo horário.');
    ask(['Menu']); go('menu');
  }
  function parar() { setRem({ off: true, pausedUntil: null }); bot('Pronto, desliguei seus lembretes. Seus vales continuam aqui. Quando quiser voltar, é só digitar LEMBRETE.'); ask(['Menu']); go('menu'); }
  function naoEntendi() {
    C.unknown++;
    if (C.unknown >= 2) { C.unknown = 0; bot('Acho que não estou conseguindo te ajudar. Quer falar com uma pessoa da equipe?'); ask(['Falar com uma pessoa', 'Menu']); go('menu'); return; }
    bot('Não entendi. Escolha uma das opções abaixo.'); ask(['Devolver garrafa vazia', 'Usar meu vale', 'Meus vales', 'Lojas perto de mim', 'Meus lembretes', 'Falar com uma pessoa'], true); go('menu');
  }
  function global(t) {
    if (!C.cadastrado) return false;
    const n = norm(t);
    if (['menu', 'oi', 'ola', 'voltar'].includes(n)) { C.unknown = 0; menu(); return true; }
    if (n === 'saldo') { bot(`${cap(temTxt())}.`); ask(['Usar meu vale', 'Meus vales', 'Menu']); go('menu'); return true; }
    if (n === 'usar meu saldo' || n === 'usar saldo' || n === 'usar vale') { usarSaldo(); return true; }
    if (n === 'lojas') { lojas(); return true; }
    if (['creditos', 'credito', 'consultar creditos', 'meus creditos', 'vouchers', 'voucher', 'vales', 'meus vales', 'vale-casco'].includes(n)) { creditos(); return true; }
    if (n === 'voltar ao menu') { menu(); return true; }
    if (n === 'lembrete' || n === 'lembretes') {
      const r = rem();
      if (r && r.consentAt && (r.off || r.pausedUntil)) { setRem({ off: false, pausedUntil: null }); bot('Lembretes ligados de novo.'); }
      meusLembretes(); return true;
    }
    if (['atendente', 'falar com uma pessoa', 'falar com alguem'].includes(n)) { atendente(); return true; }
    if (n === 'parar' || n === 'parar lembretes') { parar(); return true; }
    if (n === 'apagar meus dados') { bot('Isso remove seu cadastro, seus vales e seu histórico. Tem certeza?'); ask(['Apagar tudo', 'Cancelar']); go('apagar'); return true; }
    const m = n.match(/(vou comprar|compro|comprar|vou buscar).*(segunda|terca|quarta|quinta|sexta|sabado|domingo)/);
    if (m) {
      const di = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].indexOf(m[2]);
      C.ctx.avulso = na(DIAS[(di + 6) % 7]) + ' às 19h';
      bot(`Quer que eu te lembre ${C.ctx.avulso}?`); ask(['Sim', 'Outro horário']); go('avulso'); return true;
    }
    if (/^[1-7]$/.test(n) && !['devQtd', 'freq'].includes(C.step)) { steps.menu(n); return true; }
    return false;
  }

  const steps = {
    nome(t) {
      const n = t.trim().split(/\s+/)[0];
      if (!n || n.length < 2 || /\d/.test(n)) { bot('Me diz só o seu primeiro nome, por favor.'); return; }
      C.nome = cap(n.toLowerCase());
      if (C.ctx.fluxo === 'devolucao') bot(`Prazer, ${C.nome}! Agora me passa seu celular com DDD. É por ele que seus vales ficam guardados.`);
      else bot(`Prazer, ${C.nome}! Agora seu celular com DDD.`, 'É por ele que te reconhecemos no balcão e na máquina, e é para ele que vai o lembrete por SMS.');
      go('cel');
    },
    cel(t) {
      const d = digits(t).replace(/^55(?=\d{10,11}$)/, '');
      if (!((d.length === 11 && d[2] === '9') || d.length === 10)) { bot('Esse número não parece certo. Manda com DDD, assim: 21 98765-4321'); return; }
      const s = st();
      if (s.phone !== d) { s.phone = d; s.bal = 0; s.vales = []; s.history = []; s.rem = null; s.code = null; } // cadastro novo começa zerado
      bot(`Anotado: ${fmtCel(d)}.`, 'Agora seu CPF, só os números. Ele liga seus vales ao seu cadastro e evita contas duplicadas.'); ask([]); go('cpf');
    },
    cpf(t) {
      if (!cpfValido(t)) { bot('Esse CPF não confere. Confira os 11 números e mande de novo.'); ask([]); return; }
      C.cpf = digits(t).replace(/^(\d{3})\d{6}(\d{2})$/, '$1.***.***-$2');
      if (C.ctx.fluxo === 'devolucao') { creditar(C.ctx.qtd, C.ctx.local); return; }
      perguntaFreq();
    },
    freq(t) {
      const n = norm(t), f = FREQS.find((x, i) => norm(x[0]) === n || n === String(i + 1));
      if (!f) { bot('Escolhe uma das opções, por favor.'); ask(FREQS.map(x => x[0])); return; }
      C.ctx.freq = f[1];
      if (f[1] === 'ocasioes') { C.ctx.dia = 'varia'; C.ctx.hora = 'vespera'; perguntaConsent(); return; }
      bot('E em que dia costuma comprar?'); ask(DIA_BTNS); go('dia');
    },
    dia(t) {
      const n = norm(t), k = DIA_BTNS.find(d => norm(d) === n || (n.length >= 3 && norm(d).startsWith(n)));
      if (!k) { bot('Escolhe um dia da lista, ou Varia.'); ask(DIA_BTNS); return; }
      C.ctx.dia = k.toLowerCase(); bot('Prefere que eu te lembre quando?'); ask(['Véspera à noite', 'No dia, de manhã']); go('hora');
    },
    hora(t) {
      const n = norm(t);
      if (n.includes('vesp') || n.includes('noite')) C.ctx.hora = 'vespera';
      else if (n.includes('dia') || n.includes('manha')) C.ctx.hora = 'dia';
      else { bot('Toca numa das duas opções.'); ask(['Véspera à noite', 'No dia, de manhã']); return; }
      perguntaConsent();
    },
    consent(t) {
      const n = norm(t), base = { freq: C.ctx.freq, dia: C.ctx.dia, hora: C.ctx.hora, pausedUntil: null };
      if (['sim', 's', 'pode'].includes(n)) st().rem = Object.assign(base, { off: false, consentAt: new Date().toISOString() });
      else if (n.includes('agora nao') || n === 'nao' || n === 'n') st().rem = Object.assign(base, { off: true, consentAt: null });
      else { bot('Toca em Sim ou Agora não.'); ask(['Sim', 'Agora não']); return; }
      C.ajusteAntes = null; fimCadastro();
    },
    oferta(t) {
      const n = norm(t);
      if (n === 'bora' || n === 'sim') { perguntaFreq(); return; }
      C.ofertas++; bot('Tranquilo. Seus vales continuam aqui. Digite MENU para ver tudo que dá para fazer.'); ask(['Menu']); go('menu');
    },
    menu(t) {
      const n = norm(t), i = MENU.findIndex((m, ix) => norm(m) === n || n === String(ix + 1));
      if (i < 0) return naoEntendi();
      C.unknown = 0;
      [devolver, devolver, comprar, usarSaldo, lojas, meusLembretes, atendente][i]();
    },
    devLocal(t) {
      const n = norm(t);
      if (n.includes('balc')) { bot(`Entrega o casco no caixa e fala seu celular: ${fmtCel(st().phone)}.`, 'O lojista registra do lado dele e o vale de R$ 3,00 cai aqui na hora.'); ask(['Simular registro do lojista', 'Menu']); go('devBalcao'); return; }
      if (n.includes('colet')) { C.ctx.local = ORIGENS.coletor.onde; bot('Quantos cascos você deixou no coletor?'); ask(['1', '2', 'Mais']); go('devQtd'); return; }
      if (n.includes('maq') || n.includes('esta')) {
        bot('Na tela da máquina, toque em "Tenho um casco vazio".', 'Coloque o casco na abertura verde, de pé e com o gargalo pra frente. Pode ser com ou sem tampa. Ela confere em menos de 10 segundos.');
        ask(['Casco aceito', 'A máquina recusou']); go('maq'); return;
      }
      if (global(t)) return;
      bot('Escolhe onde você está devolvendo.'); ask(['Máquina da estação', 'Balcão do lojista', 'Coletor na loja']);
    },
    maq(t) {
      const n = norm(t);
      if (n.includes('aceit')) {
        sys('a máquina conferiu: material, código, vazio e sem trinca');
        bot('Casco aceito! Ele vale R$ 3,00. Na tela você escolhe:', 'Levar gelada agora: você paga só o líquido, no Pix ou por aproximação.', 'Ou pegar o vale: ele sai impresso, vale 7 dias em qualquer máquina da rede e eu guardo uma cópia aqui.');
        ask(['Levei gelada agora', 'Peguei o vale']); go('maqEsc'); return;
      }
      if (n.includes('recus')) {
        bot('A máquina só aceita o casco da Coca-Cola Retornável 2L, vazio e sem trinca. Garrafa descartável, trincada, amassada ou com líquido volta na mesma abertura, sem dano.', 'Se tinha líquido, esvazie e tente de novo. Se continuar, leve ao balcão de uma loja parceira.');
        ask(['Tentar de novo', 'Lojas perto de mim', 'Menu']); go('maqRec'); return;
      }
      if (global(t)) return;
      ask(['Casco aceito', 'A máquina recusou']);
    },
    maqEsc(t) {
      const n = norm(t);
      if (n.includes('gelada')) {
        registrar('Devolução na máquina', 'Estação Nova Iguaçu'); registrar('Gelada na máquina', 'Estação Nova Iguaçu');
        sys('pagamento aprovado · garrafa liberada na abertura de retirada');
        bot('Ciclo fechado: o casco voltou e você pagou só o líquido. A garrafa que você levou agora é sua e vale R$ 3,00 na próxima.');
        ask(['Menu']); go('menu'); return;
      }
      if (n.includes('vale')) { sys('vale-casco impresso na abertura VALE'); creditar(1, ORIGENS.maquina.onde); return; }
      if (global(t)) return;
      ask(['Levei gelada agora', 'Peguei o vale']);
    },
    maqRec(t) {
      if (norm(t).includes('tentar')) { steps.devLocal('maquina'); return; }
      global(t) || steps.menu(t);
    },
    devBalcao(t) {
      if (norm(t).includes('simular')) { sys('o lojista registrou 2 cascos no balcão'); creditar(2, 'balcão da Mercearia do Seu Zé'); return; }
      global(t) || steps.menu(t);
    },
    devQtd(t) {
      const n = norm(t);
      if (n === 'mais') { bot('Quantos? Digita o número.'); ask([]); return; }
      let q = parseInt(digits(t), 10);
      if (!q) { if (global(t)) return; bot('Manda só o número de cascos.'); ask(['1', '2', 'Mais']); return; }
      const s = st(), today = new Date().toISOString().slice(0, 10);
      const ja = s.returnsToday && s.returnsToday.day === today ? s.returnsToday.n : 0;
      if (ja + q > 6) {
        q = Math.max(0, 6 - ja);
        if (!q) { bot('O coletor aceita até 6 garrafas por dia no seu número, e hoje você já chegou nas 6. O resto você registra amanhã escaneando o mesmo QR.'); ask(['Menu']); go('menu'); return; }
        bot(`O coletor aceita até 6 garrafas por dia no seu número. Registrei ${q} hoje, e o resto você registra amanhã escaneando o mesmo QR.`);
      }
      if (C.ctx.fluxo === 'devolucao' && !C.nome) { C.ctx.qtd = q; bot('Para guardar seus vales, qual é o seu nome?'); ask([]); go('nome'); return; }
      creditar(q, C.ctx.local || ORIGENS.coletor.onde);
    },
    usar(t) {
      const n = norm(t);
      if (n.includes('maquina')) {
        bot('Na tela, toque em "Tenho um vale" e insira o vale impresso na fenda branca, com o código pra cima.', 'A máquina lê, recolhe o vale e desconta R$ 3,00. Você paga só o líquido, no Pix ou por aproximação.');
        ask(['Simular resgate na máquina', 'Menu']); go('usoMaq'); return;
      }
      if (n.includes('loja')) { codigo(); return; }
      if (global(t)) return;
      bot('Onde vai usar o vale?'); ask(['Na máquina', 'Numa loja parceira', 'Menu']);
    },
    usoMaq(t) {
      if (norm(t).includes('simular')) {
        const v = Ret.useVale();
        if (!v) { bot('Você não tem vale ativo agora.'); ask(['Menu']); go('menu'); return; }
        sys(`a máquina leu e recolheu o vale ${Ret.fmtVale(v.c)} · pagamento aprovado`);
        registrar('Vale usado na máquina', 'Estação Nova Iguaçu');
        bot(`Vale aceito: R$ 3,00 descontados e a gelada saiu na abertura de retirada. Agora ${temTxt()}.`); ask(['Menu']); go('menu'); return;
      }
      global(t) || steps.menu(t);
    },
    manha(t) { if (norm(t) === 'quero') { setRem({ hora: 'dia' }); bot('Feito. Agora o SMS chega no dia, às 7h30.'); } codigo(); },
    uso(t) {
      const n = norm(t);
      if (n.includes('simular')) { sys('o lojista leu o vale-casco'); bot('O Seu Zé leu seu vale de R$ 3,00. Confirma?'); ask(['Confirmo', 'Não fui eu']); return; }
      if (n.includes('confirmo')) {
        const s = st(); Ret.useVale(s.code && s.code.v); s.code = null; s.shop.vales++; registrar('Vale usado', 'Mercearia do Seu Zé');
        bot(`Vale usado na Mercearia do Seu Zé: R$ 3,00 descontados. Agora ${temTxt()}.`); ask(['Menu']); go('menu'); return;
      }
      if (n.includes('nao fui')) { bot('Certo, não usei seu vale. Vou avisar a equipe para conferir com a loja.'); ask(['Falar com uma pessoa', 'Menu']); go('menu'); return; }
      global(t) || steps.menu(t);
    },
    lojas(t) {
      if (norm(t).includes('localiza')) {
        sys('localização enviada · não fica salva');
        const cold = st().shop.cold;
        const rows = STORES.filter(s => (s.id === 'ze' ? cold : s.s.cold !== false)).slice(0, 4);
        bot(`Achei ${rows.length} lojas com retornável perto de você:`);
        card('<div class="cardmsg__k">Toque numa loja para ver fotos, mapa e rota</div>' + rows.map(s => `<button type="button" class="cardmsg__shop" data-shop="${s.id}"><span><strong>${esc(s.n)}</strong><small>${esc(s.k)} · ${esc(s.s.bairro)}</small></span><span class="cardmsg__go">${s.d} <b aria-hidden="true">›</b></span></button>`).join(''));
        ask(['A loja estava sem retornável', 'Menu']); go('lojasRes'); return;
      }
      global(t) || steps.menu(t);
    },
    lojasRes(t) {
      if (norm(t).includes('sem retornavel')) { bot('Poxa! Anotei para a equipe falar com o lojista. A máquina da Estação Nova Iguaçu, a 900 m, tem gelada e mostra o estoque em tempo real.'); ask(['Menu']); go('menu'); return; }
      global(t) || steps.menu(t);
    },
    lembretes(t) {
      const n = norm(t);
      if (n.includes('voltar ao menu') || n === 'menu') { menu(); return; }
      if (n.includes('mudar') || n.includes('ligar')) { perguntaFreq(); return; }
      if (n.includes('pausar')) { const d = Date.now() + 30 * 864e5; setRem({ pausedUntil: d }); bot(`Pausei seus lembretes até ${ddmm(new Date(d))}. Seu padrão fica guardado.`); ask(['Menu']); go('menu'); return; }
      if (n.includes('parar')) { parar(); return; }
      if (n.includes('voltar') && C.ajusteAntes) { setRem(C.ajusteAntes); C.ajusteAntes = null; bot('Voltei para o lembrete anterior.', padraoFrase()); ask(['Menu']); go('menu'); return; }
      global(t) || steps.menu(t);
    },
    ajuste(t) {
      if (norm(t).includes('sim')) {
        const r = rem(); C.ajusteAntes = { dia: r.dia, freq: r.freq }; setRem(C.ctx.proposta); C.recusaEm = 0;
        bot(`Fechado. Te lembro ${rem().hora === 'vespera' ? 'na véspera, às 19h' : 'no dia, às 7h30'}, toda semana. Se quiser voltar ao anterior, é só ir em Meus lembretes.`);
      } else { C.recusaEm = trocas().length; bot('Combinado, mantenho como está.'); }
      ask(['Menu']); go('menu');
    },
    avulso(t) {
      if (norm(t) === 'sim') { C.ctx.avulsoOk = C.ctx.avulso; bot(`Combinado. Te mando o SMS ${C.ctx.avulso}.`); ask(['Menu']); go('menu'); return; }
      bot('Me diz o dia e a hora que prefere, por exemplo "sexta às 18h".'); ask([]); go('avulsoHora');
    },
    avulsoHora(t) { bot(`Combinado. Te mando o SMS: ${t.trim()}.`); ask(['Menu']); go('menu'); },
    apagar(t) {
      if (norm(t).includes('apagar')) {
        try { localStorage.removeItem('retornavel-demo-v1'); } catch {}
        Ret.state = Ret.fresh(); Ret.state.bal = 0; Ret.state.history = [];
        queue = []; C = fresh('site'); $msgs.textContent = ''; lastWho = null;
        sys('cadastro e histórico removidos'); bot('Pronto, apaguei seu cadastro e seu histórico. Se quiser voltar, é só mandar um oi.'); ask(['Oi']); go('start'); pump(); return;
      }
      bot('Ok, não apaguei nada.'); ask(['Menu']); go('menu');
    },
    start() { iniciar(); }
  };

  function handle(t) {
    if (C.step === 'start') { iniciar(); return; }
    const emCadastro = !C.cadastrado;
    if (!emCadastro && !['apagar', 'avulsoHora', 'nome', 'cel', 'cpf'].includes(C.step) && global(t)) return;
    (steps[C.step] || steps.menu)(t);
  }
  function send(t) {
    t = String(t).trim(); if (!t || queue.length > 6) return;
    C.replies = []; C.list = false; $rep.textContent = '';
    queue.push({ t: 'me', x: t }); handle(t); pump();
  }

  /* ---------- simulador de SMS (só para a demonstração) ---------- */
  function simular(tipo) {
    const box = $('#chat-sms');
    const add = (txt, hora) => { const d = document.createElement('div'); d.innerHTML = smsHtml(txt, hora); box.prepend(d.firstChild); };
    if (!C.cadastrado || !st().phone) { box.innerHTML = '<p class="muted small" style="margin:0">Faça o cadastro no chat primeiro.</p>'; return; }
    if (tipo === 'lojista') { queue.push({ t: 'sys', x: 'o lojista registrou 1 casco no balcão' }); C.replies = []; creditar(1, 'balcão da Mercearia do Seu Zé'); pump(); return; }
    if ((tipo === 'lembrete' || tipo === 'checkin') && !lembretesOn()) { add('(Nenhum SMS: os lembretes estão desligados ou pausados para este número.)', '—'); return; }
    if (tipo === 'lembrete') add(textoSMS(), rem().hora === 'vespera' ? '19:00' : '07:30');
    if (tipo === 'checkin') add(`Oi, ${C.nome}. Não vi troca sua essa semana. Conseguiu comprar? Responda 1 se comprou, 2 se não, ou PAUSAR. Ou abra retornavel.app/c`, '10:00');
    if (tipo === 'pausa') add(`Parei seus lembretes por enquanto, ${C.nome}. Seus vales continuam guardados. Para voltar, abra retornavel.app/c e digite LEMBRETE.`, '10:00');
  }
  document.querySelectorAll('[data-sim]').forEach(b => b.addEventListener('click', () => simular(b.dataset.sim)));
  $('#chat-kw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) send(b.dataset.kw || b.textContent); });
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); const v = $in.value; $in.value = ''; send(v); });
  $('#chat-reset').addEventListener('click', () => { closeMore(); reset(true); });
  const more = $('#chat-more'), moreMenu = $('#chat-menu');
  function closeMore() { if (moreMenu) { moreMenu.hidden = true; more.setAttribute('aria-expanded', 'false'); } }
  if (more) more.addEventListener('click', () => { moreMenu.hidden = !moreMenu.hidden; more.setAttribute('aria-expanded', String(!moreMenu.hidden)); });
  $('#chat-kw').addEventListener('click', () => closeMore());

  /* ---------- abrir ---------- */
  function begin(origem) {
    C = fresh(origem); $msgs.textContent = ''; lastWho = null;
    sys(origem && origem !== 'site' ? `QR Code lido: ${ORIGENS[origem].onde}` : 'Retornável Chat');
    queue.push({ t: 'me', x: ORIGENS[C.origem].txt }); iniciar(); pump();
  }
  function open() {
    setTimeout(() => $in.focus({ preventScroll: true }), 50);
    if (started) return;
    started = true;
    const o = origemDaURL(), saved = load();
    if (saved && saved.cadastrado && st().phone) {
      C = saved; C.replies = C.replies || []; $msgs.textContent = ''; lastWho = null; C.log.forEach(draw);
      if (o === 'coletor' || o === 'maquina') {
        // quem já tem cadastro e escaneia o coletor ou a máquina vai direto para a devolução
        queue.push({ t: 'me', x: ORIGENS[o].txt });
        if (o === 'coletor') { C.ctx.local = ORIGENS.coletor.onde; bot(`Oi, ${C.nome}! Quantos cascos você deixou no coletor?`); ask(['1', '2', 'Mais']); go('devQtd'); }
        else { sys('a máquina conferiu o casco: material, código, vazio e sem trinca'); creditar(1, ORIGENS.maquina.onde); }
        pump();
      } else if (o) { queue.push({ t: 'me', x: ORIGENS[o].txt }); menu(); pump(); }
      else drawReplies();
      return;
    }
    begin(o || 'site');
  }
  function reset(reopen) {
    try { localStorage.removeItem(KEY); } catch {}
    queue = []; busy = false; started = false; C = null; $msgs.textContent = ''; $rep.textContent = '';
    if (reopen) open();
  }
  window.RetChat = { open, reset: () => reset(false) };

  // O QR leva direto ao chat: index.html?o=rotulo, ?o=coletor, ?o=maquina...
  if (origemDaURL() || location.hash === '#/chat') Ret.openSheet('chat');
})();
