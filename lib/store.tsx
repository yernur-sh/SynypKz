'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit as fsLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { CLASS_ID, HOMEROOM_TEACHER_EMAIL, TEACHER_EMAILS } from './config';
import type { UserProfile, UserRole } from './types';

function resolveRole(email: string, requested: UserRole): UserRole {
  return TEACHER_EMAILS.includes(email.toLowerCase()) ? 'teacher' : requested;
}

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isTeacher: boolean;
  isHomeroom: boolean;
  authModal: 'login' | 'register' | null;
  openAuth: (mode?: 'login' | 'register') => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    studentName?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        try {
          localStorage.removeItem('synypkz-user');
        } catch {}
        return;
      }
      // Алдымен кэштен бірден көрсету (0мс) — бет бірден ашылады
      try {
        const cached = localStorage.getItem('synypkz-user');
        if (cached) {
          const parsed = JSON.parse(cached) as UserProfile;
          if (parsed.id === fbUser.uid) {
            setUser(parsed);
            setLoading(false);
          }
        }
      } catch {}
      const ref = doc(db, 'users', fbUser.uid);
      let snap = await getDoc(ref);
      if (!snap.exists()) {
        const email = (fbUser.email || '').toLowerCase();
        const profile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email,
          role: resolveRole(email, 'student'),
          classId: CLASS_ID,
          isHomeroom: email === HOMEROOM_TEACHER_EMAIL,
          createdAt: Date.now(),
        };
        await setDoc(ref, profile);
        setUser(profile);
        try {
          localStorage.setItem('synypkz-user', JSON.stringify(profile));
        } catch {}
      } else {
        const profile = { id: fbUser.uid, ...(snap.data() as Omit<UserProfile, 'id'>) } as UserProfile;
        setUser(profile);
        try {
          localStorage.setItem('synypkz-user', JSON.stringify(profile));
        } catch {}
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    setAuthModal(null);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    studentName?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(cred.user, { displayName: name });
    const profile: UserProfile = {
      id: cred.user.uid,
      name,
      email: cleanEmail,
      role: resolveRole(cleanEmail, role),
      classId: CLASS_ID,
      isHomeroom: cleanEmail === HOMEROOM_TEACHER_EMAIL,
      ...(role === 'parent' && studentName ? { studentName } : {}),
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUser(profile);
    setAuthModal(null);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    setAuthModal(null);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo<AppContextType>(
    () => ({
      user,
      firebaseUser,
      loading,
      isTeacher: user?.role === 'teacher',
      isHomeroom: !!user?.isHomeroom,
      authModal,
      openAuth: (mode: 'login' | 'register' = 'login') => setAuthModal(mode),
      closeAuth: () => setAuthModal(null),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, firebaseUser, loading, authModal]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/** Firestore коллекциясын нақты уақытта тыңдайтын hook — жылдам, кэшпен (hydration қатесіз). */
export function useCollection<T extends { id: string }>(
  path: string,
  orderField?: string,
  direction: 'asc' | 'desc' = 'desc',
  limitCount?: number
) {
  const cacheKey = `fs-cache:${path}:${orderField ?? ''}:${direction}:${limitCount ?? ''}`;

  // Hydration қатесін болдырмау үшін бастапқы мән әрқашан [] / true — сервер мен клиентте бірдей.
  // Кэштен оқу тек useEffect ішінде (client mount кейін) жасалады, сонда сервер-дегі "0" мен клиент-тегі "1" сәйкессіздігі болмайды.
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mount кейін кэштен бірден көрсету — бет бірден жылдам ашылады, бірақ hydration-дан кейін
    let hasCache = false;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        if (Array.isArray(parsed) && parsed.length) {
          setData(parsed);
          setLoading(false);
          hasCache = true;
        }
      }
    } catch {}

    const constraints: QueryConstraint[] = [];
    if (orderField) constraints.push(orderBy(orderField, direction));
    if (limitCount) constraints.push(fsLimit(limitCount));

    const q = query(collection(db, path), ...constraints);

    // includeMetadataChanges: кэштен келгенде бірден (0-100мс) хабарлайды, сосын серверден жаңартады
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
        const isFromCache = snap.metadata.fromCache;

        // Алғашқы ашуда кэш бос болса, бос кэш snapshot-ты елемей, серверді күту — әйтпесе EmptyState бірден көрініп, мәлімет жоқ сияқты болады
        if (isFromCache && docs.length === 0 && !hasCache) {
          // loading true күйінде қалдыру — skeleton көрсетіледі, серверден келгенде ауысады
          return;
        }

        setData(docs);
        setError(null);
        setLoading(false);
        // Келесі ашу үшін localStorage-қа сақтау (жылдам іске қосу)
        try {
          if (docs.length) {
            localStorage.setItem(cacheKey, JSON.stringify(docs.slice(0, 50)));
          } else if (!isFromCache) {
            localStorage.removeItem(cacheKey);
          }
        } catch {}
      },
      (err) => {
        console.error('Firestore error', path, err);
        setError(err.message);
        // Кэш бар болса loading-ді жасырмау — кэш көрсетіліп тұр
        if (!hasCache) setLoading(false);
      }
    );
    return () => unsub();
  }, [path, orderField, direction, limitCount, cacheKey]);

  return { data, loading, error };
}
