import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, ShoppingCart, Menu, MapPin, ChevronDown, ArrowUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Drawer } from './ui';
import { api } from '../lib/api';
import { useDebounced, useFetch } from '../lib/hooks';

function SearchBar() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const dq = useDebounced(q, 300);
  const reduce = useReducedMotion();
  const { data: meta } = useFetch(() => api.get('/products/meta'), []);

  useEffect(() => {
    if (dq.trim().length < 2) return setList([]);
    let live = true;
    api.get(`/products/suggest?q=${encodeURIComponent(dq)}`).then((r) => live && setList(r)).catch(() => {});
    return () => { live = false; };
  }, [dq]);

  const go = (term) => { setOpen(false); nav(`/search?q=${encodeURIComponent(term)}${cat !== 'All' ? `&category=${encodeURIComponent(cat)}` : ''}`); };
  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); go(q); }}>
      <select aria-label="Search category" value={cat} onChange={(e) => setCat(e.target.value)}>
        <option>All</option>{meta?.categories?.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input value={q} placeholder="Search Orvixa" aria-label="Search" autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      <button className="go" type="submit" aria-label="Search"><Search size={20} /></button>
      <AnimatePresence>
        {open && list.length > 0 && (
          <motion.ul className="suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
            {list.map((s, i) => (
              <motion.li key={s._id} initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <button type="button" onMouseDown={() => go(s.title)}><Search size={14} /> {s.title} <span className="muted small">in {s.category}</span></button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { count, bump } = useCart();
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [compact, setCompact] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { data: meta } = useFetch(() => api.get('/products/meta'), []);
  const reduce = useReducedMotion();
  const first = user?.name?.split(' ')[0] || user?.email?.split('@')[0];
  const pin = user?.addresses?.find((a) => a.isDefault)?.pincode;

  useEffect(() => { const on = () => setCompact(window.scrollY > 60); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  useEffect(() => { setMenu(false); setDrawer(false); }, [loc.pathname]);

  return (
    <header className={`header ${compact ? 'compact' : ''}`}>
      <div className="hdr-top">
        <Link to="/" className="logo" aria-label="Orvixa home">orvixa<b>.</b></Link>
        <Link to={user ? '/account/addresses' : '/login'} className="hdr-link pincode-chip"><span className="small muted" style={{ color: '#ccc' }}>Deliver to</span><strong><MapPin size={14} /> {pin || 'Select pincode'}</strong></Link>
        <SearchBar />
        <div style={{ position: 'relative' }} onMouseLeave={() => setMenu(false)}>
          <button className="hdr-link" aria-haspopup="menu" aria-expanded={menu} onMouseEnter={() => setMenu(true)} onClick={() => setMenu((m) => !m)}>
            <span>Hello, {first || 'sign in'}</span><strong>Account &amp; Lists <ChevronDown size={12} /></strong>
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div className="menu" role="menu" initial={reduce ? false : { opacity: 0, scale: .96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} transition={{ duration: .15 }}>
                {user ? <>
                  <Link to="/account">Your Account</Link><Link to="/orders">Your Orders</Link><Link to="/wishlist">Your Wishlist</Link>
                  {isAdmin && <Link to="/admin">Admin dashboard</Link>}
                  <button onClick={() => { logout(); nav('/'); }}>Sign out</button>
                </> : <>
                  <button className="btn btn-cart" style={{ color: '#111', width: '100%', textAlign: 'center', display: 'block' }} onClick={() => nav('/login')}>Sign in</button>
                  <div className="small muted" style={{ marginTop: 8 }}>New customer? <Link to="/login?mode=register">Start here.</Link></div>
                </>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link to="/orders" className="hdr-link"><span>Returns</span><strong>&amp; Orders</strong></Link>
        <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
          <ShoppingCart id="cart-icon" size={32} />
          <span key={bump} className={`cart-badge ${bump ? 'bounce' : ''}`}>{count}</span>
          <span>Cart</span>
        </Link>
      </div>
      <nav className="subnav" aria-label="Main">
        <button onClick={() => setDrawer(true)}><Menu size={18} /> All</button>
        <NavLink to="/deals">Today&apos;s Deals</NavLink>
        <NavLink to="/search?section=bestsellers">Best Sellers</NavLink>
        <NavLink to="/search?category=Electronics">Electronics</NavLink>
        <NavLink to="/search?sort=newest">New Arrivals</NavLink>
        <NavLink to="/help">Customer Service</NavLink>
      </nav>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={`Hello, ${first || 'sign in'}`}>
        <strong>Shop by department</strong>
        {meta?.categories?.map((c) => <Link key={c} to={`/search?category=${encodeURIComponent(c)}`}>{c}</Link>)}
        <strong style={{ display: 'block', marginTop: 16 }}>Help &amp; settings</strong>
        <Link to="/account">Your Account</Link><Link to="/help">Customer Service</Link>
        {user ? <button className="linkbtn dlink" onClick={() => { logout(); setDrawer(false); nav('/'); }}>Sign out</button> : <Link to="/login">Sign in</Link>}
      </Drawer>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={14} /> Back to top</button>
      <div className="foot-cols">
        <div><h4>Get to Know Us</h4><Link to="/contact">Contact Us</Link><Link to="/page/terms">Terms &amp; Conditions</Link><Link to="/page/privacy">Privacy Policy</Link></div>
        <div><h4>Shop with Us</h4><Link to="/account">Your Account</Link><Link to="/orders">Your Orders</Link><Link to="/wishlist">Wishlist</Link></div>
        <div><h4>Policies</h4><Link to="/page/refund">Refund &amp; Returns</Link><Link to="/page/shipping">Shipping Policy</Link></div>
        <div><h4>Let Us Help You</h4><Link to="/help">Customer Service</Link><Link to="/deals">Today&apos;s Deals</Link><Link to="/contact">Contact Us</Link></div>
      </div>
      <div className="foot-bottom">© {new Date().getFullYear()} Orvixa. All rights reserved.</div>
    </footer>
  );
}
