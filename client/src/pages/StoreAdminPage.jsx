import { ChevronLeft, FileText, KeyRound, LogOut, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SESSION_EXPIRED_EVENT, clearToken, getToken, request, setToken } from '../api';
import { ErrorNotice, Loading } from '../components/feedback';
import { COUPON_KINDS } from '../coupons';
import { formatCents, formatDateTime } from '../format';
import { useApi, usePageTitle } from '../hooks';

export function StoreAdminPage() {
  usePageTitle('店家經營後台');
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken('store')));

  useEffect(() => {
    const onExpired = (event) => event.detail === 'store' && setSignedIn(false);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const signOut = async () => {
    await request('/api/admin/logout', { method: 'POST', auth: 'store' }).catch(() => {});
    clearToken('store');
    setSignedIn(false);
  };

  return (
    <div className="p-4 pb-16">
      <Link to="/" className="mb-3 inline-flex items-center gap-0.5 text-xs text-slate-500">
        <ChevronLeft className="h-4 w-4" />
        返回首頁
      </Link>
      {signedIn ? (
        <Dashboard onSignOut={signOut} />
      ) : (
        <StoreSignIn onSignedIn={() => setSignedIn(true)} />
      )}
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-xl bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none';

function StoreSignIn({ onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ storeCode: '', setupCode: '', password: '' });
  const [error, setError] = useState(null);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const { storeCode, setupCode, password } = form;
    try {
      const { token } = await request(mode === 'signin' ? '/api/admin/login' : '/api/admin/setup', {
        method: 'POST',
        body: mode === 'signin' ? { storeCode, password } : { storeCode, setupCode, password },
        auth: null,
      });
      setToken('store', token);
      onSignedIn();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <Store className="h-5 w-5 text-amber-400" />
        <h1 className="text-lg font-black">店家後台</h1>
      </div>

      <div className="mb-4 flex rounded-2xl bg-slate-800 p-1 text-xs font-semibold">
        {[
          ['signin', '登入'],
          ['setup', '首次設定'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 transition ${
              mode === value ? 'bg-amber-500 text-slate-900' : 'text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'setup' && (
        <p className="mb-3 text-[11px] leading-relaxed text-slate-300">
          請輸入平台提供的一次性設定碼，並設定您自己的店家密碼。設定完成後，設定碼即失效。
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={form.storeCode}
          onChange={update('storeCode')}
          placeholder="店家代碼，例如 DAAN"
          autoCapitalize="characters"
          className={INPUT_CLASS}
          required
        />
        {mode === 'setup' && (
          <input
            value={form.setupCode}
            onChange={update('setupCode')}
            placeholder="一次性設定碼，例如 7KQ2-M9XA"
            autoCapitalize="characters"
            autoComplete="off"
            className={`${INPUT_CLASS} font-mono`}
            required
          />
        )}
        <input
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder={mode === 'signin' ? '店家密碼' : '設定店家密碼（至少 8 個字元）'}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          className={INPUT_CLASS}
          required
        />
        <ErrorNotice error={error} />
        <button
          type="submit"
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-900"
        >
          {mode === 'signin' ? '登入' : '完成設定並登入'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onSignOut }) {
  const dashboard = useApi('/api/admin/dashboard', { auth: 'store' });

  if (dashboard.loading) return <Loading />;
  if (dashboard.error) return <ErrorNotice error={dashboard.error} />;

  const { store, redemptions, ...totals } = dashboard.data;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-amber-400" />
            <h1 className="text-lg font-black">{store.name}</h1>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px]"
          >
            <LogOut className="h-3.5 w-3.5" />
            登出
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-3 text-xs">
          <div className="font-bold text-amber-300">「成交才收費」承諾</div>
          <div className="mt-0.5 text-[11px] text-white/80">
            零月費、零上架費、零廣告費。顧客真實到店核銷才收取 19% + 1%。
          </div>
          <div className="mt-2 text-[11px] text-white/60">受贈公益團體：{store.charityName}</div>
        </div>
      </div>

      <CounterCodeCard />

      <div className="grid grid-cols-2 gap-3">
        <Kpi
          label="總核銷折價券"
          value={`${totals.redemptionCount} 筆`}
          note={`折抵總金額 $${totals.totalAmount} 元`}
        />
        <Kpi
          label="帶來新客"
          value={`${totals.refereeCount} 位`}
          note="透過親友推薦到店"
          tone="text-emerald-600"
        />
        <Kpi
          label="應付平台費 (19%)"
          value={`$${formatCents(totals.platformFeeCents)}`}
          note="成交後向店家請款"
          tone="text-indigo-600"
        />
        <Kpi
          label="公益提撥金 (1%)"
          value={`$${formatCents(totals.charityContributionCents)}`}
          note="由平台轉贈公益團體"
          tone="text-rose-600"
        />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <FileText className="h-4 w-4 text-slate-500" />
          核銷紀錄
        </h3>
        {redemptions.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">尚無核銷紀錄</p>
        ) : (
          <div className="space-y-2.5">
            {redemptions.map((r) => (
              <div
                key={r.couponCode}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">
                    {r.customerDisplayName}{' '}
                    <span className="text-[10px] font-normal text-gray-500">
                      ({COUPON_KINDS[r.couponKind].label})
                    </span>
                  </div>
                  <div className="text-sm font-black text-rose-600">-${r.amount} 元</div>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">{r.couponCode}</div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 font-mono text-[10px] text-gray-400">
                  <span>{formatDateTime(r.redeemedAt)}</span>
                  <span>
                    服務費 ${formatCents(r.platformFeeCents)} / 公益 $
                    {formatCents(r.charityContributionCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CounterCodeCard() {
  const counterCode = useApi('/api/admin/counter-code', { auth: 'store' });
  const [now, setNow] = useState(() => Date.now());
  const expiresAt = counterCode.data ? Date.parse(counterCode.data.expiresAt) : null;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(counterCode.reload, Math.max(0, expiresAt - Date.now()) + 500);
    return () => clearTimeout(timer);
  }, [expiresAt, counterCode.reload]);

  const secondsLeft = expiresAt ? Math.max(0, Math.round((expiresAt - now) / 1000)) : 0;
  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4 text-center shadow-sm">
      <div className="mb-2 flex items-center justify-center gap-2">
        <KeyRound className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-bold text-slate-900">櫃台驗證碼</h3>
      </div>
      <ErrorNotice error={counterCode.error} />
      {counterCode.data && (
        <>
          <div className="font-mono text-5xl font-black tracking-[0.2em] text-slate-900">
            {counterCode.data.code}
          </div>
          <p className="mt-2 text-xs text-slate-500">{countdown} 後更新</p>
        </>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        顧客領取見面禮或使用優惠券時，請告知此驗證碼。
      </p>
    </div>
  );
}

function Kpi({ label, value, note, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${tone}`}>{value}</div>
      <div className="mt-1 text-[10px] text-gray-400">{note}</div>
    </div>
  );
}
