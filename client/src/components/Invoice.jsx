import { inr } from '../lib/api';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Invoice({ order: o, email }) {
  const no = 'INV-' + o._id.slice(-8).toUpperCase();
  const paid = o.payment.status === 'Paid';
  const a = o.address;
  return (
    <article className="invoice-sheet" aria-label={`Invoice ${no}`}>
      {paid && <div className="inv-stamp" aria-hidden="true">PAID</div>}

      <header className="inv-head">
        <div className="inv-brand">
          <span className="inv-logo">orvixa<b>.</b></span>
          <small>Everything. One Place.</small>
          <p>Sold by [COMPANY NAME]<br />[ADDRESS] · GSTIN [GSTIN]</p>
        </div>
        <div className="inv-title">
          <h2>Tax invoice</h2>
          <dl>
            <div><dt>Invoice no.</dt><dd>{no}</dd></div>
            <div><dt>Invoice date</dt><dd>{fmt(o.createdAt)}</dd></div>
            <div><dt>Order no.</dt><dd>#{o._id.slice(-8).toUpperCase()}</dd></div>
            <div><dt>Order status</dt><dd>{o.status}</dd></div>
          </dl>
        </div>
      </header>

      <section className="inv-meta">
        <div><h3>Billed to</h3><p><b>{a.name}</b><br />{email}<br />{a.phone}</p></div>
        <div><h3>Ship to</h3><p>{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.city}, {a.state} {a.pincode}</p></div>
        <div><h3>Payment</h3><p>{o.payment.method === 'COD' ? 'Cash on Delivery' : o.payment.method}<br />{paid ? 'Paid' : 'Due on delivery'}{o.couponCode && <><br />Coupon {o.couponCode}</>}</p></div>
      </section>

      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead><tr><th>#</th><th>Item</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr></thead>
          <tbody>
            {o.items.map((i, k) => (
              <tr key={i.product}><td>{k + 1}</td><td>{i.title}</td><td className="r">{i.qty}</td><td className="r">{inr(i.price)}</td><td className="r">{inr(i.price * i.qty)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inv-bottom">
        <div className="inv-notes">
          <h3>Notes</h3>
          <p>GST at 18% is included in the item prices.</p>
          <p>Returns are accepted within 7 days of delivery. See our Refund &amp; Return Policy.</p>
          <p>Questions? [support@yourdomain.com] · [PHONE NUMBER]</p>
        </div>
        <dl className="inv-totals">
          <div><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
          {o.discount > 0 && <div><dt>Discount</dt><dd>− {inr(o.discount)}</dd></div>}
          <div><dt>Delivery</dt><dd>{o.delivery ? inr(o.delivery) : 'FREE'}</dd></div>
          <div className="muted"><dt>GST included (18%)</dt><dd>{inr(o.gst)}</dd></div>
          <div className="grand"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
        </dl>
      </div>

      <footer className="inv-foot">Thank you for shopping with Orvixa. This is a computer-generated invoice and needs no signature.</footer>
    </article>
  );
}