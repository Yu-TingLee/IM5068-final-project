import { ArrowRight, CircleCheck, Gift } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { request } from '../api';
import { CounterCodeForm } from '../components/CounterCodeForm';
import { formatDate } from '../format';
import { usePageTitle } from '../hooks';

export function WelcomePage() {
  usePageTitle('到店領見面禮');
  const [coupon, setCoupon] = useState(null);

  const handleSubmit = async (counterCode) => {
    setCoupon(await request('/api/welcome-coupons', { method: 'POST', body: { counterCode } }));
  };

  return (
    <div className="p-4 pb-12">
      <div className="mb-4 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2.5 text-rose-600">
          <Gift className="h-6 w-6" />
          <h1 className="text-xl font-black text-slate-900">到店領見面禮</h1>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          第一次到合作店家？向店員索取櫃台驗證碼，即可領取 <strong>50 元見面禮</strong>
          。使用見面禮後，您就會成為這家店的推薦夥伴，獲得專屬推薦碼！
        </p>
      </div>

      {coupon ? (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CircleCheck className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-black text-slate-900">歡迎光臨《{coupon.storeName}》！</h2>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-3xl font-black text-rose-600">
              ${coupon.faceValue} <span className="text-xs font-normal text-gray-500">元</span>
            </div>
            <div className="mt-1 text-xs text-slate-600">
              消費滿 ${coupon.minSpend} 可折抵・期限至 {formatDate(coupon.expiresAt)}
            </div>
          </div>
          <Link
            to="/wallet"
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-3.5 text-sm font-bold text-white shadow-md"
          >
            前往「我的優惠券」立即使用
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-md">
          <CounterCodeForm submitLabel="領取 50 元見面禮" onSubmit={handleSubmit} />
          <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-slate-500">
            • 驗證碼每 10 分鐘更新一次。每位會員在同一家店家限領一次新客優惠券。
          </p>
        </div>
      )}
    </div>
  );
}
