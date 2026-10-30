import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShieldCheck, Truck } from "lucide-react";
import { api, imgUrl } from "../lib/api";
import { useFetch } from "../lib/hooks";
import {
  Button,
  Carousel,
  Reveal,
  Skeleton,
  PriceBlock,
  StarRating,
  LazyImg,
} from "../components/ui";
import ProductCard, {
  AddToCartButton,
  HeartButton,
} from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const RV = "orvixa-recent";
const recent = () => {
  try {
    return JSON.parse(localStorage.getItem(RV)) || [];
  } catch {
    return [];
  }
};

function Gallery({ images, title }) {
  const [i, setI] = useState(0);
  const [pos, setPos] = useState("50% 50%");
  return (
    <div className="gallery">
      <div className="thumbs">
        {images.map((s, k) => (
          <button
            key={k}
            aria-current={k === i}
            aria-label={`Image ${k + 1}`}
            onMouseEnter={() => setI(k)}
            onClick={() => setI(k)}
          >
            <img src={imgUrl(s)} alt="" width="56" height="56" />
          </button>
        ))}
      </div>
      <div
        className="mainimg"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos(
            `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
          );
        }}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={i}
            src={imgUrl(images[i])}
            alt={title}
            width="600"
            height="600"
            style={{ transformOrigin: pos }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function Reviews({ product, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { data, reload } = useFetch(
    () => api.get(`/reviews/${product._id}`),
    [product._id],
  );
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [err, setErr] = useState("");
  const max = Math.max(1, ...(data?.histogram.map((h) => h.count) || [1]));
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.rating < 1 || form.rating > 5)
      return setErr("Rating must be between 1 and 5");
    try {
      await api.post(`/reviews/${product._id}`, form);
      toast("Review posted");
      setForm({ rating: 5, title: "", body: "" });
      reload();
      onChange();
    } catch (x) {
      setErr(x.message);
    }
  };
  return (
    <section
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px,320px) 1fr",
        gap: 32,
      }}
    >
      <div>
        <h2>Customer reviews</h2>
        <StarRating value={product.rating} size={20} />{" "}
        <b>{product.rating} out of 5</b>
        <div className="muted small">{product.numReviews} ratings</div>
        {data?.histogram.map((h) => (
          <div className="hist-row" key={h.stars}>
            <span>{h.stars} star</span>
            <div className="hist-track">
              <motion.div
                className="hist-fill"
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: h.count / max }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="muted">{h.count}</span>
          </div>
        ))}
        <h3 style={{ marginTop: 20 }}>Review this product</h3>
        {user ? (
          <form onSubmit={submit}>
            {err && (
              <div className="alert err" role="alert">
                {err}
              </div>
            )}
            <label>
              Rating{" "}
              <select
                className="sel"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: +e.target.value })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <input
              className="inp"
              style={{ margin: "8px 0" }}
              placeholder="Headline"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="inp"
              placeholder="Write your review"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <Button variant="cart" type="submit" style={{ marginTop: 8 }}>
              Submit review
            </Button>
          </form>
        ) : (
          <Link
            to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`}
          >
            Sign in to write a review
          </Link>
        )}
      </div>
      <div>
        {data?.reviews.length === 0 && (
          <p className="muted">
            No reviews yet. Be the first to share your experience.
          </p>
        )}
        {data?.reviews.map((r) => (
          <Reveal key={r._id}>
            <div style={{ marginBottom: 18 }}>
              <b>{r.userName}</b>{" "}
              {r.verified && (
                <span className="badge badge-orange">Verified Purchase</span>
              )}
              <div>
                <StarRating value={r.rating} /> <b>{r.title}</b>
              </div>
              <div className="muted small">
                {new Date(r.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "long",
                })}
              </div>
              <p>{r.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const imgRef = useRef(null);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/products/${id}`),
    [id],
  );
  const { data: rv } = useFetch(async () => {
    const ids = recent().filter((x) => x !== id);
    return ids.length ? api.get(`/products/by-ids?ids=${ids.join(",")}`) : [];
  }, [id]);
  useEffect(() => {
    setQty(1);
    try {
      localStorage.setItem(
        RV,
        JSON.stringify([id, ...recent().filter((x) => x !== id)].slice(0, 10)),
      );
    } catch {
      /* ignore */
    }
  }, [id]);

  if (error)
    return (
      <div className="container">
        <div className="card center-box">
          <h2>Product not found</h2>
          <Link to="/">Back to home</Link>
        </div>
      </div>
    );
  if (loading)
    return (
      <div className="container">
        <div className="pdp">
          <Skeleton h={420} />
          <Skeleton h={420} />
          <Skeleton h={300} />
        </div>
      </div>
    );
  const { product: p, related } = data;
  const out = p.stock < 1;
  const maxQty = Math.min(p.stock, 10);
  const delivery = new Date(Date.now() + 4 * 864e5).toLocaleDateString(
    "en-IN",
    { weekday: "long", day: "numeric", month: "long" },
  );
  const buyNow = async () => {
    try {
      await add(p, qty);
      nav("/checkout");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="container">
      <Helmet>
        <title>{p.title} — Orvixa</title>
        <meta name="description" content={p.description} />
        <meta property="og:title" content={p.title} />
        <meta property="og:image" content={p.images[0]} />
      </Helmet>
      <div className="muted small" style={{ marginBottom: 8 }}>
        <Link to={`/search?category=${encodeURIComponent(p.category)}`}>
          {p.category}
        </Link>
      </div>
      <div className="card pdp">
        <div style={{ position: "relative" }}>
          <Gallery images={p.images} title={p.title} />
          <HeartButton id={p._id} />
        </div>
        <div>
          <h1 style={{ fontSize: 24 }}>{p.title}</h1>
          <Link to={`/search?brand=${encodeURIComponent(p.brand)}`}>
            Visit the {p.brand} Store
          </Link>
          <div>
            <StarRating value={p.rating} count={p.numReviews} size={18} />
          </div>
          <hr />
          <PriceBlock price={p.price} mrp={p.mrp} large />
          <div className="muted small">Inclusive of all taxes</div>
          <h3 style={{ marginTop: 16 }}>About this item</h3>
          <ul>
            {p.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="muted">{p.description}</p>
        </div>
        <aside className="buybox" aria-label="Buy box">
          <PriceBlock price={p.price} mrp={p.mrp} large />
          <div className="small">
            <Truck size={14} /> FREE delivery <b>{delivery}</b>
          </div>
          {out ? (
            <div className="red" style={{ fontSize: 18 }}>
              Currently unavailable
            </div>
          ) : (
            <div className="green" style={{ fontSize: 18 }}>
              {p.stock <= p.lowStockAt ? (
                <span className="red">Only {p.stock} left in stock</span>
              ) : (
                "In stock"
              )}
            </div>
          )}
          {!out && (
            <label>
              Quantity:{" "}
              <select
                className="sel"
                value={qty}
                onChange={(e) => setQty(+e.target.value)}
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          <AddToCartButton
            product={p}
            qty={qty}
            className="btn-block"
            imgRef={imgRef}
          />
          <Button
            variant="buy"
            className="btn-block"
            disabled={out}
            onClick={buyNow}
          >
            Buy Now
          </Button>
          <div className="muted small">
            <ShieldCheck size={14} /> Secure transaction
          </div>
        </aside>
      </div>
      <div className="mobile-bar">
        <AddToCartButton
          product={p}
          qty={qty}
          className="btn-block"
          label="Add to Cart"
        />
        <Button variant="buy" disabled={out} onClick={buyNow}>
          Buy Now
        </Button>
      </div>
      {related.length > 0 && (
        <Reveal>
          <Carousel title="Customers also viewed">
            {related.map((r) => (
              <ProductCard key={r._id} product={r} />
            ))}
          </Carousel>
        </Reveal>
      )}
      {rv?.length > 0 && (
        <Reveal>
          <Carousel title="Recently viewed">
            {rv.map((r) => (
              <ProductCard key={r._id} product={r} />
            ))}
          </Carousel>
        </Reveal>
      )}
      <Reviews product={p} onChange={reload} />
    </div>
  );
}
