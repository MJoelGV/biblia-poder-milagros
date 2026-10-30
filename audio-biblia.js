// Biblia en audio: convierte "Libro capítulo" en el archivo de audio correspondiente
(function () {
  var LIBROS = ["Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías", "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amós", "Abdías", "Jonás", "Miqueas", "Nahum", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías", "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"];
  var CODIGOS = ["genesis", "exodus", "lev", "num", "deu", "joshua", "judges", "ruth", "1sam", "2sam", "1kin", "2kin", "1chron", "2chron", "ezra", "nehemiah", "esther", "job", "psalm", "proverbs", "ecc", "song", "isaiah", "jere", "lam", "ezek", "dan", "hosea", "joel", "amos", "oba", "jonah", "micah", "nahum", "habak", "haggai", "zeph", "zech", "mal", "matt", "mark", "luke", "john", "acts", "romans", "1cor", "2cor", "gal", "eph", "phil", "col", "1the", "2the", "1tim", "2tim", "tit", "phi", "heb", "jam", "1pet", "2pet", "1joh", "2joh", "3joh", "jude", "rev"];
  function normal(t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  function indice(libro) {
    var n = normal(libro);
    if (n === 'hechos de los apostoles') n = 'hechos';
    if (n === 'cantar de los cantares') n = 'cantares';
    for (var i = 0; i < LIBROS.length; i++) if (normal(LIBROS[i]) === n) return i;
    return -1;
  }
  window.AudioBiblia = {
    LIBROS: LIBROS,
    CODIGOS: CODIGOS,
    indice: indice,
    // Ruta del mp3 (base: carpeta donde está la app, por ejemplo '' o '../')
    archivo: function (libro, cap, base) {
      var i = indice(libro);
      if (i < 0) return null;
      var c = parseInt(cap, 10) || 1;
      var num = String(c);
      while (num.length < (CODIGOS[i] === 'psalm' && c >= 100 ? 3 : 2)) num = '0' + num;
      return (base || '') + 'audio/' + CODIGOS[i] + '_' + num + '.mp3';
    },
    // Enlace a la página de Escuchar, que empieza a sonar al abrir
    enlace: function (libro, cap, base) {
      return (base || '') + 'audio.html?book=' + encodeURIComponent(libro) + '&chapter=' + (parseInt(cap, 10) || 1) + '&play=1';
    }
  };
})();
