import { useRef, useState, Component } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, StarHalf, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFocusTrap } from "../lib/hooks";
import { inr } from "../lib/api";

export function Button({
  variant = "secondary",
  className = "",
  children,
  loading,
  ...p
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      whileTap={reduce || p.disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`btn btn-${variant} ${className}`}
      disabled={p.disabled || loading}
      {...p}
    >
      {loading ? "Please wait…" : children}
    </motion.button>
  );
}

export function StarRating({ value = 0, count, size = 16 }) {
  const full = Math.floor(value),
    half = value - full >= 0.5;
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < full) return <Star key={i} size={size} fill="currentColor" />;
        if (i === full && half)
          return <StarHalf key={i} size={size} fill="currentColor" />;
        return <Star key={i} size={size} className="empty" />;
      })}
      {count !== undefined && (
        <span className="count">{count.toLocaleString("en-IN")}</span>
      )}
    </span>
  );
}

export function PriceBlock({ price, mrp, large }) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className={`price-block ${large ? "large" : ""}`}>
      {off > 0 && <span className="off">-{off}%</span>}
      <span className="price">
        <sup>₹</sup>
        {Number(price).toLocaleString("en-IN")}
      </span>
      {off > 0 && (
        <span className="mrp">
          M.R.P.: <s>{inr(mrp)}</s>
        </span>
      )}
    </div>
  );
}

export const Badge = ({ children, tone = "red" }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);
export const Skeleton = ({ h = 16, w = "100%", r = 6, style }) => (
  <div
    className="skeleton"
    style={{ height: h, width: w, borderRadius: r, ...style }}
    aria-hidden
  />
);

export function Reveal({ children, delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Modal({ open, onClose, title, children }) {
  const ref = useFocusTrap(open, onClose);
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="modal"
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, side = "left", children }) {
  const ref = useFocusTrap(open, onClose);
  const reduce = useReducedMotion();
  const off = side === "left" ? "-100%" : side === "bottom" ? "100%" : "100%";
  const axis = side === "bottom" ? { y: off } : { x: off };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.aside
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`drawer drawer-${side}`}
            initial={reduce ? { opacity: 0 } : axis}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : axis}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <strong>{title}</strong>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LazyImg({
  src,
  alt,
  w = 400,
  h = 400,
  className = "",
  imgRef,
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`lazy ${loaded ? "in" : ""} ${className}`}
    />
  );
}

export function Carousel({ title, children, link }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (el)
      setEdge({
        start: el.scrollLeft < 8,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
      });
  };
  const go = (d) =>
    ref.current?.scrollBy({
      left: d * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  return (
    <section className="card carousel-card">
      <div className="row between">
        <h2>{title}</h2>
        {link}
      </div>
      <div className="carousel">
        {!edge.start && (
          <button
            className="car-arrow left"
            onClick={() => go(-1)}
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
        )}
        <div className="car-track" ref={ref} onScroll={update} tabIndex={0}>
          {children}
        </div>
        {!edge.end && (
          <button
            className="car-arrow right"
            onClick={() => go(1)}
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </section>
  );
}

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card center-box" role="alert">
        <h2>Something went wrong</h2>
        <p className="muted">
          This part of the page failed to load. Your cart and account are safe.
        </p>
        <Button variant="cart" onClick={() => this.setState({ error: null })}>
          Try again
        </Button>
      </div>
    );
  }
}

export function Empty({ title, text, action }) {
  return (
    <div className="card center-box empty-state">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
        <circle cx="48" cy="48" r="44" fill="#f0f2f2" />
        <path
          d="M28 36h6l6 24h22l5-17H38"
          fill="none"
          stroke="#565959"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="44" cy="68" r="3" fill="#565959" />
        <circle cx="60" cy="68" r="3" fill="#565959" />
      </svg>
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function Confetti() {
  const bits = Array.from({ length: 44 }, (_, i) => i);
  const colors = ["#ffa41c", "#ffd814", "#007185", "#b12704", "#007600"];
  return (
    <div className="confetti" aria-hidden>
      {bits.map((i) => (
        <span
          key={i}
          style={{
            "--x": `${(Math.random() - 0.5) * 520}px`,
            "--y": `${-80 - Math.random() * 280}px`,
            "--r": `${Math.random() * 720}deg`,
            background: colors[i % 5],
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedTick({ size = 72 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      aria-hidden
      className="tick"
    >
      <circle cx="26" cy="26" r="24" fill="#007600" />
      <path
        d="M14 27l8 8 16-17"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="40"
        style={{ animation: "draw .5s .15s var(--ease-out) both" }}
      />
    </svg>
  );
}
