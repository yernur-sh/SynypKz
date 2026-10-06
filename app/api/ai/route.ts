// ЖИ-көмекшінің серверлік API маршруты.
// Кез келген OpenAI-үйлесімді провайдермен жұмыс істейді (OpenAI, OpenRouter, Groq, Gemini-ның OpenAI режимі).
// API кілті тек серверде тұрады — браузерге ешқашан жіберілмейді.

import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/ai-prompt';
import { checkScope } from '@/lib/ai-scope';
import { resolveProvider, listModels, isModelError, type Provider } from '@/lib/ai-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InMsg {
  role: 'user' | 'assistant';
  content: string;
}

// Бір рет сәтті жұмыс істеген модельді келесі сұрауда бірінші қолданамыз.
const workingModels = new Map<Provider['name'], string>();

function isChatModel(model: string) {
  return /llama|gpt|gemma|gemini|mistral|qwen/i.test(model)
    && !/whisper|tts|guard|embed|vision-preview/i.test(model);
}

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function callModel(p: Provider, model: string, messages: unknown[]) {
  return fetch(`${p.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${p.key}`,
      ...(p.headers || {}),
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.4,
      max_tokens: 900,
      messages,
    }),
  });
}

export async function POST(req: NextRequest) {
  let body: { messages?: InMsg[]; userName?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const history = (body.messages || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 4000) }));

  const last = [...history].reverse().find((m) => m.role === 'user');
  if (!last) return Response.json({ error: 'empty' }, { status: 400 });

  // 1-қорған: сервер жағындағы тақырып сүзгісі (модельге жеткізбей тоқтатады)
  const verdict = checkScope(last.content);
  if (verdict.kind !== 'allow') {
    return new Response(sse({ delta: verdict.reply }) + sse({ done: true, blocked: true }), {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const provider = resolveProvider();
  if (!provider) {
    // Кілт жоқ — клиент офлайн «мида» жауап береді
    return Response.json({ error: 'no_provider' }, { status: 503 });
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt({ userName: body.userName, role: body.role }) },
    ...history,
  ];

  // Модельдерді кезекпен сынау: AI_MODEL → резервтегілер → провайдер тізімінен нақты қолжетімдісі
  const remembered = workingModels.get(provider.name);
  const candidates = remembered
    ? [remembered, ...provider.models.filter((model) => model !== remembered)]
    : [...provider.models];
  const attempted = new Set<string>();
  let upstream: Response | null = null;
  let lastStatus = 0;
  let lastText = '';
  let usedModel = '';

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    attempted.add(model);
    let res: Response;
    try {
      res = await callModel(provider, model, messages);
    } catch {
      return Response.json({ error: 'upstream_unreachable', provider: provider.name }, { status: 502 });
    }

    if (res.ok && res.body) {
      upstream = res;
      usedModel = model;
      workingModels.set(provider.name, model);
      break;
    }

    lastStatus = res.status;
    lastText = await res.text().catch(() => '');
    // Ескірген модель болса, Groq тізімінен қолжетімдісін бірден таңдаймыз.
    if (isModelError(res.status, lastText)) {
      if (workingModels.get(provider.name) === model) workingModels.delete(provider.name);
      const available = (await listModels(provider)).filter(isChatModel);
      if (available.length) {
        const next = [
          ...provider.models.filter((candidate) => available.includes(candidate)),
          ...available.filter((candidate) => !provider.models.includes(candidate)),
        ].filter((candidate) => !attempted.has(candidate));
        candidates.splice(i + 1, candidates.length - i - 1, ...next);
      }
      continue;
    }

    console.error(`AI provider error [${provider.name}/${model}]`, res.status, lastText.slice(0, 300));

    // Кілт қате / лимит / сервер қатесі — қайталаудың мәні жоқ
    break;
  }

  if (!upstream || !upstream.body) {
    let reason: string = 'upstream_error';
    if (lastStatus === 401 || lastStatus === 403) reason = 'bad_key';
    else if (lastStatus === 429) reason = 'rate_limit';
    else if (isModelError(lastStatus, lastText)) reason = 'model_not_found';

    let detail = '';
    try {
      detail = JSON.parse(lastText)?.error?.message ?? '';
    } catch {
      detail = lastText.slice(0, 200);
    }

    return Response.json(
      { error: reason, provider: provider.name, status: lastStatus, detail },
      { status: 502 }
    );
  }

  // OpenAI SSE ағынын клиентке қарапайым пішімде қайта жіберу
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      const reader = upstream!.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith('data:')) continue;
            const payload = s.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(enc.encode(sse({ delta })));
            } catch {
              /* толық емес чанк — елемейміз */
            }
          }
        }
        controller.enqueue(enc.encode(sse({ done: true, model: usedModel })));
      } catch {
        controller.enqueue(enc.encode(sse({ error: 'stream_error' })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-AI-Model': usedModel,
    },
  });
}
