import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ErrorNotice } from './feedback';

export function CounterCodeForm({ submitLabel, onSubmit }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(code);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-700">櫃台驗證碼</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="請輸入店家提供的 6 位數驗證碼"
          className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.4em] placeholder:text-sm placeholder:tracking-normal focus:ring-2 focus:ring-rose-400 focus:outline-none"
          required
        />
      </label>

      <ErrorNotice error={error} />

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-md transition hover:from-rose-600 hover:to-amber-600 disabled:opacity-60"
      >
        <span>{submitLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
