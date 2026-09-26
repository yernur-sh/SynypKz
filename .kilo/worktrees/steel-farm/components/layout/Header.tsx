'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { CLASS_LABEL } from '@/lib/config';
import { canAccess } from '@/lib/access';
import { Avatar } from '@/components/ui';
import {
  Home,
  CalendarDays,
  MessageSquare,
  Trophy,
  Users,
  Smile,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

// Реті: «Тәрбие сағаты» мен «ЖИ-көмекші» барлық рөлде ең соңында тұрады.
const NAV = [
  { href: '/', label: 'Басты бет', icon: Home },
  { href: '/schedule', label: 'Кесте', icon: CalendarDays },
  { href: '/communication', label: 'Байланыс', icon: MessageSquare },
  { href: '/achievements', label: 'Жетістіктер', icon: Trophy },
  { href: '/parent-portal', label: 'Ата-ана', icon: Users },
  { href: '/fun-break', label: 'Үзіліс', icon: Smile },
  { href: '/class-hour', label: 'Тәрбие сағаты', icon: HeartHandshake },
  { href: '/ai-assistant', label: 'ЖИ-көмекші', icon: Sparkles },
];

const ROLE_LABEL: Record<string, string> = {
  teacher: 'Мұғалім',
  parent: 'Ата-ана',
  student: 'Оқушы',
};

export default function Header() {
  const pathname = usePathname();
  const { user, loading, openAuth, logout } = useApp();
  const nav = NAV.filter((item) => canAccess(user?.role, item.href));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-3 shadow-sm shadow-slate-200/50 backdrop-blur-xl sm:gap-4 sm:px-5">
        {/* Логотип */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-sm font-black text-white shadow-md shadow-sky-200 transition-transform group-hover:scale-105">
            8A
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block text-base font-extrabold text-slate-900">SynypKz</span>
            <span className="block text-[11px] font-medium text-slate-400">{CLASS_LABEL}</span>
          </span>
        </Link>

        {/* Desktop навигация */}
        <nav className="mx-auto hidden min-w-0 flex-nowrap items-center gap-0.5 rounded-2xl bg-slate-100/70 p-1 lg:flex">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[13px] font-semibold leading-none transition-all ${
                  active
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden whitespace-nowrap xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Оң жақ */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-sky-200 hover:shadow-sm"
              >
                <Avatar name={user.name} />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-[120px] truncate text-xs font-bold text-slate-800">
                    {user.name}
                  </span>
                  <span className="block text-[10px] font-semibold text-sky-500">
                    {user.isHomeroom ? 'Сынып жетекшісі' : ROLE_LABEL[user.role]}
                  </span>
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 animate-pop overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Шығу
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => openAuth('login')} className="btn-ghost h-10">
                <LogIn className="h-4 w-4" /> Кіру
              </button>
              <button onClick={() => openAuth('register')} className="btn-primary h-10">
                <UserPlus className="h-4 w-4" /> Тіркелу
              </button>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-ghost h-10 w-10 !p-0 lg:hidden"
            aria-label="Мәзір"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile навигация */}
      {mobileOpen && (
        <nav className="animate-fade-in mx-auto mt-2 max-w-7xl rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
