import io, os, sys
W = sys.argv[1]

def edit(path, pairs):
    p = os.path.join(W, path)
    s = io.open(p, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70])
        s = s.replace(a, b)
    io.open(p, 'w', encoding='utf-8').write(s)

# ---------- map.js: endereço, horário, coordenadas e fotos de cada loja (exemplo) ----------
edit('site/map.js', [
 ("kind: 'Balcão e coletor', tags: ['coletor'], km: 0.4, x: 905, y: 520 },",
  "kind: 'Balcão e coletor', tags: ['coletor'], km: 0.4, x: 905, y: 520, addr: 'Rua Mal. Floriano, 214 · Centro, Nova Iguaçu', hours: 'Seg a sáb, 7h às 21h · Dom, 8h às 13h', lat: -22.7593, lng: -43.4509, photos: ['img/06-mercadinho.jpg', 'img/03-balcao.jpg'] },"),
 ("kind: 'Máquina de devolução', tags: ['maquina'], km: 1.2, x: 1080, y: 410, cold: true },",
  "kind: 'Máquina de devolução', tags: ['maquina'], km: 1.2, x: 1080, y: 410, cold: true, addr: 'Av. Gov. Amaral Peixoto, 1.250 · Centro, Nova Iguaçu', hours: 'Todos os dias, 7h às 22h', lat: -22.7561, lng: -43.4458, photos: ['img/09-maquina.jpg', 'img/08-coletor.jpg'] },"),
 ("kind: 'Balcão', tags: [], km: 1.6, x: 760, y: 300, cold: true },",
  "kind: 'Balcão', tags: [], km: 1.6, x: 760, y: 300, cold: true, addr: 'Estrada de Madureira, 88 · Rancho Novo', hours: 'Seg a sáb, 7h às 20h', lat: -22.7489, lng: -43.4602, photos: ['img/03-balcao.jpg', 'img/06-mercadinho.jpg'] },"),
 ("kind: 'Balcão', tags: [], km: 2.1, x: 1230, y: 640, cold: false },",
  "kind: 'Balcão', tags: [], km: 2.1, x: 1230, y: 640, cold: false, addr: 'Rua Sete de Setembro, 40 · Comendador Soares', hours: 'Seg a sáb, 8h às 19h', lat: -22.7702, lng: -43.4321, photos: ['img/06-mercadinho.jpg', 'img/10-lojista.jpg'] },"),
 ("kind: 'Balcão e coletor', tags: ['coletor'], km: 3.4, x: 1390, y: 300, cold: true },",
  "kind: 'Balcão e coletor', tags: ['coletor'], km: 3.4, x: 1390, y: 300, cold: true, addr: 'Av. Brasil, 1.020 · Mesquita', hours: 'Todos os dias, 10h às 23h', lat: -22.7829, lng: -43.4271, photos: ['img/01-consumo.jpg', 'img/08-coletor.jpg'] },"),
 ("kind: 'Máquina de devolução', tags: ['maquina'], km: 2.8, x: 640, y: 720, cold: true }",
  "kind: 'Máquina de devolução', tags: ['maquina'], km: 2.8, x: 640, y: 720, cold: true, addr: 'Rua Dr. Barros Júnior, 500 · Jardim Iguaçu', hours: 'Todos os dias, 7h às 22h', lat: -22.7690, lng: -43.4655, photos: ['img/09-maquina.jpg', 'img/11-recolhimento.jpg'] }"),
])

# ---------- chat.js ----------
edit('site/chat.js', [
 # lojas do chat vêm da mesma base do mapa
 ("""  const STORES = [
    { n: 'Mercearia do Seu Zé', k: 'Balcão e coletor', d: '400 m' },
    { n: 'Prezunic Nova Iguaçu', k: 'Máquina de devolução', d: '1,2 km' },
    { n: 'Bar e Lanchonete Ponto Certo', k: 'Balcão', d: '3,4 km' }
  ];""", """  const STORES = ((window.RetMap && window.RetMap.STORES) || []).map(s => ({ id: s.id, n: s.name, k: s.kind, d: s.km < 1 ? Math.round(s.km * 1000) + ' m' : s.km.toLocaleString('pt-BR') + ' km', s }));"""),
 # lista do menu: créditos
 ("ask(['Meus lembretes', 'Comprar retornável', 'Falar com uma pessoa'], true); go('menu');",
  "ask(['Consultar créditos', 'Meus lembretes', 'Comprar retornável', 'Falar com uma pessoa'], true); go('menu');"),
 # meus lembretes: sempre com volta ao menu
 ("    const r = ['Mudar lembrete', 'Pausar por 1 mês', 'Parar lembretes']; if (C.ajusteAntes) r.push('Voltar ao anterior');\n    ask(r); go('lembretes');",
  "    const r = ['Mudar lembrete', 'Pausar por 1 mês', 'Parar lembretes']; if (C.ajusteAntes) r.push('Voltar ao anterior');\n    r.push('Voltar ao menu');\n    ask(r); go('lembretes');"),
 # palavra-chave CREDITOS e opção do menu
 ("    if (n === 'lojas') { lojas(); return true; }",
  "    if (n === 'lojas') { lojas(); return true; }\n    if (['creditos', 'credito', 'consultar creditos', 'meus creditos', 'vouchers', 'voucher', 'vales'].includes(n)) { creditos(); return true; }\n    if (n === 'voltar ao menu') { menu(); return true; }"),
 # cartão de lojas clicável
 ("        card(rows.map(s => `<div class=\"cardmsg__shop\"><div><strong>${esc(s.n)}</strong><small>${esc(s.k)}</small></div><span>${s.d}</span></div>`).join(''));",
  "        card('<div class=\"cardmsg__k\">Toque numa loja para ver fotos, mapa e rota</div>' + rows.map(s => `<button type=\"button\" class=\"cardmsg__shop\" data-shop=\"${s.id}\"><span><strong>${esc(s.n)}</strong><small>${esc(s.k)} · ${esc(s.s.bairro)}</small></span><span class=\"cardmsg__go\">${s.d} <b aria-hidden=\"true\">›</b></span></button>`).join(''));"),
 ("const rows = STORES.filter((s, i) => i !== 0 || cold);", "const rows = STORES.filter(s => (s.id === 'ze' ? cold : s.s.cold !== false)).slice(0, 4);"),
])

# funções novas no chat: créditos e ficha da loja
p = os.path.join(W, 'site/chat.js')
s = io.open(p, encoding='utf-8').read()
anchor = "  function lojas() {"
assert anchor in s
s = s.replace(anchor, r'''  /* créditos de voucher (integração com o sistema de vales; aqui com dados de exemplo) */
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  function getCredits() {
    const x = st();
    if (!x.credits) x.credits = [
      { t: 'Vale de devolução', where: 'Mercearia do Seu Zé', v: 3.5, ate: '30/11' },
      { t: 'Bônus de cadastro', where: 'Programa Retornável', v: 2, ate: '15/12' }
    ];
    return x.credits;
  }
  function creditos() {
    const cs = getCredits();
    const total = cs.reduce((a, c) => a + c.v, 0);
    if (!cs.length) { bot('Você não tem créditos de voucher no momento.'); ask(['Menu']); go('menu'); return; }
    bot(`Você tem ${brl(total)} em créditos de voucher.`);
    card('<div class="cardmsg__k">Créditos disponíveis</div>' + cs.map(c => `<div class="cardmsg__credit"><span><strong>${esc(c.t)}</strong><small>${esc(c.where)} · válido até ${esc(c.ate)}</small></span><b>${brl(c.v)}</b></div>`).join('') + `<div class="cardmsg__total"><span>Total</span><b>${brl(total)}</b></div>`);
    bot('Os créditos são descontados no caixa, junto com o código do saldo.');
    ask(['Usar meu saldo', 'Voltar ao menu']); go('menu');
  }

  /* ficha da loja: fotos, mapa e rota no Google Maps */
  const panel = document.querySelector('.sheet__panel.chat');
  const modal = document.createElement('div');
  modal.className = 'shopmodal'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Detalhes da loja');
  modal.innerHTML = '<div class="shopmodal__box"><div class="shopmodal__gal"></div><button type="button" class="shopmodal__x" aria-label="Fechar">&times;</button><div class="shopmodal__body"><h3></h3><p class="shopmodal__kind"></p><p class="shopmodal__state"></p><dl><div><dt>Endereço</dt><dd class="a"></dd></div><div><dt>Horário</dt><dd class="h"></dd></div></dl><div class="shopmodal__map"></div><a class="btn btn--dark btn--block shopmodal__route" target="_blank" rel="noopener">Como chegar</a><p class="shopmodal__note">Abre o Google Maps com a rota até a loja. Endereço e loja são exemplos.</p></div></div>';
  if (panel) panel.appendChild(modal);
  function openShop(id) {
    const it = STORES.find(x => x.id === id); if (!it) return;
    const s = it.s;
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

  function lojas() {''')
io.open(p, 'w', encoding='utf-8').write(s)

# lembretes: "Voltar ao menu" dentro do passo
edit('site/chat.js', [
 ("    lembretes(t) {\n      const n = norm(t);\n", "    lembretes(t) {\n      const n = norm(t);\n      if (n.includes('voltar ao menu') || n === 'menu') { menu(); return; }\n"),
])

# ---------- fx.js: enchimento começa com 35% da garrafa visível ----------
edit('site/fx.js', [
 ("""    if (band && band.offsetParent && fillImg) {
      const r = band.getBoundingClientRect();
      // começa a encher quando a faixa entra na tela e termina quando o meio dela passa do meio da tela
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5 + r.height * 0.5)));""",
  """    if (band && band.offsetParent && fillImg) {
      // começa quando 35% da garrafa já está visível e termina quando ela está inteira no alto da tela
      const r = fillImg.getBoundingClientRect();
      const start = vh - r.height * 0.35, end = Math.min(vh * 0.18, vh - r.height - 20);
      const p = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, start - end)));"""),
])
print('ok')
