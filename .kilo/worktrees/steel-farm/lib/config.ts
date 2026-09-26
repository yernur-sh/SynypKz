// Сыныпқа қатысты негізгі баптаулар.
// Мұғалім / сынып жетекші рөлі осы e-mail тізімі арқылы анықталады.

export const CLASS_ID = '8-A';
export const CLASS_LABEL = '8 «А» сыныбы';
export const SCHOOL_NAME = 'Мектеп-лицей';

/** Сынып жетекшісінің e-mail-ы. Тек осы адам сынып хабарламасын жариялай алады. */
export const HOMEROOM_TEACHER_EMAIL = 'ainur@school.kz';

/** Мұғалім құқығы бар e-mail-дар (сынып жетекшісі де осында кіреді). */
export const TEACHER_EMAILS = [
  HOMEROOM_TEACHER_EMAIL,
  'teacher@school.kz',
];

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'monday', label: 'Дүйсенбі', short: 'Дс' },
  { key: 'tuesday', label: 'Сейсенбі', short: 'Сс' },
  { key: 'wednesday', label: 'Сәрсенбі', short: 'Ср' },
  { key: 'thursday', label: 'Бейсенбі', short: 'Бс' },
  { key: 'friday', label: 'Жұма', short: 'Жм' },
  { key: 'saturday', label: 'Сенбі', short: 'Сн' },
];

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export const LESSON_TIMES = [
  '08:00 - 08:45',
  '08:55 - 09:40',
  '09:50 - 10:35',
  '10:55 - 11:40',
  '11:50 - 12:35',
  '12:45 - 13:30',
  '13:40 - 14:25',
];

export const SUBJECT_COLORS: Record<string, string> = {
  default: 'from-sky-400 to-blue-500',
};

const PALETTE = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-rose-500',
  'from-lime-400 to-emerald-500',
  'from-cyan-400 to-sky-500',
];

/** Пән атауынан тұрақты түс градиентін шығарады. */
export function subjectGradient(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) % 9973;
  return PALETTE[hash % PALETTE.length];
}

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'olympiad', label: 'Олимпиада', emoji: '🏅' },
  { key: 'sport', label: 'Спорт', emoji: '⚽' },
  { key: 'art', label: 'Өнер', emoji: '🎨' },
  { key: 'science', label: 'Ғылым', emoji: '🔬' },
  { key: 'reading', label: 'Оқырмандық', emoji: '📚' },
  { key: 'discipline', label: 'Тәртіп', emoji: '⭐' },
] as const;

export const BREAK_EXERCISES = [
  {
    id: 'eye',
    title: 'Көзге арналған жаттығу',
    emoji: '👁️',
    seconds: 600,
    gradient: 'from-sky-400 to-cyan-500',
    steps: [
      'Көзді 5 секунд жұмып, ашыңыз — 2 минут бойы қайталаңыз.',
      'Көз алмасын баяу 4 бағытта (сол-оң, жоғары-төмен) жүргізіңіз — 2 минут.',
      'Алыстағы (терезе сырты) және жақындағы (кітап) затқа кезектесіп 20 секунд қараңыз — 3 минут.',
      'Көзді алақанмен жауып, қараңғыда 1 минут демалыңыз, терең дем алыңыз — 3 минут.',
    ],
  },
  {
    id: 'stretch',
    title: 'Сергіту жаттығуы',
    emoji: '🤸',
    seconds: 600,
    gradient: 'from-emerald-400 to-teal-500',
    steps: [
      'Орныңыздан тұрып, иық пен қолды айналдырыңыз, мойынды баяу бұрыңыз — 3 минут.',
      'Қолды жоғары созып, денені оңға-солға, алға-артқа иіңіз — 2 минут.',
      'Орнында жеңіл жүру, секіру және 15 рет отырып-тұру — 3 минут.',
      'Терең дем алып, бұлшық еттерді босатып, орныңызға отырыңыз — 2 минут.',
    ],
  },
  {
    id: 'breathing',
    title: 'Тыныс алу жаттығуы',
    emoji: '🌬️',
    seconds: 600,
    gradient: 'from-violet-400 to-indigo-500',
    steps: [
      '4 секунд мұрынмен дем алыңыз, 4 секунд ұстаңыз, 6 секунд ауызбен шығарыңыз — 3 минут қайталаңыз.',
      'Ішпен (диафрагмамен) терең тыныс алыңыз, кеудені кере демеңіз — 3 минут.',
      'Көзді жұмып, әр дем шығарғанда иық пен жақты босатыңыз, ойды тыныштандырыңыз — 4 минут.',
    ],
  },
];
