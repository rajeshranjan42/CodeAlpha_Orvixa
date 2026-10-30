import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { Button, Empty, LazyImg, PriceBlock } from "../components/ui";
import { imgUrl } from "../lib/api";

export default function Wishlist() {
  const { items, remove } = useWishlist();
  const { add } = useCart();
  const toast = useToast();
  const move = async (p) => {
    try {
      await add(p, 1);
      await remove(p._id);
      toast("Moved to cart");
    } catch (e) {
      toast(e.message, "error");
    }
  };
  return (
    <div className="container">
      <Helmet>
        <title>Your Wishlist — Orvixa</title>
      </Helmet>
      <h1>Your Wishlist</h1>
      {items.length === 0 ? (
        <Empty
          title="Your wishlist is empty"
          text="Tap the heart on any product to save it here."
          action={
            <Link className="btn btn-cart" to="/">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="grid">
          <AnimatePresence>
            {items.map((p) => (
              <motion.div
                key={p._id}
                layout
                className="pcard"
                exit={{ opacity: 0, x: 80 }}
                transition={{ duration: 0.25 }}
              >
                <Link to={`/product/${p._id}`}>
                  <LazyImg src={imgUrl(p.images[0])} alt={p.title} />
                  <h3 className="clamp2">{p.title}</h3>
                </Link>
                <PriceBlock price={p.price} mrp={p.mrp} />
                <Button
                  variant="cart"
                  disabled={p.stock < 1}
                  onClick={() => move(p)}
                >
                  {p.stock < 1 ? "Out of stock" : "Move to cart"}
                </Button>
                <Button variant="ghost" onClick={() => remove(p._id)}>
                  Remove
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
