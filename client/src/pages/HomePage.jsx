import {
  ArrowRight,
  Gift,
  Heart,
  Info,
  LogOut,
  Share2,
  Sparkles,
  Ticket,
  Store,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../auth';
import { ErrorNotice } from '../components/feedback';
import { useApi, usePageTitle } from '../hooks';

const TILES = [
  {
    to: '/claim',
    icon: Ticket,
    title: '🎟 輸入推薦碼',
    text: '輸入親友代碼，立即領取 100 元折價券',
    tone: 'rose',
  },
  {
    to: '/wallet',
    icon: Wallet,
    title: '👛 我的優惠券',
    text: '到店出示並使用，享受即時現折',
    tone: 'amber',
  },
  {
    to: '/referral',
    icon: Share2,
    title: '🤝 我的推薦碼',
    text: '分享專屬連結，親友得券自己拿回饋',
    tone: 'indigo',
  },
  {
    to: '/charity',
    icon: Heart,
    title: '❤️ 公益愛心',
    text: '每筆核銷 1% 轉化公益，讓愛心發光',
    tone: 'rose',
  },
  {
    to: '/join',
    icon: Gift,
    title: '🎁 到店領見面禮',
    text: '在店家櫃台輸入驗證碼，領取 50 元見面禮',
    tone: 'teal',
  },
  {
    to: '/about',
    icon: Info,
    title: 'ℹ️ 認識樂福',
    text: '社會企業理念與 19%+1% 模式',
    tone: 'blue',
  },
];

const TONES = {
  rose: 'border-rose-100 bg-rose-50 text-rose-500',
  amber: 'border-amber-100 bg-amber-50 text-amber-600',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-600',
  teal: 'border-teal-100 bg-teal-50 text-teal-600',
  blue: 'border-blue-100 bg-blue-50 text-blue-600',
};

export function HomePage() {
  usePageTitle('首頁');
  const { customer, error, signOut } = useAuth();

  return (
    <div className="pb-10">
      <header className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wider">
              Love Taiwan 樂福推薦
            </span>
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-rose-900">
              社會企業
            </span>
          </div>
          {customer && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-xs">
              <Heart className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
              <span>
                愛心 <strong>{customer.hearts}</strong> 顆
              </span>
            </div>
          )}
        </div>

        {customer ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/25 text-lg font-bold">
              {customer.displayName.slice(0, 1)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{customer.displayName}</h2>
              <p className="text-xs text-rose-100">@{customer.account}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] hover:bg-white/25"
            >
              <LogOut className="h-3.5 w-3.5" />
              登出
            </button>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Link
              to="/signin"
              className="flex-1 rounded-xl bg-white py-2.5 text-center text-sm font-bold text-rose-600 shadow"
            >
              登入 / 註冊
            </Link>
          </div>
        )}

        <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 p-2.5 text-xs">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
          <p className="font-medium">樂福，讓每一次消費，都成為打造愛的力量。</p>
        </div>
      </header>

      {error?.code === 'server_offline' && (
        <div className="mt-4 px-4">
          <ErrorNotice error={error} />
        </div>
      )}
      {customer && <QuickStats />}

      <section className="mt-5 grid grid-cols-2 gap-3 px-4">
        {TILES.map(({ to, icon: Icon, title, text, tone }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col justify-between rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition active:scale-[0.98]"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${TONES[tone]}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between text-[15px] font-bold text-slate-800">
              <span>{title}</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 px-4 text-center">
        <Link
          to="/store"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm"
        >
          <Store className="h-3.5 w-3.5" />
          店家專區：查看驗證碼與核銷報表
        </Link>
      </div>
    </div>
  );
}

function QuickStats() {
  const coupons = useApi('/api/coupons');
  const referralCodes = useApi('/api/referral-codes');

  const error = coupons.error || referralCodes.error;
  if (error) {
    return (
      <div className="mt-4 px-4">
        <ErrorNotice error={error} />
      </div>
    );
  }

  const unused = coupons.data?.filter((c) => c.status === 'unused').length ?? 0;
  const referred = referralCodes.data?.reduce((sum, code) => sum + code.redeemCount, 0) ?? 0;

  return (
    <div className="relative z-10 -mt-3 px-4">
      <div className="flex items-center rounded-2xl border border-amber-100 bg-white p-3.5 shadow-md">
        <Link to="/wallet" className="flex-1 border-r border-gray-100 pr-3">
          <div className="text-[11px] font-medium text-gray-500">未使用優惠券</div>
          <div className="mt-0.5 text-xl font-black text-rose-600">
            {unused} <span className="text-xs font-normal text-gray-600">張</span>
          </div>
        </Link>
        <Link to="/stats" className="flex-1 pl-3">
          <div className="text-[11px] font-medium text-gray-500">推薦帶客戰績</div>
          <div className="mt-0.5 text-xl font-black text-amber-600">
            {referred} <span className="text-xs font-normal text-gray-600">位新客到店</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
