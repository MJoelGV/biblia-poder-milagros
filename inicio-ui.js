// Mosaicos de la página principal (Capítulo del día y Mi cuenta), con el mismo estilo de vidrio de la portada
const CSS = `
  #extras-inicio { display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:800px; margin:14px auto 0; }
  .xi-tile { display:flex; align-items:center; gap:10px; min-width:0; padding:11px 12px; border-radius:16px;
    background:rgba(0,0,0,.45); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.28); color:#fff; font:inherit; text-align:left; cursor:pointer;
    transition:transform .15s ease, background .2s ease; -webkit-tap-highlight-color:transparent; }
  .xi-tile:active { transform:scale(.97); }
  .xi-tile:focus-visible { outline:2px solid #fff; outline-offset:2px; }
  .xi-tile[disabled] { opacity:.7; cursor:default; }
  .xi-ico { width:38px; height:38px; flex-shrink:0; border-radius:12px; display:grid; place-items:center;
    background:rgba(255,255,255,.16); font-size:17px; overflow:hidden; }
  .xi-ico img { width:100%; height:100%; object-fit:cover; }
  .xi-tile.on .xi-ico { background:#4CAF50; }
  .xi-txt { min-width:0; display:flex; flex-direction:column; }
  .xi-t { font-weight:700; font-size:.92em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .xi-s { font-size:.78em; opacity:.82; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
  .xi-tile.on .xi-s { opacity:1; color:#b9f6ca; }
  .xi-panel { grid-column:1 / -1; padding:12px 14px; border-radius:14px; background:rgba(0,0,0,.55);
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.2);
    color:#fff; font-size:.88em; line-height:1.45; text-align:left; }
  .xi-panel[hidden] { display:none; }
  .xi-acciones { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .xi-btn { border:0; border-radius:999px; padding:8px 14px; font:inherit; font-size:.92em; font-weight:700; cursor:pointer;
    background:#fff; color:#222; }
  .xi-btn.sec { background:rgba(255,255,255,.14); color:#fff; border:1px solid rgba(255,255,255,.35); }
  .xi-btn.peligro { background:rgba(229,57,53,.18); color:#ffcdd2; border:1px solid rgba(229,57,53,.5); }
  @media (max-width:360px) { #extras-inicio { grid-template-columns:1fr; } }
`;

export function contenedorInicio() {
  const ancla = document.getElementById('proverb-link');
  if (!ancla) return null;
  let c = document.getElementById('extras-inicio');
  if (!c) {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    c = document.createElement('div'); c.id = 'extras-inicio';
    ancla.parentNode.insertBefore(c, ancla.nextSibling);
  }
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
