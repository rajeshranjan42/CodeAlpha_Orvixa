import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { Printer, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { Skeleton, Button } from '../components/ui';
import Invoice from '../components/Invoice';
import { useAuth } from '../context/AuthContext';
import { Pill } from './Orders';

const FLOW = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export default function Tracking() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const invoiceOnly = !!sp.get('invoice');
  const { data, loading, error } = useFetch(() => api.get(`/orders/${id}`), [id]);
  useEffect(() => { if (invoiceOnly && data) { const t = setTimeout(() => window.print(), 500); return () => clearTimeout(t); } }, [data, invoiceOnly]);

  if (loading) return <div className="container"><Skeleton h={300} /></div>;
  if (error) return <div className="container"><div className="alert err">{error.message}</div><Link to="/orders">Back to orders</Link></div>;
  const o = data.order;
  const idx = FLOW.indexOf(o.status);
  const dead = idx === -1; // cancelled / returned
  const reached = (s) => (dead ? o.history.some((h) => h.status === s) : FLOW.indexOf(s) <= idx);
  const pct = dead ? 0 : idx / (FLOW.length - 1);

  const bar = (
    <div className="inv-bar no-print">
      <Link to="/orders" className="btn btn-ghost"><ArrowLeft size={16} /> Your orders</Link>
      <Button variant="buy" onClick={() => window.print()}><Printer size={16} /> Print / Save as PDF</Button>
    </div>
  );

  if (invoiceOnly) {
    return (
      <div className="container invoice-page">
        <Helmet><title>Invoice — Orvixa</title></Helmet>
        {bar}
        <Invoice order={o} email={user?.email} />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <Helmet><title>Track order — Orvixa</title></Helmet>
      <Link to="/orders" className="no-print">‹ Your orders</Link>
      <div className="card no-print">
        <div className="row between"><h1>Order #{o._id.slice(-8).toUpperCase()}</h1><Pill s={o.status} /></div>
        <div className="timeline">
          <div className="tl-line"><motion.div className="tl-fill" initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: pct }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} /></div>
          {(dead ? [...o.history.map((h) => h.status)] : FLOW).map((s) => (
            <div key={s} className={`tl-step ${reached(s) ? 'done' : ''} ${o.status === s ? 'current' : ''}`}><span className="tl-dot" /><b>{s}</b>
              <div className="small muted">{o.history.find((h) => h.status === s) ? new Date(o.history.find((h) => h.status === s).at).toLocaleString('en-IN') : 'Pending'}</div></div>
          ))}
        </div>
      </div>
      <div className="inv-bar no-print"><h2 style={{ margin: 0 }}>Invoice</h2><Button onClick={() => window.print()}><Printer size={16} /> Print / Save as PDF</Button></div>
      <Invoice order={o} email={user?.email} />
    </div>
  );
}