import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { api, imgUrl } from "../lib/api";
import { useFetch } from "../lib/hooks";
import {
  Button,
  Drawer,
  Empty,
  LazyImg,
  PriceBlock,
  StarRating,
  Badge,
} from "../components/ui";
import { AddToCartButton, HeartButton } from "../components/ProductCard";
import { useRef } from "react";

function ResultCard({ p }) {
  const ref = useRef(null);
  return (
    <motion.article
      layout
      className="rcard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Link to={`/product/${p._id}`} style={{ position: "relative" }}>
        <LazyImg src={imgUrl(p.images[0])} alt={p.title} imgRef={ref} />
      </Link>
      <div>
        <Link to={`/product/${p._id}`}>
          <h3 className="clamp2" style={{ fontSize: 17 }}>
            {p.title}
          </h3>
        </Link>
        <div className="muted small">by {p.brand}</div>
        <StarRating value={p.rating} count={p.numReviews} />
        <PriceBlock price={p.price} mrp={p.mrp} />
        {p.discount >= 10 && <Badge>{p.discount}% off</Badge>}
        <div className="small" style={{ margin: "6px 0" }}>
          {p.stock < 1 ? (
            <span className="red">Currently unavailable</span>
          ) : (
            <>
              FREE Delivery on orders over ₹499{" "}
              {p.stock <= p.lowStockAt && (
                <span className="red"> · Only {p.stock} left</span>
              )}
            </>
          )}
        </div>
        <AddToCartButton product={p} imgRef={ref} />
      </div>
      <HeartButton id={p._id} />
    </motion.article>
  );
}

function Filters({ params, set, meta, brands }) {
  const [min, setMin] = useState(params.get("minPrice") || "");
  const [max, setMax] = useState(params.get("maxPrice") || "");
  const brandSel = (params.get("brand") || "").split(",").filter(Boolean);
  const toggleBrand = (b) =>
    set({
      brand: (brandSel.includes(b)
        ? brandSel.filter((x) => x !== b)
        : [...brandSel, b]
      ).join(","),
    });
  return (
    <div className="filters">
      <h3>Department</h3>
      <div>
        <button className="linkbtn" onClick={() => set({ category: "" })}>
          All
        </button>
      </div>
      {meta?.categories.map((c) => (
        <div key={c}>
          <button
            className="linkbtn"
            style={{ fontWeight: params.get("category") === c ? 700 : 400 }}
            onClick={() => set({ category: c })}
          >
            {c}
          </button>
        </div>
      ))}
      <h3>Customer Reviews</h3>
      <button
        className="linkbtn"
        onClick={() =>
          set({ minRating: params.get("minRating") === "4" ? "" : "4" })
        }
      >
        <span className="stars">★★★★☆</span> &amp; Up
      </button>
      <h3>Brand</h3>
      {brands?.map((b) => (
        <label key={b}>
          <input
            type="checkbox"
            checked={brandSel.includes(b)}
            onChange={() => toggleBrand(b)}
          />{" "}
          {b}
        </label>
      ))}
      <h3>Price</h3>
      <div className="row">
        <input
          type="number"
          min="0"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          aria-label="Minimum price"
        />
        <input
          type="number"
          min="0"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          aria-label="Maximum price"
        />
        <Button onClick={() => set({ minPrice: min, maxPrice: max })}>
          Go
        </Button>
      </div>
      <h3>Discount</h3>
      {[10, 25, 50].map((d) => (
        <label key={d}>
          <input
            type="radio"
            name="disc"
            checked={params.get("minDiscount") === String(d)}
            onChange={() => set({ minDiscount: String(d) })}
          />{" "}
          {d}% off or more
        </label>
      ))}
    </div>
  );
}

export default function Search({ deals }) {
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const { data: meta } = useFetch(() => api.get("/products/meta"), []);
  const qs = useMemo(() => {
    const p = new URLSearchParams(params);
    if (deals) p.set("section", "deals");
    return p.toString();
  }, [params, deals]);
  const { data, loading, error } = useFetch(
    () => api.get(`/products?${qs}`),
    [qs],
  );

  const set = (patch) => {
    const p = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    p.delete("page");
    setParams(p);
  };
  const chips = [
    "category",
    "brand",
    "minRating",
    "minPrice",
    "maxPrice",
    "minDiscount",
  ].filter((k) => params.get(k));
  const q = params.get("q");
  const section = params.get("section");
  const cat = params.get("category");
  const heading = deals
    ? "Today's Deals"
    : section === "bestsellers"
      ? "Best Sellers"
      : section === "featured"
        ? "Featured"
        : cat && !q
          ? cat
          : params.get("sort") === "newest" && !q
            ? "New Arrivals"
            : null;
  const page = +params.get("page") || 1;
  const from = data ? (page - 1) * 24 + 1 : 0;

  return (
    <div className="container">
      <Helmet>
        <title>{heading || (q ? `Results for ${q}` : "Shop")} — Orvixa</title>
      </Helmet>
      <div className="layout-2">
        <aside className="filters-desktop card">
          <Filters
            params={params}
            set={set}
            meta={meta}
            brands={data?.brands}
          />
        </aside>
        <section>
          <div className="card row between wrap">
            <div>
              {heading && <h2 style={{ margin: 0 }}>{heading}</h2>}
              {data && data.total > 0 ? (
                <span>
                  {from}–{Math.min(from + data.items.length - 1, data.total)} of{" "}
                  {data.total} results
                  {q && (
                    <>
                      {" "}
                      for <b className="red">&quot;{q}&quot;</b>
                    </>
                  )}
                </span>
              ) : (
                !loading && <span>No results</span>
              )}
            </div>
            <div className="row">
              <Button
                className="filters-btn"
                onClick={() => setSheet(true)}
                style={{
                  display: window.innerWidth > 800 ? "none" : "inline-flex",
                }}
              >
                <SlidersHorizontal size={16} /> Filters
              </Button>
              <label>
                Sort by:{" "}
                <select
                  className="sel"
                  value={params.get("sort") || "featured"}
                  onChange={(e) => set({ sort: e.target.value })}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Avg. Customer Review</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </label>
            </div>
          </div>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            <AnimatePresence>
              {chips.map((k) => (
                <motion.button
                  key={k}
                  layout
                  className="chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => set({ [k]: "" })}
                >
                  {k === "minRating"
                    ? "4★ & up"
                    : k === "minDiscount"
                      ? `${params.get(k)}%+ off`
                      : k.includes("Price")
                        ? `${k === "minPrice" ? "Min" : "Max"} ₹${params.get(k)}`
                        : params.get(k)}{" "}
                  <X size={14} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {error && <div className="alert err">{error.message}</div>}
          {loading &&
            Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="rcard">
                <div className="skeleton" style={{ aspectRatio: 1 }} />
                <div>
                  <div className="skeleton" style={{ height: 20 }} />
                  <div
                    className="skeleton"
                    style={{ height: 14, width: "50%", marginTop: 8 }}
                  />
                </div>
              </div>
            ))}
          {!loading && data?.items.length === 0 && (
            <Empty
              title="No results found"
              text="Try a different search or remove some filters."
              action={
                <Button
                  variant="cart"
                  onClick={() => setParams(q ? { q } : {})}
                >
                  Clear filters
                </Button>
              }
            />
          )}
          {!loading && (
            <AnimatePresence mode="popLayout">
              {data?.items.map((p) => (
                <ResultCard key={p._id} p={p} />
              ))}
            </AnimatePresence>
          )}
          {data?.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === page ? "buy" : "secondary"}
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.set("page", n);
                    setParams(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {n}
                </Button>
              ))}
            </nav>
          )}
        </section>
      </div>
      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        side="bottom"
        title="Filters"
      >
        <Filters params={params} set={set} meta={meta} brands={data?.brands} />
      </Drawer>
    </div>
  );
}
