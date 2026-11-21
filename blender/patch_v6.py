import io, os, sys
W = sys.argv[1]
p = os.path.join(W, 'blender/template.html')
s = io.open(p, encoding='utf-8').read()

def between(start, end, new, include_end=False):
    global s
    a = s.index(start); b = s.index(end, a)
    if include_end: b += len(end)
    s = s[:a] + new + s[b:]

def rep(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b)

# 1) sai a onda de troca de página; entra a tela de carregamento (garrafa enchendo)
between('<!-- transição entre páginas: onda vermelha que cobre a tela -->', '<main id="conteudo">', '{{LOADER}}\n\n')

# 2) novo topo: painel vermelho + foto, garrafa grande na divisa
between('  <section class="hero" aria-labelledby="hero-title">', '  <div class="over">', '''  <section class="hero" id="hero" aria-labelledby="hero-title">
    <div class="hero__photo" aria-hidden="true"><img src="img/04-mesa.jpg" alt=""></div>
    <div class="wrap hero__in">
      <div class="hero__copy">
        <p class="hero__kicker">Coca-Cola Retornável</p>
        <h1 id="hero-title">Devolva o casco.<br>Leve a próxima quando quiser.</h1>
        <p class="lead">Cada garrafa vazia que você devolve vira saldo. Com ele, você retira uma Coca-Cola retornável em qualquer loja parceira e paga só o líquido.</p>
        <div class="actions">
          <button class="btn btn--light" data-open="chat">Começar no chat</button>
          <a class="btn btn--ghost-light" href="#/como-funciona">Como funciona</a>
        </div>
      </div>
    </div>
    <figure class="hero__bottle" aria-label="Garrafa retornável de 2 litros girando">
      <img id="seq" src="seq/f000.webp" width="480" height="795" alt="Garrafa retornável Coca-Cola de 2 litros com tampa amarela">
    </figure>
  </section>

''')

# 3) resumo sem "25 usos"
rep('<p><strong>Até 25 usos</strong> por garrafa, com lavagem e rótulo novo a cada volta</p>', '<p><strong>O casco é seu</strong> e vale em qualquer troca</p>')

# 4) faixa "do casco vazio à garrafa cheia": garrafa com rótulo que enche ao rolar
rep('<section class="steps-band">', '<section class="steps-band" id="fillband">')
rep('<figure class="steps-band__img reveal"><img src="seq/vazia.webp" alt="Casco vazio da garrafa retornável de 2 litros" loading="lazy"></figure>',
    '<figure class="steps-band__img"><img id="fill" src="seq/e000.webp" width="480" height="795" alt="Garrafa retornável de 2 litros enchendo de Coca-Cola" loading="lazy"></figure>')

# 5) lembrete: texto alinhado ao topo do iPhone
rep('''    <section class="section">
      <div class="wrap split">
        <div class="reveal">
          <h2 class="h-xl">Lembrete por SMS</h2>''', '''    <section class="section section--sms">
      <div class="wrap split split--top">
        <div class="reveal sms__copy">
          <h2 class="h-xl">Lembrete por SMS</h2>''')

# 6) mosaico sem "25 vezes"
rep('<h2 class="h-xl">A mesma garrafa, até 25 vezes</h2>', '<h2 class="h-xl">Uma garrafa que volta</h2>')
rep('<p class="muted">Depois de cada uso, o casco volta para a fábrica, é lavado, higienizado, enchido e recebe um rótulo novo.</p>',
    '<p class="muted">Depois de cada uso, o casco volta para a fábrica, onde é lavado, higienizado e enchido de novo. Para você, ele vale sempre na próxima compra.</p>')

# 7) busca de lojas: um campo, um seletor
between('      <div class="finder__search">', '      <p class="finder__status"', '''      <div class="finder__search">
        <label class="search">
          <span class="sr">Buscar por bairro ou nome da loja</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input id="bairro" type="text" placeholder="Bairro ou nome da loja" autocomplete="address-level3">
          <button class="search__loc" id="btn-locate" type="button" title="Usar minha localização" aria-label="Usar minha localização">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </button>
        </label>
        <label class="select">
          <span>Mostrar</span>
          <select id="filter-sel">
            <option value="todas">Todas as lojas</option>
            <option value="disponivel">Com retornável disponível hoje</option>
            <option value="coletor">Com coletor de cascos</option>
            <option value="maquina">Com máquina de devolução</option>
          </select>
        </label>
      </div>
''')

# 8) dúvidas: sem "até 25"
rep('<details><summary>Quantas vezes a garrafa é usada?</summary><p>Até 25. A cada volta ela é lavada, higienizada, enchida e recebe um rótulo novo.</p></details>',
    '<details><summary>Meu casco vence?</summary><p>Não. Enquanto estiver inteiro, ele vale na troca. A fábrica confere cada garrafa na lavagem e tira de circulação as que estiverem gastas.</p></details>')

s = s.replace('styles.css?v=31', 'styles.css?v=40').replace('seq.js?v=3', 'seq.js?v=4').replace('app.js?v=7', 'app.js?v=8').replace('fx.js?v=1', 'fx.js?v=2')
io.open(p, 'w', encoding='utf-8').write(s)

# app.js: seletor de filtro
pa = os.path.join(W, 'site/app.js')
a = io.open(pa, encoding='utf-8').read()
old = "  document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {"
assert old in a
a = a.replace(old, "  const fsel = document.getElementById('filter-sel');\n  if (fsel) fsel.addEventListener('change', () => { storeFilter = fsel.value; renderStores($('#bairro').value); });\n" + old)
a = a.replace("$('#finder-status').textContent = 'Localização simulada no Centro de Nova Iguaçu. Nada foi salvo.';", "$('#finder-status').textContent = 'Mostrando lojas perto do Centro de Nova Iguaçu (localização simulada).';")
io.open(pa, 'w', encoding='utf-8').write(a)
print('ok')
