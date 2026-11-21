// Chat da Coca-Cola Retornável: acha as lojas com retornável perto de você e explica a máquina
// da estação e o vale-casco em papel. Lembrete por SMS opcional (nome e celular). Protótipo: nada sai do navegador.
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
  const MENU = ['Onde tem retornável', 'Como devolver o casco', 'Como usar o vale', 'É minha primeira vez', 'Lembrete por SMS', 'Falar com uma pessoa'];

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

  /* ---------- lembrete por SMS (fica só neste navegador) ---------- */
  const SKEY = 'retornavel-sms-v1';
  let R = (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch { return {}; } })();
  const saveR = () => { try { localStorage.setItem(SKEY, JSON.stringify(R)); } catch {} };
  const digits = x => String(x).replace(/\D/g, '');
  const cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
  const fmtCel = d => d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  const ddmm = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIA_BTNS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const FREQS = [['Toda semana', 7], ['A cada 15 dias', 14], ['Uma vez por mês', 28]];
  const freqLabel = v => (FREQS.find(f => f[1] === v) || ['Toda semana'])[0].toLowerCase();
  const na = d => (d === 'sábado' || d === 'domingo' ? 'no ' : 'na ') + d;
  const ativo = () => !!(R.consentAt && !R.off && !(R.pausedUntil && R.pausedUntil > Date.now()));
  function proximo() {
    if (!ativo()) return null;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const alvo = DIAS.indexOf(R.dia);
    do d.setDate(d.getDate() + 1); while (d.getDay() !== alvo);
    if (R.hora === 'vespera') { d.setDate(d.getDate() - 1); d.setHours(19, 0); } else d.setHours(7, 30);
    if (d < new Date()) d.setDate(d.getDate() + 7);
    return d;
  }
  const proximoTxt = () => { const d = proximo(); return d ? `${DIAS[d.getDay()]}, ${ddmm(d)}, às ${d.getHours() === 19 ? '19h' : '7h30'}` : null; };
  function textoSMS() {
    const n = R.nome || 'oi';
    return R.hora === 'dia'
      ? `Hoje é dia de retornável, ${n}. Leva o casco no caminho: na máquina da Estação Nova Iguaçu ele vira um vale-casco de 7 dias. retornavel.app/l`
      : `Amanhã é dia de retornável, ${n}. Deixa o casco perto da porta e passa na máquina da Estação Nova Iguaçu na ida. retornavel.app/l`;
  }
  const smsCard = (txt, hora, titulo) => card(`<div class="cardmsg__k">${esc(titulo || 'Prévia do SMS para ' + fmtCel(R.phone || ''))}</div><div class="sms-preview"><div class="sms-preview__from"><span>SMS · Retornável</span><span>${esc(hora || '')}</span></div>${esc(txt)}</div>`);
  function padraoFrase() {
    if (!R.consentAt || R.off) return 'Seus lembretes por SMS estão desligados.';
    if (R.pausedUntil && R.pausedUntil > Date.now()) return `Seus lembretes estão pausados até ${ddmm(new Date(R.pausedUntil))}.`;
    return `Te lembro por SMS ${R.hora === 'vespera' ? 'na véspera, às 19h' : 'no dia, às 7h30'}, porque você costuma comprar ${na(R.dia)}. Frequência: ${freqLabel(R.freq)}.`;
  }
  function lembrete() {
    if (R.consentAt) { meusLembretes(); return; }
    bot('Eu te mando um SMS no dia que você costuma comprar, para não esquecer o casco. Nada entre 21h e 7h, e para parar é só responder PARAR.', 'Para isso preciso só do seu nome e do seu celular. Qual é o seu nome?');
    ask(['Agora não']); go('smsNome');
  }
  function meusLembretes() {
    bot(padraoFrase()); const p = proximoTxt(); if (p) bot(`Próximo SMS: ${p}.`);
    if (!R.consentAt || R.off) { ask(['Ligar lembretes', 'Menu']); go('lembretes'); return; }
    ask(['Ver exemplo do SMS', 'Mudar lembrete', 'Pausar por 1 mês', 'Parar lembretes', 'Menu']); go('lembretes');
  }
  function perguntaFreq() { bot(`${R.nome ? R.nome + ', c' : 'C'}om que frequência você compra retornável?`); ask(FREQS.map(f => f[0])); go('smsFreq'); }
  function fimLembrete() {
    const p = proximoTxt();
    bot(`Fechado, ${R.nome}. Te lembro por SMS ${R.hora === 'vespera' ? 'na véspera, às 19h' : 'no dia, às 7h30'}, ${freqLabel(R.freq)}.`);
    smsCard(textoSMS(), p || '');
    bot('Para mudar, pausar ou parar, é só digitar LEMBRETE aqui no chat.'); ask(['Menu']); go('menu');
  }
  function parar() { R.off = true; R.pausedUntil = null; saveR(); bot('Pronto, desliguei seus lembretes por SMS. Quando quiser voltar, é só digitar LEMBRETE.'); ask(['Menu']); go('menu'); }

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
    if (['lembrete', 'lembretes', 'lembrete por sms', 'sms', 'meus lembretes'].includes(n)) { if (R.consentAt && (R.off || R.pausedUntil) && n === 'lembrete') { R.off = false; R.pausedUntil = null; saveR(); bot('Lembretes ligados de novo.'); } lembrete(); return true; }
    if (n === 'parar' || n === 'parar lembretes') { parar(); return true; }
    if (n === 'apagar meus dados') { bot('Isso apaga seu nome, seu celular e seus lembretes deste aparelho. Tem certeza?'); ask(['Apagar tudo', 'Cancelar']); go('apagar'); return true; }
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
      [lojas, devolver, usarVale, primeiraVez, lembrete, atendente][i]();
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
    },
    smsNome(t) {
      if (norm(t) === 'agora nao') { bot('Tranquilo. Se mudar de ideia, é só digitar LEMBRETE.'); ask(['Menu']); go('menu'); return; }
      const n = t.trim().split(/\s+/)[0];
      if (!n || n.length < 2 || /\d/.test(n)) { bot('Me diz só o seu primeiro nome, por favor.'); return; }
      R.nome = cap(n.toLowerCase());
      bot(`Prazer, ${R.nome}! Agora seu celular com DDD. É para ele que vai o SMS.`); ask([]); go('smsCel');
    },
    smsCel(t) {
      const d = digits(t).replace(/^55(?=\d{10,11}$)/, '');
      if (!((d.length === 11 && d[2] === '9') || d.length === 10)) { bot('Esse número não parece certo. Manda com DDD, assim: 21 98765-4321'); return; }
      R.phone = d; bot(`Anotado: ${fmtCel(d)}.`); perguntaFreq();
    },
    smsFreq(t) {
      const n = norm(t), f = FREQS.find((x, i) => norm(x[0]) === n || n === String(i + 1));
      if (!f) { if (global(t)) return; bot('Escolhe uma das opções, por favor.'); ask(FREQS.map(x => x[0])); return; }
      R.freqTmp = f[1]; bot('E em que dia costuma comprar?'); ask(DIA_BTNS); go('smsDia');
    },
    smsDia(t) {
      const n = norm(t), k = DIA_BTNS.find(d => norm(d) === n || (n.length >= 3 && norm(d).startsWith(n)));
      if (!k) { if (global(t)) return; bot('Escolhe um dia da lista.'); ask(DIA_BTNS); return; }
      R.diaTmp = k.toLowerCase();
      bot('Prefere que eu te lembre quando?', 'Na véspera, às 19h, para deixar o casco perto da porta. Ou no dia, às 7h30, para levar no caminho da estação.');
      ask(['Véspera à noite', 'No dia, de manhã']); go('smsHora');
    },
    smsHora(t) {
      const n = norm(t);
      if (n.includes('vesp') || n.includes('noite')) R.horaTmp = 'vespera';
      else if (n.includes('dia') || n.includes('manha')) R.horaTmp = 'dia';
      else { if (global(t)) return; bot('Toca numa das duas opções.'); ask(['Véspera à noite', 'No dia, de manhã']); return; }
      bot(`Posso te mandar esse lembrete por SMS no ${fmtCel(R.phone)}? Dá para parar quando quiser respondendo PARAR.`); ask(['Sim', 'Agora não']); go('smsConsent');
    },
    smsConsent(t) {
      const n = norm(t);
      if (['sim', 's', 'pode'].includes(n)) {
        Object.assign(R, { freq: R.freqTmp, dia: R.diaTmp, hora: R.horaTmp, off: false, pausedUntil: null, consentAt: new Date().toISOString() });
        delete R.freqTmp; delete R.diaTmp; delete R.horaTmp; saveR(); fimLembrete(); return;
      }
      if (n.includes('agora nao') || n === 'nao') { bot('Tudo bem, não vou mandar SMS. Se mudar de ideia, é só digitar LEMBRETE.'); ask(['Menu']); go('menu'); return; }
      bot('Toca em Sim ou Agora não.'); ask(['Sim', 'Agora não']);
    },
    lembretes(t) {
      const n = norm(t);
      if (n.includes('exemplo')) { const p = proximoTxt(); smsCard(textoSMS(), p || ''); ask(['Mudar lembrete', 'Menu']); return; }
      if (n.includes('mudar') || n.includes('ligar')) { if (!R.nome || !R.phone) { R.consentAt = null; lembrete(); return; } perguntaFreq(); return; }
      if (n.includes('pausar')) { R.pausedUntil = Date.now() + 30 * 864e5; saveR(); bot(`Pausei seus lembretes até ${ddmm(new Date(R.pausedUntil))}. Seu dia e horário ficam guardados.`); ask(['Menu']); go('menu'); return; }
      if (n.includes('parar')) { parar(); return; }
      global(t) || steps.menu(t);
    },
    apagar(t) {
      if (norm(t).includes('apagar')) { R = {}; try { localStorage.removeItem(SKEY); } catch {} sys('nome, celular e lembretes apagados deste aparelho'); bot('Pronto, apaguei tudo. Se quiser o lembrete de novo, é só digitar LEMBRETE.'); ask(['Menu']); go('menu'); return; }
      bot('Ok, não apaguei nada.'); ask(['Menu']); go('menu');
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
  $('#chat-kw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { closeMore(); send({ LOJAS: 'Onde tem retornável', ATENDENTE: 'Falar com uma pessoa', LEMBRETE: 'Lembrete por SMS' }[b.dataset.kw] || 'Menu'); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-chat]'); if (!b) return;
    e.preventDefault(); window.Ret.openSheet('chat');
    const t = b.dataset.chat; const tryIt = (k = 0) => { if (C && !busy && !queue.length) send(t); else if (k < 40) setTimeout(() => tryIt(k + 1), 150); };
    setTimeout(tryIt, 300);
  });
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
