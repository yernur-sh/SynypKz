'use client';

import React, { ReactNode, useEffect } from 'react';
import { X, Inbox, Loader2 } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md shadow-sky-200">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="page-title truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card animate-fade-in flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-500 animate-floaty">
        <Inbox className="h-7 w-7" />
      </div>
      <p className="font-bold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Жүктелуде…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm font-medium text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} animate-pop overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2 h-9 w-9 !p-0" aria-label="Жабу">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  const colors = [
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-violet-400 to-purple-500',
  ];
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${
        colors[hash % colors.length]
      } font-bold text-white ${className || 'h-9 w-9 text-xs'}`}
    >
      {initials || '?'}
    </div>
  );
}

export function formatDate(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('kk-KZ', {
    day: '2-digit',
    month: 'long',
  });
}

export function formatDateTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('kk-KZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
