import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
export const useWishlist = () => useContext(Ctx);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return setItems([]);
    api.get('/wishlist').then((r) => setItems(r.items)).catch(() => {});
  }, [user]);

  const has = useCallback((id) => items.some((p) => p._id === id), [items]);
  const toggle = useCallback(async (id) => {
    if (!user) return nav(`/login?returnUrl=${encodeURIComponent(loc.pathname + loc.search)}`);
    const r = has(id) ? await api.del(`/wishlist/${id}`) : await api.post(`/wishlist/${id}`);
    setItems(r.items);
  }, [user, has, nav, loc]);
  const remove = useCallback(async (id) => setItems((await api.del(`/wishlist/${id}`)).items), []);

  return <Ctx.Provider value={{ items, has, toggle, remove }}>{children}</Ctx.Provider>;
}
