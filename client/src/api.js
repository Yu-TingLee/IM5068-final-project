const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const TOKEN_KEYS = {
  customer: 'customerToken',
  store: 'storeToken',
};

export const SESSION_EXPIRED_EVENT = 'auth:sessionExpired';

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function getToken(kind) {
  try {
    return localStorage.getItem(TOKEN_KEYS[kind]);
  } catch {
    return null;
  }
}

export function setToken(kind, token) {
  try {
    localStorage.setItem(TOKEN_KEYS[kind], token);
  } catch {
    // Private browsing can block storage; the session then lasts only for this page.
  }
}

export function clearToken(kind) {
  try {
    localStorage.removeItem(TOKEN_KEYS[kind]);
  } catch {
    // Nothing stored, nothing to clear.
  }
}

export async function request(path, { method = 'GET', body, auth = 'customer' } = {}) {
  // ngrok's free plan shows a warning page to browsers unless this header is present.
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth && getToken(auth);
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('server_offline', 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (response.ok) return data;

  if (response.status === 401 && token) {
    clearToken(auth);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: auth }));
  }
  const code = data?.error ?? (response.status >= 502 ? 'server_offline' : 'unknown');
  throw new ApiError(code, response.status);
}
