# Orvixa — MERN storefront (Amazon-style, fully animated)

MongoDB + Express + React (Vite) + Node. Real JWT auth, real database, server-side
price/stock/coupon checks. Payments are **simulated** (no Razorpay charge).

## Run it

Requirements: Node 18+, MongoDB running locally (or an Atlas URI).

```bash
npm run install:all
cp server/.env.example server/.env      # set JWT_SECRET, MONGO_URI
npm run seed                            # 36 products, coupons, banners, pages, demo users
npm run dev                             # API :5000, web :5173
```

Demo accounts (created by the seed):

| Role | Email | Password |
|---|---|---|
| Admin | admin@orvixa.com | Admin@12345 |
| Customer | customer@orvixa.com | Customer@123 |

Coupons: `WELCOME10` (10%, max ₹200, min ₹500), `FLAT100` (₹100, min ₹999), `OLDONE` (expired).
Re-run `npm run seed` any time to reset all data.

## Structure

```
server/src
  models/      User (addresses, wishlist, cart), Product, Order, Review, Coupon, Content
  routes/      auth, products, cart, wishlist, orders, reviews, profile, coupons, content, admin
  utils/       pricing.js (coupon + totals — unit tested)
client/src
  styles/      tokens.css, motion.css, app.css
  context/     Auth, Cart (anonymous localStorage cart merges on login), Wishlist, Toast
  components/  ui.jsx (Button, StarRating, PriceBlock, Badge, Skeleton, Reveal, PageTransition,
               Modal, Drawer, Carousel, ErrorBoundary…), Layout.jsx (header/footer), ProductCard
  pages/       Home, Search(+Deals), Product, Cart, Login, Checkout, Orders, Tracking,
               Wishlist, Account, Admin, Static (legal, help, contact)
```

## Tests

`npm test` runs server unit tests (node:test) and client component tests (Vitest).
`npm run test:e2e` runs Playwright against a running, seeded app.

## Animation guidelines

- Animate only `transform` and `opacity`. Progress bars and bars use `scaleX/scaleY`.
- Every motion component checks `useReducedMotion`; `motion.css` also disables CSS animation
  under `prefers-reduced-motion`.
- Nothing longer than 600 ms except the hero auto-slide (5 s). Never block input.

## Notes

- Server is the source of truth for price, stock, delivery fee, GST (18% included) and coupons.
- Order cancel restores stock; checkout reserves stock atomically and rolls back on failure.
- Password reset is a stub that returns a generic message (no email is sent).
