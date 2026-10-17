import { Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../auth';
import { ErrorNotice, Loading } from '../components/feedback';
import { formatCents } from '../format';
import { useApi, usePageTitle } from '../hooks';

export function CharityPage() {
  usePageTitle('樂福公益愛心');
  const { customer } = useAuth();
  const charities = useApi('/api/charities', { auth: null });

  return (
    <div className="p-4 pb-16">
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 p-6 text-white shadow-lg">
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
          Love Taiwan 社會企業提撥
        </span>
        <h1 className="mt-2 text-xl leading-snug font-black">
          樂福，讓每一次消費，
          <br />
          都成為打造愛的力量。
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-rose-100">
          店家核銷折價券時，系統從折價券面額中提撥 <strong>1% 投入公益</strong>
          ，消費者毋須額外付費，日常消費即能滾動真實善意。
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs">
          <div>
            <div className="text-[11px] text-rose-200">我的公益愛心</div>
            <div className="mt-0.5 flex items-center gap-1 text-2xl font-black text-amber-200">
              <Heart className="h-5 w-5 fill-rose-300 text-rose-300" />
              {customer.hearts} 顆
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-rose-200">因我而產生的公益金</div>
            <div className="mt-0.5 text-2xl font-black">
              ${formatCents(customer.charityContributionCents)}{' '}
              <span className="text-xs font-normal">元</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-100 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-sm">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p>
          <strong className="text-slate-800">愛心規則：</strong>
          每次在合作店家完成核銷，每 100 元可獲得 1 顆愛心（每次至少 1
          顆）。每家店家都有指定的受贈公益團體。
        </p>
      </div>

      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900">
        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        合作公益團體
      </h2>
      {charities.loading && <Loading />}
      <ErrorNotice error={charities.error} />
      <div className="space-y-3">
        {charities.data?.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">目前尚無合作公益團體</p>
        )}
        {charities.data?.map((charity) => (
          <div
            key={charity.name}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900">{charity.name}</h3>
            <div className="text-right">
              <div className="text-[11px] text-gray-400">平台累計提撥公益金</div>
              <div className="text-sm font-bold text-rose-600">
                ${formatCents(charity.totalContributionCents)} 元
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
