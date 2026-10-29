// Mosaicos de Capítulo del día y Mi cuenta (usan los colores del tema claro u oscuro)
const CSS = `
  #extras-inicio { display:grid; grid-template-columns:minmax(0,1fr); gap:10px; }
  .xi-tile { display:flex; align-items:center; gap:14px; min-width:0; min-height:72px; padding:12px 16px; border-radius:18px;
    background:var(--surface,#fff); border:1px solid var(--border,#E3E9E4); color:var(--text,#15201A); font:inherit; text-align:left;
    cursor:pointer; transition:transform .15s ease; -webkit-tap-highlight-color:transparent; width:100%; }
  .xi-tile:active { transform:scale(.98); }
  .xi-tile:focus-visible { outline:2px solid var(--accent,#2E7D32); outline-offset:2px; }
  .xi-tile[disabled] { opacity:.7; cursor:default; }
  .xi-ico { width:44px; height:44px; flex-shrink:0; border-radius:22px; display:grid; place-items:center;
    background:var(--accent-soft,#E6F2E7); color:var(--accent,#2E7D32); font-size:18px; overflow:hidden; }
  .xi-ico img { width:100%; height:100%; object-fit:cover; }
  .xi-tile.on .xi-ico { background:var(--accent-fill,#2E7D32); color:var(--on-accent,#fff); }
  .xi-txt { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .xi-t { font-weight:700; font-size:16px; line-height:1.25; }
  .xi-s { font-size:14px; color:var(--text-2,#5B6B62); line-height:1.3; }
  .xi-tile.on .xi-s { color:var(--accent,#2E7D32); }
  .xi-tile::after { content:''; width:9px; height:9px; flex-shrink:0; border-right:2px solid var(--text-2,#5B6B62); border-top:2px solid var(--text-2,#5B6B62); transform:rotate(45deg); margin-right:4px; }
  .xi-panel { grid-column:1 / -1; padding:14px 16px; border-radius:16px; background:var(--surface,#fff); border:1px solid var(--border,#E3E9E4);
    color:var(--text,#15201A); font-size:15px; line-height:1.5; text-align:left; }
  .xi-panel[hidden] { display:none; }
  .xi-acciones { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  .xi-btn { min-height:44px; border:0; border-radius:22px; padding:0 18px; font:inherit; font-size:15px; font-weight:700; cursor:pointer;
    background:var(--accent-fill,#2E7D32); color:var(--on-accent,#fff); }
  .xi-btn.sec { background:transparent; color:var(--text,#15201A); border:1px solid var(--border,#E3E9E4); }
  .xi-btn.peligro { background:transparent; color:#C62828; border:1px solid #EF9A9A; }
  :root[data-theme="dark"] .xi-btn.peligro { color:#FF8A80; border-color:#7F3B3B; }
`;

export function contenedorInicio() {
  let c = document.getElementById('extras-inicio');
  if (c && c.dataset.listo) return c;
  if (!c) {
    const ancla = document.getElementById('proverb-link');
    if (!ancla) return null;
    c = document.createElement('div'); c.id = 'extras-inicio';
    ancla.parentNode.insertBefore(c, ancla.nextSibling);
  }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  c.dataset.listo = '1';
  return c;
}

// Crea un mosaico con ícono, título y subtítulo, y un panel de mensajes debajo de la cuadrícula
export function crearMosaico(id, icono, titulo) {
  const c = contenedorInicio();
  if (!c) return null;
  const tile = document.createElement('button');
  tile.className = 'xi-tile'; tile.id = id; tile.type = 'button';
  tile.innerHTML = `<span class="xi-ico">${icono}</span><span class="xi-txt"><span class="xi-t"></span><span class="xi-s"></span></span>`;
  tile.querySelector('.xi-t').textContent = titulo;
  const panel = document.createElement('div');
  panel.className = 'xi-panel'; panel.hidden = true;
  // Los mosaicos van primero y los paneles al final, ocupando todo el ancho
  const primerPanel = c.querySelector('.xi-panel');
  c.insertBefore(tile, primerPanel);
  c.appendChild(panel);
  return {
    tile, panel,
    set(subtitulo, activo) { tile.querySelector('.xi-s').textContent = subtitulo; tile.classList.toggle('on', !!activo); },
    icono(html) { tile.querySelector('.xi-ico').innerHTML = html; },
    mostrar(html, acciones = []) {
      // Cierra los demás paneles para que solo haya uno abierto
      c.querySelectorAll('.xi-panel').forEach(p => { if (p !== panel) p.hidden = true; });
      panel.innerHTML = `<div class="xi-msg"></div>`;
      panel.querySelector('.xi-msg').innerHTML = html;
      if (acciones.length) {
        const fila = document.createElement('div'); fila.className = 'xi-acciones';
        acciones.forEach(a => {
          const b = document.createElement('button'); b.type = 'button';
          b.className = 'xi-btn' + (a.tipo ? ' ' + a.tipo : ''); b.textContent = a.texto;
          b.onclick = a.accion; fila.appendChild(b);
        });
        panel.appendChild(fila);
      }
      panel.hidden = false;
    },
    ocultar() { panel.hidden = true; }
  };
}
