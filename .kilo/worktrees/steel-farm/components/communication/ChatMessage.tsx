'use client';

import React, { useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { Message } from '@/lib/types';
import { Avatar, formatDateTime } from '@/components/ui';

interface ChatMessageProps {
  message: Message;
  currentUserId: string;
  showParentRole?: boolean;
}

export default function ChatMessage({
  message,
  currentUserId,
  showParentRole = false,
}: ChatMessageProps) {
  const own = message.senderId === currentUserId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [action, setAction] = useState<'saving' | 'deleting' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(message.content);
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(message.content);
    setError(null);
    setEditing(false);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!own || !content || action) return;

    if (content === message.content) {
      setEditing(false);
      return;
    }

    setAction('saving');
    setError(null);
    try {
      await updateDoc(doc(db, 'messages', message.id), {
        content,
        editedAt: Date.now(),
      });
      setEditing(false);
    } catch (err: any) {
      console.error('Хабарламаны өзгерту қатесі', err);
      setError(err?.message || 'Хабарлама өзгертілмеді. Қайталап көріңіз.');
    } finally {
      setAction(null);
    }
  };

  const remove = async () => {
    if (!own || action) return;
    if (!window.confirm('Бұл хабарламаны өшіргіңіз келе ме?')) return;

    setAction('deleting');
    setError(null);
    try {
      await deleteDoc(doc(db, 'messages', message.id));
    } catch (err: any) {
      console.error('Хабарламаны өшіру қатесі', err);
      setError(err?.message || 'Хабарлама өшірілмеді. Қайталап көріңіз.');
      setAction(null);
    }
  };

  return (
    <div className={`group flex animate-fade-in gap-2 ${own ? 'flex-row-reverse' : ''}`}>
      <Avatar name={message.senderName} />
      <div className={`flex max-w-[82%] flex-col ${own ? 'items-end text-right' : 'items-start'}`}>
        <p className="text-[11px] font-semibold text-slate-400">
          {message.senderName}
          {message.senderRole === 'teacher' && ' · мұғалім'}
          {showParentRole && message.senderRole === 'parent' && ' · ата-ана'}
        </p>

        {editing ? (
          <form
            onSubmit={save}
            className="mt-1 w-full min-w-[240px] rounded-2xl border border-sky-200 bg-sky-50 p-2 shadow-sm sm:min-w-[320px]"
          >
            <label htmlFor={`edit-message-${message.id}`} className="sr-only">
              Хабарламаны өзгерту
            </label>
            <textarea
              id={`edit-message-${message.id}`}
              autoFocus
              className="input min-h-[76px] resize-y text-left"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={action === 'saving'}
              maxLength={4000}
            />
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={cancelEditing}
                className="btn-ghost !px-2.5 !py-1.5 text-xs"
                disabled={action === 'saving'}
              >
                <X className="h-3.5 w-3.5" /> Бас тарту
              </button>
              <button
                type="submit"
                className="btn-primary !px-2.5 !py-1.5 text-xs"
                disabled={!draft.trim() || action === 'saving'}
              >
                {action === 'saving' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Сақтау
              </button>
            </div>
          </form>
        ) : (
          <div
            className={`mt-0.5 inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm ${
              own
                ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {message.content}
          </div>
        )}

        <div className={`mt-0.5 flex min-h-7 items-center gap-1 ${own ? 'flex-row-reverse' : ''}`}>
          <p className="text-[10px] text-slate-300">
            {formatDateTime(message.createdAt)}
            {message.editedAt && ' · өзгертілді'}
          </p>
          {own && !editing && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={startEditing}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50"
                aria-label="Хабарламаны өзгерту"
                title="Өзгерту"
                disabled={action !== null}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={remove}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                aria-label="Хабарламаны өшіру"
                title="Өшіру"
                disabled={action !== null}
              >
                {action === 'deleting' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-left text-xs font-medium text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
