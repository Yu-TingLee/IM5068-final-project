import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT, clearToken, getToken, request, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken('customer')));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setCustomer(await request('/api/auth/me'));
      setError(null);
    } catch (err) {
      setCustomer(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken('customer')) return;
    let active = true;
    request('/api/auth/me')
      .then(
        (me) => active && setCustomer(me),
        (err) => active && setError(err),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = (event) => event.detail === 'customer' && setCustomer(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback(({ token, customer }) => {
    setToken('customer', token);
    setCustomer(customer);
    setError(null);
  }, []);

  const signIn = useCallback(
    async (account, password) =>
      startSession(
        await request('/api/auth/login', { method: 'POST', body: { account, password } }),
      ),
    [startSession],
  );

  const register = useCallback(
    async (account, displayName, password) =>
      startSession(
        await request('/api/auth/register', {
          method: 'POST',
          body: { account, displayName, password },
        }),
      ),
    [startSession],
  );

  const signOut = useCallback(async () => {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken('customer');
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, loading, error, refresh, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
