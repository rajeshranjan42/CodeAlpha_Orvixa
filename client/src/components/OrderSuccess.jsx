import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Check, MapPin, CreditCard, Truck, FileText, ShoppingBag } from 'lucide-react';
import { Confetti, AnimatedTick, Button } from './ui';
import { imgUrl, inr } from '../lib/api';

const STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'];

export default function OrderSuccess({ order: o, name, onTrack, onInvoice }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const no = o._id.slice(-8).toUpperCase();
  const eta = new Date(new Date(o.createdAt).getTime() + 4 * 864e5).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const first = (name || '').split(' ')[0];

  const copy = async () => {
    try { await navigator.clipboard.writeText(no); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };
  const rise = (i) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] } });

  return (
    <div className="container">
      <Confetti />
      <motion.div className="success" initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="success-hero">
          <AnimatedTick size={88} />
          <h1>Thank you{first ? `, ${first}` : ''}!</h1>
          <p>Your order is confirmed. We&apos;ll start packing it right away.</p>
          <div className="order-chip">
            <span>Order number</span>
            <b>#{no}</b>
            <button type="button" onClick={copy} aria-label="Copy order number">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          </div>
        </div>

        <div className="success-body">
          <motion.ol className="success-steps" aria-label="Order progress" {...rise(0)}>
            {STEPS.map((s, i) => (
              <li key={s} className={i === 0 ? 'done' : ''}>
                <span>{i === 0 ? <Check size={14} /> : i + 1}</span>{s}
              </li>
            ))}
          </motion.ol>

          <div className="success-grid">
            <motion.section {...rise(1)}>
              <h2>Your items</h2>
              <ul className="success-items">
                {o.items.map((i) => (
                  <li key={i.product}>
                    <img src={imgUrl(i.image)} alt="" width="64" height="64" />
                    <div><b className="clamp2">{i.title}</b><span className="muted small">Qty {i.qty} · {inr(i.price)} each</span></div>
                    <strong>{inr(i.price * i.qty)}</strong>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.aside {...rise(2)}>
              <h2>Summary</h2>
              <dl className="success-sum">
                <div><dt>Items</dt><dd>{inr(o.subtotal)}</dd></div>
                {o.discount > 0 && <div className="green"><dt>Discount{o.couponCode ? ` (${o.couponCode})` : ''}</dt><dd>− {inr(o.discount)}</dd></div>}
                <div><dt>Delivery</dt><dd>{o.delivery ? inr(o.delivery) : 'FREE'}</dd></div>
                <div className="muted"><dt>GST (included)</dt><dd>{inr(o.gst)}</dd></div>
                <div className="total"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
              </dl>
              <ul className="success-info">
                <li><Truck size={18} /><span><b>Arriving by {eta}</b></span></li>
                <li><MapPin size={18} /><span>{o.address.name}, {o.address.line1}{o.address.line2 && `, ${o.address.line2}`}, {o.address.city}, {o.address.state} {o.address.pincode}</span></li>
                <li><CreditCard size={18} /><span>{o.payment.method === 'COD' ? 'Cash on Delivery' : o.payment.method} · {o.payment.status}</span></li>
              </ul>
            </motion.aside>
          </div>

          <motion.div className="success-actions" {...rise(3)}>
            <Button variant="buy" onClick={onTrack}><Truck size={16} /> Track order</Button>
            <Button onClick={onInvoice}><FileText size={16} /> View invoice</Button>
            <Link className="btn" to="/"><ShoppingBag size={16} /> Continue shopping</Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}