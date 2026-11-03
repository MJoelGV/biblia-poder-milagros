// Tema claro / oscuro / automático. Se carga en el <head> para que no parpadee.
// Usa la misma preferencia 'theme' ('light' | 'dark') que la página de lectura; sin preferencia = automático.
(function () {
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function preferencia() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function aplicar() {
    var p = preferencia();
    var oscuro = p === 'dark' || (p !== 'light' && media && media.matches);
    document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
    pintarBarra(oscuro);
  }
  // La barra del teléfono (hora, batería) toma el mismo color que el fondo de la página
  function pintarBarra(oscuro) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    var color = oscuro ? '#0F1412' : '#F6F8F5';
    if (document.body) {
      var bg = getComputedStyle(document.body).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') color = bg;
    }
    meta.setAttribute('content', color);
  }
  document.addEventListener('DOMContentLoaded', function () { pintarBarra(document.documentElement.getAttribute('data-theme') === 'dark'); });
  window.temaApp = {
    actual: function () { var p = preferencia(); return p === 'dark' ? 'oscuro' : p === 'light' ? 'claro' : 'auto'; },
    elegir: function (op) {
      try {
        if (op === 'oscuro') localStorage.setItem('theme', 'dark');
        else if (op === 'claro') localStorage.setItem('theme', 'light');
        else localStorage.removeItem('theme');
      } catch (e) {}
      aplicar();
    }
  };
  if (media && media.addEventListener) media.addEventListener('change', aplicar);
  aplicar();
})();

// Al tocar la notificación del Capítulo del día: abrir el capítulo aunque la app arranque en la portada
(function () {
  if (!('serviceWorker' in navigator)) return;
  function ir(url) { if (url && location.href !== url) location.replace(url); }
  navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.tipo === 'abrir') ir(e.data.url); });
  if (!window.caches) return;
  caches.open('abrir-pendiente').then(function (c) {
    return c.match('abrir').then(function (r) {
      if (!r) return;
      return r.json().then(function (d) {
        c.delete('abrir');
        if (d && Date.now() - d.t < 120000) ir(d.url);
      });
    });
  }).catch(function () {});
})();

