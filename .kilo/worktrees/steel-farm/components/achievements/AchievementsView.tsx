'use client';

import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS, type AchievementItem } from '@/lib/achievements-data';
import { PageHeader } from '@/components/ui';
import { Trophy, X, ImageIcon, FileText, Building2, Calendar, Award, User, ZoomIn } from 'lucide-react';

/** Сурет (жүктелмесе — ұқыпты орынбасар) */
function Picture({
  item,
  className = '',
  onClick,
}: {
  item: AchievementItem;
  className?: string;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const show = item.image && !failed;

  if (!show) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center ${className}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm">
          <ImageIcon className="h-6 w-6" />
        </span>
        <p className="text-xs font-semibold text-slate-400">Сурет әлі қосылмаған</p>
        <p className="max-w-[220px] text-[11px] leading-snug text-slate-400">
          Файлды <code className="rounded bg-white px-1">public{item.image}</code> жолына салсаңыз,
          осы жерде көрінеді.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden bg-slate-100 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt={item.title}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/20 group-hover:opacity-100">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow">
          <ZoomIn className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
}

/** Сурет + ақпарат карточкасы */
function AchievementCard({ item, onZoom }: { item: AchievementItem; onZoom: () => void }) {
  const meta: { icon: React.ElementType; value?: string }[] = [
    { icon: Award, value: item.award },
    { icon: User, value: item.holder },
    { icon: Building2, value: item.issuer },
    { icon: Calendar, value: item.date },
  ];

  return (
    <article className="card animate-fade-up flex flex-col overflow-hidden">
      <Picture item={item} className="h-64 sm:h-72" onClick={onZoom} />

      <div className="flex flex-1 flex-col gap-3 border-t border-slate-100 p-4">
        <h2 className="text-base font-bold leading-snug text-slate-900">{item.title}</h2>

        {meta.some((m) => m.value) && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {meta
              .filter((m) => m.value)
              .map((m, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <m.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {m.value}
                </li>
              ))}
          </ul>
        )}

        <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>

        {item.pdf && (
          <a
            href={item.pdf}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FileText className="h-3.5 w-3.5" /> Түпнұсқа құжат
          </a>
        )}
      </div>
    </article>
  );
}

export default function AchievementsView() {
  const [zoom, setZoom] = useState<AchievementItem | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = zoom ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoom]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Жетістіктер"
        subtitle={`Сыныбымыздың марапаттары мен дипломдары · ${ACHIEVEMENTS.length} жетістік`}
        icon={<Trophy className="h-6 w-6" />}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {ACHIEVEMENTS.map((a) => (
          <AchievementCard key={a.id} item={a} onZoom={() => setZoom(a)} />
        ))}
      </div>

      {/* Суретті үлкейту */}
      {zoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setZoom(null)}
        >
          <div
            className="animate-pop relative max-h-full w-full max-w-4xl overflow-auto rounded-3xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoom(null)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow transition hover:bg-white hover:text-slate-900"
              aria-label="Жабу"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom.image} alt={zoom.title} className="mx-auto max-h-[75vh] w-auto rounded-2xl" />
            <div className="px-2 py-3">
              <h3 className="font-bold text-slate-900">{zoom.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{zoom.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
