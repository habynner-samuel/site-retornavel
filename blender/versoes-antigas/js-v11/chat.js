// Chat da Coca-Cola Retornável: acha as lojas com retornável perto de você e explica a máquina
// da estação e o vale-casco em papel. Sem cadastro. Protótipo: nada sai do navegador.
(function () {
  const $ = s => document.querySelector(s);
  const KEY = 'retornavel-chat-v3';

  /* ---------- de onde a pessoa veio (QR da máquina, da embalagem ou de materiais) ---------- */
  const ORIGENS = {
    maquina: { txt: 'Oi! Estou na máquina da estação', onde: 'máquina da Estação Nova Iguaçu' },
    rotulo: { txt: 'Oi! Quero saber da retornável', onde: 'rótulo da garrafa' },
    gondola: { txt: 'Oi! Quero saber da retornável', onde: 'gôndola' },
    caixa: { txt: 'Oi! Quero saber da retornável', onde: 'caixa da loja' },
    site: { txt: 'Oi! Quero saber da retornável', onde: 'site' }
  };
  const ALIAS = { rot: 'rotulo', 'rótulo': 'rotulo', gon: 'gondola', cx: 'caixa', maq: 'maquina', 'máquina': 'maquina', coletor: 'site', col: 'site' };
  function origemDaURL() {
    const q = new URLSearchParams(location.search);
    let o = (q.get('o') || q.get('origem') || '').toLowerCase().split('-')[0];
    o = ALIAS[o] || o;
    return ORIGENS[o] ? o : null;
  }
  const STORES = ((window.RetMap && window.RetMap.STORES) || []).map(s => ({ id: s.id, n: s.name, k: s.kind, d: s.km < 1 ? Math.round(s.km * 1000) + ' m' : s.km.toLocaleString('pt-BR') + ' km', km: s.km, s }));
  const MENU = ['Onde tem retornável', 'Como devolver o casco', 'Como usar o vale', 'É minha primeira vez', 'Falar com uma pessoa'];

  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- estado da conversa ---------- */
  const fresh = origem => ({ origem: origem || 'site', step: 'menu', log: [], replies: [], list: false, unknown: 0 });
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  let C = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(C)); } catch {} };

  /* ---------- render ---------- */
  const $msgs = $('#chat-msgs'), $rep = $('#chat-replies'), $in = $('#chat-input');
  let queue = [], busy = false, started = false, lastWho = null;
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
    else { el.className = 'bub bub--' + m.t; el.textContent = m.x; }
    $msgs.append(el);
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
  const card = h => queue.push({ t: 'card', h, at: Date.now() });
  const ask = (r, list) => { C.replies = r; C.list = !!list; };
  const go = s => { C.step = s; };

  /* ---------- respostas ---------- */
  function menu(oi) {
    bot(oi ? 'Oi! Aqui você descobre onde tem Coca-Cola Retornável perto de você e como trocar o casco. Como posso ajudar?' : 'Como posso ajudar?');
    ask(MENU, true); go('menu');
  }
  function lojas() { bot('Me manda sua localização que eu te mostro onde tem retornável hoje.'); ask(['Enviar localização', 'Menu']); go('lojas'); }
  function listaLojas() {
    sys('localização enviada · não fica salva');
    const rows = STORES.filter(s => s.s.cold !== false).sort((a, b) => a.km - b.km).slice(0, 4);
    bot(`Achei ${rows.length} lugares com retornável hoje perto de você:`);
    card('<div class="cardmsg__k">Toque para ver fotos, mapa e rota</div>' + rows.map(s => `<button type="button" class="cardmsg__shop" data-shop="${s.id}"><span><strong>${esc(s.n)}</strong><small>${esc(s.k)} · ${esc(s.s.bairro)}</small></span><span class="cardmsg__go">${s.d} <b aria-hidden="true">›</b></span></button>`).join(''));
    bot('Leve o casco: com ele, você paga só o líquido.');
    ask(['Ver todas no mapa', 'Menu']); go('lojasRes');
  }
  function devolver() {
    bot('Leve o casco vazio à máquina da Estação Nova Iguaçu. Na tela, toque em "Tenho um casco vazio".',
      'Coloque o casco na abertura, de pé e com o gargalo pra frente. Pode ser com ou sem tampa. A máquina confere na hora.');
    ask(['Casco aceito', 'A máquina não aceitou', 'Menu']); go('maq');
  }
  function usarVale() {
    bot('Na máquina da estação, toque em "Tenho um vale" e coloque o vale na abertura.',
      'Você leva a Coca-Cola Retornável cheia pagando só o líquido, no Pix ou por aproximação. A máquina fica com o vale.',
      'O vale é válido por 7 dias e pode ser usado uma vez. A data vem impressa nele.');
    ask(['Onde fica a máquina', 'Menu']); go('menu');
  }
  function primeiraVez() {
    bot('Que bom ter você aqui! Na máquina da estação, toque em "É minha primeira vez". Você paga a bebida e o casco, no Pix ou por aproximação.',
      'Na próxima, traga o casco vazio: com ele, você paga só o líquido.');
    ask(['Onde tem retornável', 'Menu']); go('menu');
  }
  function maquinaLocal() {
    bot('A máquina fica na Estação Nova Iguaçu (SuperVia, Ramal Japeri), funcionando no horário da estação.');
    ask(['Ver no mapa', 'Menu']); go('lojasRes');
  }
  function atendente() {
    const h = new Date(), dentro = h.getDay() >= 1 && h.getDay() <= 6 && h.getHours() >= 8 && h.getHours() < 20;
    bot('Vou te passar para alguém da equipe.', dentro ? 'Nosso atendimento é de segunda a sábado, das 8h às 20h. Já já alguém responde por aqui.' : 'Nosso atendimento é de segunda a sábado, das 8h às 20h, então te respondem no próximo horário.');
    ask(['Menu']); go('menu');
  }
  function naoEntendi() {
    C.unknown++;
    if (C.unknown >= 2) { C.unknown = 0; bot('Acho que não estou conseguindo te ajudar. Quer falar com uma pessoa da equipe?'); ask(['Falar com uma pessoa', 'Menu']); go('menu'); return; }
    bot('Não entendi. Escolha uma das opções abaixo.'); ask(MENU, true); go('menu');
  }
  function verMapa() {
    if (window.Ret) window.Ret.closeSheets();
    location.hash = '#/lojas';
  }

  // palavras que funcionam em qualquer ponto da conversa
  function global(t) {
    const n = norm(t);
    if (['menu', 'oi', 'ola', 'voltar', 'voltar ao menu', 'inicio'].includes(n)) { C.unknown = 0; menu(); return true; }
    if (['atendente', 'falar com uma pessoa', 'falar com alguem', 'atendimento'].includes(n)) { atendente(); return true; }
    if (n.includes('mapa')) { verMapa(); bot('Abri o mapa de lojas para você.'); ask(['Menu']); go('menu'); return true; }
    if (n === 'lojas' || n.includes('onde tem') || n.includes('perto') || n.includes('loja')) { lojas(); return true; }
    if (n.includes('onde fica') || n.includes('estacao')) { maquinaLocal(); return true; }
    if (n.includes('primeira')) { primeiraVez(); return true; }
    if (n.includes('vale') || n.includes('voucher')) { usarVale(); return true; }
    if (n.includes('devolv') || n.includes('casco')) { devolver(); return true; }
    return false;
  }

  const steps = {
    menu(t) {
      const n = norm(t), i = MENU.findIndex((m, ix) => norm(m) === n || n === String(ix + 1));
      if (i < 0) { if (global(t)) return; naoEntendi(); return; }
      C.unknown = 0;
      [lojas, devolver, usarVale, primeiraVez, atendente][i]();
    },
    lojas(t) {
      if (norm(t).includes('localiza')) { listaLojas(); return; }
      global(t) || steps.menu(t);
    },
    lojasRes(t) { global(t) || steps.menu(t); },
    maq(t) {
      const n = norm(t);
      if (n.includes('aceit') && !n.includes('nao')) {
        sys('vale-casco impresso');
        bot('Casco aceito! Pegue o vale que saiu impresso: ele é válido por 7 dias.', 'Na volta, toque em "Tenho um vale", coloque o vale na máquina e leve a cheia pagando só o líquido.');
        ask(['Menu']); go('menu'); return;
      }
      if (n.includes('nao aceitou') || n.includes('recus')) {
        bot('A máquina recebe só o casco da Coca-Cola Retornável 2L, vazio e sem trinca. Garrafa descartável, trincada, amassada ou com líquido volta pela mesma abertura.', 'Se tinha líquido, esvazie e tente de novo.');
        ask(['Tentar de novo', 'Falar com uma pessoa', 'Menu']); go('maqRec'); return;
      }
      global(t) || steps.menu(t);
    },
    maqRec(t) {
      if (norm(t).includes('tentar')) { devolver(); return; }
      global(t) || steps.menu(t);
    }
  };

  function handle(t) { (steps[C.step] || steps.menu)(t); }
  function send(t) {
    t = String(t).trim(); if (!t || queue.length > 6) return;
    C.replies = []; C.list = false; $rep.textContent = '';
    queue.push({ t: 'me', x: t }); handle(t); pump();
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
    const tem = s.cold !== false;
    const stt = modal.querySelector('.shopmodal__state');
    stt.textContent = tem ? 'Retornável disponível hoje' : 'Retornável em falta hoje';
    stt.classList.toggle('is-off', !tem);
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

  /* ---------- menu ⋮ ---------- */
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); const v = $in.value; $in.value = ''; send(v); });
  const more = $('#chat-more'), moreMenu = $('#chat-menu');
  function closeMore() { if (moreMenu) { moreMenu.hidden = true; more.setAttribute('aria-expanded', 'false'); } }
  if (more) more.addEventListener('click', () => { moreMenu.hidden = !moreMenu.hidden; more.setAttribute('aria-expanded', String(!moreMenu.hidden)); });
  $('#chat-kw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { closeMore(); send(b.dataset.kw === 'LOJAS' ? 'Onde tem retornável' : b.dataset.kw === 'ATENDENTE' ? 'Falar com uma pessoa' : 'Menu'); } });
  $('#chat-reset').addEventListener('click', () => { closeMore(); reset(true); });

  /* ---------- abrir ---------- */
  function begin(origem) {
    C = fresh(origem); $msgs.textContent = ''; lastWho = null;
    sys(origem && origem !== 'site' ? `QR Code lido: ${ORIGENS[origem].onde}` : 'Chat Coca-Cola Retornável');
    queue.push({ t: 'me', x: ORIGENS[C.origem].txt });
    if (origem === 'maquina') {
      bot('Oi! Você está na máquina da Estação Nova Iguaçu. O que vai fazer agora?');
      ask(['Como devolver o casco', 'Como usar o vale', 'É minha primeira vez', 'Menu']); go('menu');
    } else menu(true);
    pump();
  }
  function open() {
    setTimeout(() => $in.focus({ preventScroll: true }), 50);
    if (started) return;
    started = true;
    const o = origemDaURL(), saved = load();
    if (saved && !o && saved.log && saved.log.length) {
      C = saved; C.replies = C.replies || []; $msgs.textContent = ''; lastWho = null; C.log.forEach(draw); drawReplies();
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

  // O QR leva direto ao chat: index.html?o=maquina, ?o=rotulo...
  if (origemDaURL() || location.hash === '#/chat') window.Ret.openSheet('chat');
})();
