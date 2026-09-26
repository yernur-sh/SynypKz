'use client';

import React, { useMemo, useState } from 'react';
import { useApp, useCollection } from '@/lib/store';
import type { UserProfile } from '@/lib/types';
import { Avatar, Loading, formatDate } from '@/components/ui';
import { Users, GraduationCap, Heart, Search, Lock } from 'lucide-react';

type Tab = 'student' | 'parent';

export default function MembersList() {
  const { user, openAuth } = useApp();
  // limit 100 — тіркелгендер тізімі кэшпен бірден
  const { data, loading, error } = useCollection<UserProfile>('users', 'createdAt', 'desc', 100);
  const [tab, setTab] = useState<Tab>('student');
  const [q, setQ] = useState('');

  const students = useMemo(
    () => data.filter((u) => u.role === 'student').sort((a, b) => a.name.localeCompare(b.name, 'kk')),
    [data]
  );
  const parents = useMemo(
    () => data.filter((u) => u.role === 'parent').sort((a, b) => a.name.localeCompare(b.name, 'kk')),
    [data]
  );

  const list = tab === 'student' ? students : parents;
  const filtered = q.trim()
    ? list.filter((u) =>
        `${u.name} ${u.studentName || ''}`.toLowerCase().includes(q.trim().toLowerCase())
      )
    : list;

  const tabs: { key: Tab; label: string; count: number; icon: typeof GraduationCap }[] = [
    { key: 'student', label: 'Оқушылар', count: students.length, icon: GraduationCap },
    { key: 'parent', label: 'Ата-аналар', count: parents.length, icon: Heart },
  ];

  return (
    <section className="card animate-fade-up p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Users className="h-5 w-5 text-indigo-500" /> Сайтқа тіркелгендер
        </h2>
        <span className="chip bg-indigo-50 text-indigo-600">
          Барлығы {students.length + parents.length}
        </span>
      </div>

      {!user ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-slate-700">Тізім тек тіркелгендерге көрінеді</p>
          <p className="max-w-xs text-xs text-slate-500">
            Сынып қауымдастығын көру үшін аккаунтыңызбен кіріңіз немесе тіркеліңіз.
          </p>
          <div className="flex gap-2">
            <button onClick={() => openAuth('login')} className="btn-primary h-9 text-xs">
              Кіру
            </button>
            <button onClick={() => openAuth('register')} className="btn-soft h-9 text-xs">
              Тіркелу
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-2xl bg-slate-100/70 p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    tab === t.key
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      tab === t.key ? 'bg-sky-50 text-sky-600' : 'bg-white text-slate-400'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Іздеу…"
                className="input !py-2 pl-8 text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600">
              Тізімді жүктеу қатесі: {error}
            </p>
          )}

          {loading && data.length === 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[64px] animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {q ? 'Ештеңе табылмады.' : 'Әзірге ешкім тіркелмеген.'}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-sky-200 hover:bg-white hover:shadow-sm"
                >
                  <Avatar name={m.name} className="h-10 w-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {m.name}
                      {m.id === user.id && (
                        <span className="ml-1.5 text-[10px] font-bold text-sky-500">(сіз)</span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {m.role === 'parent'
                        ? m.studentName
                          ? `Ата-ана · ${m.studentName}`
                          : 'Ата-ана'
                        : 'Оқушы'}
                      {m.createdAt ? ` · ${formatDate(m.createdAt)}` : ''}
                    </p>
                  </div>
                  <span
                    className={`chip shrink-0 ${
                      m.role === 'parent'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {m.role === 'parent' ? 'Ата-ана' : 'Оқушы'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
