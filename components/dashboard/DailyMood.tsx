'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { HeartPulse } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useApp, useCollection } from '@/lib/store';
import type { MoodValue, StudentMood, UserProfile } from '@/lib/types';

const MOODS: { value: MoodValue; label: string; emoji: string; message: string }[] = [
  { value: 'happy', label: 'Көңілдімін', emoji: '😊', message: 'Керемет! Бүгінгі қуанышыңды жақындарыңмен бөліссең, күнің одан да шуақты болуы мүмкін.' },
  { value: 'calm', label: 'Жақсымын', emoji: '🙂', message: 'Өзіңді жақсы сезінгенің қуантады. Осы жайлы күйіңді сақтап, бүгін өзіңе ұнайтын іске уақыт бөл.' },
  { value: 'sad', label: 'Ренжулімін', emoji: '😢', message: 'Ренжуің түсінікті. Қаласаң, не болғанын сенетін адамыңа немесе мұғаліміңе айтып көр — жалғыз қалудың қажеті жоқ.' },
  { value: 'angry', label: 'Ашулымын', emoji: '😠', message: 'Ашулану да қалыпты сезім. Бірнеше рет терең дем алып, өзіңе аздап уақыт бер. Дайын болғанда, не мазалағанын айтып көр.' },
  { value: 'tired', label: 'Ұйқым қанған жоқ', emoji: '😴', message: 'Шаршағаныңды байқағаның маңызды. Мүмкіндік болса, аздап тынығып, су ішіп ал. Бүгін өзіңе жұмсақ қара.' },
  { value: 'anxious', label: 'Мазасызбын', emoji: '😟', message: 'Мазасыз сезіну қиын болуы мүмкін. Баяу дем алып, қазір жасай алатын бір шағын қадамға көңіл бөл. Қажет болса, сенетін адамнан көмек сұра.' },
];

function almatyDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export default function DailyMood() {
  const { user } = useApp();
  const [today, setToday] = useState(almatyDate);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(almatyDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (user?.role === 'student') return <StudentMoodPicker key={user.id} studentId={user.id} today={today} />;
  if (user?.role === 'teacher') return <TeacherMoodList today={today} />;
  return null;
}

function StudentMoodPicker({ studentId, today }: { studentId: string; today: string }) {
  const [record, setRecord] = useState<StudentMood | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setRecord(null);
    return onSnapshot(doc(db, 'studentMoods', studentId), (snapshot) => {
      setRecord(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as StudentMood : null);
      setLoading(false);
      setError(null);
    }, () => {
      setLoading(false);
      setError('Көңіл күйді жүктеу мүмкін болмады.');
    });
  }, [studentId]);

  const selected = record?.date === today ? record.mood : null;
  const selectedMood = MOODS.find((option) => option.value === selected);

  async function choose(mood: MoodValue) {
    setSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'studentMoods', studentId), {
        date: today,
        mood,
        updatedAt: Date.now(),
      });
    } catch {
      setError('Сақтау мүмкін болмады. Қайта көріңіз.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card animate-fade-up border border-sky-100 p-5 sm:p-6" aria-labelledby="daily-mood-title">
      <div className="mb-4">
        <h2 id="daily-mood-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <HeartPulse className="h-5 w-5 text-rose-500" /> Бүгін көңіл күйің қандай?
        </h2>
        <p className="mt-1 text-sm text-slate-500">Біреуін таңда. Күні бойы өзгерте аласың. Жауабыңды тек өзің және мұғалім көреді.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {MOODS.map(({ value, label, emoji }) => (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            disabled={loading || saving}
            aria-pressed={selected === value}
            className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-wait disabled:opacity-60 ${
              selected === value
                ? 'border-sky-400 bg-sky-50 text-sky-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
            }`}
          >
            <span aria-hidden="true" className="text-3xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </div>
      {selectedMood && (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3" aria-live="polite">
          <p className="text-sm font-semibold text-sky-900">{selectedMood.emoji} {selectedMood.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{selectedMood.message}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        {error || (saving ? 'Сақталып жатыр…' : loading ? 'Жүктеліп жатыр…' : selected ? 'Бүгінгі көңіл күйің сақталды.' : 'Әлі таңдаған жоқсың.')}
      </p>
    </section>
  );
}

function TeacherMoodList({ today }: { today: string }) {
  const { data: users, loading: usersLoading, error: usersError } = useCollection<UserProfile>('users', undefined, 'desc', undefined, true);
  const { data: moods, loading: moodsLoading, error: moodsError } = useCollection<StudentMood>('studentMoods', undefined, 'desc', undefined, true);
  const moodByStudent = useMemo(() => new Map(moods.filter((item) => item.date === today).map((item) => [item.id, item.mood])), [moods, today]);
  const students = useMemo(() => users.filter((item) => item.role === 'student').sort((a, b) => a.name.localeCompare(b.name, 'kk')), [users]);
  const answered = students.filter((student) => moodByStudent.has(student.id)).length;

  return (
    <section className="card animate-fade-up border border-sky-100 p-5 sm:p-6" aria-labelledby="daily-mood-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="daily-mood-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <HeartPulse className="h-5 w-5 text-rose-500" /> Оқушылардың бүгінгі көңіл күйі
          </h2>
          <p className="mt-1 text-sm text-slate-500">Оқушы таңдауы өзгерсе, тізім автоматты жаңарады.</p>
        </div>
        <span className="chip bg-sky-50 text-sky-700">Жауап бергені: {answered}/{students.length}</span>
      </div>
      {(usersError || moodsError) ? (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">Көңіл күй тізімін жүктеу мүмкін болмады.</p>
      ) : (usersLoading || moodsLoading) ? (
        <p className="text-sm text-slate-500">Жүктеліп жатыр…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500">Әзірге тіркелген оқушы жоқ.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const mood = MOODS.find((option) => option.value === moodByStudent.get(student.id));
            return (
              <li key={student.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{student.name}</span>
                <span className="shrink-0 text-xs font-medium text-slate-600" aria-label={mood?.label || 'Белгілемеді'}>
                  {mood ? `${mood.emoji} ${mood.label}` : 'Белгілемеді'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
