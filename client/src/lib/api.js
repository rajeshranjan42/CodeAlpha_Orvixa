// Base URL: VITE_API_URL mein "/api" ho ya na ho, dono case mein sahi URL banega.
const RAW = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const ORIGIN = RAW.replace(/\/api$/, '');          // jaise https://codealpha-orvixa-server.onrender.com
const BASE = RAW ? ORIGIN + '/api' : '/api';
export const API_BASE = BASE;

export const TOKEN_KEY = 'orvixa-jwt';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

async function request(method, url, body, form) {
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + url, { method, headers, body: form ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error(data?.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}
export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b ?? {}),
  put: (u, b) => request('PUT', u, b),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
  upload: (u, formData) => request('POST', u, formData, true),
};

// Uploaded images backend se aate hain, isliye unke aage backend ka origin lagta hai.
export const imgUrl = (u) =>
  u?.startsWith('/uploads') ? (import.meta.env.VITE_API_ORIGIN || ORIGIN) + u : u;

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const PINCODE_RE = /^[1-9]\d{5}$/;
