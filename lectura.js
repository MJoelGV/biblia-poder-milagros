// Lectura de la Biblia · Biblia de Poder y Milagros
(function () {
  'use strict';

  // ---------- Datos básicos ----------
  const VERSIONES = [
    { id: 'Reina-Valera-1960', corto: 'RVR1960', nombre: 'Reina-Valera 1960' },
    { id: 'TLA', corto: 'TLA', nombre: 'Traducción en Lenguaje Actual' },
    { id: 'Dios-Habla-Hoy', corto: 'DHH', nombre: 'Dios Habla Hoy' },
    { id: 'La-Biblia-de-Las-Americas', corto: 'LBLA', nombre: 'La Biblia de las Américas' },
    { id: 'Nueva-Traduccion-Viviente', corto: 'NTV', nombre: 'Nueva Traducción Viviente' }
  ];
  const CODIGOS = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
    'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
  const COLORES = ['amarillo', 'verde', 'azul', 'rosa', 'morado'];
  const $ = id => document.getElementById(id);
  const leer = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } };
  const leerJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { avisar('No se pudo guardar en este dispositivo'); } };
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (p, w = 22) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICO_COM = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
  const ICO_MEM = '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>';
  const ICO_OK = '<path d="M20 6 9 17l-5-5"/>';

  // ---------- Estado ----------
  const params = new URLSearchParams(location.search);
  const ultima = leerJSON('ultimaLectura', null);
  let version = VERSIONES.some(v => v.id === params.get('version')) ? params.get('version')
    : (VERSIONES.some(v => v.id === leer('lecturaVersion')) ? leer('lecturaVersion') : (ultima && VERSIONES.some(v => v.id === ultima.version) ? ultima.version : 'Reina-Valera-1960'));
  let libro = null, capitulo = 1, versiculoInicial = parseInt(params.get('verse') || '0', 10) || 0;
  let comparar = leer('lecturaComparar', '');
  let mostrarPericopas = leer('mostrarPericopas', '1') !== '0';
  let tamLetra = parseFloat(leer('verseFontSize', '20')) || 20;
  const docs = {};       // versiones ya cargadas
  let doc = null;        // versión actual
  let libros = [];       // nombres de los 66 libros
  let seleccionado = null; // { v, el }

  const verInfo = id => VERSIONES.find(v => v.id === id) || VERSIONES[0];
  const clave = v => `${libro}-${capitulo}-${v}`;
  const referencia = v => `${libro} ${capitulo}:${v}`;

  // ---------- Avisos ----------
  let tAviso;
  function avisar(t) {
    const a = $('aviso'); a.textContent = t; a.classList.add('on');
    clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('on'), 2400);
  }

  // ---------- Cargar versiones ----------
  async function cargarVersion(id) {
    if (docs[id]) return docs[id];
    const r = await fetch(`biblia-files/${id}.xmm`);
    if (!r.ok) throw new Error('No se pudo descargar la versión');
    const texto = await r.text();
    const d = new DOMParser().parseFromString(texto.replace(/^\uFEFF/, ''), 'text/xml');
    if (d.querySelector('parsererror')) throw new Error('Archivo de la Biblia dañado');
    docs[id] = d;
    return d;
  }
  const nodoLibro = (d, b) => d.querySelector(`b[n="${CSS.escape(b)}"]`);
  const nodoCap = (d, b, c) => { const nb = nodoLibro(d, b); return nb ? nb.querySelector(`c[n="${c}"]`) : null; };
  const numCaps = b => { const nb = nodoLibro(doc, b); return nb ? nb.getElementsByTagName('c').length : 0; };
  const textoV = nodo => Array.from(nodo.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  function versiculosDe(d, b, c) {
    const nc = nodoCap(d, b, c);
    return nc ? Array.from(nc.getElementsByTagName('v')).map(n => ({ n: parseInt(n.getAttribute('n'), 10), t: textoV(n) })) : [];
  }

  // ---------- Perícopas ----------
  function pericopasDe(b, c) {
    const i = libros.indexOf(b);
    const datos = window.PERICOPES_DATA;
    if (i < 0 || !datos) return [];
    return (datos[`${CODIGOS[i]}-${c}`] || []).map(p => ({ desde: parseInt(p.startVerseId, 10) || 1, titulo: (p.title || '').trim() }))
      .filter(p => p.titulo).map(p => ({ ...p, titulo: p.titulo.charAt(0).toUpperCase() + p.titulo.slice(1) }));
  }

  // ---------- Pintar el capítulo ----------
  async function mostrar(b, c, v, opciones = {}) {
    if (!libros.includes(b)) b = libros[0];
    const total = numCaps(b);
    c = Math.min(Math.max(1, parseInt(c, 10) || 1), total || 1);
    libro = b; capitulo = c;
    cerrarTodo();
    const vi = verInfo(version);
    $('txt-pasaje').textContent = `${b} ${c}`;
    $('txt-version').textContent = vi.corto;
    $('cap-ver').textContent = vi.nombre;
    $('cap-nombre').textContent = `${b} ${c}`;
    document.title = `${b} ${c} · Biblia de Poder y Milagros`;

    const lista = versiculosDe(doc, b, c);
    let otra = [];
    if (comparar && comparar !== version) {
      try { otra = versiculosDe(await cargarVersion(comparar), b, c); } catch (e) { avisar('No se pudo cargar la versión para comparar'); }
    }
    const mapaOtra = new Map(otra.map(x => [x.n, x.t]));
    const peris = mostrarPericopas ? pericopasDe(b, c) : [];
    const marcados = new Set(leerJSON('bookmarks', []));
    const colores = leerJSON('bookmarkColors', {});
    const comentarios = leerJSON('comments', {});
    const memorizados = new Set(leerJSON('memorized', []));
    const comparando = otra.length > 0;
    const nombreOtra = comparando ? verInfo(comparar).corto : '';

    let html = '', abierto = false;
    const abrir = () => { if (!abierto) { html += '<p>'; abierto = true; } };
    const cerrar = () => { if (abierto) { html += '</p>'; abierto = false; } };
    for (const x of lista) {
      const p = peris.find(pp => pp.desde === x.n);
      if (p) { cerrar(); html += `<h2 class="peri"><button type="button" data-peri="${x.n}" aria-label="${esc(p.titulo)}. Ver todas las perícopas de ${esc(b)}">${esc(p.titulo)}</button></h2>`; }
      if (comparando) cerrar();
      abrir();
      const k = `${b}-${c}-${x.n}`;
      const color = marcados.has(k) ? (COLORES.includes(colores[k]) ? colores[k] : 'verde') : '';
      const iconos = (comentarios[k] ? `<button class="vi" type="button" data-com="${x.n}" aria-label="Ver comentario">${svg(ICO_COM, 16)}</button>` : '')
        + (memorizados.has(k) ? `<span class="vi" title="Memorizado" aria-label="Memorizado">${svg(ICO_MEM, 16)}</span>` : '');
      html += `<span class="v${color ? ' hl-' + color : ''}" data-v="${x.n}" tabindex="0" role="button" aria-label="Versículo ${x.n}"><sup class="vn">${x.n}</sup>${iconos}${esc(x.t)}</span> `;
      if (comparando) {
        cerrar();
        const t2 = mapaOtra.get(x.n);
        if (t2) html += `<span class="cmp-v"><b>${esc(nombreOtra)}</b>${esc(t2)}</span>`;
      }
    }
    cerrar();
    const texto = $('texto');
    texto.classList.toggle('comparando', comparando);
    texto.innerHTML = html || '<div class="cargando-txt">No se encontró este capítulo en esta versión.</div>';
    pintarFin();

    // Recordar dónde se quedó
    guardar('ultimaLectura', { book: b, chapter: c, version, t: Date.now() });
    const url = new URL(location.href);
    url.searchParams.set('book', b); url.searchParams.set('chapter', c);
    url.searchParams.delete('verse'); url.searchParams.delete('q'); url.searchParams.delete('version');
    history.replaceState(null, '', url);

    // Si se está escuchando, el audio sigue al capítulo que se abrió
    if (escuchando && (audioPos.b !== b || audioPos.c !== c)) cargarAudio(b, c, true);
    if (v) requestAnimationFrame(() => irAVersiculo(v));
    else if (!opciones.mantenerScroll) window.scrollTo({ top: 0, behavior: 'auto' });
    $('barra').classList.remove('oculta');
    document.body.classList.remove('leyendo');
  }

  function irAVersiculo(v) {
    const el = document.querySelector(`.v[data-v="${v}"]`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.classList.remove('destello'); void el.offsetWidth; el.classList.add('destello');
    setTimeout(() => el.classList.remove('destello'), 2700);
  }

  // ---------- Capítulo anterior / siguiente ----------
  function vecino(dir) {
    let i = libros.indexOf(libro), c = capitulo + dir;
    if (c < 1) { if (i === 0) return null; i--; c = numCaps(libros[i]); }
    else if (c > numCaps(libro)) { if (i === libros.length - 1) return null; i++; c = 1; }
    return { b: libros[i], c };
  }
  function pintarFin() {
    const a = vecino(-1), s = vecino(1);
    $('fab-ant').hidden = !a; $('fab-sig').hidden = !s;
    $('fin').innerHTML = (a ? `<a href="#" data-ir="-1"><small>Anterior</small>${esc(a.b)} ${a.c}</a>` : '<span style="flex:1"></span>')
      + (s ? `<a href="#" class="sig" data-ir="1"><small>Siguiente</small>${esc(s.b)} ${s.c}</a>` : '');
  }
  function ir(dir) { const n = vecino(dir); if (n) mostrar(n.b, n.c); }
  $('fab-ant').addEventListener('click', () => ir(-1));
  $('fab-sig').addEventListener('click', () => ir(1));
  $('fin').addEventListener('click', e => { const a = e.target.closest('[data-ir]'); if (a) { e.preventDefault(); ir(parseInt(a.dataset.ir, 10)); } });

  // ---------- Barra que se esconde al leer ----------
  // Al leer hacia abajo se esconden la barra de arriba, la de abajo y las flechas;
  // al subir un poco o llegar al final del capítulo, vuelven a aparecer.
  let ultimoY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - ultimoY) < 8) return;
    const alFinal = window.innerHeight + y >= document.documentElement.scrollHeight - 140;
    const esconder = y > ultimoY && y > 90 && !alFinal;
    $('barra').classList.toggle('oculta', esconder);
    document.body.classList.toggle('leyendo', esconder);
    ultimoY = y;
  }, { passive: true });

  // ---------- Hojas y pantallas ----------
  let abiertos = [];
  function abrir(id) {
    const el = $(id);
    abiertos.push(el);
    if (el.classList.contains('hoja')) $('velo').classList.add('on');
    requestAnimationFrame(() => el.classList.add('on'));
    document.body.style.overflow = 'hidden';
    const foco = el.querySelector('input, textarea, [data-cerrar]');
    if (foco) setTimeout(() => foco.focus({ preventScroll: true }), 380);
  }
  function cerrarUltimo() {
    const el = abiertos.pop();
    if (!el) return;
    el.classList.remove('on');
    if (!abiertos.some(x => x.classList.contains('hoja'))) $('velo').classList.remove('on');
    if (!abiertos.length) { document.body.style.overflow = ''; quitarSeleccion(); }
  }
  function cerrarTodo() { while (abiertos.length) cerrarUltimo(); }
  $('velo').addEventListener('click', cerrarUltimo);
  document.addEventListener('click', e => { if (e.target.closest('[data-cerrar]')) cerrarUltimo(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarUltimo(); });
  // Deslizar hacia abajo para cerrar una hoja
  document.querySelectorAll('.hoja').forEach(h => {
    let y0 = null;
    h.addEventListener('touchstart', e => { y0 = h.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    h.addEventListener('touchmove', e => { if (y0 !== null && e.touches[0].clientY - y0 > 70) { y0 = null; cerrarUltimo(); } }, { passive: true });
  });

  // ---------- Tocar un versículo ----------
  function quitarSeleccion() { document.querySelectorAll('.v.sel').forEach(x => x.classList.remove('sel')); seleccionado = null; }
  function abrirVersiculo(el) {
    quitarSeleccion();
    const v = parseInt(el.dataset.v, 10);
    seleccionado = { v, el };
    el.classList.add('sel');
    const k = clave(v);
    $('hv-ref').textContent = referencia(v);
    $('hv-ver').textContent = verInfo(version).nombre;
    const marcado = leerJSON('bookmarks', []).includes(k);
    const color = marcado ? (leerJSON('bookmarkColors', {})[k] || 'verde') : '';
    document.querySelectorAll('#hoja-v .color').forEach(b => b.classList.toggle('on', !!b.dataset.color && b.dataset.color === color));
    $('txt-comentar').textContent = leerJSON('comments', {})[k] ? 'Ver comentario' : 'Comentar';
    const mem = leerJSON('memorized', []).includes(k);
    $('txt-memorizar').textContent = mem ? 'Memorizado' : 'Memorizar';
    document.querySelector('[data-accion="memorizar"]').classList.toggle('on', mem);
    abrir('hoja-v');
  }
  $('texto').addEventListener('click', e => {
    const com = e.target.closest('[data-com]');
    if (com) { e.stopPropagation(); seleccionado = { v: parseInt(com.dataset.com, 10) }; abrirComentario(); return; }
    const el = e.target.closest('.v');
    if (el) abrirVersiculo(el);
  });
  $('texto').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('v')) { e.preventDefault(); abrirVersiculo(e.target); }
  });

  // Colores
  document.querySelectorAll('#hoja-v .color').forEach(b => b.addEventListener('click', () => {
    if (!seleccionado) return;
    const k = clave(seleccionado.v), color = b.dataset.color;
    let marcados = leerJSON('bookmarks', []);
    const colores = leerJSON('bookmarkColors', {});
    if (color) {
      if (!marcados.includes(k)) marcados.push(k);
      colores[k] = color;
    } else {
      marcados = marcados.filter(x => x !== k);
      delete colores[k];
    }
    guardar('bookmarks', marcados);
    guardar('bookmarkColors', colores);
    const el = document.querySelector(`.v[data-v="${seleccionado.v}"]`);
    if (el) { COLORES.forEach(cn => el.classList.remove('hl-' + cn)); if (color) el.classList.add('hl-' + color); }
    document.querySelectorAll('#hoja-v .color').forEach(x => x.classList.toggle('on', x === b && !!color));
    setTimeout(cerrarUltimo, 260);
  }));

  // Acciones
  document.querySelectorAll('#hoja-v .accion').forEach(b => b.addEventListener('click', () => {
    if (!seleccionado) return;
    const v = seleccionado.v, k = clave(v);
    const texto = (versiculosDe(doc, libro, capitulo).find(x => x.n === v) || {}).t || '';
    switch (b.dataset.accion) {
      case 'comparar': abrirComparar(v, texto); break;
      case 'comentar': cerrarUltimo(); seleccionado = { v }; abrirComentario(); break;
      case 'memorizar': {
        let mem = leerJSON('memorized', []);
        const ya = mem.includes(k);
        mem = ya ? mem.filter(x => x !== k) : mem.concat(k);
        guardar('memorized', mem);
        avisar(ya ? 'Quitado de memorizados' : 'Agregado a memorizados');
        cerrarUltimo();
        mostrar(libro, capitulo, 0, { mantenerScroll: true });
        break;
      }
      case 'copiar': {
        const t = `«${texto}» ${referencia(v)} (${verInfo(version).corto})`;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => avisar('Versículo copiado'), () => avisar('No se pudo copiar'));
        cerrarUltimo();
        break;
      }
      case 'compartir':
        location.href = `share.html?book=${encodeURIComponent(libro)}&chapter=${capitulo}&verse=${v}&version=${encodeURIComponent(version)}`;
        break;
      case 'nota':
        cerrarUltimo();
        abrirNotas({ cita: { ref: `${referencia(v)} (${verInfo(version).corto})`, texto } });
        break;
    }
  }));

  // ---------- Comentarios ----------
  function abrirComentario() {
    const k = clave(seleccionado.v);
    $('hc-ref').textContent = referencia(seleccionado.v);
    $('hc-txt').value = leerJSON('comments', {})[k] || '';
    $('hc-borrar').hidden = !$('hc-txt').value;
    abrir('hoja-com');
  }
  function guardarComentario(texto) {
    const k = clave(seleccionado.v);
    const com = leerJSON('comments', {});
    if (texto) com[k] = texto; else delete com[k];
    guardar('comments', com);
    cerrarTodo();
    avisar(texto ? 'Comentario guardado' : 'Comentario eliminado');
    mostrar(libro, capitulo, 0, { mantenerScroll: true });
  }
  $('hc-guardar').addEventListener('click', () => guardarComentario($('hc-txt').value.trim()));
  $('hc-borrar').addEventListener('click', () => { if (confirm('¿Eliminar este comentario?')) guardarComentario(''); });

  // ---------- Comparar un versículo ----------
  function abrirComparar(v, texto) {
    $('hcmp-ref').textContent = referencia(v);
    $('hcmp-res').hidden = true;
    $('hcmp-lista').innerHTML = VERSIONES.filter(x => x.id !== version).map(x => `<button type="button" data-ver="${x.id}">${esc(x.nombre)}${svg('<path d="m9 6 6 6-6 6"/>', 18)}</button>`).join('');
    $('hcmp-lista').onclick = async e => {
      const btn = e.target.closest('[data-ver]'); if (!btn) return;
      const res = $('hcmp-res');
      res.hidden = false; res.textContent = 'Cargando…';
      try {
        const d = await cargarVersion(btn.dataset.ver);
        const t = (versiculosDe(d, libro, capitulo).find(x => x.n === v) || {}).t;
        res.innerHTML = `<b style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:var(--accent)">${esc(verInfo(btn.dataset.ver).nombre)}</b><br>${esc(t || 'Este versículo no está en esa versión.')}`;
      } catch (err) { res.textContent = 'No se pudo cargar esa versión. Revisa tu conexión.'; }
    };
    cerrarUltimo();
    seleccionado = { v };
    abrir('hoja-cmp');
  }

  // ---------- Versión ----------
  $('btn-version').addEventListener('click', () => {
    $('hver-lista').innerHTML = VERSIONES.map(x => `<button type="button" data-ver="${x.id}"><span>${esc(x.nombre)} <small style="color:var(--text-2)">${x.corto}</small></span>${x.id === version ? `<span style="color:var(--accent)">${svg(ICO_OK, 20)}</span>` : ''}</button>`).join('');
    abrir('hoja-ver');
  });
  $('hver-lista').addEventListener('click', async e => {
    const b = e.target.closest('[data-ver]'); if (!b) return;
    cerrarTodo();
    if (b.dataset.ver === version) return;
    avisar('Cargando ' + verInfo(b.dataset.ver).nombre + '…');
    try {
      doc = await cargarVersion(b.dataset.ver);
      version = b.dataset.ver; guardar('lecturaVersion', version);
      mostrar(libro, capitulo, 0, { mantenerScroll: true });
    } catch (err) { avisar('No se pudo cargar esa versión'); }
  });

  // ---------- Ajustes (Aa) ----------
  function aplicarLetra() {
    document.documentElement.style.setProperty('--vfs', tamLetra + 'px');
    $('aa-tam').textContent = tamLetra;
  }
  $('btn-aa').addEventListener('click', () => {
    $('aa-cmp').innerHTML = '<option value="">Ninguna</option>' + VERSIONES.filter(x => x.id !== version).map(x => `<option value="${x.id}"${x.id === comparar ? ' selected' : ''}>${x.corto}</option>`).join('');
    $('aa-peri').setAttribute('aria-checked', String(mostrarPericopas));
    const t = window.temaApp ? window.temaApp.actual() : 'auto';
    document.querySelectorAll('#hoja-aa [data-tema]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tema === t)));
    abrir('hoja-aa');
  });
  $('aa-menos').addEventListener('click', () => { tamLetra = Math.max(14, tamLetra - 2); guardar('verseFontSize', String(tamLetra)); aplicarLetra(); });
  $('aa-mas').addEventListener('click', () => { tamLetra = Math.min(34, tamLetra + 2); guardar('verseFontSize', String(tamLetra)); aplicarLetra(); });
  document.querySelectorAll('#hoja-aa [data-tema]').forEach(b => b.addEventListener('click', () => {
    if (window.temaApp) window.temaApp.elegir(b.dataset.tema);
    document.querySelectorAll('#hoja-aa [data-tema]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('aa-cmp').addEventListener('change', () => {
    comparar = $('aa-cmp').value; guardar('lecturaComparar', comparar);
    mostrar(libro, capitulo, 0, { mantenerScroll: true });
  });
  $('aa-peri').addEventListener('click', () => {
    mostrarPericopas = !mostrarPericopas; guardar('mostrarPericopas', mostrarPericopas ? '1' : '0');
    $('aa-peri').setAttribute('aria-checked', String(mostrarPericopas));
    const y = window.scrollY; mostrar(libro, capitulo, 0, { mantenerScroll: true }); window.scrollTo(0, y);
    abrir('hoja-aa');
  });
  function abrirPericopas(cTocado, vTocado) {
    let html = '';
    const total = numCaps(libro);
    for (let c = 1; c <= total; c++) {
      const lista = pericopasDe(libro, c);
      if (!lista.length) continue;
      html += `<div class="peri-cap">Capítulo ${c}</div>`;
      lista.forEach(p => {
        const tocada = c === cTocado && p.desde === vTocado;
        html += `<button class="peri-item${c === capitulo ? ' actual' : ''}${tocada ? ' tocada' : ''}" type="button" data-c="${c}" data-v="${p.desde}"${tocada ? ' aria-current="true"' : ''}><small>${esc(libro)} ${c}:${p.desde}</small>${esc(p.titulo)}</button>`;
      });
    }
    $('ppe-t').textContent = `Perícopas de ${libro}`;
    $('ppe-lista').innerHTML = html || '<p class="res-n">Este libro no tiene perícopas registradas.</p>';
    cerrarTodo();
    abrir('p-peri');
    // Llevar la lista hasta la perícopa tocada (o al capítulo que se está leyendo)
    setTimeout(() => {
      const obj = $('ppe-lista').querySelector('.peri-item.tocada') || $('ppe-lista').querySelector('.peri-item.actual');
      if (obj) { const caja = $('ppe-lista'); caja.scrollTop = obj.offsetTop - caja.offsetTop - 60; }
    }, 60);
  }
  $('aa-ver-peri').addEventListener('click', () => abrirPericopas(capitulo, 0));
  $('texto').addEventListener('click', e => {
    const b = e.target.closest('[data-peri]');
    if (b) { e.stopPropagation(); abrirPericopas(capitulo, parseInt(b.dataset.peri, 10)); }
  }, true);
  $('ppe-lista').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    mostrar(libro, parseInt(b.dataset.c, 10), parseInt(b.dataset.v, 10));
  });

  // ---------- Elegir pasaje ----------
  let testamento = 'NT';
  function pintarLibros() {
    const f = $('pp-filtro').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const lista = libros.map((b, i) => ({ b, i })).filter(({ b, i }) => f
      ? b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(f)
      : (testamento === 'AT' ? i < 39 : i >= 39));
    $('pp-libros').innerHTML = lista.map(({ b }) => {
      const abierto = b === libro || lista.length === 1;
      const n = numCaps(b);
      let caps = '';
      for (let c = 1; c <= n; c++) caps += `<button type="button" data-b="${esc(b)}" data-c="${c}"${b === libro && c === capitulo ? ' class="on" aria-current="true"' : ''}>${c}</button>`;
      return `<div class="libro${abierto ? ' abierto' : ''}"><button type="button" aria-expanded="${abierto}">${esc(b)}<small style="color:var(--text-2);font-weight:500">${n} cap.</small></button><div class="caps">${caps}</div></div>`;
    }).join('') || '<p class="res-n">No hay libros con ese nombre.</p>';
    document.querySelectorAll('[data-test]').forEach(x => x.setAttribute('aria-pressed', String(!f && x.dataset.test === testamento)));
  }
  $('btn-pasaje').addEventListener('click', () => {
    testamento = libros.indexOf(libro) < 39 ? 'AT' : 'NT';
    $('pp-filtro').value = '';
    pintarLibros();
    abrir('p-pasaje');
    setTimeout(() => { const a = document.querySelector('#pp-libros .libro.abierto'); if (a) a.scrollIntoView({ block: 'start' }); }, 400);
  });
  $('pp-filtro').addEventListener('input', pintarLibros);
  document.querySelectorAll('[data-test]').forEach(b => b.addEventListener('click', () => { testamento = b.dataset.test; $('pp-filtro').value = ''; pintarLibros(); }));
  $('pp-libros').addEventListener('click', e => {
    const cap = e.target.closest('[data-c]');
    if (cap) { mostrar(cap.dataset.b, parseInt(cap.dataset.c, 10)); return; }
    const cab = e.target.closest('.libro > button');
    if (cab) {
      const div = cab.parentElement, ab = !div.classList.contains('abierto');
      document.querySelectorAll('#pp-libros .libro.abierto').forEach(x => { x.classList.remove('abierto'); x.firstElementChild.setAttribute('aria-expanded', 'false'); });
      if (ab) { div.classList.add('abierto'); cab.setAttribute('aria-expanded', 'true'); }
    }
  });

  // ---------- Buscar ----------
  const normal = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let modoBusqueda = leer('busquedaModo', 'exacta') === 'contiene' ? 'contiene' : 'exacta';
  function pintarModo() {
    document.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modoBusqueda)));
    $('pb-ayuda').textContent = modoBusqueda === 'exacta'
      ? 'Busca la palabra completa: «amor» no mostrará «amorreo».'
      : 'Busca esas letras dentro de cualquier palabra: «amor» también mostrará «amorreo» y «amoroso».';
  }
  document.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => {
    modoBusqueda = b.dataset.modo; guardar('busquedaModo', modoBusqueda); pintarModo();
    if ($('pb-q').value.trim().length >= 2) buscar($('pb-q').value);
  }));
  pintarModo();
  const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function buscar(q) {
    q = q.trim();
    const res = $('pb-res');
    if (q.length < 2) { res.innerHTML = ''; return; }
    const nq = normal(q);
    // Palabra exacta: lo buscado no puede estar pegado a otras letras
    const re = modoBusqueda === 'exacta' ? new RegExp(`(^|[^a-z0-9])(${escRe(nq).replace(/\s+/g, '\\s+')})(?=[^a-z0-9]|$)`) : null;
    const posicion = t => {
      if (!re) { const i = t.indexOf(nq); return i < 0 ? null : [i, nq.length]; }
      const m = re.exec(t); return m ? [m.index + m[1].length, m[2].length] : null;
    };
    const hallados = [];
    let total = 0;
    for (const nb of doc.getElementsByTagName('b')) {
      const b = nb.getAttribute('n');
      for (const nc of nb.getElementsByTagName('c')) {
        for (const nv of nc.getElementsByTagName('v')) {
          const t = textoV(nv);
          if (posicion(normal(t))) {
            total++;
            if (hallados.length < 300) hallados.push({ b, c: nc.getAttribute('n'), v: nv.getAttribute('n'), t });
          }
        }
      }
    }
    const marcar = t => {
      const pos = posicion(normal(t));
      if (!pos) return esc(t);
      const [i, n] = pos;
      return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + n)) + '</mark>' + esc(t.slice(i + n));
    };
    res.innerHTML = `<p class="res-n">${total === 0 ? 'No se encontraron versículos.' : total === 1 ? '1 versículo encontrado' : `${total} versículos encontrados` + (total > 300 ? ' (se muestran los primeros 300)' : '')}</p>`
      + hallados.map(h => `<button class="res" type="button" data-b="${esc(h.b)}" data-c="${h.c}" data-v="${h.v}"><b>${esc(h.b)} ${h.c}:${h.v}</b><span>${marcar(h.t)}</span></button>`).join('');
  }
  $('btn-buscar').addEventListener('click', () => { abrir('p-buscar'); });
  $('pb-form').addEventListener('submit', e => { e.preventDefault(); buscar($('pb-q').value); $('pb-q').blur(); });
  $('pb-res').addEventListener('click', e => {
    const r = e.target.closest('[data-b]'); if (!r) return;
    mostrar(r.dataset.b, parseInt(r.dataset.c, 10), parseInt(r.dataset.v, 10));
  });

  // ---------- Notas ----------
  let notaActual = null; // id de la nota que se edita
  function leerNotas() { const n = leerJSON('bible-notes', []); return Array.isArray(n) ? n : []; }
  function guardarBorrador() {
    guardar('bible-note-draft', { id: notaActual, title: $('pn-tit').value, content: $('pn-editor').innerHTML });
  }
  function cargarBorrador() {
    const b = leerJSON('bible-note-draft', null);
    if (b && typeof b === 'object') { notaActual = b.id || null; $('pn-tit').value = b.title || ''; $('pn-editor').innerHTML = b.content || ''; }
  }
  function pestanaNotas(cual) {
    document.querySelectorAll('[data-ntab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ntab === cual)));
    $('pn-editar').hidden = cual !== 'editar';
    $('pn-todas').hidden = cual !== 'todas';
    if (cual === 'todas') pintarNotas();
  }
  function pintarNotas() {
    const notas = leerNotas();
    $('pn-tab-todas').textContent = `Todas mis notas (${notas.length})`;
    $('pn-todas').innerHTML = notas.length ? notas.map(n => `<div class="nota"><button type="button" data-abrir="${n.id}" style="all:unset;display:block;cursor:pointer;width:100%"><b>${esc(n.title || 'Sin título')}</b><small>${n.reference ? esc(n.reference) + ' · ' : ''}${new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</small><p>${esc((n.plainText || '').slice(0, 180))}</p></button><div style="display:flex;gap:8px;margin-top:10px"><button class="btn-l sec" type="button" data-abrir="${n.id}" style="min-height:40px;font-size:14px">Abrir</button><button class="btn-l peligro" type="button" data-borrar="${n.id}" style="min-height:40px;font-size:14px">Eliminar</button></div></div>`).join('')
      : '<p class="res-n">Todavía no tienes notas guardadas.</p>';
  }
  function abrirNotas(opc = {}) {
    cargarBorrador();
    if (opc.cita) {
      const bq = `<blockquote><b>${esc(opc.cita.ref)}</b><br>${esc(opc.cita.texto)}</blockquote><p><br></p>`;
      $('pn-editor').innerHTML = bq + $('pn-editor').innerHTML;
      if (!$('pn-tit').value) $('pn-tit').value = opc.cita.ref.replace(/ \(.*\)$/, '');
      guardarBorrador();
    }
    $('pn-tab-todas').textContent = `Todas mis notas (${leerNotas().length})`;
    pestanaNotas('editar');
    abrir('p-notas');
  }
  $('btn-notas').addEventListener('click', () => abrirNotas());
  document.querySelectorAll('[data-ntab]').forEach(b => b.addEventListener('click', () => pestanaNotas(b.dataset.ntab)));
  document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
  document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => { $('pn-editor').focus(); document.execCommand(b.dataset.cmd, false, null); guardarBorrador(); }));
  $('pn-editor').addEventListener('input', guardarBorrador);
  $('pn-tit').addEventListener('input', guardarBorrador);
  // Imágenes: se achican para que la nota no pese demasiado (y se pueda guardar en la nube)
  $('pn-img-btn').addEventListener('click', () => $('pn-img').click());
  $('pn-img').addEventListener('change', () => {
    const f = $('pn-img').files[0]; if (!f) return;
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const data = cv.toDataURL('image/jpeg', 0.72);
        $('pn-editor').focus();
        document.execCommand('insertHTML', false, `<img src="${data}" alt="Imagen de la nota">`);
        guardarBorrador();
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(f);
    $('pn-img').value = '';
  });
  $('pn-guardar').addEventListener('click', () => {
    const titulo = $('pn-tit').value.trim(), html = $('pn-editor').innerHTML.trim(), plano = $('pn-editor').innerText.trim();
    if (!plano && !$('pn-editor').querySelector('img')) { avisar('Escribe algo en la nota antes de guardar'); return; }
    const notas = leerNotas(), ahora = new Date().toISOString();
    const i = notas.findIndex(n => n.id === notaActual);
    const datos = { title: titulo || 'Nota sin título', content: html, plainText: plano, reference: `${libro} ${capitulo}`, updatedAt: ahora };
    if (i >= 0) notas[i] = { ...notas[i], ...datos };
    else { notaActual = Date.now(); notas.unshift({ id: notaActual, ...datos, createdAt: ahora }); }
    guardar('bible-notes', notas);
    guardarBorrador();
    avisar('Nota guardada');
    $('pn-tab-todas').textContent = `Todas mis notas (${notas.length})`;
  });
  $('pn-nueva').addEventListener('click', () => {
    if (($('pn-editor').innerText.trim() || $('pn-tit').value.trim()) && !confirm('¿Empezar una nota nueva? Lo que no hayas guardado se perderá.')) return;
    notaActual = null; $('pn-tit').value = ''; $('pn-editor').innerHTML = ''; guardarBorrador(); $('pn-editor').focus();
  });
  $('pn-todas').addEventListener('click', e => {
    const ab = e.target.closest('[data-abrir]'), bo = e.target.closest('[data-borrar]');
    if (ab) {
      const n = leerNotas().find(x => String(x.id) === ab.dataset.abrir); if (!n) return;
      notaActual = n.id; $('pn-tit').value = n.title || ''; $('pn-editor').innerHTML = n.content || ''; guardarBorrador(); pestanaNotas('editar');
    } else if (bo && confirm('¿Eliminar esta nota para siempre?')) {
      const id = bo.dataset.borrar;
      guardar('bible-notes', leerNotas().filter(x => String(x.id) !== id));
      if (String(notaActual) === id) { notaActual = null; guardarBorrador(); }
      pintarNotas(); avisar('Nota eliminada');
    }
  });
  // PDF
  function cargarScript(src) {
    return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  }
  $('pn-pdf').addEventListener('click', async () => {
    const titulo = $('pn-tit').value.trim() || 'Mi nota';
    const ed = $('pn-editor');
    if (!ed.innerText.trim() && !ed.querySelector('img')) { avisar('La nota está vacía'); return; }
    avisar('Creando PDF…');
    try {
      if (!window.jspdf) await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const anchoP = pdf.internal.pageSize.getWidth(), altoP = pdf.internal.pageSize.getHeight(), m = 20, ancho = anchoP - m * 2;
      let y = 25;
      const salto = h => { if (y + h > altoP - m) { pdf.addPage(); y = m; } };
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
      pdf.splitTextToSize(titulo, ancho).forEach(l => { salto(9); pdf.text(l, m, y); y += 9; });
      pdf.setDrawColor(200); pdf.line(m, y, anchoP - m, y); y += 8;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12);
      const escribir = (t, negrita) => {
        pdf.setFont('helvetica', negrita ? 'bold' : 'normal');
        pdf.splitTextToSize(t, ancho).forEach(l => { salto(6.5); pdf.text(l, m, y); y += 6.5; });
      };
      for (const nodo of ed.childNodes) {
        if (nodo.nodeType === 3) { if (nodo.textContent.trim()) escribir(nodo.textContent.trim()); continue; }
        if (nodo.nodeType !== 1) continue;
        const imgs = nodo.tagName === 'IMG' ? [nodo] : Array.from(nodo.querySelectorAll('img'));
        const txt = nodo.innerText.trim();
        if (nodo.tagName === 'UL' || nodo.tagName === 'OL') {
          Array.from(nodo.children).forEach((li, i) => escribir((nodo.tagName === 'OL' ? `${i + 1}. ` : '• ') + li.innerText.trim()));
        } else if (txt) escribir(txt, nodo.tagName === 'BLOCKQUOTE' || /^H\d$/.test(nodo.tagName));
        for (const im of imgs) {
          const w = Math.min(ancho, (im.naturalWidth || 600) * 0.2645), h = w * ((im.naturalHeight || 400) / (im.naturalWidth || 600));
          salto(h + 4); try { pdf.addImage(im.src, 'JPEG', m, y, w, h); } catch (e) {} y += h + 4;
        }
        y += 2;
      }
      pdf.save(`${titulo.replace(/[^\wáéíóúñü -]/gi, '').trim() || 'nota'}.pdf`);
    } catch (e) { console.error(e); avisar('No se pudo crear el PDF'); }
  });

  // ---------- Escuchar el capítulo ----------
  const audioEl = $('mini-audio');
  let escuchando = false, audioPos = {};
  const ICO_PLAY = svg('<path d="M7 4v16l13-8z" fill="currentColor"/>', 20);
  const ICO_PAUSA = svg('<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>', 20);
  function cargarAudio(b, c, reproducir) {
    const src = window.AudioBiblia && window.AudioBiblia.archivo(b, c);
    if (!src) { avisar('Este capítulo no tiene audio'); return; }
    audioPos = { b, c };
    audioEl.src = src;
    $('mini-tit').textContent = `${b} ${c}`;
    $('mini-mas').href = window.AudioBiblia.enlace(b, c).replace('&play=1', '');
    guardar('audio-last-book', src.split('/').pop().split('_')[0]);
    guardar('audio-last-file', src.split('/').pop());
    guardar('audio-last-position', '0');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `${b} ${c}`, artist: 'Biblia de Poder y Milagros', album: 'Biblia en audio',
        artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] });
    }
    if (reproducir) audioEl.play().catch(() => avisar('No se pudo reproducir el audio'));
  }
  function empezarAEscuchar() {
    escuchando = true;
    $('mini').hidden = false; $('btn-escuchar').hidden = true;
    document.body.classList.add('con-mini');
    cargarAudio(libro, capitulo, true);
  }
  function dejarDeEscuchar() {
    escuchando = false; audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load();
    $('mini').hidden = true; $('btn-escuchar').hidden = false;
    document.body.classList.remove('con-mini');
  }
  $('btn-escuchar').addEventListener('click', empezarAEscuchar);
  $('mini-cerrar').addEventListener('click', dejarDeEscuchar);
  $('mini-play').addEventListener('click', () => { audioEl.paused ? audioEl.play().catch(() => {}) : audioEl.pause(); });
  const pintarPlay = () => { const p = audioEl.paused; $('mini-play').innerHTML = p ? ICO_PLAY : ICO_PAUSA; $('mini-play').setAttribute('aria-label', p ? 'Reproducir' : 'Pausar'); };
  audioEl.addEventListener('play', pintarPlay); audioEl.addEventListener('pause', pintarPlay);
  pintarPlay();
  let ultimoAudio = 0;
  audioEl.addEventListener('timeupdate', () => {
    if (audioEl.duration) $('mini-prog').style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
    if (Date.now() - ultimoAudio > 4000) { ultimoAudio = Date.now(); guardar('audio-last-position', String(audioEl.currentTime)); }
  });
  // Al terminar el capítulo, la página avanza y sigue sonando el siguiente
  audioEl.addEventListener('ended', () => { const n = vecino(1); if (n) mostrar(n.b, n.c); else dejarDeEscuchar(); });
  audioEl.addEventListener('error', () => { if (escuchando && audioEl.getAttribute('src')) avisar('No se pudo cargar el audio. Revisa tu conexión.'); });
  if ('mediaSession' in navigator) {
    const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch (e) {} };
    h('play', () => audioEl.play()); h('pause', () => audioEl.pause());
    h('previoustrack', () => { if (escuchando) ir(-1); }); h('nexttrack', () => { if (escuchando) ir(1); });
    h('seekbackward', () => { audioEl.currentTime = Math.max(0, audioEl.currentTime - 15); });
    h('seekforward', () => { audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 15); });
  }

  // ---------- Inicio ----------
  aplicarLetra();
  (async function iniciar() {
    try {
      doc = await cargarVersion(version);
    } catch (e) {
      try { version = 'Reina-Valera-1960'; doc = await cargarVersion(version); }
      catch (e2) { $('texto').innerHTML = '<div class="cargando-txt">No se pudo cargar la Biblia. Revisa tu conexión e inténtalo de nuevo.</div>'; return; }
    }
    libros = Array.from(doc.getElementsByTagName('b')).map(b => b.getAttribute('n'));
    let b = params.get('book'), c = params.get('chapter');
    if (b) {
      // Aceptar nombres sin acentos o en minúsculas en los enlaces
      const nb = normal(b);
      b = libros.find(x => x === b) || libros.find(x => normal(x) === nb) || libros[0];
    } else if (ultima && libros.includes(ultima.book)) { b = ultima.book; c = ultima.chapter; }
    else { b = 'Juan'; c = 1; }
    await mostrar(b, c || 1, versiculoInicial);
    const q = params.get('q');
    if (q) { $('pb-q').value = q; abrir('p-buscar'); buscar(q); }
  })();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
})();
