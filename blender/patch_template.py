import io, os, sys, re
W = sys.argv[1]
p = os.path.join(W, 'blender/template.html')
s = io.open(p, encoding='utf-8').read()

def between(start, end, new):
    global s
    a = s.index(start); b = s.index(end, a)
    s = s[:a] + new + s[b:]

def rep(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b)

# textos sem "gelada"
rep('<span>Leve a gelada</span>', '<span>Leve a próxima</span>')
rep('alt="Garrafa retornável Coca-Cola de 2 litros, gelada, com tampa amarela"', 'alt="Garrafa retornável Coca-Cola de 2 litros com tampa amarela"')
rep('<h2 class="h-xl">Do vazio à gelada</h2>', '<h2 class="h-xl">Do casco vazio à garrafa cheia</h2>')

# iPhone da seção de lembrete (Início)
between('        <div class="phone reveal" aria-label="Exemplo de SMS na tela do celular">',
        '      </div>\n    </section>\n\n    <section class="section section--grey">',
        '        <div class="iphone reveal" aria-label="Exemplo do SMS na tela de bloqueio de um iPhone">\n          <div class="iphone__screen">{{LOCK}}</div>\n        </div>\n')

# celular do Como funciona: mesma moldura, 4ª tela é a tela de bloqueio
rep('''        <div class="phone">
          <div class="phone__screen">''', '''        <div class="iphone">
          <div class="iphone__screen iphone__screen--app">''')
a = s.index('            <div class="scr scr--4 phone__screen--lock">')
b = s.index('            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>', a) + len('            </div>\n')
s = s[:a] + '            <div class="scr scr--4">{{LOCK}}</div>\n' + s[b:]
rep('<div class="scr__bar">Retornável Chat</div>', '<div class="scr__bar">Fale com a Coca-Cola Retornável</div>')
s = s.replace('<div class="scr__bar">Retornável Chat</div>', '<div class="scr__bar">Fale com a Coca-Cola Retornável</div>')

# painel de lojas
between('    <aside class="finder">', '    </aside>', '''    <aside class="finder" aria-label="Buscar lojas">
      <div class="finder__head">
        <p class="crumb crumb--dark"><a href="#/inicio">Início</a> <span>/</span> Lojas</p>
        <h1>Encontre uma loja</h1>
      </div>
      <div class="finder__search">
        <label class="search">
          <span class="sr">Buscar por bairro ou nome da loja</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input id="bairro" type="text" placeholder="Bairro ou nome da loja" autocomplete="address-level3">
        </label>
        <button class="locate" id="btn-locate" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          Usar minha localização
        </button>
      </div>
      <div class="filters" role="tablist" aria-label="Filtrar lojas">
        <button type="button" class="filter is-on" data-f="todas" role="tab">Todas</button>
        <button type="button" class="filter" data-f="disponivel" role="tab">Disponível hoje</button>
        <button type="button" class="filter" data-f="coletor" role="tab">Coletor</button>
        <button type="button" class="filter" data-f="maquina" role="tab">Máquina</button>
      </div>
      <p class="finder__status" id="finder-status" role="status"></p>
      <ul class="stores" id="stores"></ul>
      <p class="finder__foot">Lojas e estoque de exemplo. A localização não fica salva.</p>
''')

# Para lojistas: só o essencial
between('<!-- ======================= LOJISTAS (cortina lateral na foto) ======================= -->',
        '<!-- ======================= DÚVIDAS ======================= -->', '''<!-- ======================= LOJISTAS (cortina lateral na foto) ======================= -->
<div class="page page--lojistas" data-page="lojistas" hidden>
  <header class="split-head">
    <div class="split-head__txt">
      <p class="crumb crumb--light"><a href="#/inicio">Início</a> <span>/</span> Para lojistas</p>
      <h1>Para lojistas</h1>
      <p class="lead">Registre cascos e vales pelo celular da loja, sem instalar nada.</p>
      <button class="btn btn--light" data-open="lojista">Ver o painel de exemplo</button>
    </div>
    <div class="split-head__img"><img src="img/10-lojista.jpg" alt="Lojista no balcão com engradados de garrafas retornáveis"></div>
  </header>
  <section class="section">
    <div class="wrap">
      <ol class="features">
        <li class="reveal"><h3>Ler o vale</h3><p>O vale do cliente conta como casco na troca de caixas.</p></li>
        <li class="reveal"><h3>Registrar cascos</h3><p>Entradas e saídas de vasilhames em um toque.</p></li>
        <li class="reveal"><h3>Informar disponibilidade</h3><p>A loja aparece no mapa quando tem retornável.</p></li>
        <li class="reveal"><h3>Pedir recolhimento</h3><p>Chame o distribuidor quando precisar.</p></li>
      </ol>
      <p class="features__note reveal">Para participar, fale com o vendedor do distribuidor na próxima visita.</p>
    </div>
  </section>
  <figure class="photo-band reveal"><img src="img/11-recolhimento.jpg" alt="Caminhão de distribuição em frente a um mercadinho" loading="lazy"></figure>
</div>

''')

# botão flutuante: some no Lojas (o mapa já ocupa a tela) — controlado no CSS
s = s.replace('styles.css?v=21', 'styles.css?v=30').replace('app.js?v=6', 'app.js?v=7').replace('chat.js?v=4', 'chat.js?v=5').replace('map.js?v=1', 'map.js?v=2')
io.open(p, 'w', encoding='utf-8').write(s)
print('ok', s.count('{{LOCK}}'))
