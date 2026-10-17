import { CircleAlert, WifiOff } from 'lucide-react';
import { errorMessage } from '../errors';

export function Loading() {
  return <div className="py-16 text-center text-sm text-slate-400">載入中…</div>;
}

export function ErrorNotice({ error }) {
  if (!error) return null;
  const offline = error.code === 'server_offline';
  const Icon = offline ? WifiOff : CircleAlert;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1 leading-snug">{errorMessage(error)}</span>
      {offline && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white"
        >
          重試
        </button>
      )}
    </div>
  );
}
