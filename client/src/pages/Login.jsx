import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";
import Field from "../components/Field";
import { api } from "../lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") || "login"; // login | register | forgot
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const returnUrl = params.get("returnUrl");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m) => {
    setErrs({});
    setTop("");
    setInfo("");
    const p = new URLSearchParams(params);
    p.set("mode", m);
    setParams(p, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!EMAIL_RE.test(f.email)) er.email = "Enter a valid email address";
    if (mode !== "forgot" && f.password.length < 8)
      er.password = "Password must be at least 8 characters";
    if (mode === "register" && f.confirm !== f.password)
      er.confirm = "Passwords do not match";
    setErrs(er);
    setTop("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = await api.post("/auth/forgot", { email: f.email });
        setInfo(r.message);
      } else {
        const u =
          mode === "register"
            ? await register(f.email, f.password, f.name)
            : await login(f.email, f.password);
        nav(u.role === "admin" && !returnUrl ? "/admin" : returnUrl || "/", {
          replace: true,
        });
      }
    } catch (x) {
      setTop(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <Helmet>
        <title>Sign in — Orvixa</title>
      </Helmet>
      <Link
        to="/"
        className="auth-logo"
        style={{ display: "block", color: "inherit" }}
      >
        orvixa<b>.</b>
      </Link>
      <div className="auth-box card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.form
            key={mode}
            onSubmit={submit}
            noValidate
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h1 style={{ fontSize: 28 }}>
              {mode === "register"
                ? "Create account"
                : mode === "forgot"
                  ? "Password assistance"
                  : "Sign in"}
            </h1>
            {top && (
              <div className="alert err" role="alert">
                {top}
              </div>
            )}
            {info && (
              <div className="alert ok" role="status">
                {info}
              </div>
            )}
            {mode === "register" && (
              <Field
                label="Your name (optional)"
                value={f.name}
                onChange={set("name")}
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={f.email}
              onChange={set("email")}
              error={errs.email}
              ok={EMAIL_RE.test(f.email)}
              autoComplete="email"
            />
            {mode !== "forgot" && (
              <Field
                label="Password"
                type="password"
                value={f.password}
                onChange={set("password")}
                error={errs.password}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            )}
            {mode === "register" && (
              <Field
                label="Re-enter password"
                type="password"
                value={f.confirm}
                onChange={set("confirm")}
                error={errs.confirm}
                autoComplete="new-password"
              />
            )}
            <Button
              variant="cart"
              type="submit"
              className="btn-block"
              loading={busy}
            >
              {mode === "register"
                ? "Create your Orvixa account"
                : mode === "forgot"
                  ? "Continue"
                  : "Sign in"}
            </Button>
            {mode === "login" && (
              <p>
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => switchTo("forgot")}
                >
                  Forgot password?
                </button>
              </p>
            )}
            {mode !== "login" && (
              <p>
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => switchTo("login")}
                >
                  Already a customer? Sign in
                </button>
              </p>
            )}
          </motion.form>
        </AnimatePresence>
        {mode === "login" && (
          <>
            <div
              className="muted small"
              style={{ textAlign: "center", margin: "16px 0 8px" }}
            >
              New to Orvixa?
            </div>
            <Button className="btn-block" onClick={() => switchTo("register")}>
              Create your Orvixa account
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
