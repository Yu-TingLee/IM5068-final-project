import { Check, Copy, Lock, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ErrorNotice, Loading } from '../components/feedback';
import { appUrl } from '../format';
import { useApi, usePageTitle } from '../hooks';

export function ReferralPage() {
  usePageTitle('我的推薦碼與分享卡');
  const referralCodes = useApi('/api/referral-codes');

  return (
    <div className="p-4 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Share2 className="h-6 w-6 text-indigo-500" />
            我的推薦碼與分享卡
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">分享善意好店，親友享優惠、自己拿回饋</p>
        </div>
        <Link
          to="/stats"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600"
        >
          推薦戰績 →
        </Link>
      </div>

      {referralCodes.loading && <Loading />}
      <ErrorNotice error={referralCodes.error} />
      {referralCodes.data?.length === 0 && <NotUnlocked />}
      <div className="space-y-6">
        {referralCodes.data?.map((referralCode) => (
          <ShareCard key={referralCode.shortCode} referralCode={referralCode} />
        ))}
      </div>
    </div>
  );
}

function ShareCard({ referralCode }) {
  const [copied, setCopied] = useState(false);
  const claimUrl = appUrl(`/claim?code=${referralCode.shortCode}`);
  const shareText = `【好友專屬推薦】推薦你到《${referralCode.storeName}》！輸入我的推薦碼「${referralCode.code}」或短碼「${referralCode.shortCode}」，立即領 100 元折價券！消費還能一起做公益 ❤️ ${claimUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-rose-950 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold">
              Love Taiwan 夥伴
            </span>
            <span className="text-xs font-medium text-slate-300">
              {referralCode.storeName} 推薦人
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            現折 100 元
          </div>
        </div>

        <div className="my-5 text-center">
          <div className="mb-1 text-xs font-medium text-slate-400">推薦碼（好友輸入即領）</div>
          <div className="text-2xl font-black tracking-wider text-amber-300">
            {referralCode.code}
          </div>
          <div className="mt-2 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs">
            或輸入短碼：<strong className="text-amber-200">{referralCode.shortCode}</strong>
          </div>
        </div>

        <div className="flex items-center justify-around border-t border-white/10 pt-3 text-center text-xs">
          <Stat label="已被領取" value={`${referralCode.claimCount} 人`} />
          <Stat
            label="成功到店核銷"
            value={`${referralCode.redeemCount} 人`}
            accent="text-amber-300"
          />
          <Stat label="累積回饋" value={`$${referralCode.totalReward}`} accent="text-rose-400" />
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-md transition ${
          copied ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
        }`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? '已複製！可直接貼在 LINE / IG / FB' : '一鍵複製分享文案與連結'}
      </button>
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#06C755] py-3.5 text-sm font-bold text-white shadow-md"
      >
        <Share2 className="h-4 w-4" />
        分享給 LINE 好友
      </a>
    </div>
  );
}

function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`mt-0.5 text-base font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function NotUnlocked() {
  return (
    <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-black text-slate-900">推薦碼尚未解鎖</h2>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600">
        為了確保「真實體驗推薦」，樂福推薦碼只發給<strong>真正到過實體店家消費的顧客</strong>！
      </p>
      <div className="mt-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900">
        <div className="font-bold">解鎖推薦碼的兩種方式：</div>
        <p>
          <span className="font-bold text-rose-600">方式一：</span>
          在店家櫃台輸入店家提供的驗證碼領取見面禮，到店使用後自動開通。
        </p>
        <p>
          <span className="font-bold text-indigo-600">方式二：</span>
          輸入親友推薦碼領取折價券，到店使用後自動開通。
        </p>
      </div>
      <Link
        to="/claim"
        className="mt-6 block w-full rounded-xl bg-rose-500 py-3 text-xs font-bold text-white shadow"
      >
        輸入朋友推薦碼領券
      </Link>
    </div>
  );
}
