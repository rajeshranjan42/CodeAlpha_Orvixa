import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Header, Footer } from "./components/Layout";
import { PageTransition, ErrorBoundary, Skeleton } from "./components/ui";
import Extras from "./components/Extras";
import ChatBot from "./components/ChatBot";
import { useAuth } from "./context/AuthContext";


const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/Login"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const Static = lazy(() => import("./pages/Static"));

function Guard({ admin, children }) {
  const { user, ready, isAdmin } = useAuth();
  const loc = useLocation();
  if (!ready)
    return (
      <div className="container">
        <Skeleton h={200} />
      </div>
    );
  if (!user)
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export const NotFound = () => (
  <div className="card center-box">
    <h1>404</h1>
    <p className="muted">We couldn&apos;t find that page.</p>
    <a className="btn btn-cart" href="/">
      Go to home
    </a>
  </div>
);

export default function App() {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const bare =
    loc.pathname.startsWith("/checkout") || loc.pathname === "/login";
  const wrap = (el) => (
    <PageTransition>
      <ErrorBoundary>{el}</ErrorBoundary>
    </PageTransition>
  );
  return (
    <>
      <Extras />
      {!bare && <Header />}
      <main id="main">
        <Suspense
          fallback={
            <div className="container">
              <Skeleton h={300} />
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={loc} key={loc.pathname}>
              <Route path="/" element={wrap(<Home />)} />
              <Route path="/search" element={wrap(<Search />)} />
              <Route path="/deals" element={wrap(<Search deals />)} />
              <Route path="/product/:id" element={wrap(<Product />)} />
              <Route path="/cart" element={wrap(<Cart />)} />
              <Route path="/login" element={wrap(<Login />)} />
              <Route
                path="/checkout"
                element={<Guard>{wrap(<Checkout />)}</Guard>}
              />
              <Route
                path="/orders"
                element={<Guard>{wrap(<Orders />)}</Guard>}
              />
              <Route
                path="/orders/:id"
                element={<Guard>{wrap(<Tracking />)}</Guard>}
              />
              <Route
                path="/wishlist"
                element={<Guard>{wrap(<Wishlist />)}</Guard>}
              />
              <Route
                path="/account/*"
                element={<Guard>{wrap(<Account />)}</Guard>}
              />
              <Route
                path="/admin"
                element={<Guard admin>{wrap(<Admin />)}</Guard>}
              />
              <Route path="/page/:slug" element={wrap(<Static />)} />
              <Route path="/help" element={wrap(<Static help />)} />
              <Route path="/contact" element={wrap(<Static contact />)} />
              <Route path="*" element={wrap(<NotFound />)} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {!bare && <Footer />}
      {!bare && <ChatBot />}
    </>
  );
}