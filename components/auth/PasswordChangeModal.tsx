'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useApp } from '@/lib/store';

export default function PasswordChangeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { changePassword } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const close = () => {
    if (busy) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Жаңа құпиясөздер бірдей емес.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Құпиясөз сәтті өзгертілді.');
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Қазіргі құпиясөз қате.',
        'auth/wrong-password': 'Қазіргі құпиясөз қате.',
        'auth/weak-password': 'Жаңа құпиясөз кемінде 6 таңба болуы керек.',
        'auth/too-many-requests': 'Әрекет тым көп қайталанды. Кейінірек көріңіз.',
      };
      setError(messages[err?.code] || err?.message || 'Құпиясөзді өзгерту мүмкін болмады.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Құпиясөзді өзгерту" maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Қазіргі құпиясөз</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="label">Жаңа құпиясөз</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="label">Жаңа құпиясөзді қайталаңыз</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((value) => !value)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-sky-600"
        >
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPasswords ? 'Құпиясөздерді жасыру' : 'Құпиясөздерді көрсету'}
        </button>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{success}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Өзгерту
        </button>
      </form>
    </Modal>
  );
}
