import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth';
import { ErrorNotice } from '../components/feedback';
import { usePageTitle } from '../hooks';

const INPUT_CLASS =
  'w-full rounded-xl border border-amber-300 bg-amber-50/50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none';

export function SignInPage() {
  const [mode, setMode] = useState('signin');
  usePageTitle(mode === 'signin' ? '登入' : '註冊');
  const { customer, signIn, register } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next') : '/';

  const [form, setForm] = useState({ account: '', displayName: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (customer) return <Navigate to={next} replace />;

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(form.account, form.password);
      } else {
        await register(form.account, form.displayName, form.password);
      }
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">歡迎來到樂福推薦</h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          登入後即可領取折價券、到店核銷，並開通您的專屬推薦碼。
        </p>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex rounded-2xl bg-slate-200/70 p-1 text-xs font-semibold">
          {[
            ['signin', '登入'],
            ['register', '註冊'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`flex-1 rounded-xl py-2 transition ${
                mode === value ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">帳號</span>
            <input
              value={form.account}
              onChange={update('account')}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="3–20 個小寫英文、數字或底線"
              className={INPUT_CLASS}
              required
            />
          </label>

          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">顯示名稱</span>
              <input
                value={form.displayName}
                onChange={update('displayName')}
                maxLength={20}
                placeholder="會顯示在您的推薦碼中，例如：小明"
                className={INPUT_CLASS}
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">密碼</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? '至少 8 個字元' : ''}
              className={INPUT_CLASS}
              required
            />
          </label>

          <ErrorNotice error={error} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60"
          >
            {mode === 'signin' ? '登入' : '建立帳號'}
          </button>
        </form>
      </div>
    </div>
  );
}
