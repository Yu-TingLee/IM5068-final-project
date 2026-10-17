import { CircleCheck, Clock, Gift, Heart, ShieldAlert, Sparkles, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { request } from '../api';
import { useAuth } from '../auth';
import { ErrorNotice, Loading } from '../components/feedback';
import { CounterCodeForm } from '../components/CounterCodeForm';
import { formatCents, formatDate, formatDateTime } from '../format';
import { COUPON_KINDS } from '../coupons';
import { useApi, usePageTitle } from '../hooks';

const TABS = [
  ['unused', '未使用'],
  ['redeemed', '已使用'],
  ['expired', '已過期'],
];

export function WalletPage() {
  usePageTitle('我的優惠券匣');
  const coupons = useApi('/api/coupons');
  const [tab, setTab] = useState('unused');
  const [selected, setSelected] = useState(null);

  if (coupons.loading) return <Loading />;
  if (coupons.error) {
    return (
      <div className="p-4">
        <ErrorNotice error={coupons.error} />
      </div>
    );
  }

  const countBy = (status) => coupons.data.filter((c) => c.status === status).length;
  const visible = coupons.data.filter((c) => c.status === tab);

  return (
    <div className="p-4 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Wallet className="h-6 w-6 text-amber-500" />
            我的優惠券匣
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            持有 {countBy('unused')} 張未使用券（上限 15 張）
          </p>
        </div>
        <Link
          to="/claim"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600"
        >
          + 輸入碼領券
        </Link>
      </div>

      <div className="mb-4 flex rounded-2xl bg-slate-200/70 p-1 text-xs font-semibold">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-xl py-2 transition ${
              tab === value ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            {label} ({countBy(value)})
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">目前尚無此狀態的優惠券</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
              輸入朋友的推薦碼，或到店家櫃台領取見面禮，讓好店被你看見！
            </p>
          </div>
        ) : (
          visible.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} onUse={() => setSelected(coupon)} />
          ))
        )}
      </div>

      {selected && (
        <RedeemDialog
          coupon={selected}
          onClose={() => setSelected(null)}
          onRedeemed={coupons.reload}
        />
      )}
    </div>
  );
}

function CouponCard({ coupon, onUse }) {
  const kind = COUPON_KINDS[coupon.kind];
  const isUnused = coupon.status === 'unused';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isUnused ? 'border-amber-200' : 'border-gray-200 opacity-80'
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-2.5 ${kind.stripe}`} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {coupon.storeName}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${kind.badge}`}>
                {kind.label}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-gray-500">券碼：{coupon.code}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-black text-rose-600">${coupon.faceValue}</div>
            <div className="text-[10px] text-gray-400">滿 ${coupon.minSpend} 折抵</div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {coupon.status === 'redeemed'
                ? `已於 ${formatDateTime(coupon.redeemedAt)} 核銷`
                : `期限至 ${formatDate(coupon.expiresAt)}`}
            </span>
          </div>
          {isUnused ? (
            <button
              onClick={onUse}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              我要使用
            </button>
          ) : (
            <span className="text-[11px] font-medium text-gray-400">
              {coupon.status === 'redeemed' ? '已完成核銷' : '已逾期'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RedeemDialog({ coupon, onClose, onRedeemed }) {
  const { refresh } = useAuth();
  const [result, setResult] = useState(null);

  const handleRedeem = async (counterCode) => {
    setResult(
      await request(`/api/coupons/${coupon.id}/redeem`, {
        method: 'POST',
        body: { counterCode },
      }),
    );
    onRedeemed();
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {result ? (
          <RedeemSuccess result={result} onClose={onClose} />
        ) : (
          <>
            <div className="border-b border-gray-100 pb-3 text-center">
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                {coupon.storeName}
              </span>
              <div className="my-2 text-3xl font-black text-rose-600">
                ${coupon.faceValue}{' '}
                <span className="text-xs font-normal text-gray-500">
                  (滿 ${coupon.minSpend} 可折抵)
                </span>
              </div>
              <div className="font-mono text-xs text-gray-400">券碼：{coupon.code}</div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-amber-300/80 bg-amber-50 p-3.5">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">請在店家櫃台使用</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                  出示此畫面給店員，並輸入店家提供的 6 位數櫃台驗證碼，即可完成折抵。
                </p>
              </div>
            </div>

            <div className="mt-4">
              <CounterCodeForm submitLabel="確認使用這張優惠券" onSubmit={handleRedeem} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RedeemSuccess({ result, onClose }) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
        <Heart className="h-10 w-10 fill-rose-500" />
      </div>
      <h3 className="text-xl font-black text-slate-900">
        核銷成功！折抵 ${result.coupon.faceValue} 元
      </h3>
      <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
        ❤️ 你的這筆消費，讓 {formatCents(result.charityContributionCents)} 元流向社會公益！
      </div>

      {(result.becamePartner || result.rewardIssued) && (
        <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left text-xs">
          {result.becamePartner && (
            <div className="flex items-start gap-2 text-slate-700">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                <strong>專屬推薦碼已解鎖！</strong>您已到店消費，現在也是這家店的推薦夥伴。
              </span>
            </div>
          )}
          {result.rewardIssued && (
            <div className="flex items-start gap-2 text-indigo-700">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <span>
                <strong>雙向善意回饋！</strong>您的推薦人已收到一張感謝折價券。
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 space-y-2">
        {result.becamePartner && (
          <Link
            to="/referral"
            className="block w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white shadow"
          >
            查看我的推薦碼與分享卡
          </Link>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gray-100 py-2.5 text-xs font-medium text-slate-700"
        >
          完成
        </button>
      </div>
    </div>
  );
}
