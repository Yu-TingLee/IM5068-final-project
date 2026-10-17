import { Award, Gift, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router';
import { ErrorNotice, Loading } from '../components/feedback';
import { formatDateTime } from '../format';
import { useApi, usePageTitle } from '../hooks';

export function StatsPage() {
  usePageTitle('推薦戰績與回饋');
  const referralCodes = useApi('/api/referral-codes');
  const referrals = useApi('/api/referrals');
  const coupons = useApi('/api/coupons');

  const loading = referralCodes.loading || referrals.loading || coupons.loading;
  const error = referralCodes.error || referrals.error || coupons.error;
  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="p-4">
        <ErrorNotice error={error} />
      </div>
    );
  }

  const sum = (field) => referralCodes.data.reduce((total, code) => total + code[field], 0);
  const unusedRewards = coupons.data.filter((c) => c.kind === 'reward' && c.status === 'unused');

  return (
    <div className="p-4 pb-16">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-black text-slate-900">
          <TrendingUp className="h-6 w-6 text-amber-500" />
          我的推薦戰績與回饋
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">用真實好評分享愛店，成就每一次善意回饋</p>
      </div>

      {referralCodes.data.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <Award className="mx-auto mb-2 h-12 w-12 text-gray-300" />
          <h3 className="text-sm font-bold text-slate-800">尚無推薦戰績資料</h3>
          <p className="mt-1 text-xs text-gray-500">
            完成到店消費並開通推薦碼後，這裡將紀錄您為店家帶來的新客與回饋！
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-rose-500 p-5 text-white shadow-md">
            <h2 className="text-xl leading-tight font-black">
              你的推薦，已為合作店家
              <br />
              帶來 <span className="text-2xl text-amber-200">{sum('redeemCount')}</span> 位新客！
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-amber-100">
              每當被推薦親友首次完成核銷，您將獲得 25 元感謝折價券，無累積上限！
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Metric label="領券好友" value={`${sum('claimCount')} 人`} />
            <Metric label="到店核銷" value={`${sum('redeemCount')} 人`} tone="text-emerald-600" />
            <Metric label="累積回饋" value={`$${sum('totalReward')}`} tone="text-rose-600" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  可使用的回饋折價券（{unusedRewards.length} 張）
                </h4>
                <p className="text-xs text-slate-500">下次消費時直接折抵</p>
              </div>
            </div>
            <Link
              to="/wallet"
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              去使用
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-slate-500" />
              推薦好友動態
            </h3>
            {referrals.data.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">
                目前還沒有好友透過您的推薦碼領券，快分享給朋友吧！
              </p>
            ) : (
              <div className="space-y-2.5">
                {referrals.data.map((referral, index) => (
                  <ReferralRow key={index} referral={referral} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-3.5 text-center shadow-sm">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`mt-0.5 text-xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function ReferralRow({ referral }) {
  const redeemed = referral.redeemedAt !== null;
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
            redeemed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {referral.refereeDisplayName.slice(0, 1)}
        </div>
        <div>
          <div className="font-bold text-slate-800">
            {referral.refereeDisplayName}
            <span className="ml-1 font-normal text-gray-400">・{referral.storeName}</span>
          </div>
          <div className="text-[10px] text-gray-400">
            {redeemed
              ? `核銷於 ${formatDateTime(referral.redeemedAt)}`
              : `領券於 ${formatDateTime(referral.claimedAt)}`}
          </div>
        </div>
      </div>
      {redeemed ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
          回饋 +${referral.rewardValue}
        </span>
      ) : (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-600">
          尚待到店
        </span>
      )}
    </div>
  );
}
