// Capítulo del día: activar o desactivar notificaciones diarias
import { app } from './firebase-config.js';
import { crearMosaico } from './inicio-ui.js';
import { getMessaging, getToken, deleteToken, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const VAPID_KEY = 'BMAuA98N9pwf7_MBKLWB0JlD3j_mSBgx03Ep53-jA1ZhF6Ay81ip8KXx9qznuKrWgoIdMP4NQY74Yod0RmM5qtw';
const CLAVE_LOCAL = 'capituloDelDiaToken';

const db = getFirestore(app);

function plataforma() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'web';
}
function esIOS() { return plataforma() === 'ios'; }
function instaladaEnInicio() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function leerToken() { try { return localStorage.getItem(CLAVE_LOCAL); } catch (e) { return null; } }
function guardarToken(t) { try { t ? localStorage.setItem(CLAVE_LOCAL, t) : localStorage.removeItem(CLAVE_LOCAL); } catch (e) {} }

// ---------- Mosaico en la página principal ----------
const m = crearMosaico('xi-cdd', '<i class="fas fa-bell" aria-hidden="true"></i>', 'Capítulo del día');
let estado = 'inactivo';

function pintar(nuevo, mensaje) {
  estado = nuevo;
  if (!m) return;
  m.tile.disabled = nuevo === 'cargando';
  if (nuevo === 'activo') m.set('Activado · cada mañana', true);
  else if (nuevo === 'cargando') m.set(mensaje || 'Un momento…', false);
  else m.set('Toca para activar', false);
  if (nuevo === 'bloqueado' && mensaje) m.mostrar(mensaje, [{ texto: 'Entendido', tipo: 'sec', accion: () => m.ocultar() }]);
  else if (nuevo !== 'cargando') m.ocultar();
}

async function activar() {
  if (esIOS() && !instaladaEnInicio()) {
    pintar('bloqueado', 'En iPhone, primero agrega la app a tu pantalla de inicio (botón Compartir → <b>Agregar a inicio</b>) y ábrela desde ahí.');
    return;
  }
  if (!(await isSupported())) {
    pintar('bloqueado', 'Este navegador no permite notificaciones. Prueba con Chrome en Android o con la app instalada.');
    return;
  }
  pintar('cargando', 'Pidiendo permiso…');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    pintar('bloqueado', 'No se dio permiso para las notificaciones. Puedes activarlo en la configuración del navegador, en los permisos de este sitio.');
    return;
  }
  try {
    pintar('cargando', 'Activando…');
    const registro = await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registro });
    if (!token) throw new Error('No se obtuvo token');
    await setDoc(doc(db, 'tokens', token), {
      token, plataforma: plataforma(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    guardarToken(token);
    pintar('activo');
    registro.showNotification('¡Listo! 📖', {
      body: 'Desde mañana recibirás el capítulo del día.',
      icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'capitulo-del-dia-bienvenida'
    });
  } catch (e) {
    console.error('Capítulo del día:', e);
    pintar('bloqueado', 'No se pudo activar. Revisa tu conexión e inténtalo de nuevo.');
  }
}

async function desactivar() {
  pintar('cargando', 'Desactivando…');
  const token = leerToken();
  try {
    if (token) await deleteDoc(doc(db, 'tokens', token));
    try { await deleteToken(getMessaging(app)); } catch (e) {}
  } catch (e) {
    console.warn('Capítulo del día:', e);
  }
  guardarToken(null);
  pintar('inactivo');
}

if (m) m.tile.addEventListener('click', () => {
  if (estado === 'activo') {
    if (!m.panel.hidden) return m.ocultar();
    m.mostrar('Cada mañana te llega una notificación con un capítulo del Nuevo Testamento para leer. Al tocarla se abre la lectura.', [
      { texto: 'Desactivar', tipo: 'sec', accion: desactivar },
      { texto: 'Cerrar', tipo: 'sec', accion: () => m.ocultar() }
    ]);
  } else if (estado !== 'cargando') activar();
});

// Estado inicial y renovación silenciosa del token
(async function inicio() {
  const token = leerToken();
  if (!token || !('Notification' in window) || Notification.permission !== 'granted') {
    if (token) guardarToken(null);
    pintar('inactivo');
    return;
  }
  pintar('activo');
  try {
    if (!(await isSupported())) return;
    const registro = await navigator.serviceWorker.ready;
    const nuevo = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registro });
    if (nuevo && nuevo !== token) {
      await setDoc(doc(db, 'tokens', nuevo), { token: nuevo, plataforma: plataforma(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      try { await deleteDoc(doc(db, 'tokens', token)); } catch (e) {}
      guardarToken(nuevo);
    }
  } catch (e) { console.warn('Capítulo del día (renovar):', e); }
})();
