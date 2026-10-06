'use client';

// Клиент ↔ /api/ai арасындағы ағынды (streaming) байланыс.
// Егер серверде ЖИ провайдері бапталмаған болса, офлайн «мида» (lib/assistant.ts) жауап береді.

import { answer as offlineAnswer } from './assistant';
import { checkScope } from './ai-scope';

export interface AiTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskOptions {
  messages: AiTurn[];
  userName?: string;
  role?: string;
  signal?: AbortSignal;
  /** Ағын үзіндісі немесе дайын жауаппен толық ауыстыру. */
  onDelta: (chunk: string, replace?: boolean) => void;
}

export type OfflineReason =
  | 'no_provider'
  | 'bad_key'
  | 'rate_limit'
  | 'model_not_found'
  | 'upstream_error'
  | 'network'
  | null;

export type AskResult = {
  mode: 'ai' | 'offline' | 'blocked';
  text: string;
  reason?: OfflineReason;
  /** Провайдер қайтарған түпнұсқа қате мәтіні (диагностика үшін). */
  detail?: string;
};

export async function askAssistant(opts: AskOptions): Promise<AskResult> {
  const lastUser = [...opts.messages].reverse().find((m) => m.role === 'user');
  const question = lastUser?.content ?? '';

  // Клиенттегі алдын ала сүзгі — тақырыптан тыс сұрақ серверге де жіберілмейді
  const verdict = checkScope(question);
  if (verdict.kind !== 'allow') {
    opts.onDelta(verdict.reply);
    return { mode: 'blocked', text: verdict.reply };
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  // Қорғау кезінде ұзақ күтіп қалмас үшін уақытында дайын жауапқа ауысамыз.
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: opts.messages,
        userName: opts.userName,
        role: opts.role,
      }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      let reason: OfflineReason = 'upstream_error';
      let detail = '';
      try {
        const j = await res.json();
        const known = ['no_provider', 'bad_key', 'rate_limit', 'model_not_found', 'upstream_error'];
        if (known.includes(j?.error)) reason = j.error;
        detail = j?.detail || '';
      } catch {
        /* ignore */
      }
      const text = offlineAnswer(question);
      opts.onDelta(text, true);
      return { mode: 'offline', text, reason, detail };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';
    let text = '';
    let completed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        try {
          const json = JSON.parse(s.slice(5).trim());
          if (json.delta) {
            text += json.delta;
            opts.onDelta(json.delta);
          }
          if (json.done) completed = true;
        } catch {
          /* ignore */
        }
      }
    }

    if (!completed || !text.trim()) throw new Error('incomplete_answer');
    return { mode: 'ai', text };
  } catch (e) {
    if (opts.signal?.aborted) throw e;
    // Fallback — сынып деректері негізіндегі офлайн жауап
    const text = offlineAnswer(question);
    opts.onDelta(text, true);
    return { mode: 'offline', text, reason: 'network' };
  } finally {
    clearTimeout(timeout);
    opts.signal?.removeEventListener('abort', onAbort);
  }
}
