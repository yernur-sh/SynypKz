'use client';

import React from 'react';
import { DAYS, subjectGradient } from '@/lib/config';
import { todayKey, lessonsFor, dayLabel, nextSchoolDayKey } from '@/lib/schedule-data';
import { PageHeader } from '@/components/ui';
import { CalendarDays, Clock, Sun, UserRound, MapPin } from 'lucide-react';

export default function ScheduleView() {
  const today = todayKey(); // жексенбіде — null, сондықтан ешбір күн «Бүгін» болып белгіленбейді
  const nextDay = nextSchoolDayKey();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Сабақ кестесі"
        subtitle="Апталық кестенің барлық күні — бір бетте"
        icon={<CalendarDays className="h-6 w-6" />}
      />

      {today === null && (
        <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Sun className="h-5 w-5 shrink-0 text-amber-500" />
          <p>
            <span className="font-bold">Бүгін — {dayLabel(null)}</span>, демалыс күні. Келесі оқу күні —{' '}
            <span className="font-semibold">{dayLabel(nextDay)}</span> ({lessonsFor(nextDay).length} сабақ).
          </p>
        </div>
      )}

      {/* Барлық күн бір бетте - сабақтар 08:00 басталады */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((d, idx) => {
          const lessons = lessonsFor(d.key);
          const isToday = today === d.key;
          return (
            <section
              key={d.key}
              className={`card animate-fade-up delay-${Math.min(idx + 1, 4)} overflow-hidden bg-gradient-to-br from-white to-violet-50/30 ${
                isToday ? 'ring-2 ring-violet-400 ring-offset-2' : ''
              }`}
            >
              <header
                className={`flex items-center justify-between gap-2 px-4 py-3 ${
                  isToday
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white'
                    : 'border-b border-slate-100 bg-violet-50/40 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black ${
                      isToday ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    {d.short}
                  </span>
                  <h2 className="font-bold">{d.label}</h2>
                </div>
                <span
                  className={`chip ${
                    isToday ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {isToday ? 'Бүгін · ' : ''}
                  {lessons.length} сабақ
                </span>
              </header>

              {lessons.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500">
                    <Sun className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-600">Демалыс күні</p>
                  <p className="text-xs text-slate-400">Сабақ жоспарланбаған</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lessons.map((l) => (
                    <li
                      key={`${d.key}-${l.lessonNumber}`}
                      className="flex items-start gap-3 px-4 py-3 transition hover:bg-sky-50/50"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${subjectGradient(l.subject)} text-xs font-black text-white shadow-md`}>
                        {l.lessonNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{l.subject}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] leading-none text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3 w-3 shrink-0 text-slate-400" /> {l.teacher}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" /> {l.room}
                          </span>
                        </p>
                        {l.notes && (
                          <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                            {l.notes}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-slate-500">
                        <p className="flex items-center justify-end gap-1 font-semibold text-slate-700">
                          <Clock className="h-3 w-3" /> {l.time.split(' - ')[0]}
                        </p>
                        <p className="mt-1 hidden text-[10px] text-slate-400 sm:block">{l.time.split(' - ')[1]} дейін</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
