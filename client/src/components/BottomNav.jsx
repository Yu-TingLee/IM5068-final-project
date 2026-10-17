import { Heart, House, Share2, Ticket, Wallet } from 'lucide-react';
import { NavLink } from 'react-router';

const ITEMS = [
  { to: '/', label: '首頁', icon: House },
  { to: '/claim', label: '領券', icon: Ticket },
  { to: '/wallet', label: '優惠券', icon: Wallet },
  { to: '/referral', label: '推薦碼', icon: Share2 },
  { to: '/charity', label: '公益', icon: Heart },
];

export function BottomNav() {
  return (
    <nav
      aria-label="主要功能選單"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-100/80 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition ${
                isActive ? 'font-bold text-rose-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
