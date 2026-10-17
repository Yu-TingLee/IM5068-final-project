import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { ErrorNotice, Loading } from './feedback';

export function RequireAuth({ children }) {
  const { customer, loading, error } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (error?.code === 'server_offline') {
    return (
      <div className="p-4">
        <ErrorNotice error={error} />
      </div>
    );
  }
  if (!customer) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }
  return children;
}
