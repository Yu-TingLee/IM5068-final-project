import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { AuthProvider } from './auth';
import { BottomNav } from './components/BottomNav';
import { RequireAuth } from './components/RequireAuth';
import { AboutPage } from './pages/AboutPage';
import { ClaimPage } from './pages/ClaimPage';
import { CharityPage } from './pages/CharityPage';
import { HomePage } from './pages/HomePage';
import { ReferralPage } from './pages/ReferralPage';
import { SignInPage } from './pages/SignInPage';
import { StatsPage } from './pages/StatsPage';
import { StoreAdminPage } from './pages/StoreAdminPage';
import { WalletPage } from './pages/WalletPage';
import { WelcomePage } from './pages/WelcomePage';

const CUSTOMER_PAGES = [
  ['/join', WelcomePage],
  ['/claim', ClaimPage],
  ['/wallet', WalletPage],
  ['/referral', ReferralPage],
  ['/stats', StatsPage],
  ['/charity', CharityPage],
];

function Layout() {
  const { pathname } = useLocation();
  const isStoreAdmin = pathname.startsWith('/store');

  return (
    <div className="mx-auto min-h-screen max-w-md text-slate-800">
      <main className={isStoreAdmin ? '' : 'pb-20'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/store" element={<StoreAdminPage />} />
          {CUSTOMER_PAGES.map(([path, Page]) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireAuth>
                  <Page />
                </RequireAuth>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isStoreAdmin && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </HashRouter>
  );
}
