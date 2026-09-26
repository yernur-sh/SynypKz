// ЖИ провайдерін env айнымалылары бойынша анықтау (тек серверде қолданылады).

export interface Provider {
  name: 'openai' | 'openrouter' | 'groq' | 'gemini';
  baseUrl: string;
  key: string;
  /** Кезекпен сыналатын модельдер: алдымен AI_MODEL, сосын резервтегілер. */
  models: string[];
  headers?: Record<string, string>;
}

/**
 * Кілттің шынымен қойылғанын тексеру.
 * Үлгі мәтін («МҰНДА_ӨЗ_КІЛТІҢІЗДІ...»), бос жол немесе тым қысқа мән кілт саналмайды.
 */
export function envKey(name: string): string | null {
  const v = (process.env[name] || '').trim().replace(/^["']|["']$/g, '');
  if (!v || v.length < 20) return null;
  if (/МҰНДА|ӨЗ_КІЛТ|your[-_ ]?key|xxx|\.\.\./i.test(v)) return null;
  return v;
}

/** Резервтегі модельдер — біреуі жарамсыз болса, келесісі сыналады. */
const FALLBACKS: Record<Provider['name'], string[]> = {
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'gemma2-9b-it',
  ],
  openai: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-3.5-turbo'],
  openrouter: ['openai/gpt-4o-mini', 'meta-llama/llama-3.3-70b-instruct'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash'],
};

function withModel(name: Provider['name'], preferred?: string): string[] {
  const list = [...FALLBACKS[name]];
  const p = (preferred || '').trim();
  return p ? [p, ...list.filter((m) => m !== p)] : list;
}

export function resolveProvider(): Provider | null {
  const model = process.env.AI_MODEL;

  const openai = envKey('OPENAI_API_KEY');
  if (openai) {
    return {
      name: 'openai',
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
      key: openai,
      models: withModel('openai', model),
    };
  }

  const openrouter = envKey('OPENROUTER_API_KEY');
  if (openrouter) {
    return {
      name: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      key: openrouter,
      models: withModel('openrouter', model),
      headers: { 'X-Title': 'SynypKz' },
    };
  }

  const groq = envKey('GROQ_API_KEY');
  if (groq) {
    return {
      name: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      key: groq,
      models: withModel('groq', model),
    };
  }

  const gemini = envKey('GEMINI_API_KEY');
  if (gemini) {
    return {
      name: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      key: gemini,
      models: withModel('gemini', model),
    };
  }

  return null;
}

/** Провайдердегі нақты қолжетімді модельдер тізімі (/models). */
export async function listModels(p: Provider): Promise<string[]> {
  try {
    const res = await fetch(`${p.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${p.key}`, ...(p.headers || {}) },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json?.models ?? [];
    return data
      .map((m: any) => String(m?.id ?? m?.name ?? ''))
      .filter(Boolean)
      .map((id: string) => id.replace(/^models\//, ''));
  } catch {
    return [];
  }
}

/** Қате мәтіні модельге қатысты ма (модель жоқ / тоқтатылған)? */
export function isModelError(status: number, text: string): boolean {
  if (status !== 400 && status !== 404) return false;
  return /model_not_found|model_decommissioned|does not exist|decommissioned|unknown model|invalid model/i.test(
    text
  );
}
