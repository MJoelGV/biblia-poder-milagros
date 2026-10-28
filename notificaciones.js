// Capítulo del día: activar o desactivar notificaciones diarias
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getMessaging, getToken, deleteToken, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCxqK1fyIw7R9qmDMHoRdKpgP1mLnsRKn0',
  authDomain: 'biblia-poder-y-milagros.firebaseapp.com',
  projectId: 'biblia-poder-y-milagros',
  storageBucket: 'biblia-poder-y-milagros.firebasestorage.app',
  messagingSenderId: '921398729445',
  appId: '1:921398729445:web:5711d70d560e91e99dd20c'
};
const VAPID_KEY = 'BMAuA98N9pwf7_MBKLWB0JlD3j_mSBgx03Ep53-jA1ZhF6Ay81ip8KXx9qznuKrWgoIdMP4NQY74Yod0RmM5qtw';
const CLAVE_LOCAL = 'capituloDelDiaToken';

const app = initializeApp(firebaseConfig);
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

// ---------- Tarjeta en la página principal ----------
const estilos = document.createElement('style');
estilos.textContent = `
  .cdd-card { display:flex; align-items:center; gap:14px; margin:14px auto; max-width:600px; padding:16px 18px;
    border-radius:16px; background:linear-gradient(135deg,#2e7d32,#4CAF50); color:#fff; box-shadow:0 6px 18px rgba(0,0,0,.18); }
  .cdd-icono { font-size:30px; line-height:1; }
  .cdd-texto { flex:1; min-width:0; }
  .cdd-titulo { font-weight:700; font-size:1.05em; margin:0 0 2px; color:#fff; }
  .cdd-desc { margin:0; font-size:.88em; opacity:.92; color:#fff; }
  .cdd-btn { flex-shrink:0; border:0; border-radius:999px; padding:10px 16px; font-weight:700; font-size:.92em; cursor:pointer;
    background:#fff; color:#2e7d32; }
  .cdd-btn.secundario { background:rgba(255,255,255,.18); color:#fff; border:1px solid rgba(255,255,255,.6); }
  .cdd-btn:disabled { opacity:.6; cursor:default; }
`;
document.head.appendChild(estilos);

const tarjeta = document.createElement('div');
tarjeta.className = 'cdd-card';
tarjeta.innerHTML = `
  <div class="cdd-icono" aria-hidden="true">🔔</div>
  <div class="cdd-texto">
    <p class="cdd-titulo">Capítulo del día</p>
    <p class="cdd-desc" id="cdd-desc">Recibe cada mañana una notificación con un capítulo para leer.</p>
  </div>
  <button class="cdd-btn" id="cdd-btn">Activar</button>
`;
const ancla = document.getElementById('proverb-link');
if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(tarjeta, ancla.nextSibling);
else document.body.prepend(tarjeta);

const btn = tarjeta.querySelector('#cdd-btn');
const desc = tarjeta.querySelector('#cdd-desc');

function pintar(estado, mensaje) {
  btn.disabled = false;
  btn.classList.remove('secundario');
  if (estado === 'activo') {
    desc.textContent = mensaje || 'Activado ✓ Te llegará cada mañana.';
    btn.textContent = 'Desactivar';
    btn.classList.add('secundario');
  } else if (estado === 'cargando') {
    desc.textContent = mensaje || 'Un momento...';
    btn.disabled = true;
  } else if (estado === 'bloqueado') {
    desc.textContent = mensaje;
    btn.textContent = 'Activar';
  } else {
    desc.textContent = mensaje || 'Recibe cada mañana una notificación con un capítulo para leer.';
    btn.textContent = 'Activar';
  }
}

async function activar() {
  if (esIOS() && !instaladaEnInicio()) {
    pintar('bloqueado', 'En iPhone, primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ahí.');
    return;
  }
  if (!(await isSupported())) {
    pintar('bloqueado', 'Este navegador no permite notificaciones. Prueba con Chrome en Android o con la app instalada.');
    return;
  }
  pintar('cargando', 'Pidiendo permiso...');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    pintar('bloqueado', 'No se dio permiso para notificaciones. Puedes activarlo en la configuración del navegador.');
    return;
  }
  try {
    pintar('cargando', 'Activando...');
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
  pintar('cargando', 'Desactivando...');
  const token = leerToken();
  try {
    if (token) await deleteDoc(doc(db, 'tokens', token));
    try { await deleteToken(getMessaging(app)); } catch (e) {}
  } catch (e) {
    console.warn('Capítulo del día:', e);
  }
  guardarToken(null);
  pintar('inactivo', 'Desactivado. Puedes volver a activarlo cuando quieras.');
}

btn.addEventListener('click', () => {
  if (btn.textContent === 'Desactivar') desactivar(); else activar();
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
