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
const CLAVE_HORA = 'capituloHora';
function leerHora() { try { const h = parseInt(localStorage.getItem(CLAVE_HORA), 10); return h >= 0 && h <= 23 ? h : 7; } catch (e) { return 7; } }
function guardarHora(h) { try { localStorage.setItem(CLAVE_HORA, String(h)); } catch (e) {} }
function zona() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; } catch (e) { return 'America/Chicago'; } }
function textoHora(h) { const ampm = h < 12 ? 'a.m.' : 'p.m.'; const h12 = h % 12 === 0 ? 12 : h % 12; return `${h12}:00 ${ampm}`; }
function datosToken(token) {
  return { token, plataforma: plataforma(), hora: leerHora(), tz: zona(), updatedAt: serverTimestamp() };
}
function leerToken() { try { return localStorage.getItem(CLAVE_LOCAL); } catch (e) { return null; } }
function guardarToken(t) { try { t ? localStorage.setItem(CLAVE_LOCAL, t) : localStorage.removeItem(CLAVE_LOCAL); } catch (e) {} }

// ---------- Mosaico en la página principal ----------
const m = crearMosaico('xi-cdd', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>', 'Capítulo del día');
let estado = 'inactivo';

function pintar(nuevo, mensaje) {
  estado = nuevo;
  if (!m) return;
  m.tile.disabled = nuevo === 'cargando';
  if (nuevo === 'activo') m.set(`Activado · ${textoHora(leerHora())}`, true);
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
    await setDoc(doc(db, 'tokens', token), { ...datosToken(token), createdAt: serverTimestamp() }, { merge: true });
    guardarToken(token);
    pintar('activo');
    mostrarAjustes('¡Listo! Ya estás suscrito. Elige a qué hora quieres recibir el capítulo del día:');
    registro.showNotification('¡Listo! 📖', {
      body: 'Recibirás el capítulo del día a la hora que elijas.',
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

function mostrarAjustes(intro) {
  const opciones = [];
  for (let h = 4; h <= 22; h++) opciones.push(`<option value="${h}"${h === leerHora() ? ' selected' : ''}>${textoHora(h)}</option>`);
  m.mostrar(`${intro || 'Cada día te llega una notificación con un capítulo del Nuevo Testamento. Al tocarla se abre la lectura.'}
    <label style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;font-weight:600">¿A qué hora?
      <select id="cdd-hora" style="min-height:44px;border-radius:12px;padding:0 12px;font:inherit;font-size:16px;background:var(--bg,#F6F8F5);color:var(--text,#15201A);border:1px solid var(--border,#E3E9E4)">${opciones.join('')}</select>
    </label>`, [
    { texto: 'Listo', accion: () => m.ocultar() },
    { texto: 'Desactivar', tipo: 'sec', accion: desactivar }
  ]);
  const sel = m.panel.querySelector('#cdd-hora');
  sel.addEventListener('change', async () => {
    const h = parseInt(sel.value, 10);
    guardarHora(h);
    pintar('activo'); mostrarAjustes('Hora guardada ✓ Te llegará cada día a esta hora.');
    const token = leerToken();
    if (token) { try { await setDoc(doc(db, 'tokens', token), datosToken(token), { merge: true }); } catch (e) { console.warn('Hora:', e); } }
  });
}

if (m) m.tile.addEventListener('click', () => {
  if (estado === 'activo') {
    if (!m.panel.hidden) return m.ocultar();
    mostrarAjustes();
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
    const hoyLocal = new Date().toDateString();
    if (localStorage.getItem('capituloSync') !== hoyLocal) {
      await setDoc(doc(db, 'tokens', token), datosToken(token), { merge: true });
      localStorage.setItem('capituloSync', hoyLocal);
    }
  } catch (e) { console.warn('Capítulo del día (sync):', e); }
  try {
    if (!(await isSupported())) return;
    const registro = await navigator.serviceWorker.ready;
    const nuevo = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registro });
    if (nuevo && nuevo !== token) {
      await setDoc(doc(db, 'tokens', nuevo), { ...datosToken(nuevo), createdAt: serverTimestamp() }, { merge: true });
      try { await deleteDoc(doc(db, 'tokens', token)); } catch (e) {}
      guardarToken(nuevo);
    }
  } catch (e) { console.warn('Capítulo del día (renovar):', e); }
})();
