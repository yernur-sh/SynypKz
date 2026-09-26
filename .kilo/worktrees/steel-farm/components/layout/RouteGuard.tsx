'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { canAccess } from '@/lib/access';
import { Lock, ArrowLeft } from 'lucide-react';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useApp();

  if (loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />;
  }

  if (!canAccess(user?.role, pathname)) {
    return (
      <div className="card animate-fade-up mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Бет қолжетімсіз</h1>
        <p className="mt-2 text-sm text-slate-500">
          Бұл бөлім сіздің рөліңізге арналмаған.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Басты бетке
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
