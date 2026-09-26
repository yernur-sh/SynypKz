// LaTeX → адамға түсінікті мәтін.
// Модель кейде $...$, \frac{a}{b}, x^{2} сияқты LaTeX жазады — оны оқуға ыңғайлы
// Unicode математикасына айналдырамыз (x², ½, √, ×, ≤ ...).

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
};
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', ',': ',', a: 'ₐ', n: 'ₙ', x: 'ₓ',
};

const SYMBOLS: [RegExp, string][] = [
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\mp\b/g, '∓'],
  [/\\leq?\b/g, '≤'],
  [/\\geq?\b/g, '≥'],
  [/\\neq\b/g, '≠'],
  [/\\approx\b/g, '≈'],
  [/\\equiv\b/g, '≡'],
  [/\\infty\b/g, '∞'],
  [/\\pi\b/g, 'π'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\theta\b/g, 'θ'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\Delta\b/g, 'Δ'],
  [/\\delta\b/g, 'δ'],
  [/\\sum\b/g, 'Σ'],
  [/\\prod\b/g, '∏'],
  [/\\int\b/g, '∫'],
  [/\\rightarrow\b|\\to\b|\\Rightarrow\b/g, '→'],
  [/\\leftarrow\b/g, '←'],
  [/\\in\b/g, '∈'],
  [/\\angle\b/g, '∠'],
  [/\\degree\b|\\circ\b/g, '°'],
  [/\\ldots\b|\\dots\b/g, '…'],
  [/\\%/g, '%'],
];

/** Қарапайым бөлшектерді әдемі таңбаға айналдыру. */
const NICE_FRACTIONS: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕',
  '1/6': '⅙', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
};

function toScript(src: string, map: Record<string, string>): string | null {
  let out = '';
  for (const ch of src) {
    const m = map[ch];
    if (!m) return null; // барлық таңба аударылмаса — қолданбаймыз
    out += m;
  }
  return out;
}

/** \frac{a}{b} → a/b (немесе ½ сияқты таңба) */
function replaceFrac(s: string): string {
  const re = /\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g;
  let prev = '';
  let cur = s;
  // кірістірілген бөлшектер үшін бірнеше рет жүгіреміз
  for (let i = 0; i < 4 && cur !== prev; i++) {
    prev = cur;
    cur = cur.replace(re, (_m, a: string, b: string) => {
      const A = a.trim();
      const B = b.trim();
      const nice = NICE_FRACTIONS[`${A}/${B}`];
      if (nice) return nice;
      const needParensA = /[+\-\s]/.test(A);
      const needParensB = /[+\-\s]/.test(B);
      return `${needParensA ? `(${A})` : A}/${needParensB ? `(${B})` : B}`;
    });
  }
  return cur;
}

/** \sqrt{x} → √x, \sqrt[3]{x} → ∛x */
function replaceSqrt(s: string): string {
  return s
    .replace(/\\sqrt\s*\[\s*3\s*\]\s*\{([^{}]*)\}/g, (_m, a) => `∛${/[+\-\s]/.test(a) ? `(${a})` : a}`)
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, (_m, a) => `√${/[+\-\s]/.test(a) ? `(${a})` : a}`)
    .replace(/\\sqrt\s+(\w+)/g, '√$1');
}

/** x^{2} → x², a_{1} → a₁ (аударылмайтын жағдайда ^ түрінде қалдырамыз) */
function replaceScripts(s: string): string {
  return s
    .replace(/\^\{([^{}]+)\}/g, (_m, a: string) => toScript(a, SUP) ?? `^(${a})`)
    .replace(/\^(-?\w)/g, (_m, a: string) => toScript(a, SUP) ?? `^${a}`)
    .replace(/_\{([^{}]+)\}/g, (_m, a: string) => toScript(a, SUB) ?? `_(${a})`)
    .replace(/_(\w)/g, (_m, a: string) => toScript(a, SUB) ?? `_${a}`);
}

/**
 * Жауап мәтініндегі LaTeX-ті қарапайым, оқуға ыңғайлы түрге келтіру.
 * Markdown (**қалың**, тізім) сол қалпында қалады.
 */
export function latexToReadable(input: string): string {
  if (!input) return input;
  let s = input;

  // Блоктық формулалар: $$...$$, \[...\] → бөлек жол
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, a) => `\n${String(a).trim()}\n`);
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, a) => `\n${String(a).trim()}\n`);
  // Жолішілік: $...$, \(...\)
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, a) => String(a).trim());
  // Жолішілік $...$ (ескі браузерлерде lookbehind жоқ, сондықтан қарапайым нұсқа).
  // Ішінде кемі бір математикалық белгі болғанда ғана алып тастаймыз — «5$» сияқты мәтін бүлінбейді.
  s = s.replace(/\$([^$\n]{1,200}?)\$/g, (m, a: string) =>
    /[=+\-*/^_\\√×·÷<>]|\\[a-zA-Z]/.test(a) ? String(a).trim() : m
  );

  // Орта (environment) және түзету командалары
  s = s.replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, '');
  s = s.replace(/\\(?:left|right|displaystyle|quad|qquad|,|;|!|:)\s?/g, ' ');
  s = s.replace(/\\ /g, ' ');
  s = s.replace(/\\text(?:bf|it|rm)?\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\mathbb\s*\{([^{}]*)\}|\\mathrm\s*\{([^{}]*)\}/g, '$1$2');
  s = s.replace(/\\boxed\s*\{([^{}]*)\}/g, '**$1**');

  // Дәрежелерді алдымен түрлендіреміз — сонда \\sqrt{a^{2}} ішіндегі жақшалар жоғалады
  s = replaceScripts(s);

  // Кірістірілген құрылымдарды ішкісінен бастап шешеміз (\\frac{-b \\pm \\sqrt{D}}{2a})
  let prev = '';
  for (let i = 0; i < 6 && s !== prev; i++) {
    prev = s;
    s = replaceSqrt(s);
    s = replaceFrac(s);
  }

  for (const [re, ch] of SYMBOLS) s = s.replace(re, ch);
  s = replaceScripts(s);

  // Қалған белгісіз командалар: \foo → foo
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  // Артық жақшалар мен бос орындар
  s = s.replace(/[{}]/g, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(/ +([,.;:])/g, '$1');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}
