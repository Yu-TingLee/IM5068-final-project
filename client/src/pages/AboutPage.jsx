import { Heart } from 'lucide-react';
import { usePageTitle } from '../hooks';

const PILLARS = [
  {
    title: '真實熟客推薦・嚴格防弊',
    text: '推薦碼只發給「真正到店消費過」的客人；領取見面禮與使用優惠券都需輸入店家櫃台的限時驗證碼，確認顧客真的在店裡。',
    tone: 'border-amber-100 bg-amber-50 text-amber-600',
  },
  {
    title: '成交才收費・零風險推廣',
    text: '不收月費、上架費與廣告費。顧客真正持券到店消費核銷後，才按折價券面額收取 19% 服務費與 1% 公益提撥。',
    tone: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  },
  {
    title: '19% + 1% 社會企業善意閉環',
    text: '每筆核銷的 1% 直接轉化為公益金，捐給該店家指定的社福團體，消費者不需額外付費。',
    tone: 'border-rose-100 bg-rose-50 text-rose-600',
  },
];

export function AboutPage() {
  usePageTitle('認識樂福推薦');

  return (
    <div className="p-4 pb-16">
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 p-6 text-center text-white shadow-lg">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Heart className="h-6 w-6 fill-white" />
        </div>
        <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">
          Love Taiwan 樂福推薦
        </span>
        <h1 className="mt-2 text-xl font-black">讓善良更容易發生</h1>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-rose-100">
          樂福推薦是一家台灣社會企業，我們相信實體商家的好口碑，應該透過真實消費的熟客溫暖傳遞，讓每一次消費都成為打造愛的力量。
        </p>
      </div>

      <div className="space-y-3">
        {PILLARS.map(({ title, text, tone }, index) => (
          <div key={title} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${tone}`}
              >
                {index + 1}
              </div>
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            </div>
            <p className="pl-10 text-xs leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
