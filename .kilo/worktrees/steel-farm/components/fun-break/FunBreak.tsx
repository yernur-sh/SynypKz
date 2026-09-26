'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BREAK_EXERCISES } from '@/lib/config';
import { PageHeader } from '@/components/ui';
import { Smile, Play, Pause, RotateCcw } from 'lucide-react';

export default function FunBreak() {
  const [activeId, setActiveId] = useState(BREAK_EXERCISES[0].id);
  const active = BREAK_EXERCISES.find((e) => e.id === activeId)!;
  const [seconds, setSeconds] = useState(active.seconds);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(active.seconds);
    setRunning(false);
  }, [activeId, active.seconds]);

  const playAlarm = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const beep = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
        osc.start(t);
        osc.stop(t + dur);
      };
      beep(880, 0, 0.5);
      beep(880, 0.3, 0.5);
      beep(1100, 0.6, 0.8);
    } catch {}
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          playAlarm();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = 1 - seconds / active.seconds;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Көңілді үзіліс"
        subtitle="Сабақ арасында 10 минут сергіп алыңыз"
        icon={<Smile className="h-6 w-6" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {BREAK_EXERCISES.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setActiveId(ex.id)}
            className={`card card-hover animate-fade-up delay-${i + 1} flex items-center gap-3 p-4 text-left ${
              activeId === ex.id ? 'border-sky-300 ring-4 ring-sky-100' : ''
            }`}
          >
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${ex.gradient} text-lg`}
            >
              {ex.emoji}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-bold text-slate-800">{ex.title}</span>
              <span className="block text-xs text-slate-500">10 минут</span>
            </span>
          </button>
        ))}
      </div>

      <div className="card animate-fade-up overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${active.gradient}`} />
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative grid h-44 w-44 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-4xl font-extrabold tabular-nums text-slate-900">
                {mm}:{ss}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRunning((v) => !v)} className="btn-primary">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? 'Тоқтату' : 'Бастау'}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setSeconds(active.seconds);
                }}
                className="btn-ghost"
              >
                <RotateCcw className="h-4 w-4" /> Қайта
              </button>
            </div>

          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {active.emoji} {active.title}
            </h2>
            <ol className="mt-3 space-y-2">
              {active.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-600"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
