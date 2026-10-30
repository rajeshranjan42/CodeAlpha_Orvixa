import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { api, imgUrl, inr } from "../lib/api";
import { useFetch } from "../lib/hooks";
import { Button, Empty, Modal, Skeleton } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";

export const pillTone = (s) =>
  s === "Delivered"
    ? "green"
    : s === "Cancelled" || s === "Returned"
      ? "red"
      : "orange";
export const Pill = ({ s }) => (
  <span className={`pill ${pillTone(s)}`}>{s}</span>
);
const TABS = ["Orders", "Buy Again", "Cancelled"];

export default function Orders() {
  const { data, loading, reload } = useFetch(() => api.get("/orders"), []);
  const [tab, setTab] = useState("Orders");
  const [confirm, setConfirm] = useState(null); // {kind, order}
  const toast = useToast();
  const nav = useNavigate();
  const { add } = useCart();
  const orders = data?.orders || [];
  const shown = orders.filter((o) =>
    tab === "Cancelled"
      ? ["Cancelled", "Returned"].includes(o.status)
      : !["Cancelled", "Returned"].includes(o.status),
  );
  const buyAgainItems = [
    ...new Map(
      orders.flatMap((o) => o.items).map((i) => [String(i.product), i]),
    ).values(),
  ];

  const run = async () => {
    try {
      await api.post(`/orders/${confirm.order._id}/${confirm.kind}`);
      toast(confirm.kind === "cancel" ? "Order cancelled" : "Return requested");
      setConfirm(null);
      reload();
    } catch (e) {
      toast(e.message, "error");
      setConfirm(null);
    }
  };
  const again = async (i) => {
    try {
      const { product } = await api.get(`/products/${i.product}`);
      await add(product, 1);
      toast("Added to cart");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <Helmet>
        <title>Your Orders — Orvixa</title>
      </Helmet>
      <h1>Your Orders</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
            {tab === t && (
              <motion.i
                layoutId="ul"
                className="ul"
                style={{ left: 0, right: 0 }}
              />
            )}
          </button>
        ))}
      </div>
      {loading && <Skeleton h={160} />}
      {!loading && tab !== "Buy Again" && shown.length === 0 && (
        <Empty
          title={
            tab === "Cancelled"
              ? "No cancelled orders"
              : "You haven't placed any orders yet"
          }
          action={
            <Link className="btn btn-cart" to="/">
              Start shopping
            </Link>
          }
        />
      )}
      {tab === "Buy Again" &&
        (buyAgainItems.length
          ? buyAgainItems.map((i) => (
              <div key={i.product} className="card row">
                <img
                  src={imgUrl(i.image)}
                  alt=""
                  width="80"
                  height="80"
                  style={{ borderRadius: 6 }}
                />
                <span style={{ flex: 1 }}>{i.title}</span>
                <Button variant="cart" onClick={() => again(i)}>
                  Buy it again
                </Button>
              </div>
            ))
          : !loading && <Empty title="Nothing to buy again yet" />)}
      {tab !== "Buy Again" && (
        <AnimatePresence>
          {shown.map((o) => (
            <motion.div
              key={o._id}
              layout
              className="order-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="order-head">
                <div>
                  ORDER PLACED
                  <strong>
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </strong>
                </div>
                <div>
                  TOTAL<strong>{inr(o.total)}</strong>
                </div>
                <div>
                  SHIP TO<strong>{o.address.name}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  ORDER # {o._id.slice(-8).toUpperCase()}
                  <strong>
                    <button
                      className="linkbtn"
                      onClick={() =>
                        window.open(`/orders/${o._id}?invoice=1`, "_blank")
                      }
                    >
                      View invoice
                    </button>
                  </strong>
                </div>
              </div>
              <div className="order-body">
                <div>
                  <Pill s={o.status} />
                  {o.items.map((i) => (
                    <div
                      key={i.product}
                      className="row"
                      style={{ marginTop: 10 }}
                    >
                      <img
                        src={imgUrl(i.image)}
                        alt=""
                        width="72"
                        height="72"
                        style={{ borderRadius: 6 }}
                      />
                      <Link to={`/product/${i.product}`}>{i.title}</Link>
                    </div>
                  ))}
                </div>
                <div
                  className="col"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minWidth: 190,
                  }}
                >
                  <Button
                    variant="cart"
                    onClick={() => nav(`/orders/${o._id}`)}
                  >
                    Track package
                  </Button>
                  {o.canReturn && (
                    <Button
                      onClick={() => setConfirm({ kind: "return", order: o })}
                    >
                      Return items
                    </Button>
                  )}
                  {o.canCancel && (
                    <Button
                      className="btn-danger"
                      onClick={() => setConfirm({ kind: "cancel", order: o })}
                    >
                      Cancel order
                    </Button>
                  )}
                  {o.status === "Delivered" && (
                    <Button
                      onClick={() =>
                        nav(`/product/${o.items[0].product}#reviews`)
                      }
                    >
                      Write a review
                    </Button>
                  )}
                  <Button onClick={() => again(o.items[0])}>
                    Buy it again
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === "cancel"
            ? "Cancel this order?"
            : "Return these items?"
        }
      >
        <p>
          {confirm?.kind === "cancel"
            ? "Your items will be restocked and your order moved to Cancelled."
            : "We will arrange a pickup and refund after inspection."}
        </p>
        <div className="row">
          <Button onClick={() => setConfirm(null)}>Keep order</Button>
          <Button variant="buy" onClick={run}>
            {confirm?.kind === "cancel" ? "Yes, cancel" : "Yes, return"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
