import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Check, ShoppingCart } from 'lucide-react';
import { LazyImg, PriceBlock, StarRating, Button, Badge } from './ui';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { flyToCart } from '../lib/hooks';
import { imgUrl } from '../lib/api';

export function HeartButton({ id }) {
  const { has, toggle } = useWishlist();
  const [k, setK] = useState(0);
  const on = has(id);
  return (
    <button key={k} className={`heart ${on ? 'on' : ''} ${k ? 'pop' : ''}`} aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setK((x) => x + 1); toggle(id); }}>
      <Heart size={20} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function AddToCartButton({ product, qty = 1, className = '', label = 'Add to Cart', imgRef }) {
  const { add } = useCart();
  const toast = useToast();
  const [done, setDone] = useState(false);
  const out = product.stock < 1;
  const onClick = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      flyToCart(imgRef?.current);
      await add(product, qty);
      setDone(true); setTimeout(() => setDone(false), 1400);
      toast('Added to cart');
    } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <Button variant="cart" className={className} disabled={out} onClick={onClick}>
      {out ? 'Out of stock' : done ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> {label}</>}
    </Button>
  );
}

export default function ProductCard({ product: p }) {
  const imgRef = useRef(null);
  return (
    <motion.article className="pcard" whileHover={{ y: -4 }} transition={{ duration: 0.15 }}>
      <Link to={`/product/${p._id}`} className="pcard-link">
        <div className="pcard-img">
          <LazyImg src={imgUrl(p.images[0])} alt={p.title} imgRef={imgRef} />
          {p.discount >= 10 && <span className="pcard-badge"><Badge>{p.discount}% off</Badge></span>}
          <HeartButton id={p._id} />
        </div>
        <h3 className="clamp2">{p.title}</h3>
        <StarRating value={p.rating} count={p.numReviews} size={14} />
        <PriceBlock price={p.price} mrp={p.mrp} />
        <div className="muted small">{p.stock < 1 ? 'Currently unavailable' : 'FREE Delivery above ₹499'}</div>
      </Link>
      <div className="pcard-cta"><AddToCartButton product={p} imgRef={imgRef} /></div>
    </motion.article>
  );
}

export function ProductSkeletons({ n = 6 }) {
  return Array.from({ length: n }, (_, i) => (
    <div className="pcard" key={i}><div className="skeleton" style={{ aspectRatio: '1', borderRadius: 8 }} /><div className="skeleton" style={{ height: 14, marginTop: 10 }} /><div className="skeleton" style={{ height: 14, width: '60%', marginTop: 6 }} /></div>
  ));
}
