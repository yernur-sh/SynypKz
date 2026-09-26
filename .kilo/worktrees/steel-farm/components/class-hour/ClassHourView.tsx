'use client';

import React, { useState } from 'react';
import {
  CLASS_HOUR_PLAN,
  DIRECTIONS,
  MONTHS,
  TOTAL_TOPICS,
  currentWeek,
  isPastWeek,
  directionOf,
  monthLabel,
  type ClassHourWeek,
  type ClassHourTopic,
} from '@/lib/class-hour-data';
import { PageHeader } from '@/components/ui';
import { HeartHandshake, ChevronDown, Target, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';

function TopicCard({
  topic,
  defaultOpen = false,
}: {
  topic: ClassHourTopic;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const d = directionOf(topic.direction);

  return (
    <div className={`overflow-hidden rounded-2xl border ${d.soft} transition`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${d.gradient} text-base shadow-sm`}
        >
          {d.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[11px] font-bold uppercase tracking-wide ${d.text}`}>
            {d.label}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-snug text-slate-800">
            {topic.title}
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="animate-fade-in space-y-4 border-t border-white/70 bg-white/70 px-4 py-4">
          <p className="text-sm leading-relaxed text-slate-600">{topic.about}</p>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Target className="h-3.5 w-3.5" /> Негізгі ойлар
            </p>
            <ul className="space-y-1.5">
              {topic.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${d.gradient}`} />
                  <span className="leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <HelpCircle className="h-3.5 w-3.5" /> Талқылау сұрақтары
            </p>
            <ul className="space-y-1.5">
              {topic.questions.map((q, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm italic leading-snug text-slate-600"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekBlock({ week, highlight }: { week: ClassHourWeek; highlight: boolean }) {
  const past = isPastWeek(week);

  return (
    <section
      className={`card overflow-hidden ${highlight ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`}
    >
      <header
        className={`flex items-center justify-between gap-2 px-4 py-3 ${
          highlight
            ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
            : 'border-b border-slate-100 bg-slate-50/70 text-slate-800'
        }`}
      >
        <h3 className="flex items-center gap-2 font-bold">
          <span
            className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${
              highlight ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'
            }`}
          >
            {week.week}
          </span>
          {week.week}-апта
        </h3>
        <span
          className={`chip ${
            highlight
              ? 'bg-white/20 text-white'
              : past
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-200/70 text-slate-600'
          }`}
        >
          {highlight ? (
            <>
              <Sparkles className="h-3 w-3" /> Осы апта
            </>
          ) : past ? (
            <>
              <CheckCircle2 className="h-3 w-3" /> Өтті
            </>
          ) : (
            `${week.topics.length} тақырып`
          )}
        </span>
      </header>

      <div className="space-y-2.5 p-3">
        {week.topics.map((t, i) => (
          <TopicCard key={i} topic={t} defaultOpen={highlight && week.topics.length === 1} />
        ))}
      </div>
    </section>
  );
}

export default function ClassHourView() {
  const cur = currentWeek();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Тәрбие сағаты"
        subtitle="2026-2027 оқу жылының апталық тақырыптары"
        icon={<HeartHandshake className="h-6 w-6" />}
      />

      {/* Осы аптаның тақырыптары */}
      {cur && (
        <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-5 py-6 text-white shadow-lg shadow-sky-200 sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <span className="chip bg-white/20 text-white">
              <Sparkles className="h-3 w-3" /> Осы апта
            </span>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
              {monthLabel(cur.month)} · {cur.week}-апта
            </h2>
            <ul className="mt-3 space-y-2">
              {cur.topics.map((t, i) => {
                const d = directionOf(t.direction);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/95">
                    <span className="mt-0.5 shrink-0">{d.emoji}</span>
                    <span className="leading-snug">
                      <b className="font-semibold">{d.short}:</b> {t.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Бағыттар */}
      <section className="animate-fade-up delay-1">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Тәрбие жұмысының бағыттары
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {DIRECTIONS.map((d) => {
            const count = CLASS_HOUR_PLAN.reduce(
              (n, w) => n + w.topics.filter((t) => t.direction === d.key).length,
              0
            );
            return (
              <div
                key={d.key}
                className={`flex items-center gap-3 rounded-2xl border ${d.soft} px-3 py-2.5`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${d.gradient} text-base shadow-sm`}
                >
                  {d.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${d.text}`}>{d.short}</span>
                  <span className="block truncate text-[11px] text-slate-500">{d.label}</span>
                </span>
                <span className="shrink-0 text-sm font-extrabold text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Барлығы {CLASS_HOUR_PLAN.length} апта · {TOTAL_TOPICS} тақырып
        </p>
      </section>

      {/* Айлар бойынша толық жоспар */}
      {MONTHS.map((m, mi) => {
        const weeks = CLASS_HOUR_PLAN.filter((w) => w.month === m.key);
        if (!weeks.length) return null;
        return (
          <section key={m.key} className={`animate-fade-up delay-${Math.min(mi + 1, 4)} space-y-3`}>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-slate-900">{m.label}</h2>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="chip bg-slate-100 text-slate-500">
                {weeks.reduce((n, w) => n + w.topics.length, 0)} тақырып
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {weeks.map((w) => (
                <WeekBlock key={w.id} week={w} highlight={cur?.id === w.id} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
