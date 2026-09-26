// Диагностика: ЖИ провайдері бапталған ба және кілт жұмыс істей ме?
// Кілттің өзі ешқашан қайтарылмайды.
// /api/ai/status        — жылдам тексеру (тек env)
// /api/ai/status?live=1 — провайдерге сұрау салып, қолжетімді модельдерді көрсетеді

import { NextRequest } from 'next/server';
import { resolveProvider, envKey, listModels } from '@/lib/ai-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const providers = {
    openai: !!envKey('OPENAI_API_KEY'),
    openrouter: !!envKey('OPENROUTER_API_KEY'),
    groq: !!envKey('GROQ_API_KEY'),
    gemini: !!envKey('GEMINI_API_KEY'),
  };

  const p = resolveProvider();
  if (!p) {
    return Response.json({
      configured: false,
      providers,
      hint: '.env.local файлына GROQ_API_KEY / OPENAI_API_KEY / OPENROUTER_API_KEY / GEMINI_API_KEY қосып, серверді қайта іске қосыңыз.',
    });
  }

  const base = {
    configured: true,
    provider: p.name,
    providers,
    requestedModel: process.env.AI_MODEL || '(көрсетілмеген — әдепкі қолданылады)',
    modelOrder: p.models,
  };

  if (req.nextUrl.searchParams.get('live') !== '1') {
    return Response.json({
      ...base,
      hint: 'Кілтті нақты тексеру үшін: /api/ai/status?live=1',
    });
  }

  // Тірі тексеру
  let status = 0;
  let detail = '';
  try {
    const res = await fetch(`${p.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${p.key}`, ...(p.headers || {}) },
      cache: 'no-store',
    });
    status = res.status;
    if (!res.ok) detail = (await res.text().catch(() => '')).slice(0, 300);
  } catch (e) {
    return Response.json({ ...base, live: false, error: 'unreachable', hint: 'Интернет немесе прокси мәселесі.' });
  }

  if (status === 401 || status === 403) {
    return Response.json({
      ...base,
      live: false,
      error: 'bad_key',
      status,
      detail,
      hint: 'Кілт жарамсыз. Жаңа кілт жасап, .env.local ішіне қойыңыз да, серверді қайта іске қосыңыз.',
    });
  }

  const available = await listModels(p);
  const chat = available.filter((m) => !/whisper|tts|guard|embed|vision-preview/i.test(m));
  const working = p.models.find((m) => available.includes(m)) ?? chat[0] ?? null;

  return Response.json({
    ...base,
    live: true,
    availableModels: chat,
    willUse: working,
    hint: working
      ? `Кілт жұмыс істейді. Чат «${working}» моделін қолданады.`
      : 'Кілт жарамды, бірақ қолжетімді чат моделі табылмады.',
  });
}
