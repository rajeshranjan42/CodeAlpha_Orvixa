import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, imgUrl } from "../lib/api";
import { useFetch } from "../lib/hooks";
import { Carousel, Reveal, Skeleton } from "../components/ui";
import ProductCard, { ProductSkeletons } from "../components/ProductCard";

function Hero({ banners }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = banners.length;
  useEffect(() => {
    if (paused || n < 2 || reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n, reduce]);
  if (!n)
    return (
      <div className="hero">
        <Skeleton h="100%" r={0} />
      </div>
    );
  const b = banners[i];
  const step = (d) => setI((x) => (x + d + n) % n);
  let sx = 0;
  return (
    <div
      className="hero"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      onTouchStart={(e) => {
        sx = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const d = e.changedTouches[0].clientX - sx;
        if (Math.abs(d) > 40) step(d < 0 ? 1 : -1);
      }}
    >
      <AnimatePresence>
        <motion.div
          key={b._id}
          className="hero-slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link to={b.link}>
            <img
              src={imgUrl(b.image)}
              alt={b.title}
              width="1600"
              height="400"
            />
          </Link>
          <div className="hero-cap">
            <h2>{b.title}</h2>
            <span>{b.subtitle}</span>
          </div>
        </motion.div>
      </AnimatePresence>
      <button
        className="nav-btn l"
        onClick={() => step(-1)}
        aria-label="Previous slide"
      >
        <ChevronLeft />
      </button>
      <button
        className="nav-btn r"
        onClick={() => step(1)}
        aria-label="Next slide"
      >
        <ChevronRight />
      </button>
      <div className="dots">
        {banners.map((x, k) => (
          <button
            key={x._id}
            aria-label={`Slide ${k + 1}`}
            aria-current={k === i}
            onClick={() => setI(k)}
          />
        ))}
      </div>
    </div>
  );
}

function Section({ title, query, link }) {
  const { data, loading } = useFetch(
    () => api.get(`/products?${query}&limit=12`),
    [query],
  );
  return (
    <Reveal>
      <Carousel title={title} link={link}>
        {loading ? (
          <ProductSkeletons n={6} />
        ) : (
          data.items.map((p) => <ProductCard key={p._id} product={p} />)
        )}
      </Carousel>
    </Reveal>
  );
}

function Tiles() {
  const { data: meta } = useFetch(() => api.get("/products/meta"), []);
  const { data } = useFetch(async () => {
    const cats = (await api.get("/products/meta")).categories.slice(0, 4);
    return Promise.all(
      cats.map(async (c) => ({
        c,
        items: (
          await api.get(`/products?category=${encodeURIComponent(c)}&limit=4`)
        ).items,
      })),
    );
  }, []);
  if (!meta || !data)
    return (
      <div className="tiles">
        {[0, 1, 2, 3].map((k) => (
          <Skeleton key={k} h={340} />
        ))}
      </div>
    );
  return (
    <div className="tiles">
      {data.map(({ c, items }, k) => (
        <Reveal key={c} delay={k * 0.06}>
          <div className="tile">
            <h2>{c}</h2>
            <div className="imgs">
              {items.map((p) => (
                <Link key={p._id} to={`/product/${p._id}`}>
                  <img
                    src={imgUrl(p.images[0])}
                    alt={p.title}
                    width="200"
                    height="200"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
            <Link to={`/search?category=${encodeURIComponent(c)}`}>
              See more
            </Link>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: banners } = useFetch(() => api.get("/content/banners"), []);
  const heroes = banners?.filter((b) => b.kind === "hero") || [];
  const promo = banners?.find((b) => b.kind === "promo");
  return (
    <>
      <Helmet>
        <title>Orvixa — Shop online</title>
      </Helmet>
      <Hero banners={heroes} />
      <div className="container" style={{ paddingTop: 0 }}>
        <Tiles />
        <div style={{ height: 16 }} />
        <Section
          title="Best Sellers"
          query="section=bestsellers"
          link={<Link to="/search?section=bestsellers">See all</Link>}
        />
        {promo && (
          <Reveal>
            <Link
              to={promo.link}
              className="card promo"
              style={{ display: "block" }}
            >
              <img
                src={imgUrl(promo.image)}
                alt={promo.title}
                width="1200"
                height="300"
                loading="lazy"
              />
            </Link>
          </Reveal>
        )}
        <Section title="Latest" query="sort=newest" />
        <Section title="Featured" query="section=featured" />
        <Section
          title="New Arrivals in Electronics"
          query="category=Electronics&sort=newest"
          link={<Link to="/search?category=Electronics">See all</Link>}
        />
      </div>
    </>
  );
}
