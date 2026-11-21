import io, os, sys
W = sys.argv[1]
p = os.path.join(W, 'site/chat.js')
s = io.open(p, encoding='utf-8').read()

def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)

# 1) desenho: carrossel de cartões e mensagens com cabeçalho do remetente
rep("""  function draw(m) {
    const el = document.createElement('div');
    if (m.t === 'card') { el.className = 'cardmsg'; el.innerHTML = m.h; }
    else { el.className = 'bub bub--' + m.t; el.textContent = m.x; }
    $msgs.append(el);""", """  let lastWho = null;
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
    $msgs.append(el);""")

# 2) lista de opções: cartão com título e pílulas largas, sem números
rep("""    $rep.textContent = ''; $rep.classList.toggle('is-list', !!C.list);
    (C.replies || []).forEach((r, i) => {
      const b = document.createElement('button'); b.type = 'button';
      if (C.list) b.innerHTML = `<b>${i + 1}</b><span>${esc(r)}</span>`; else b.textContent = r;
      b.addEventListener('click', () => send(r)); $rep.append(b);
    });""", """    $rep.textContent = ''; $rep.classList.toggle('is-list', !!C.list);
    if (C.list && (C.replies || []).length) $rep.insertAdjacentHTML('afterbegin', '<p class="chat__replies-h">Ou escolha uma opção:</p>');
    (C.replies || []).forEach(r => {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = r;
      b.addEventListener('click', () => send(r)); $rep.append(b);
    });""")

# 3) mensagens guardam o horário
rep("const bot = (...xs) => xs.forEach(x => queue.push({ t: 'bot', x }));", "const bot = (...xs) => xs.forEach(x => queue.push({ t: 'bot', x, at: Date.now() }));")
rep("const card = (h, qr) => queue.push({ t: 'card', h, qr });", "const card = (h, qr) => queue.push({ t: 'card', h, qr, at: Date.now() });\n  const carousel = items => queue.push({ t: 'carousel', items, at: Date.now() });")

# 4) menu: carrossel com as três ações principais + lista com as outras
rep("function menu() { bot(`Oi, ${C.nome}! Seu saldo: ${garrafas(st().bal)}. O que você quer fazer?`); ask(MENU, true); go('menu'); }",
"""function menu() {
    bot(`${C.nome}, seu saldo é de ${garrafas(st().bal)}. Como posso ajudar?`);
    carousel([
      { img: 'img/08-coletor.jpg', t: 'Devolver garrafa', d: 'No balcão, no coletor ou na máquina. O saldo entra na hora.', label: 'Devolver agora', send: 'Devolver garrafa vazia' },
      { img: 'img/02-qr.jpg', t: 'Usar meu saldo', d: 'Gere o código e mostre no caixa. Ele vale 2 horas.', label: 'Gerar código', send: 'Usar meu saldo' },
      { img: 'img/06-mercadinho.jpg', t: 'Lojas perto de você', d: 'Veja quais lojas têm retornável disponível hoje.', label: 'Ver lojas', send: 'Lojas perto de mim' }
    ]);
    ask(['Meus lembretes', 'Comprar retornável', 'Falar com uma pessoa'], true); go('menu');
  }""")
rep("bot('Não entendi bem. Escolhe uma opção aqui:'); ask(MENU, true); go('menu');", "bot('Não entendi. Escolha uma das opções abaixo.'); ask(['Devolver garrafa vazia', 'Usar meu saldo', 'Lojas perto de mim', 'Meus lembretes', 'Falar com uma pessoa'], true); go('menu');")

# 5) menu ⋮ do cabeçalho
rep("  $('#chat-reset').addEventListener('click', () => reset(true));", """  $('#chat-reset').addEventListener('click', () => { closeMore(); reset(true); });
  const more = $('#chat-more'), moreMenu = $('#chat-menu');
  function closeMore() { if (moreMenu) { moreMenu.hidden = true; more.setAttribute('aria-expanded', 'false'); } }
  if (more) more.addEventListener('click', () => { moreMenu.hidden = !moreMenu.hidden; more.setAttribute('aria-expanded', String(!moreMenu.hidden)); });
  $('#chat-kw').addEventListener('click', () => closeMore());""")

io.open(p, 'w', encoding='utf-8').write(s)

# app.js: o chat flutua sobre a página, sem travar a rolagem
pa = os.path.join(W, 'site/app.js')
a = io.open(pa, encoding='utf-8').read()
old = "    document.body.style.overflow = 'hidden';\n    if (name === 'conta')"
assert old in a
a = a.replace(old, "    if (name !== 'chat') document.body.style.overflow = 'hidden';\n    document.body.classList.toggle('chat-open', name === 'chat');\n    if (name === 'conta')")
old2 = "    $$('.sheet').forEach(s => s.hidden = true);\n    document.body.style.overflow = '';"
assert old2 in a
a = a.replace(old2, "    $$('.sheet').forEach(s => s.hidden = true);\n    document.body.style.overflow = '';\n    document.body.classList.remove('chat-open');")
io.open(pa, 'w', encoding='utf-8').write(a)
print('ok')
