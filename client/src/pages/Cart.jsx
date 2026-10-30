import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Empty, PriceBlock } from "../components/ui";
import { api, imgUrl, inr } from "../lib/api";

const FREE = 499;

function Flip({ n }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={n}
        className="flip"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
      >
        {n}
      </motion.span>
    </AnimatePresence>
  );
}

function Row({ l, saved }) {
  const { setQty, remove, save, moveToCart, removeSaved } = useCart();
  const toast = useToast();
  const p = l.product;
  const guard = (fn) => async () => {
    try {
      await fn();
    } catch (e) {
      toast(e.message, "error");
    }
  };
  return (
    <motion.div
      layout
      className="cart-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${p._id}`}>
        <img src={imgUrl(p.images[0])} alt={p.title} width="140" height="140" />
      </Link>
      <div>
        <Link to={`/product/${p._id}`}>
          <h3>{p.title}</h3>
        </Link>
        <div className={p.stock < 1 ? "red" : "green"}>
          {p.stock < 1 ? "Out of stock" : "In stock"}
        </div>
        <div className="row wrap" style={{ marginTop: 8 }}>
          {!saved && p.stock > 0 && (
            <label>
              Qty:{" "}
              <select
                className="sel"
                value={l.qty}
                onChange={(e) => guard(() => setQty(p._id, +e.target.value))()}
              >
                {Array.from(
                  { length: Math.min(p.stock, 10) },
                  (_, i) => i + 1,
                ).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          {!saved && (
            <span className="muted">
              Qty <Flip n={l.qty} />
            </span>
          )}
          <div className="links">
            <button
              className="linkbtn"
              onClick={guard(() =>
                saved ? removeSaved(p._id) : remove(p._id),
              )}
            >
              Delete
            </button>
            {saved ? (
              <button
                className="linkbtn"
                onClick={guard(() => moveToCart(p._id))}
              >
                Move to cart
              </button>
            ) : (
              <button className="linkbtn" onClick={guard(() => save(p._id))}>
                Save for later
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <PriceBlock price={p.price} mrp={p.mrp} />
      </div>
    </motion.div>
  );
}

export default function Cart() {
  const { lines, saved, subtotal, count } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [coupon, setCoupon] = useState(null);
  const left = Math.max(0, FREE - subtotal);

  const apply = async () => {
    if (!user) return nav("/login?returnUrl=%2Fcart");
    try {
      const r = await api.post("/coupons/apply", { code });
      setCoupon(r);
      try {
        sessionStorage.setItem("orvixa-coupon", r.code);
      } catch {
        /* ignore */
      }
      setMsg({
        ok: true,
        t: `${r.code} applied — you save ${inr(r.discount)}`,
      });
    } catch (e) {
      setCoupon(null);
      setMsg({ ok: false, t: e.message });
    }
  };
  if (!lines.length && !saved.length)
    return (
      <div className="container">
        <Empty
          title="Your Orvixa Cart is empty"
          text="Add items to see them here."
          action={
            <Link className="btn btn-cart" to="/">
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  const shown = coupon ? subtotal - coupon.discount : subtotal;
  return (
    <div className="container">
      <Helmet>
        <title>Shopping Cart — Orvixa</title>
      </Helmet>
      <div className="cart-layout">
        <div>
          <section className="card">
            <h1>Shopping Cart</h1>
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <Row key={l.product._id} l={l} />
              ))}
            </AnimatePresence>
            {!lines.length && <p className="muted">Your cart is empty.</p>}
            <div style={{ textAlign: "right", fontSize: 18, paddingTop: 12 }}>
              Subtotal ({count} items): <b>{inr(subtotal)}</b>
            </div>
          </section>
          {saved.length > 0 && (
            <section className="card">
              <h2>Saved for later ({saved.length})</h2>
              <AnimatePresence>
                {saved.map((l) => (
                  <Row key={l.product._id} l={l} saved />
                ))}
              </AnimatePresence>
            </section>
          )}
        </div>
        <aside
          className="card summary"
          style={{ position: "sticky", top: 130 }}
        >
          <div className="small">
            {left > 0 ? (
              <>
                Add <b>{inr(left)}</b> more for{" "}
                <b className="green">FREE delivery</b>
              </>
            ) : (
              <b className="green">Your order qualifies for FREE delivery</b>
            )}
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((subtotal / FREE) * 100))}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <i
              style={{ transform: `scaleX(${Math.min(1, subtotal / FREE)})` }}
            />
          </div>
          <div className="row between">
            <span>Subtotal ({count} items)</span>
            <b>{inr(subtotal)}</b>
          </div>
          {coupon && (
            <div className="row between green">
              <span>Coupon {coupon.code}</span>
              <span>− {inr(coupon.discount)}</span>
            </div>
          )}
          <div className="row between">
            <span>Estimated total</span>
            <b>{inr(shown)}</b>
          </div>
          <Button
            variant="buy"
            className="btn-block"
            disabled={!lines.length}
            onClick={() => nav("/checkout")}
          >
            Proceed to Buy
          </Button>
          <hr style={{ width: "100%" }} />
          <label className="small" htmlFor="coupon">
            Have a coupon?
          </label>
          <div className="row">
            <input
              id="coupon"
              className="inp"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
            />
            <Button onClick={apply} disabled={!code}>
              Apply
            </Button>
          </div>
          <AnimatePresence>
            {msg && (
              <motion.div
                key={msg.t}
                className={`coupon-msg ${msg.ok ? "ok" : "err"}`}
                role="status"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {msg.t}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="muted small">
            Try WELCOME10 or FLAT100. Final discount is confirmed at checkout.
          </div>
        </aside>
      </div>
    </div>
  );
}
