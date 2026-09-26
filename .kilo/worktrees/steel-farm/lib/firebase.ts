import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBYF3eJvOPoh8dDEryIG8fI0pwtUHrcT-s',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'classroutine-8bb0f.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'classroutine-8bb0f',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'classroutine-8bb0f.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '468100680383',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:468100680383:web:40c35ce01c7c487f9b940a',
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Firestore — офлайн кэшпен (persistentLocalCache) жылдам іске қосу
// Бірінші рет желіден келген мәліметтер IndexedDB-ға жазылады, келесі ашуда кэштен бірден (0-50мс) көрсетіледі,
// сосын фондық түрде сервермен синхрондалады. WebChannel баяу желіде long-polling-ге ауысады.
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(undefined),
    }),
    experimentalAutoDetectLongPolling: true,
  } as any);
} catch {
  // Егер бұрын getFirestore шақырылған болса (HMR), fallback
  _db = getFirestore(app);
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(_db).catch((err) => {
      if (err?.code !== 'failed-precondition' && err?.code !== 'unimplemented') {
        console.warn('Firestore persistence қатесі', err);
      }
    });
  }
}
export const db: Firestore = _db;
export const googleProvider = new GoogleAuthProvider();
