// ЖИ-көмекшінің офлайн «миы».
// Сынып деректері (кесте, тәрбие сағаты, ережелер) негізінде жауап құрастырады.
// Интернет/сыртқы API қажет емес — бәрі клиенттің өзінде жұмыс істейді.

import { CLASS_LABEL, DAYS, type DayKey } from './config';
import {
  TOTAL_LESSONS,
  SUBJECTS,
  TEACHERS,
  lessonsFor,
  todayKey,
  tomorrowKey,
  nextSchoolDayKey,
  dayLabel,
} from './schedule-data';
import { currentWeek, nextWeek, directionOf, monthLabel } from './class-hour-data';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export const QUICK_PROMPTS = [
  'Бүгін қандай сабақтар бар?',
  'Ертеңге не дайындау керек?',
  'Квадрат теңдеуді қалай шешемін?',
  'Фотосинтезді қарапайым тілмен түсіндір',
  'Эссе жазудың құрылымы қандай?',
  'Present Perfect қашан қолданылады?',
  'Абай туралы қысқаша айтып бер',
  'ТЖБ-ға 3 күнде қалай дайындалам?',
];

const SUNDAY_WORDS = ['жексенб', 'воскресен'];

const DAY_WORDS: { key: DayKey; words: string[] }[] = [
  { key: 'monday', words: ['дүйсенб', 'понедельник'] },
  { key: 'tuesday', words: ['сейсенб', 'вторник'] },
  { key: 'wednesday', words: ['сәрсенб', 'сарсенб', 'среда'] },
  { key: 'thursday', words: ['бейсенб', 'четверг'] },
  { key: 'friday', words: ['жұма', 'жума', 'пятниц'] },
  { key: 'saturday', words: ['сенбі', 'сенби', 'суббот'] },
];

function norm(s: string) {
  return s.toLowerCase().replace(/ё/g, 'е').trim();
}

function has(text: string, ...words: string[]) {
  return words.some((w) => text.includes(w));
}

function formatDay(day: DayKey | null, prefix?: string): string {
  const lessons = lessonsFor(day);
  const title = `${prefix ? prefix + ' ' : ''}${dayLabel(day)}`;
  if (lessons.length === 0) {
    return `**${title}** — сабақ жоқ, демалыс күні 🌿\nБұл күні кітап оқып, демалуға болады.`;
  }
  const rows = lessons
    .map((l) => `${l.lessonNumber}. ${l.time} — **${l.subject}** (${l.teacher}, ${l.room})${l.notes ? ` · ${l.notes}` : ''}`)
    .join('\n');
  return `**${title}** — барлығы ${lessons.length} сабақ:\n${rows}`;
}

function weekOverview(): string {
  const rows = DAYS.map((d) => {
    const ls = lessonsFor(d.key);
    if (!ls.length) return `**${d.label}** — демалыс`;
    return `**${d.label}** (${ls.length}): ${ls.map((l) => l.subject).join(', ')}`;
  }).join('\n');
  return `${CLASS_LABEL} апталық кестесі (аптасына ${TOTAL_LESSONS} сабақ):\n${rows}\n\nТолық кестені «Кесте» бетінен көресіз.`;
}

function findSubject(text: string): string | null {
  const t = norm(text);
  for (const s of SUBJECTS) {
    const key = norm(s).slice(0, 5);
    if (t.includes(key)) return s;
  }
  if (has(t, 'матем')) return SUBJECTS.find((s) => s === 'Алгебра') ?? null;
  return null;
}

function subjectInfo(subject: string): string {
  const entries: string[] = [];
  for (const d of DAYS) {
    for (const l of lessonsFor(d.key)) {
      if (l.subject === subject) {
        entries.push(`${d.label} — ${l.lessonNumber}-сабақ, ${l.time}, ${l.room} (${l.teacher})`);
      }
    }
  }
  if (!entries.length) return `«${subject}» пәні кестеде табылмады.`;
  return `**${subject}** аптасына ${entries.length} рет:\n${entries.map((e) => `• ${e}`).join('\n')}`;
}

const STUDY_TIPS: Record<string, string[]> = {
  default: [
    'Тапсырманы кішкене бөліктерге бөл: 25 минут оқу + 5 минут демалыс (Помодоро).',
    'Жаңа тақырыпты өз сөзіңмен дауыстап айтып көр — есте жақсы қалады.',
    'Кешке келесі күннің сөмкесін дайындап қой, таңертең асықпайсың.',
  ],
  math: [
    'Ережені жаттамай, 3 мысалды қолмен шығарып көр.',
    'Қате жіберген есептерді бөлек дәптерге жазып қой — қайталауға өте пайдалы.',
    'Формулаларды карточкаға жазып, қабырғаға іліп қой.',
  ],
  language: [
    'Күніне 15 минут дауыстап оқу — сөздік қорды тез өсіреді.',
    'Жаңа сөздерді сөйлеммен бірге жаз, жеке сөз болып жатталмайды.',
    'Эссе жазар алдында 5 минут жоспар құр: кіріспе — 3 дәлел — қорытынды.',
  ],
  focus: [
    'Телефонды басқа бөлмеге қой немесе «Ұшу режимін» қос.',
    'Үстелде тек қажет дәптер мен кітап тұрсын.',
    'Оқу алдында 2 минут терең дем ал — ми «жұмыс режиміне» көшеді.',
  ],
};

/** Негізгі жауап генераторы. */
export function answer(question: string): string {
  const t = norm(question);

  if (!t) return 'Сұрағыңызды жазып жіберіңіз 🙂';

  // Сәлемдесу
  if (has(t, 'сәлем', 'салем', 'сәлеметсіз', 'привет', 'hello', 'hi ', 'қайырлы')) {
    return `Сәлеметсіз бе! Мен — ${CLASS_LABEL} порталының ЖИ-көмекшісімін 🤖\nКесте, тәрбие сағаты, сабаққа дайындық және оқу кеңестері бойынша көмектесе аламын.`;
  }

  if (has(t, 'рахмет', 'рақмет', 'спасибо', 'thanks')) {
    return 'Оқуыңызға сәттілік! Тағы сұрағыңыз болса — жаза беріңіз 😊';
  }

  if (has(t, 'кімсің', 'кiмсiң', 'сен кім', 'не істей аласың', 'көмек', 'помощь', 'help')) {
    return 'Мен мына сұрақтарға жауап бере аламын:\n• Бүгін/ертең қандай сабақ бар\n• Белгілі бір күннің немесе пәннің кестесі\n• Тәрбие сағатының тақырыбы мен жоспары\n• Мұғалім, кабинет, сабақ уақыты\n• Сабаққа дайындалу және зейін қою кеңестері';
  }

  // Тәрбие сағаты
  if (has(t, 'тәрбие', 'тарбие', 'классный час', 'класс сағат')) {
    const cur = currentWeek();
    const nxt = nextWeek();
    const fmt = (w: NonNullable<ReturnType<typeof currentWeek>>) =>
      w.topics
        .map((x) => `• **${directionOf(x.direction).short}:** ${x.title}\n  ${x.about}`)
        .join('\n');

    if (cur) {
      return (
        `Осы аптаның тәрбие сағаты (${monthLabel(cur.month)}, ${cur.week}-апта):\n${fmt(cur)}` +
        (nxt ? `\n\nКелесі апта (${monthLabel(nxt.month)}, ${nxt.week}-апта):\n${nxt.topics.map((x) => `• ${x.title}`).join('\n')}` : '') +
        '\n\nБарлық тақырыптар — «Тәрбие сағаты» бетінде.'
      );
    }
    if (nxt) {
      return `Кезекті тәрбие сағаты (${monthLabel(nxt.month)}, ${nxt.week}-апта):\n${fmt(nxt)}\n\nТолық жоспар — «Тәрбие сағаты» бетінде.`;
    }
    return 'Тәрбие сағатының толық жоспарын «Тәрбие сағаты» бетінен көре аласыз.';
  }

  // Күнге байланысты сұрақтар
  if (has(t, 'бүгін', 'бугин', 'сегодня')) return formatDay(todayKey(), 'Бүгін —');
  if (has(t, 'ертең', 'ертен', 'завтра')) {
    const k = tomorrowKey();
    if (!k || lessonsFor(k).length === 0) {
      const next = nextSchoolDayKey();
      return `${formatDay(k, 'Ертең —')}\n\nКелесі оқу күні — ${dayLabel(next)}:\n${formatDay(next)}`;
    }
    return `${formatDay(k, 'Ертең —')}\n\nСөмкені кешке дайындап қойыңыз 🎒`;
  }

  if (has(t, ...SUNDAY_WORDS)) {
    const next = nextSchoolDayKey();
    return `${formatDay(null)}\n\nКелесі оқу күні — ${dayLabel(next)}.`;
  }

  for (const d of DAY_WORDS) {
    if (has(t, ...d.words)) return formatDay(d.key);
  }

  // Апталық кесте
  if (has(t, 'апта', 'кесте', 'расписан', 'schedule')) {
    if (has(t, 'неше сабақ', 'қанша сабақ', 'сколько'))
      return `Аптасына барлығы ${TOTAL_LESSONS} сабақ, ${SUBJECTS.length} пән.`;
    return weekOverview();
  }

  // Мұғалім
  if (has(t, 'мұғалім', 'мугалим', 'ұстаз', 'учитель', 'жетекші')) {
    const teacherHit = Object.values(TEACHERS).find((n) => t.includes(norm(n).split(' ')[0]));
    if (teacherHit) {
      const subjects = Array.from(
        new Set(
          DAYS.flatMap((d) => lessonsFor(d.key))
            .filter((l) => l.teacher === teacherHit)
            .map((l) => l.subject)
        )
      );
      return `${teacherHit} — ${subjects.join(', ')} пәнінен сабақ береді.`;
    }
    return 'Пән мұғалімдерін «Кесте» бетінен көре аласыз.';
  }

  // Кабинет / уақыт
  if (has(t, 'кабинет', 'қай сынып', 'қайда өтеді', 'аудитория')) {
    const s = findSubject(t);
    if (s) return subjectInfo(s);
    return 'Қай пәннің кабинетін білгіңіз келеді? Мысалы: «Физика қай кабинетте?»';
  }

  if (has(t, 'сағат нешеде', 'уақыты', 'неше сағатта', 'басталады')) {
    const s = findSubject(t);
    if (s) return subjectInfo(s);
    return 'Сабақтар 08:30-да басталады. Нақты пәнді жазсаңыз, уақытын айтып беремін.';
  }

  // Оқу кеңестері
  if (has(t, 'дайындал', 'қалай оқу', 'кеңес', 'совет', 'бақылау жұмыс', 'емтихан', 'сор', 'сочь', 'бжб', 'тжб')) {
    const s = findSubject(t);
    const tips = has(t, 'матем', 'алгебра', 'геометр', 'физик', 'хими')
      ? STUDY_TIPS.math
      : has(t, 'тіл', 'әдебиет', 'эссе', 'ағылшын', 'орыс')
      ? STUDY_TIPS.language
      : STUDY_TIPS.default;
    return `${s ? `**${s}** пәніне дайындық кеңестері:` : 'Тиімді дайындалу кеңестері:'}\n${tips
      .map((x) => `• ${x}`)
      .join('\n')}${s ? `\n\n${subjectInfo(s)}` : ''}`;
  }

  if (has(t, 'зейін', 'фокус', 'жалқау', 'шаршад', 'мотивац', 'ұйықта')) {
    return `Зейін мен күш-жігерді сақтау үшін:\n${STUDY_TIPS.focus
      .map((x) => `• ${x}`)
      .join('\n')}\nҮзілісте «Үзіліс» бетіндегі жаттығуларды жасап алыңыз 🤸`;
  }

  if (has(t, 'үй тапсырма', 'уй тапсырма', 'домашн', 'дз')) {
    return 'Үй тапсырмасы мұғаліммен тікелей беріледі. Сұрағыңыз болса «Байланыс» немесе «Ата-ана» чаты арқылы мұғалімге жазыңыз.';
  }

  if (has(t, 'жетістік', 'жетистик', 'марапат', 'балл')) {
    return 'Жетістіктер мен ұпайлар «Жетістіктер» бетінде. Олимпиада, спорт, өнер және тәртіп бойынша ұпай жиналады 🏆';
  }

  if (has(t, 'ата-ана', 'ата ана', 'кездесу', 'родител')) {
    return 'Ата-аналар «Ата-ана» бетінде мұғаліммен тікелей чатта сөйлесе алады — Байланыс бетіндегі чат сияқты, тек мұғалім мен ата-анаға арналған.';
  }

  if (has(t, 'үзіліс', 'узилис', 'жаттығу', 'демал')) {
    return 'Үзілісте көзге, денеге және тыныс алуға арналған 1–2 минуттық жаттығулар бар — «Үзіліс» бетін ашыңыз 🌬️';
  }

  // Пән бойынша нақты сұрақ
  const subj = findSubject(t);
  if (subj) return subjectInfo(subj);

  // Әдепкі жауап
  return `Бұл сұрақ бойынша нақты дерегім жоқ 🤔\nМен кесте, тәрбие сағаты, мұғалімдер және оқу кеңестері туралы жақсы білемін. Мысалы:\n• «Бейсенбіде қандай сабақ бар?»\n• «Физика қай кабинетте өтеді?»\n• «Тәрбие сағатының тақырыбы қандай?»`;
}
