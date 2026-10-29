// Tema claro / oscuro / automático. Se carga en el <head> para que no parpadee.
// Usa la misma preferencia 'theme' ('light' | 'dark') que la página de lectura; sin preferencia = automático.
(function () {
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function preferencia() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function aplicar() {
    var p = preferencia();
    var oscuro = p === 'dark' || (p !== 'light' && media && media.matches);
    document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', oscuro ? '#0F1412' : '#F6F8F5');
  }
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
