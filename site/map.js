// Mapa ilustrativo (falso) de Nova Iguaçu e arredores, desenhado em SVG.
// As lojas e posições são de exemplo. O mapa conversa com a lista de lojas em app.js.
(function () {
  const W = 1600, H = 1000;
  const STORES = [
    { id: 'ze', n: 1, name: 'Mercearia do Seu Zé', bairro: 'Centro, Nova Iguaçu', kind: 'Loja parceira', tags: [], km: 0.4, x: 905, y: 520, addr: 'Rua Mal. Floriano, 214 · Centro, Nova Iguaçu', hours: 'Seg a sáb, 7h às 21h · Dom, 8h às 13h', lat: -22.7593, lng: -43.4509, photos: ['img/06-mercadinho.jpg', 'img/03-balcao.jpg'] },
    { id: 'prez', n: 2, name: 'Máquina Retornável · Estação Nova Iguaçu', bairro: 'Centro, Nova Iguaçu', kind: 'Máquina Retornável', tags: ['maquina'], km: 0.9, x: 1030, y: 470, cold: true, addr: 'Estação Nova Iguaçu (SuperVia) · plataforma', hours: 'No horário da estação · Pix ou aproximação', lat: -22.7591, lng: -43.4513, photos: ['img/09-maquina.jpg', 'img/02-qr.jpg'] },
    { id: 'bv', n: 3, name: 'Mercadinho Boa Vista', bairro: 'Rancho Novo', kind: 'Loja parceira', tags: [], km: 1.6, x: 760, y: 300, cold: true, addr: 'Estrada de Madureira, 88 · Rancho Novo', hours: 'Seg a sáb, 7h às 20h', lat: -22.7489, lng: -43.4602, photos: ['img/03-balcao.jpg', 'img/06-mercadinho.jpg'] },
    { id: 'ki', n: 4, name: 'Ki-Barato da Dona Célia', bairro: 'Comendador Soares', kind: 'Loja parceira', tags: [], km: 2.1, x: 1230, y: 640, cold: false, addr: 'Rua Sete de Setembro, 40 · Comendador Soares', hours: 'Seg a sáb, 8h às 19h', lat: -22.7702, lng: -43.4321, photos: ['img/06-mercadinho.jpg', 'img/10-lojista.jpg'] },
    { id: 'pc', n: 5, name: 'Bar e Lanchonete Ponto Certo', bairro: 'Mesquita', kind: 'Loja parceira', tags: [], km: 3.4, x: 1390, y: 300, cold: true, addr: 'Av. Brasil, 1.020 · Mesquita', hours: 'Todos os dias, 10h às 23h', lat: -22.7829, lng: -43.4271, photos: ['img/01-consumo.jpg', 'img/03-balcao.jpg'] },
    { id: 'cg', n: 6, name: 'Supermercado Cruzeiro', bairro: 'Jardim Iguaçu', kind: 'Loja parceira', tags: [], km: 2.8, x: 640, y: 720, cold: true, addr: 'Rua Dr. Barros Júnior, 500 · Jardim Iguaçu', hours: 'Todos os dias, 7h às 22h', lat: -22.7690, lng: -43.4655, photos: ['img/06-mercadinho.jpg', 'img/03-balcao.jpg'] }
  ];
  const ME = { x: 960, y: 560 };
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  // gerador simples e fixo, para o mapa sair sempre igual
  let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function draw(host) {
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', role: 'img', 'aria-label': 'Mapa ilustrativo com as lojas parceiras' });
    const g = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#ECE7DF' }, g);
    // quarteirões: grade levemente girada
    const blocks = el('g', { transform: `rotate(-14 ${W / 2} ${H / 2})` }, g);
    for (let gx = -300; gx < W + 300; gx += 86) {
      for (let gy = -300; gy < H + 300; gy += 70) {
        const w = 70 + rnd() * 6, h = 54 + rnd() * 6;
        el('rect', { x: gx, y: gy, width: w, height: h, fill: rnd() > .93 ? '#E1DBD1' : '#F7F4EF' }, blocks);
      }
    }
    // parques
    [['M 300 120 q 120 -40 200 30 q 40 90 -60 140 q -120 30 -170 -60 z', 'Parque Municipal'],
     ['M 1180 760 q 140 -30 210 40 q 20 90 -110 110 q -110 0 -130 -80 z', 'Praça da Liberdade'],
     ['M 520 520 q 50 -20 80 20 q 10 40 -40 50 q -50 0 -40 -70 z', '']].forEach(([d, name]) => {
      el('path', { d, fill: '#CFE3C3' }, g);
      if (name) { const t = el('text', { x: d.split(' ')[1] * 1 + 70, y: d.split(' ')[2] * 1 + 70, fill: '#5E7C50', 'font-size': 18, 'font-family': 'Noto Sans, sans-serif', 'font-style': 'italic' }, g); t.textContent = name; }
    });
    // rio
    el('path', { d: 'M -20 860 C 220 820 380 900 560 870 S 900 780 1080 840 S 1420 960 1640 900', fill: 'none', stroke: '#B9D4E8', 'stroke-width': 34, 'stroke-linecap': 'round' }, g);
    const rioT = el('text', { x: 330, y: 845, fill: '#5C86A6', 'font-size': 17, 'font-family': 'Noto Sans, sans-serif', 'font-style': 'italic', 'letter-spacing': 3 }, g); rioT.textContent = 'Rio Botas';
    // avenidas
    const roads = [
      ['M -40 600 C 400 560 800 470 1640 380', 'Av. Gov. Amaral Peixoto', 22, 420, 548],
      ['M 860 -40 C 880 300 900 650 1000 1040', 'Rua Mal. Floriano', 16, 905, 150],
      ['M -40 250 C 500 300 1000 230 1640 160', 'Estrada de Madureira', 16, 1120, 215],
      ['M 300 1040 C 520 700 640 520 700 -40', 'Av. Nilo Peçanha', 14, 600, 640]
    ];
    roads.forEach(([d]) => el('path', { d, fill: 'none', stroke: '#E3DCCF', 'stroke-width': 30, 'stroke-linecap': 'round' }, g));
    roads.forEach(([d, , w]) => el('path', { d, fill: 'none', stroke: '#FFFFFF', 'stroke-width': w, 'stroke-linecap': 'round' }, g));
    roads.forEach(([d, name, , tx, ty], i) => {
      const id = 'rd' + i;
      el('path', { id, d, fill: 'none', stroke: 'none' }, g);
      const t = el('text', { fill: '#7A7468', 'font-size': 15, 'font-family': 'Noto Sans, sans-serif', 'font-weight': 600 }, g);
      const tp = el('textPath', { href: '#' + id, startOffset: ['30%', '22%', '62%', '55%'][i] }, t);
      tp.textContent = name;
    });
    // linha de trem
    el('path', { id: 'trem', d: 'M -40 470 C 500 430 1100 520 1640 470', fill: 'none', stroke: '#8E8A84', 'stroke-width': 5 }, g);
    el('path', { d: 'M -40 470 C 500 430 1100 520 1640 470', fill: 'none', stroke: '#ECE7DF', 'stroke-width': 3, 'stroke-dasharray': '14 14' }, g);
    const est = el('g', {}, g); el('rect', { x: 1003, y: 470, width: 54, height: 18, fill: '#55524D', rx: 0 }, est);
    const estT = el('text', { x: 1030, y: 506, fill: '#55524D', 'font-size': 14, 'text-anchor': 'middle', 'font-family': 'Noto Sans, sans-serif', 'font-weight': 600 }, est); estT.textContent = 'Estação Nova Iguaçu';
    // bairros
    [['CENTRO', 980, 600], ['RANCHO NOVO', 640, 360], ['COMENDADOR SOARES', 1240, 720], ['MESQUITA', 1420, 250], ['JARDIM IGUAÇU', 560, 790], ['CALIFÓRNIA', 300, 470]].forEach(([n, x, y]) => {
      const t = el('text', { x, y, fill: '#A39C90', 'font-size': 15, 'text-anchor': 'middle', 'letter-spacing': 4, 'font-family': 'Noto Sans, sans-serif', 'font-weight': 600 }, g); t.textContent = n;
    });
    // você está aqui
    const me = el('g', { class: 'me', style: 'display:none' }, g);
    el('circle', { class: 'me-halo', cx: ME.x, cy: ME.y, r: 22 }, me);
    el('circle', { class: 'me-dot', cx: ME.x, cy: ME.y, r: 10 }, me);
    // pinos
    const pins = el('g', {}, g);
    STORES.forEach((s, i) => {
      const p = el('g', { class: 'pin', 'data-id': s.id, transform: `translate(${s.x} ${s.y})`, tabindex: 0, role: 'button', 'aria-label': s.name }, pins);
      const drop = el('g', { class: 'pin__drop', style: `--i:${i}` }, p);
      el('ellipse', { cx: 0, cy: 2, rx: 9, ry: 3, fill: 'rgba(0,0,0,.25)' }, drop);
      el('path', { class: 'pin__body', d: 'M0 0 C -6 -14 -18 -22 -18 -36 A 18 18 0 1 1 18 -36 C 18 -22 6 -14 0 0 Z' }, drop);
      const t = el('text', { x: 0, y: -31 }, drop); t.textContent = s.n;
    });
    host.appendChild(svg);
    // legenda e zoom
    host.insertAdjacentHTML('beforeend', '<div class="map__legend"><span><i style="background:#F40009"></i>Disponível hoje</span><span><i style="background:#8f8f8f"></i>Em falta hoje</span><span><i style="background:#1A73E8"></i>Você</span></div><div class="map__zoom"><button type="button" data-z="1" aria-label="Aproximar">+</button><button type="button" data-z="-1" aria-label="Afastar">−</button></div>');
    return { svg, g, me };
  }

  let ui = null, scale = 1, selected = null, onSelect = null;
  function ensure() {
    const host = document.getElementById('map');
    if (!host) return null;
    if (!ui) {
      ui = draw(host);
      ui.svg.addEventListener('click', e => { const p = e.target.closest('.pin'); if (p) select(p.dataset.id, true); });
      ui.svg.addEventListener('keydown', e => { const p = e.target.closest('.pin'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(p.dataset.id, true); } });
      host.querySelector('.map__zoom').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        scale = Math.min(2, Math.max(1, scale + (+b.dataset.z) * .25));
        apply();
      });
    }
    return ui;
  }
  function apply(cx, cy) {
    const s = selected && STORES.find(x => x.id === selected);
    const fx = cx ?? (s ? s.x : W * .62), fy = cy ?? (s ? s.y : H / 2);
    ui.g.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
    ui.g.style.transformOrigin = `${fx}px ${fy}px`;
    ui.g.style.transform = `scale(${scale})`;
  }
  function popup(s) {
    const host = document.getElementById('map');
    host.querySelector('.map__pop')?.remove();
    if (!s) return;
    const r = ui.svg.getBoundingClientRect(), hr = host.getBoundingClientRect();
    const pt = ui.svg.createSVGPoint(); pt.x = s.x; pt.y = s.y;
    const sp = pt.matrixTransform(ui.g.getScreenCTM());
    const d = document.createElement('div');
    d.className = 'map__pop';
    d.style.left = (sp.x - hr.left) + 'px'; d.style.top = (sp.y - hr.top) + 'px';
    d.innerHTML = `<h4></h4><p class="b1"></p><p class="b2"></p>`;
    d.querySelector('h4').textContent = s.name;
    d.querySelector('.b1').textContent = s.kind + ' · ' + s.km.toLocaleString('pt-BR') + ' km';
    d.querySelector('.b2').textContent = s.coldNow ? 'Retornável disponível hoje' : 'Retornável em falta hoje';
    host.appendChild(d);
  }
  function select(id, fromMap) {
    selected = id;
    ui.svg.querySelectorAll('.pin').forEach(p => p.classList.toggle('is-sel', p.dataset.id === id));
    const s = window.RetMap._rows.find(x => x.id === id);
    if (scale < 1.25) scale = 1.25;
    apply();
    setTimeout(() => popup(s), 620);
    if (onSelect) onSelect(id, fromMap);
  }

  window.RetMap = {
    STORES, _rows: [],
    // rows: lojas já filtradas e com o estoque de retornável do dia
    render(rows) {
      if (!ensure()) return;
      this._rows = rows;
      const visible = new Set(rows.map(r => r.id));
      ui.svg.querySelectorAll('.pin').forEach(p => {
        const r = rows.find(x => x.id === p.dataset.id);
        p.classList.toggle('is-hidden', !visible.has(p.dataset.id));
        p.classList.toggle('is-off', r ? !r.coldNow : false);
      });
      if (selected && !visible.has(selected)) { selected = null; popup(null); }
    },
    select(id) { if (ensure()) select(id, false); },
    showMe() { if (!ensure()) return; ui.me.style.display = ''; scale = 1.25; selected = null; popup(null); apply(ME.x, ME.y); },
    onSelect(fn) { onSelect = fn; },
    reset() { if (!ui) return; scale = 1; selected = null; popup(null); ui.g.style.transform = ''; }
  };
})();
