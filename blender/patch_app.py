import io, sys
p = sys.argv[1]
s = io.open(p, encoding='utf-8').read()
a = s.index("  /* Lojas perto (dados de exemplo)")
b = s.index("  renderStores();\n", a) + len("  renderStores();\n")
new = '''  /* Lojas: lista + mapa ilustrativo (map.js). Dados de exemplo; a localização é simulada. */
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
      .filter(s => storeFilter === 'todas' || (storeFilter === 'gelada' ? s.coldNow : s.tags.includes(storeFilter)))
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
      st.textContent = s.coldNow ? 'Tem gelada hoje' : 'Sem gelada hoje';
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
    $('#finder-status').textContent = 'Localização simulada no Centro de Nova Iguaçu. Nada foi salvo.';
    if (window.RetMap) window.RetMap.showMe();
    renderStores($('#bairro').value);
  });
  $('#bairro').addEventListener('input', e => { $('#finder-status').textContent = ''; renderStores(e.target.value); });
  document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
    storeFilter = b.dataset.f;
    document.querySelectorAll('.filter').forEach(x => x.classList.toggle('is-on', x === b));
    renderStores($('#bairro').value);
  }));
  renderStores();
'''
s = s[:a] + new + s[b:]

# Troca de página com a onda vermelha (fx): show() chama window.RetFx.go quando existir
old_show = "  function show(name) {\n    if (name === current) { closeMenu(); return; }\n    current = name;"
assert old_show in s
s = s.replace(old_show, "  function show(name) {\n    if (name === current) { closeMenu(); return; }\n    if (current && window.RetFx && !show._swap) { closeMenu(); window.RetFx.go(() => { show._swap = true; show(name); show._swap = false; }); return; }\n    current = name;")
old_end = "    if (name === 'inicio') dispatchEvent(new Event('resize')); // a garrafa 3D recalcula o tamanho\n  }"
assert old_end in s
s = s.replace(old_end, "    if (name === 'inicio') dispatchEvent(new Event('resize'));\n    if (window.RetFx) window.RetFx.enter(name);\n  }")
io.open(p, 'w', encoding='utf-8').write(s)
print('ok')
