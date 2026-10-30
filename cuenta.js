// Cuenta: inicio de sesión con Google y sincronización de lo que guarda cada persona
import { app } from './firebase-config.js';
import { crearMosaico } from './inicio-ui.js';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, reauthenticateWithPopup
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Datos que se guardan en la nube
const CLAVES = [
  'bookmarks', 'comments', 'memorized', 'bible-notes',
  '30diasConJesucristo', 'bibleReadingProgress', 'bibliaEnUnAno', 'completedDays', 'iphcReadingProgress',
  'theme', 'verseFontSize', 'ultimaLectura',
  'bookmarkColors', 'lecturaVersion', 'lecturaComparar', 'mostrarPericopas'
];
const MAX_NUBE = 800000; // Firebase admite ~1 MB por persona; las notas con muchas fotos se quedan solo en el celular
const META = 'cuenta-sync-meta';     // cuándo cambió cada dato en este celular
const UID_LOCAL = 'cuenta-uid';      // de quién son los datos de este celular

const auth = getAuth(app);
auth.languageCode = 'es';
const db = getFirestore(app);
const proveedor = new GoogleAuthProvider();
proveedor.setCustomParameters({ prompt: 'select_account' });

// Acceso directo a localStorage sin pasar por el vigilante de cambios
const _get = Storage.prototype.getItem, _set = Storage.prototype.setItem, _del = Storage.prototype.removeItem;
const leer = k => { try { return _get.call(localStorage, k); } catch (e) { return null; } };
const escribir = (k, v) => { try { v === null ? _del.call(localStorage, k) : _set.call(localStorage, k, v); } catch (e) {} };
const leerMeta = () => { try { return JSON.parse(leer(META) || '{}'); } catch (e) { return {}; } };
const guardarMeta = m => escribir(META, JSON.stringify(m));

let usuario = null;
let pendientes = new Set();
let temporizador = null;

// ---------- Vigilar los cambios que hace la app ----------
Storage.prototype.setItem = function (k, v) {
  _set.call(this, k, v);
  if (this === localStorage && CLAVES.includes(k)) marcarCambio(k);
};
Storage.prototype.removeItem = function (k) {
  _del.call(this, k);
  if (this === localStorage && CLAVES.includes(k)) marcarCambio(k);
};
function marcarCambio(k) {
  const m = leerMeta(); m[k] = Date.now(); guardarMeta(m);
  pendientes.add(k);
  if (usuario) { clearTimeout(temporizador); temporizador = setTimeout(subirPendientes, 1500); }
}
async function subirPendientes() {
  if (!usuario || !pendientes.size) return;
  const m = leerMeta(), datos = {};
  for (const k of pendientes) {
    const v = leer(k);
    if (v && v.length > MAX_NUBE) { console.warn('Demasiado grande para la nube, se queda en este celular:', k); continue; }
    datos[k] = { v, t: m[k] || Date.now() };
  }
  if (!Object.keys(datos).length) { pendientes = new Set(); return; }
  pendientes = new Set();
  try {
    await setDoc(doc(db, 'users', usuario.uid), { datos, actualizado: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('No se pudo guardar en la nube:', e);
    Object.keys(datos).forEach(k => pendientes.add(k));
  }
}
window.addEventListener('pagehide', () => { subirPendientes(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') subirPendientes(); });

// ---------- Combinar datos la primera vez (para no perder nada) ----------
function combinar(local, nube) {
  if (local == null) return nube;
  if (nube == null || local === nube) return local;
  try {
    const a = JSON.parse(local), b = JSON.parse(nube);
    if (Array.isArray(a) && Array.isArray(b)) {
      const vistos = new Set(a.map(x => JSON.stringify(x)));
      return JSON.stringify(a.concat(b.filter(x => !vistos.has(JSON.stringify(x)))));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') return JSON.stringify({ ...b, ...a });
  } catch (e) {}
  return local;
}

// ---------- Sincronizar al entrar ----------
async function sincronizar(u) {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  const nube = (snap.exists() && snap.data().datos) || {};
  const meta = leerMeta();
  const primeraVez = leer(UID_LOCAL) !== u.uid;
  const subir = {};
  let cambio = false;

  for (const k of CLAVES) {
    const local = leer(k);
    const n = nube[k];
    if (primeraVez) {
      const unido = combinar(local, n ? n.v : null);
      if (unido !== local) { escribir(k, unido); cambio = true; }
      if (unido !== null && unido.length <= MAX_NUBE && (!n || unido !== n.v)) subir[k] = { v: unido, t: Date.now() };
      meta[k] = (subir[k] && subir[k].t) || (n && n.t) || meta[k] || 0;
    } else {
      const tl = meta[k] || 0, tn = (n && n.t) || 0;
      if (tn > tl) {
        if (n.v !== local) { escribir(k, n.v); cambio = true; }
        meta[k] = tn;
      } else if (tl > tn && !(local && local.length > MAX_NUBE)) {
        subir[k] = { v: local, t: tl };
      }
    }
  }
  guardarMeta(meta);
  escribir(UID_LOCAL, u.uid);
  const perfil = { nombre: u.displayName || '', correo: u.email || '', actualizado: serverTimestamp() };
  if (Object.keys(subir).length) perfil.datos = subir;
  await setDoc(ref, perfil, { merge: true });

  // Si llegaron datos de otro dispositivo, recargar una vez para mostrarlos
  if (cambio && !sessionStorage.getItem('cuenta-recargado')) {
    sessionStorage.setItem('cuenta-recargado', '1');
    location.reload();
  }
}

// ---------- Entrar, salir y borrar cuenta ----------
async function entrar() {
  try {
    await signInWithPopup(auth, proveedor);
  } catch (e) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(e.code)) {
      return signInWithRedirect(auth, proveedor);
    }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      console.error(e);
      pintar('error', 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
    }
  }
}
async function salir() {
  await subirPendientes();
  await signOut(auth);
}
async function borrarCuenta() {
  if (!usuario) return;
  const ok = confirm('¿Seguro que quieres eliminar tu cuenta? Se borrarán de la nube tus marcadores, notas, versículos memorizados y avance en los planes. En este celular se conservan.');
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'users', usuario.uid));
    try { await usuario.delete(); }
    catch (e) {
      if (e.code === 'auth/requires-recent-login') { await reauthenticateWithPopup(usuario, proveedor); await usuario.delete(); }
      else throw e;
    }
    escribir(UID_LOCAL, null);
    alert('Tu cuenta y tus datos en la nube fueron eliminados.');
  } catch (e) {
    console.error(e);
    alert('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
  }
}

// ---------- Mosaico "Mi cuenta" en la página principal ----------
const m = (document.getElementById('extras-inicio') || document.getElementById('proverb-link'))
  ? crearMosaico('xi-cuenta', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.3 12.5 3.5 3.5 0 0 0 6.5 19z"/></svg>', 'Mi cuenta')
  : null;

function escapar(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

function pintar(estado, msg) {
  if (!m) return;
  if (estado === 'dentro' && usuario) {
    const nombre = (usuario.displayName || usuario.email || 'Mi cuenta').split(' ')[0];
    m.tile.querySelector('.xi-t').textContent = nombre;
    m.icono(usuario.photoURL ? `<img src="${usuario.photoURL}" alt="" referrerpolicy="no-referrer">` : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>');
    m.set(msg || 'Guardado en la nube', true);
  } else {
    m.tile.querySelector('.xi-t').textContent = 'Mi cuenta';
    m.icono('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.3 12.5 3.5 3.5 0 0 0 6.5 19z"/></svg>');
    m.set(msg || 'Guarda tus notas en la nube', false);
  }
  if (estado === 'error') m.mostrar(escapar(msg), [{ texto: 'Entendido', tipo: 'sec', accion: () => m.ocultar() }]);
}

if (m) m.tile.addEventListener('click', () => {
  if (!m.panel.hidden) return m.ocultar();
  if (usuario) {
    m.mostrar(`<b>${escapar(usuario.displayName || '')}</b><br>${escapar(usuario.email || '')}<br>
      Tus marcadores, notas, versículos memorizados y planes se guardan solos en la nube y los verás en cualquier dispositivo donde entres.`, [
      { texto: 'Cerrar sesión', tipo: 'sec', accion: () => { m.ocultar(); salir(); } },
      { texto: 'Eliminar cuenta', tipo: 'peligro', accion: borrarCuenta }
    ]);
  } else {
    m.mostrar('Entra con tu cuenta de Google para guardar tus marcadores, notas y avance en los planes, y verlos en cualquier celular o computadora. Es opcional: la app funciona igual sin cuenta.', [
      { texto: 'Entrar con Google', accion: () => { m.ocultar(); entrar(); } },
      { texto: 'Ahora no', tipo: 'sec', accion: () => m.ocultar() }
    ]);
  }
});
pintar('fuera', 'Un momento…');

getRedirectResult(auth).catch(e => console.warn('Inicio de sesión:', e.code));

onAuthStateChanged(auth, async u => {
  usuario = u;
  window.dispatchEvent(new CustomEvent('cuenta-cambio', { detail: u ? { nombre: u.displayName || '', foto: u.photoURL || '', correo: u.email || '' } : null }));
  if (!u) { pintar('fuera'); return; }
  pintar('dentro', 'Sincronizando…');
  try {
    await sincronizar(u);
    pintar('dentro');
    if (pendientes.size) subirPendientes();
  } catch (e) {
    console.error('Sincronización:', e);
    pintar('dentro', 'Sin conexión; se guardará luego');
  }
});
