// Tu biblioteca: Marcados, Comentarios y Memorizados
(function () {
  'use strict';
  const MODO = document.body.dataset.modo; // 'marcados' | 'comentarios' | 'memorizados'
  const $ = id => document.getElementById(id);
  const VERSIONES = { 'Reina-Valera-1960': ['RVR1960', 'rv1960'], 'TLA': ['TLA', 'tla'], 'Dios-Habla-Hoy': ['DHH', 'dhh'], 'La-Biblia-de-Las-Americas': ['LBLA', 'lla'], 'Nueva-Traduccion-Viviente': ['NTV', 'ntv'], 'KJV': ['KJV', 'kjv'], 'WEB': ['WEB', 'web'] };
  const COLORES = { amarillo: 'Amarillo', verde: 'Verde', azul: 'Azul', rosa: 'Rosa', morado: 'Morado' };
  const leerJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const normal = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const svg = (p, w = 18) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    leer: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    quitar: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  let tAviso;
  function avisar(t, deshacer) {
    const a = $('aviso');
    a.innerHTML = esc(t) + (deshacer ? ' <button type="button" id="deshacer">Deshacer</button>' : '');
    a.classList.add('on');
    if (deshacer) $('deshacer').onclick = () => { deshacer(); a.classList.remove('on'); };
    clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('on'), 5000);
  }

  // ---------- Biblia ----------
  const version = VERSIONES[localStorage.getItem('lecturaVersion')] ? localStorage.getItem('lecturaVersion') : 'Reina-Valera-1960';
  let doc = null, orden = [];
  const partir = k => { const a = k.lastIndexOf('-'), b = k.lastIndexOf('-', a - 1); return { libro: k.slice(0, b), cap: parseInt(k.slice(b + 1, a), 10), v: parseInt(k.slice(a + 1), 10) }; };
  function texto(p) {
    if (!doc) return '';
    const b = Array.from(doc.getElementsByTagName('b')).find(x => x.getAttribute('n') === p.libro);
    const c = b && Array.from(b.getElementsByTagName('c')).find(x => x.getAttribute('n') === String(p.cap));
    const v = c && Array.from(c.getElementsByTagName('v')).find(x => x.getAttribute('n') === String(p.v));
    return v ? Array.from(v.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim() : '';
  }
  const posicion = p => { const i = orden.indexOf(p.libro); return (i < 0 ? 999 : i) * 1e6 + p.cap * 1000 + p.v; };
  const enlaceLeer = p => `lectura.html?book=${encodeURIComponent(p.libro)}&chapter=${p.cap}&verse=${p.v}`;
  const enlaceCompartir = p => `share.html?book=${encodeURIComponent(p.libro)}&chapter=${p.cap}&verse=${p.v}&version=${VERSIONES[version][1]}`;

  // ---------- Datos de cada modo ----------
  function claves() {
    if (MODO === 'marcados') return leerJSON('bookmarks', []);
    if (MODO === 'comentarios') return Object.keys(leerJSON('comments', {}));
    return leerJSON('memorized', []);
  }
  function quitar(k) {
    if (MODO === 'marcados') {
      const lista = leerJSON('bookmarks', []), col = leerJSON('bookmarkColors', {}), antes = col[k];
      guardar('bookmarks', lista.filter(x => x !== k)); delete col[k]; guardar('bookmarkColors', col);
      return () => { const l = leerJSON('bookmarks', []); if (!l.includes(k)) l.push(k); guardar('bookmarks', l); if (antes) { const c = leerJSON('bookmarkColors', {}); c[k] = antes; guardar('bookmarkColors', c); } pintar(); };
    }
    if (MODO === 'comentarios') {
      const com = leerJSON('comments', {}), antes = com[k];
      delete com[k]; guardar('comments', com);
      return () => { const c = leerJSON('comments', {}); c[k] = antes; guardar('comments', c); pintar(); };
    }
    const mem = leerJSON('memorized', []);
    guardar('memorized', mem.filter(x => x !== k));
    return () => { const m = leerJSON('memorized', []); if (!m.includes(k)) m.push(k); guardar('memorized', m); pintar(); };
  }

  // ---------- Pintar ----------
  let filtroColor = '', repaso = false;
  function pintar() {
    const q = normal($('buscar').value.trim());
    const colores = leerJSON('bookmarkColors', {}), comentarios = leerJSON('comments', {});
    let items = claves().map(k => ({ k, p: partir(k) })).filter(x => x.p.libro && x.p.cap);
    items.forEach(x => { x.t = texto(x.p); x.color = COLORES[colores[x.k]] ? colores[x.k] : 'verde'; x.com = comentarios[x.k] || ''; });
    const total = items.length;
    if (MODO === 'marcados') {
      const cuenta = {}; items.forEach(x => { cuenta[x.color] = (cuenta[x.color] || 0) + 1; });
      $('colores').innerHTML = `<button type="button" class="fc${filtroColor === '' ? ' on' : ''}" data-color="" aria-pressed="${filtroColor === ''}">Todos <small>${total}</small></button>`
        + Object.keys(COLORES).filter(c => cuenta[c]).map(c => `<button type="button" class="fc${filtroColor === c ? ' on' : ''}" data-color="${c}" aria-pressed="${filtroColor === c}"><i style="background:var(--hl-${c})"></i>${COLORES[c]} <small>${cuenta[c]}</small></button>`).join('');
      if (filtroColor) items = items.filter(x => x.color === filtroColor);
    }
    if (q) items = items.filter(x => normal(`${x.p.libro} ${x.p.cap}:${x.p.v} ${x.t} ${x.com}`).includes(q));
    items.sort((a, b) => posicion(a.p) - posicion(b.p));
    $('total').textContent = total === 1 ? '1 versículo' : `${total} versículos`;
    if (!total) { $('lista').innerHTML = `<div class="vacio">${$('vacio-tpl').innerHTML}</div>`; return; }
    if (!items.length) { $('lista').innerHTML = '<p class="nada">No hay resultados con ese filtro.</p>'; return; }
    $('lista').innerHTML = items.map(x => {
      const ref = `${esc(x.p.libro)} ${x.p.cap}:${x.p.v}`;
      const cuerpo = x.t ? esc(x.t) : '<span class="nada">Cargando el texto…</span>';
      let extra = '';
      if (MODO === 'comentarios') extra = `<div class="com" data-com="${esc(x.k)}"><b>Tu comentario</b><p>${esc(x.com)}</p></div>`;
      const acciones = `<a class="acc" href="${enlaceLeer(x.p)}">${svg(I.leer)}Leer</a>`
        + (MODO !== 'comentarios' ? `<a class="acc" href="${enlaceCompartir(x.p)}">${svg(I.compartir)}Compartir</a>` : `<button class="acc" type="button" data-editar="${esc(x.k)}">${svg(I.editar)}Editar</button>`)
        + `<button class="acc peligro" type="button" data-quitar="${esc(x.k)}" aria-label="Quitar ${ref}">${svg(I.quitar)}Quitar</button>`;
      const oculto = MODO === 'memorizados' && repaso;
      return `<article class="item${MODO === 'marcados' ? ' hl-' + x.color : ''}">
        <h2 class="ref">${ref}</h2>
        ${oculto ? `<button type="button" class="revelar" data-revelar>${svg(I.ojo)}Toca para ver el versículo</button><p class="txt" hidden>${cuerpo}</p>` : `<p class="txt">${cuerpo}</p>`}
        ${extra}
        <div class="accs">${acciones}</div>
      </article>`;
    }).join('');
  }

  // ---------- Eventos ----------
  $('buscar').addEventListener('input', pintar);
  if ($('colores')) $('colores').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (b) { filtroColor = b.dataset.color; pintar(); } });
  if ($('repaso')) $('repaso').addEventListener('click', () => {
    repaso = !repaso; $('repaso').setAttribute('aria-pressed', String(repaso));
    $('repaso').querySelector('span').textContent = repaso ? 'Salir del repaso' : 'Modo repaso';
    pintar();
  });
  $('lista').addEventListener('click', e => {
    const r = e.target.closest('[data-revelar]');
    if (r) { r.nextElementSibling.hidden = false; r.remove(); return; }
    const q = e.target.closest('[data-quitar]');
    if (q) { const deshacer = quitar(q.dataset.quitar); pintar(); avisar('Quitado', deshacer); return; }
    const ed = e.target.closest('[data-editar]');
    if (ed) {
      const k = ed.dataset.editar, caja = $('lista').querySelector(`[data-com="${CSS.escape(k)}"]`);
      if (!caja || caja.querySelector('textarea')) return;
      const actual = leerJSON('comments', {})[k] || '';
      caja.innerHTML = `<textarea class="area" aria-label="Editar comentario">${esc(actual)}</textarea><div class="accs"><button type="button" class="btn" data-guardar="${esc(k)}">Guardar</button><button type="button" class="acc" data-cancelar>Cancelar</button></div>`;
      caja.querySelector('textarea').focus();
      return;
    }
    const g = e.target.closest('[data-guardar]');
    if (g) {
      const k = g.dataset.guardar, val = g.closest('.com').querySelector('textarea').value.trim(), com = leerJSON('comments', {});
      if (val) com[k] = val; else delete com[k];
      guardar('comments', com); pintar(); avisar(val ? 'Comentario guardado' : 'Comentario eliminado');
      return;
    }
    if (e.target.closest('[data-cancelar]')) pintar();
  });

  // ---------- Inicio ----------
  pintar();
  fetch(`biblia-files/${version}.xmm`).then(r => r.text()).then(t => {
    doc = new DOMParser().parseFromString(t.replace(/^\uFEFF/, ''), 'text/xml');
    orden = Array.from(doc.getElementsByTagName('b')).map(b => b.getAttribute('n'));
    pintar();
  }).catch(() => avisar('No se pudo cargar el texto de los versículos'));
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
})();
