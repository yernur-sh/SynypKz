'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { type ChatMessage } from '@/lib/assistant';
import { askAssistant } from '@/lib/ai-client';
import { latexToReadable } from '@/lib/math-text';
import { PageHeader, Avatar } from '@/components/ui';
import { Sparkles, Send, Bot, RotateCcw, Square, WifiOff } from 'lucide-react';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Формула тәрізді жол ма? (мәтіні аз, математикалық белгілері көп) */
function isFormulaLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 90) return false;
  if (/^[•\-\d]/.test(t) && !/=/.test(t)) return false;
  const letters = (t.match(/[A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/g) || []).length;
  const math = (t.match(/[=+\-×·÷√²³⁴ⁿ₀₁₂₃₄₅₆₇₈₉^/()<>≤≥≠±∛πΔ]/g) || []).length;
  return /=/.test(t) && math >= 3 && letters <= t.length * 0.45;
}

/** Мәтінді безендіру: LaTeX → оқылатын түр, **қалың**, тізім, формула блогы. */
function Rich({ text }: { text: string }) {
  const clean = latexToReadable(text);
  return (
    <>
      {clean.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;

        if (isFormulaLine(line)) {
          return (
            <p
              key={i}
              className="my-1 rounded-xl bg-slate-50 px-3 py-2 text-center font-mono text-[13px] font-semibold text-slate-800 ring-1 ring-slate-100"
            >
              {line.trim()}
            </p>
          );
        }

        const isList = /^\s*(•|[-*]\s|\d+[).]\s)/.test(line);
        return (
          <p key={i} className={isList ? 'pl-2' : ''}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-bold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </>
  );
}

export default function AiAssistant() {
  const { user } = useApp();
  const greeting: ChatMessage = {
    id: 'hello',
    role: 'assistant',
    content:
      'Сәлеметсіз бе! Мен — SynypKz ЖИ-көмекшісімін 🤖\nМатематика, физика, тілдер, тарих — кез келген **оқу сұрағыңды** қой: есеп шығарамыз, ережені түсіндіремін, емтиханға дайындалуға көмектесемін.\nСонымен қатар сабақ кестесі, мұғалімдер және тәрбие сағаты туралы білемін.\n\nЕскерту: мен тек мектеп және оқу-білім тақырыбында жауап беремін.',
    createdAt: Date.now(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [offline, setOffline] = useState(false);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const [offlineDetail, setOfflineDetail] = useState<string>('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setTyping(false);
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: q, createdAt: Date.now() };
    const replyId = uid();
    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'hello')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((m) => [
      ...m,
      userMsg,
      { id: replyId, role: 'assistant', content: '', createdAt: Date.now() },
    ]);
    setInput('');
    setTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await askAssistant({
        messages: history,
        userName: user?.name,
        role: user?.role,
        signal: controller.signal,
        onDelta: (chunk) =>
          setMessages((m) =>
            m.map((msg) => (msg.id === replyId ? { ...msg, content: msg.content + chunk } : msg))
          ),
      });
      setOffline(res.mode === 'offline');
      setOfflineReason(res.mode === 'offline' ? res.reason ?? null : null);
      setOfflineDetail(res.mode === 'offline' ? res.detail ?? '' : '');
    } catch {
      /* тоқтатылды */
    } finally {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === replyId && !msg.content.trim()
            ? { ...msg, content: 'Жауап алынбады. Сұрағыңызды қайта жазып көріңізші.' }
            : msg
        )
      );
      abortRef.current = null;
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ЖИ-көмекші"
        subtitle="Оқу мен мектеп сұрақтарына жауап беретін жасанды интеллект"
        icon={<Sparkles className="h-6 w-6" />}
        action={
          <button
            onClick={() => setMessages([greeting])}
            className="btn-ghost"
            disabled={messages.length <= 1}
          >
            <RotateCcw className="h-4 w-4" /> Тазалау
          </button>
        }
      />

      {offline && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium leading-relaxed text-amber-800">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {offlineReason === 'no_provider' ? (
              <>
                <b>ЖИ кілті бапталмаған.</b> Жоба түбінде{' '}
                <code className="rounded bg-amber-100 px-1">.env.local</code> файлын жасап, кілт қосыңыз
                (мыс. <code className="rounded bg-amber-100 px-1">GROQ_API_KEY=...</code>), сосын серверді
                қайта іске қосыңыз.
              </>
            ) : offlineReason === 'bad_key' ? (
              <>
                <b>Кілт жарамсыз.</b> console.groq.com сайтынан жаңа кілт жасап,{' '}
                <code className="rounded bg-amber-100 px-1">.env.local</code> ішіне қойыңыз да, серверді
                қайта қосыңыз.
              </>
            ) : offlineReason === 'rate_limit' ? (
              <>
                <b>Лимит бітті.</b> Тегін жоспардың сағаттық/тәуліктік шегіне жеттіңіз — біраз күтіп,
                қайта сұраңыз.
              </>
            ) : offlineReason === 'model_not_found' ? (
              <>
                <b>Модель табылмады.</b>{' '}
                <code className="rounded bg-amber-100 px-1">.env.local</code> ішіндегі{' '}
                <code className="rounded bg-amber-100 px-1">AI_MODEL</code> жолын өшіріңіз — жүйе жарамды
                модельді өзі таңдайды. Тексеру:{' '}
                <a className="underline" href="/api/ai/status?live=1" target="_blank" rel="noreferrer">
                  /api/ai/status?live=1
                </a>
              </>
            ) : offlineReason === 'upstream_error' ? (
              <>
                <b>ЖИ қызметі жауап бермеді.</b> Тексеру:{' '}
                <a className="underline" href="/api/ai/status?live=1" target="_blank" rel="noreferrer">
                  /api/ai/status?live=1
                </a>
              </>
            ) : (
              <>Интернет байланысы үзілді — көмекші офлайн режимде жауап беруде.</>
            )}
            {offlineDetail && (
              <span className="mt-1 block font-normal text-amber-700/80">{offlineDetail}</span>
            )}
          </span>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl">
        {/* Чат */}
        <section className="card animate-fade-up flex h-[72vh] min-h-[520px] flex-col overflow-hidden">
          <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">SynypKz көмекшісі</p>
              <p className="text-[11px] text-white/80">
                {typing
                  ? 'жазып жатыр…'
                  : offline
                  ? 'офлайн режим · сынып деректері бойынша жауап береді'
                  : 'онлайн · жасанды интеллект + сынып деректері'}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
              >
                {m.role === 'assistant' && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`animate-pop max-w-[85%] space-y-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      : 'rounded-bl-md border border-slate-100 bg-white text-slate-700'
                  }`}
                >
                  <Rich text={m.content} />
                </div>
                {m.role === 'user' && <Avatar name={user?.name || 'Мен'} className="h-8 w-8 text-[10px]" />}
              </div>
            ))}

            {typing && !messages[messages.length - 1]?.content && (
              <div className="flex items-end gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сұрағыңызды жазыңыз…"
              className="input"
            />
            {typing ? (
              <button type="button" onClick={stop} className="btn-ghost h-11 w-11 !p-0" title="Тоқтату">
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" className="btn-primary h-11 w-11 !p-0" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
        </section>

      </div>
    </div>
  );
}
