'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  CLASS_HOUR_PLAN,
  DIRECTIONS,
  MONTHS,
  currentWeek,
  isPastWeek,
  directionOf,
  monthLabel,
  type ClassHourWeek,
  type ClassHourTopic,
  type ClassHourCustomTopic,
  type MonthKey,
} from '@/lib/class-hour-data';
import { Modal, PageHeader } from '@/components/ui';
import { useApp, useCollection } from '@/lib/store';
import { db } from '@/lib/firebase';
import {
  HeartHandshake,
  ChevronDown,
  Target,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Plus,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';

function isCustomTopic(topic: ClassHourTopic): topic is ClassHourCustomTopic {
  return 'id' in topic;
}

function TopicCard({
  topic,
  defaultOpen = false,
  onEdit,
  onDelete,
  deleting = false,
}: {
  topic: ClassHourTopic;
  defaultOpen?: boolean;
  onEdit?: (topic: ClassHourCustomTopic) => void;
  onDelete?: (topic: ClassHourCustomTopic) => void;
  deleting?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const d = directionOf(topic.direction);
  const customTopic = isCustomTopic(topic) ? topic : null;

  return (
    <div className={`overflow-hidden rounded-2xl border ${d.soft} transition`}>
      <div className="flex items-start px-2 py-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-3 px-2 py-2 text-left"
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
      </div>

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

          {/* Өзгерту және өшіру батырмалары ашылмалы блоктың ең астына жылжытылды */}
          {customTopic && onEdit && onDelete && (
            <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 pt-3">
              <button
                type="button"
                onClick={() => onEdit(customTopic)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50"
                disabled={deleting}
              >
                <Pencil className="h-3.5 w-3.5" /> Өзгерту
              </button>
              <button
                type="button"
                onClick={() => onDelete(customTopic)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Өшіру
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeekBlock({
  week,
  highlight,
  onEdit,
  onDelete,
  deletingId,
}: {
  week: ClassHourWeek;
  highlight: boolean;
  onEdit?: (topic: ClassHourCustomTopic) => void;
  onDelete?: (topic: ClassHourCustomTopic) => void;
  deletingId?: string | null;
}) {
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
          <TopicCard
            key={isCustomTopic(t) ? t.id : i}
            topic={t}
            defaultOpen={highlight && week.topics.length === 1}
            onEdit={onEdit}
            onDelete={onDelete}
            deleting={isCustomTopic(t) && deletingId === t.id}
          />
        ))}
      </div>
    </section>
  );
}

export default function ClassHourView() {
  const { user, isHomeroom } = useApp();
  const { data: customTopics } = useCollection<ClassHourCustomTopic>(
    'classHourTopics',
    'createdAt',
    'asc',
    100
  );
  const staticCurrent = currentWeek();
  const [formOpen, setFormOpen] = useState(false);
  const [month, setMonth] = useState<MonthKey>(staticCurrent?.month ?? 'september');
  const [week, setWeek] = useState(staticCurrent?.week ?? 1);
  const [direction, setDirection] = useState('');
  const [title, setTitle] = useState('');
  const [about, setAbout] = useState('');
  const [points, setPoints] = useState('');
  const [questions, setQuestions] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingTopic, setEditingTopic] = useState<ClassHourCustomTopic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [optimisticTopics, setOptimisticTopics] = useState<ClassHourCustomTopic[]>([]);

  useEffect(() => {
    if (!customTopics.length) return;
    const serverIds = new Set(customTopics.map((topic) => topic.id));
    setOptimisticTopics((items) => {
      const pending = items.filter((topic) => !serverIds.has(topic.id));
      return pending.length === items.length ? items : pending;
    });
  }, [customTopics]);

  const visibleCustomTopics = useMemo(() => {
    const serverIds = new Set(customTopics.map((topic) => topic.id));
    return [
      ...customTopics,
      ...optimisticTopics.filter((topic) => !serverIds.has(topic.id)),
    ];
  }, [customTopics, optimisticTopics]);

  const plan = useMemo<ClassHourWeek[]>(
    () =>
      MONTHS.flatMap((monthItem) =>
        [1, 2, 3, 4].map((weekNumber) => {
          const fixed = CLASS_HOUR_PLAN.find(
            (item) => item.month === monthItem.key && item.week === weekNumber
          );
          return {
            id: fixed?.id ?? `${monthItem.key}-${weekNumber}`,
            month: monthItem.key,
            week: weekNumber,
            topics: [
              ...(fixed?.topics ?? []),
              ...visibleCustomTopics.filter(
                (topic) => topic.month === monthItem.key && topic.week === weekNumber
              ),
            ],
          };
        })
      ),
    [visibleCustomTopics]
  );
  const cur = staticCurrent
    ? plan.find(
        (item) => item.month === staticCurrent.month && item.week === staticCurrent.week
      ) ?? null
    : null;
  const totalTopics = plan.reduce((total, item) => total + item.topics.length, 0);
  const weeksWithTopics = plan.filter((item) => item.topics.length > 0).length;

  const clearForm = () => {
    setTitle('');
    setAbout('');
    setPoints('');
    setQuestions('');
    setDirection('');
    setEditingTopic(null);
    setFormError('');
  };

  const openCreateForm = () => {
    clearForm();
    setMonth(staticCurrent?.month ?? 'september');
    setWeek(staticCurrent?.week ?? 1);
    setFormOpen(true);
  };

  const openEditForm = (topic: ClassHourCustomTopic) => {
    setEditingTopic(topic);
    setMonth(topic.month);
    setWeek(topic.week);
    setDirection(topic.direction);
    setTitle(topic.title);
    setAbout(topic.about);
    setPoints(topic.points.join('\n'));
    setQuestions(topic.questions.join('\n'));
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (busy) return;
    setFormOpen(false);
    clearForm();
  };

  const removeTopic = async (topic: ClassHourCustomTopic) => {
    if (deletingId || !window.confirm(`«${topic.title}» тақырыбын өшіресіз бе?`)) return;
    setDeleteError('');
    setDeletingId(topic.id);
    try {
      await deleteDoc(doc(db, 'classHourTopics', topic.id));
      setOptimisticTopics((items) => items.filter((item) => item.id !== topic.id));
    } catch (error: any) {
      setDeleteError(
        error?.code === 'permission-denied'
          ? 'Тақырыпты өшіруге рұқсат жоқ. Firestore ережелерін жаңартыңыз.'
          : 'Тақырыпты өшіру мүмкін болмады. Интернетті тексеріп, қайта көріңіз.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !isHomeroom) return;
    setBusy(true);
    setFormError('');
    const values = {
      month,
      week,
      direction: direction.trim(),
      title: title.trim(),
      about: about.trim(),
      points: points.split('\n').map((item) => item.trim()).filter(Boolean),
      questions: questions.split('\n').map((item) => item.trim()).filter(Boolean),
    };

    if (editingTopic) {
      try {
        await updateDoc(doc(db, 'classHourTopics', editingTopic.id), values);
        setFormOpen(false);
        clearForm();
      } catch (error: any) {
        setFormError(
          error?.code === 'permission-denied'
            ? 'Тақырыпты өзгертуге рұқсат жоқ. Firestore ережелерін жаңартыңыз.'
            : 'Тақырыпты сақтау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.'
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    const createdAt = Date.now();
    const topicRef = doc(collection(db, 'classHourTopics'));
    const topic: ClassHourCustomTopic = {
      id: topicRef.id,
      ...values,
      authorId: user.id,
      authorName: user.name,
      createdAt,
    };
    setOptimisticTopics((items) => [...items, topic]);
    setFormOpen(false);
    try {
      await setDoc(topicRef, {
        month: topic.month,
        week: topic.week,
        direction: topic.direction,
        title: topic.title,
        about: topic.about,
        points: topic.points,
        questions: topic.questions,
        authorId: topic.authorId,
        authorName: topic.authorName,
        createdAt: topic.createdAt,
      });
      clearForm();
    } catch (error: any) {
      setOptimisticTopics((items) => items.filter((item) => item.id !== topicRef.id));
      setFormError(
        error?.code === 'permission-denied'
          ? 'Тақырып қосуға рұқсат жоқ. Жаңартылған Firestore ережелерін жариялаңыз.'
          : 'Тақырыпты сақтау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.'
      );
      setFormOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Тәрбие сағаты"
        subtitle="2026-2027 оқу жылының апталық тақырыптары"
        icon={<HeartHandshake className="h-6 w-6" />}
        action={
          isHomeroom ? (
            <button onClick={openCreateForm} className="btn-primary">
              <Plus className="h-4 w-4" /> Тақырып қосу
            </button>
          ) : undefined
        }
      />

      {deleteError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium leading-relaxed text-rose-700">
          {deleteError}
        </p>
      )}

      {/* Осы аптаның тақырыптары */}
      {cur && cur.topics.length > 0 && (
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
            const count = plan.reduce(
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
          Барлығы {weeksWithTopics} апта · {totalTopics} тақырып
        </p>
      </section>

      {/* Айлар бойынша толық жоспар */}
      {MONTHS.map((m, mi) => {
        const weeks = plan.filter((w) => w.month === m.key && w.topics.length > 0);
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
                <WeekBlock
                  key={w.id}
                  week={w}
                  highlight={cur?.id === w.id}
                  onEdit={isHomeroom ? openEditForm : undefined}
                  onDelete={isHomeroom ? removeTopic : undefined}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </section>
        );
      })}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingTopic ? 'Тәрбие сағатының тақырыбын өзгерту' : 'Тәрбие сағатына тақырып қосу'}
      >
        <form onSubmit={publish} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Ай</label>
              <select
                className="input"
                value={month}
                onChange={(event) => setMonth(event.target.value as MonthKey)}
              >
                {MONTHS.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Апта</label>
              <select
                className="input"
                value={week}
                onChange={(event) => setWeek(Number(event.target.value))}
              >
                {[1, 2, 3, 4].map((number) => (
                  <option key={number} value={number}>{number}-апта</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Бағыт</label>
            <input
              className="input"
              value={direction}
              onChange={(event) => setDirection(event.target.value)}
              placeholder="Мысалы: Ұлттық құндылықтар"
              maxLength={200}
              required
            />
          </div>
          <div>
            <label className="label">Тақырып атауы</label>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={300}
              required
            />
          </div>
          <div>
            <label className="label">Қысқаша түсіндірме</label>
            <textarea
              className="input min-h-24"
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              maxLength={3000}
              required
            />
          </div>
          <div>
            <label className="label">Негізгі ойлар</label>
            <textarea
              className="input min-h-24"
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              placeholder="Әр ойды жаңа жолдан жазыңыз"
            />
            <p className="mt-1 text-[11px] text-slate-400">Әр жол жеке тармақ болып көрсетіледі.</p>
          </div>
          <div>
            <label className="label">Талқылау сұрақтары</label>
            <textarea
              className="input min-h-24"
              value={questions}
              onChange={(event) => setQuestions(event.target.value)}
              placeholder="Әр сұрақты жаңа жолдан жазыңыз"
            />
          </div>
          {formError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {formError}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingTopic
              ? 'Өзгерістерді сақтау'
              : `${MONTHS.find((item) => item.key === month)?.label}, ${week}-аптаға қосу`}
          </button>
        </form>
      </Modal>
    </div>
  );
}