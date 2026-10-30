import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button, Empty } from '../components/ui';
import OrderSuccess from '../components/OrderSuccess';
import Field from '../components/Field';
import { api, imgUrl, inr, PINCODE_RE } from '../lib/api';

const blank = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };
const STEPS = ['Delivery address', 'Payment', 'Review items'];

export default function Checkout() {
  const { user, setUser } = useAuth();
  const { lines, subtotal, count, reload } = useCart();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [addrId, setAddrId] = useState(user.addresses.find((a) => a.isDefault)?._id || user.addresses[0]?._id || 'new');
  const [form, setForm] = useState(blank);
  const [errs, setErrs] = useState({});
  const [method, setMethod] = useState('UPI');
  const [coupon, setCoupon] = useState(() => { try { return sessionStorage.getItem('orvixa-coupon') || ''; } catch { return ''; } });
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [failNext, setFailNext] = useState(false);
  const [placed, setPlaced] = useState(null);

  useEffect(() => { reload(); }, []); // eslint-disable-line
  useEffect(() => {
    if (!coupon) return setQuote(null);
    api.post('/coupons/apply', { code: coupon }).then(setQuote).catch(() => { setQuote(null); setCoupon(''); });
  }, [coupon, subtotal]);

  const discount = quote?.discount || 0;
  const delivery = subtotal - discount >= 499 ? 0 : 40;
  const gst = Math.round(((subtotal - discount) * 18) / 118);
  const total = subtotal - discount + delivery;
  const outOfStock = lines.filter((l) => l.product.stock < l.qty);
  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n); };

  const validateAddr = () => {
    if (addrId !== 'new') return true;
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a 10-digit mobile number';
    if (!form.line1.trim()) e.line1 = 'Enter your address';
    if (!form.city.trim()) e.city = 'Enter your city';
    if (!form.state.trim()) e.state = 'Enter your state';
    if (!PINCODE_RE.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrs(e);
    return !Object.keys(e).length;
  };
  const next0 = async () => {
    if (!validateAddr()) return;
    if (addrId === 'new') {
      try { const r = await api.post('/profile/addresses', form); setUser(r.user); setAddrId(r.user.addresses[r.user.addresses.length - 1]._id); }
      catch (x) { return setErr(x.message); }
    }
    setErr(''); go(1);
  };

  const place = async () => {
    setBusy(true); setErr('');
    const a = user.addresses.find((x) => x._id === addrId) || form;
    const { _id, isDefault, ...address } = a; // eslint-disable-line
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulated gateway latency
      const r = await api.post('/orders', { address, payment: { method, simulateFail: failNext }, couponCode: coupon || undefined });
      try { sessionStorage.removeItem('orvixa-coupon'); } catch { /* ignore */ }
      await reload();
      setPlaced(r.order);
    } catch (x) { setErr(x.message); setFailNext(false); } finally { setBusy(false); }
  };

  if (placed) return (
    <OrderSuccess order={placed} name={user.name} onTrack={() => nav(`/orders/${placed._id}`)} onInvoice={() => nav(`/orders/${placed._id}?invoice=1`)} />
  );
  if (!lines.length) return <div className="container"><Empty title="Your cart is empty" action={<Link className="btn btn-cart" to="/">Continue shopping</Link>} /></div>;

  return (
    <>
      <Helmet><title>Checkout — Orvixa</title></Helmet>
      <div className="checkout-hdr"><Link to="/" className="logo" style={{ color: '#111' }}>orvixa<b>.</b></Link><h2 style={{ margin: 0 }}>Checkout ({count} items)</h2><Lock /></div>
      <div className="container cart-layout">
        <div>
          <div className="steps">{STEPS.map((s, i) => (
            <div key={s} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}><span>{i < step ? <Check size={16} /> : i + 1}</span>{s}</div>))}
          </div>
          {err && <div className="alert err" role="alert">{err}</div>}
          {outOfStock.length > 0 && <div className="alert err" role="alert">{outOfStock.map((l) => l.product.title).join(', ')} is no longer available in the quantity you chose. <Link to="/cart">Update your cart</Link></div>}
          <div className="card" style={{ overflow: 'hidden' }}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }} transition={{ duration: .25 }}>
                {step === 0 && <>
                  <h2>1. Choose a delivery address</h2>
                  {user.addresses.map((a) => (
                    <label key={a._id} className={`choice ${addrId === a._id ? 'sel' : ''}`}><input type="radio" checked={addrId === a._id} onChange={() => setAddrId(a._id)} />
                      <span><b>{a.name}</b> · {a.phone}<br />{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}</span></label>))}
                  <label className={`choice ${addrId === 'new' ? 'sel' : ''}`}><input type="radio" checked={addrId === 'new'} onChange={() => setAddrId('new')} /><b>Add a new address</b></label>
                  {addrId === 'new' && <div style={{ marginTop: 12 }}>
                    {[['name', 'Full name'], ['phone', 'Mobile number'], ['line1', 'Address line 1'], ['line2', 'Address line 2 (optional)'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([k, l]) =>
                      <Field key={k} label={l} value={form[k]} error={errs[k]} inputMode={k === 'phone' || k === 'pincode' ? 'numeric' : undefined} maxLength={k === 'pincode' ? 6 : k === 'phone' ? 10 : undefined} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
                  </div>}
                  <Button variant="cart" onClick={next0}>Deliver to this address</Button>
                </>}
                {step === 1 && <>
                  <h2>2. Payment method</h2>
                  {[['UPI', 'UPI', 'Pay with any UPI app'], ['Card', 'Credit / Debit card', 'Visa, Mastercard, RuPay'], ['COD', 'Cash on Delivery', 'Pay when your order arrives']].map(([v, t, d]) => (
                    <label key={v} className={`choice ${method === v ? 'sel' : ''}`}><input type="radio" checked={method === v} onChange={() => setMethod(v)} /><span><b>{t}</b><br /><span className="muted small">{d}</span></span></label>))}
                  <div className="muted small">Payments are simulated in this demo — no real charge is made.</div>
                  <label className="small"><input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} /> Simulate a payment failure (for testing)</label>
                  <div className="row" style={{ marginTop: 12 }}><Button onClick={() => go(0)}>Back</Button><Button variant="cart" onClick={() => go(2)}>Use this payment method</Button></div>
                </>}
                {step === 2 && <>
                  <h2>3. Review items</h2>
                  {lines.map((l) => <div key={l.product._id} className="row" style={{ marginBottom: 10 }}><img src={imgUrl(l.product.images[0])} alt="" width="64" height="64" style={{ borderRadius: 6 }} /><div style={{ flex: 1 }}>{l.product.title}<div className="muted small">Qty {l.qty}</div></div><b>{inr(l.product.price * l.qty)}</b></div>)}
                  <div className="row"><Button onClick={() => go(1)}>Back</Button></div>
                </>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <aside className="card summary sticky-sum">
          <Button variant="buy" className="btn-block" loading={busy} disabled={step < 2 || outOfStock.length > 0} onClick={place}>{err && step === 2 ? 'Retry payment' : 'Place your order'}</Button>
          <h3>Order Summary</h3>
          <div className="row"><span>Items:</span><span>{inr(subtotal)}</span></div>
          <div className="row"><span>Delivery:</span><span>{delivery ? inr(delivery) : 'FREE'}</span></div>
          <div className="row muted"><span>GST (incl.):</span><span>{inr(gst)}</span></div>
          {discount > 0 && <div className="row green"><span>Discount ({quote.code}):</span><span>− {inr(discount)}</span></div>}
          <hr style={{ width: '100%' }} />
          <div className="row total"><span>Order Total:</span><span>{inr(total)}</span></div>
        </aside>
      </div>
    </>
  );
}