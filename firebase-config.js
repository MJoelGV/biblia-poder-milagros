// Configuración compartida de Firebase para toda la app
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyCxqK1fyIw7R9qmDMHoRdKpgP1mLnsRKn0',
  authDomain: 'biblia-poder-y-milagros.firebaseapp.com',
  projectId: 'biblia-poder-y-milagros',
  storageBucket: 'biblia-poder-y-milagros.firebasestorage.app',
  messagingSenderId: '921398729445',
  appId: '1:921398729445:web:5711d70d560e91e99dd20c'
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
