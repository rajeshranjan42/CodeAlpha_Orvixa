import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
const LOCAL = 'orvixa-cart';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL)) || []; } catch { return []; } };
const writeLocal = (l) => { try { localStorage.setItem(LOCAL, JSON.stringify(l)); } catch { /* ignore */ } };

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [lines, setLines] = useState(readLocal);
  const [saved, setSaved] = useState([]);
  const [bump, setBump] = useState(0);

  const apply = (r) => { setLines(r.cart); setSaved(r.saved); };

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLines(readLocal()); setSaved([]); return; }
    const local = readLocal();
    const p = local.length
      ? api.post('/cart/merge', { items: local.map((l) => ({ productId: l.product._id, qty: l.qty })) })
      : api.get('/cart');
    p.then((r) => { apply(r); writeLocal([]); }).catch(() => {});
  }, [user, ready]);

  const add = useCallback(async (product, qty = 1) => {
    if (product.stock < 1) throw new Error('This item is out of stock');
    if (user) apply(await api.post('/cart/add', { productId: product._id, qty }));
    else {
      const cur = readLocal();
      const line = cur.find((l) => l.product._id === product._id);
      const next = Math.min((line?.qty || 0) + qty, product.stock, 10);
      const out = line ? cur.map((l) => (l === line ? { ...l, qty: next } : l)) : [...cur, { product, qty: next }];
      writeLocal(out); setLines(out);
    }
    setBump((b) => b + 1);
  }, [user]);

  const setQty = useCallback(async (id, qty) => {
    if (user) return apply(await api.patch(`/cart/${id}`, { qty }));
    const out = readLocal().map((l) => (l.product._id === id ? { ...l, qty: Math.max(1, Math.min(qty, l.product.stock, 10)) } : l));
    writeLocal(out); setLines(out);
  }, [user]);

  const remove = useCallback(async (id) => {
    if (user) return apply(await api.del(`/cart/${id}`));
    const out = readLocal().filter((l) => l.product._id !== id);
    writeLocal(out); setLines(out);
  }, [user]);

  const save = useCallback(async (id) => {
    if (user) return apply(await api.post(`/cart/${id}/save`));
    const line = readLocal().find((l) => l.product._id === id);
    if (line) { setSaved((s) => [...s.filter((x) => x.product._id !== id), line]); await remove(id); }
  }, [user, remove]);

  const moveToCart = useCallback(async (id) => {
    if (user) return apply(await api.post(`/cart/${id}/move`));
    const line = saved.find((l) => l.product._id === id);
    if (line) { setSaved((s) => s.filter((x) => x.product._id !== id)); await add(line.product, line.qty); }
  }, [user, saved, add]);

  const removeSaved = useCallback(async (id) => {
    if (user) return apply(await api.del(`/cart/saved/${id}`));
    setSaved((s) => s.filter((x) => x.product._id !== id));
  }, [user]);

  const reload = useCallback(async () => { if (user) apply(await api.get('/cart')); }, [user]);

  const value = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    return { lines, saved, count: lines.reduce((s, l) => s + l.qty, 0), subtotal, bump, add, setQty, remove, save, moveToCart, removeSaved, reload };
  }, [lines, saved, bump, add, setQty, remove, save, moveToCart, removeSaved, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
