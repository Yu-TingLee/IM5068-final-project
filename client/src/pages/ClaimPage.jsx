import { ArrowRight, CircleCheck, Heart, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { request } from '../api';
import { ErrorNotice } from '../components/feedback';
import { usePageTitle } from '../hooks';

export function ClaimPage() {
  usePageTitle('輸入推薦碼領券');
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setCoupon(await request('/api/referral-coupons', { method: 'POST', body: { code } }));
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-12">
      <div className="mb-4 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2.5 text-rose-600">
          <Ticket className="h-6 w-6" />
          <h1 className="text-xl font-black text-slate-900">輸入推薦碼領券</h1>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          輸入朋友或熟客分享給您的推薦碼，即可免費獲得該店專屬折價券！到店消費即可現場抵用。
        </p>
      </div>

      {coupon ? (
        <div className="rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <CircleCheck className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-black text-slate-900">恭喜成功領取！</h2>
          <div className="mt-5 rounded-2xl border border-rose-200 bg-gradient-to-br from-amber-50 to-rose-50 p-4">
            <div className="text-[11px] font-medium text-gray-500">
              《{coupon.storeName}》折價券
            </div>
            <div className="mt-0.5 text-3xl font-black text-rose-600">
              ${coupon.faceValue} <span className="text-xs font-normal text-gray-500">元</span>
            </div>
            <div className="mt-1 text-xs text-slate-600">消費滿 ${coupon.minSpend} 可折抵</div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-rose-500">
              <Heart className="h-3.5 w-3.5 fill-rose-500" />
              <span>消費核銷後，系統將自動提撥 1% 投入公益</span>
            </div>
          </div>
          <Link
            to="/wallet"
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-3.5 text-sm font-bold text-white shadow-md"
          >
            前往「我的優惠券」準備到店使用
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">推薦碼或短碼</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例如：大安旅店/小明 或 LF-7K3M9Q"
                className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
                required
              />
            </label>

            <ErrorNotice error={error} />

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              立即領取 100 元折價券
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 space-y-1 border-t border-gray-100 pt-4 text-[11px] text-slate-500">
            <p>• 短碼不分大小寫。</p>
            <p>• 每位會員在同一家合作店家，限領一次新客推薦折價券。</p>
            <p>• 折價券不找零、不折現、不可轉讓，使用期限為 90 天。</p>
          </div>
        </div>
      )}
    </div>
  );
}
