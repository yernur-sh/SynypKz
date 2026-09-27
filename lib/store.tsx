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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
import { CLASS_ID, HOMEROOM_TEACHER_EMAIL, TEACHER_REGISTRATION_CODE } from './config';
import type { UserProfile, UserRole } from './types';

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
    studentName?: string,
    teacherCode?: string
  ) => Promise<void>;
  loginWithGoogle: (
    role?: UserRole,
    studentName?: string,
    teacherCode?: string,
    name?: string
  ) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const googleRegistration = React.useRef<{
    role: UserRole;
    studentName?: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    // Бұрынғы нұсқа қалдырған қолмен жасалған ескі Firestore кэштерін бір рет тазалау.
    try {
      Object.keys(localStorage)
        .filter((key) => key === 'synypkz-user' || key.startsWith('fs-cache:'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
  }, []);

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
      try {
        const ref = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const email = (fbUser.email || '').toLowerCase();
          const pending = googleRegistration.current;
          const requestedRole = pending?.role ?? 'student';
          const profile: UserProfile = {
            id: fbUser.uid,
            name: pending?.name || fbUser.displayName || email.split('@')[0],
            email,
            role: requestedRole,
            classId: CLASS_ID,
            isHomeroom: email === HOMEROOM_TEACHER_EMAIL,
            ...(requestedRole === 'parent' && pending?.studentName
              ? { studentName: pending.studentName }
              : {}),
            createdAt: Date.now(),
          };
          await setDoc(ref, profile);
          setUser(profile);
        } else {
          setUser({ id: fbUser.uid, ...(snap.data() as Omit<UserProfile, 'id'>) });
        }
      } catch (error) {
        console.error('Профильді жүктеу қатесі', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
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
    studentName?: string,
    teacherCode?: string
  ) => {
    if (role === 'teacher' && teacherCode?.trim() !== TEACHER_REGISTRATION_CODE) {
      throw Object.assign(new Error('Мұғалім коды қате.'), { code: 'auth/invalid-teacher-code' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(cred.user, { displayName: name });
    const profile: UserProfile = {
      id: cred.user.uid,
      name,
      email: cleanEmail,
      role,
      classId: CLASS_ID,
      isHomeroom: cleanEmail === HOMEROOM_TEACHER_EMAIL,
      ...(role === 'parent' && studentName ? { studentName } : {}),
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUser(profile);
    setAuthModal(null);
  };

  const loginWithGoogle = async (
    role?: UserRole,
    studentName?: string,
    teacherCode?: string,
    name?: string
  ) => {
    if (role === 'teacher' && teacherCode?.trim() !== TEACHER_REGISTRATION_CODE) {
      throw Object.assign(new Error('Мұғалім коды қате.'), { code: 'auth/invalid-teacher-code' });
    }
    googleRegistration.current = role
      ? {
          role,
          studentName: studentName?.trim() || undefined,
          name: name?.trim() || undefined,
        }
      : null;
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, 'users', credential.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const email = (credential.user.email || '').toLowerCase();
        const requestedRole = role ?? 'student';
        const profile: UserProfile = {
          id: credential.user.uid,
          name: name?.trim() || credential.user.displayName || email.split('@')[0],
          email,
          role: requestedRole,
          classId: CLASS_ID,
          isHomeroom: email === HOMEROOM_TEACHER_EMAIL,
          ...(role === 'parent' && studentName?.trim() ? { studentName: studentName.trim() } : {}),
          createdAt: Date.now(),
        };
        await setDoc(ref, profile);
        setUser(profile);
      } else if (role) {
        const existing = { id: credential.user.uid, ...(snap.data() as Omit<UserProfile, 'id'>) };
        const updated: UserProfile = {
          ...existing,
          role,
        };
        if (role === 'parent' && studentName?.trim()) updated.studentName = studentName.trim();
        else delete updated.studentName;
        await setDoc(ref, updated);
        setUser(updated);
      }
      setAuthModal(null);
    } finally {
      googleRegistration.current = null;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error('Қолданушы табылмады.');
    await reauthenticateWithCredential(
      current,
      EmailAuthProvider.credential(current.email, currentPassword)
    );
    await updatePassword(current, newPassword);
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
      changePassword,
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

/** Firestore коллекциясын нақты уақытта тыңдайтын hook. */
export function useCollection<T extends { id: string }>(
  path: string,
  orderField?: string,
  direction: 'asc' | 'desc' = 'desc',
  limitCount?: number,
  enabled = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const constraints: QueryConstraint[] = [];
    if (orderField) constraints.push(orderBy(orderField, direction));
    if (limitCount) constraints.push(fsLimit(limitCount));

    const q = query(collection(db, path), ...constraints);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
        setData(docs);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error', path, err);
        setError(err.message);
        setData([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [path, orderField, direction, limitCount, enabled]);

  return { data, loading, error };
}
