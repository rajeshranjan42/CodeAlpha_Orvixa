import { useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Package, Shield, MapPin, Heart, CreditCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui";
import Field from "../components/Field";
import { api, PINCODE_RE } from "../lib/api";

const cards = [
  [Package, "Your Orders", "Track, return, or buy things again", "/orders"],
  [
    Shield,
    "Login & security",
    "Edit name and change password",
    "/account/security",
  ],
  [MapPin, "Your Addresses", "Edit addresses for orders", "/account/addresses"],
  [Heart, "Your Wishlist", "Items you saved for later", "/wishlist"],
  [
    CreditCard,
    "Payments",
    "UPI, cards and cash on delivery are available at checkout",
    "/account",
  ],
];
const blank = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function Home() {
  return (
    <div className="acc-grid">
      {cards.map(([I, t, d, to]) => (
        <Link key={t} to={to} className="acc-card">
          <I size={40} />
          <div>
            <h3>{t}</h3>
            <span className="muted">{d}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Security() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [p, setP] = useState({ name: user.name, phone: user.phone || "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [err, setErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setUser((await api.patch("/profile", p)).user);
      toast("Profile updated");
    } catch (x) {
      setErr(x.message);
    }
  };
  const savePw = async (e) => {
    e.preventDefault();
    setPwErr("");
    try {
      await api.post("/profile/password", pw);
      setPw({ current: "", next: "" });
      toast("Password updated");
    } catch (x) {
      setPwErr(x.message);
    }
  };
  return (
    <div style={{ maxWidth: 440 }}>
      <form className="card" onSubmit={saveProfile}>
        <h2>Profile</h2>
        {err && <div className="alert err">{err}</div>}
        <Field
          label="Name"
          value={p.name}
          onChange={(e) => setP({ ...p, name: e.target.value })}
        />
        <Field
          label="Mobile"
          value={p.phone}
          onChange={(e) => setP({ ...p, phone: e.target.value })}
        />
        <div className="muted small" style={{ marginBottom: 8 }}>
          Email: {user.email}
        </div>
        <Button variant="cart" type="submit">
          Save changes
        </Button>
      </form>
      <form className="card" onSubmit={savePw}>
        <h2>Change password</h2>
        <Field
          label="Current password"
          type="password"
          value={pw.current}
          onChange={(e) => setPw({ ...pw, current: e.target.value })}
          error={pwErr.includes("Current") ? pwErr : ""}
        />
        <Field
          label="New password"
          type="password"
          value={pw.next}
          onChange={(e) => setPw({ ...pw, next: e.target.value })}
          error={pwErr && !pwErr.includes("Current") ? pwErr : ""}
        />
        <Button variant="cart" type="submit">
          Update password
        </Button>
      </form>
    </div>
  );
}

function Addresses() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [errs, setErrs] = useState({});
  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!PINCODE_RE.test(f.pincode))
      er.pincode = "Enter a valid 6-digit pincode";
    if (!/^\d{10}$/.test(f.phone)) er.phone = "Enter a 10-digit mobile number";
    setErrs(er);
    if (Object.keys(er).length) return;
    try {
      const { _id, ...body } = f;
      const r = _id
        ? await api.put(`/profile/addresses/${_id}`, body)
        : await api.post("/profile/addresses", body);
      setUser(r.user);
      setF(null);
      toast("Address saved");
    } catch (x) {
      toast(x.message, "error");
    }
  };
  const del = async (id) =>
    setUser((await api.del(`/profile/addresses/${id}`)).user);
  const mkDefault = async (id) =>
    setUser(
      (await api.put(`/profile/addresses/${id}`, { isDefault: true })).user,
    );
  return (
    <div>
      <div className="acc-grid">
        <button
          className="acc-card"
          style={{
            border: "2px dashed var(--border)",
            cursor: "pointer",
            justifyContent: "center",
            font: "inherit",
          }}
          onClick={() => {
            setErrs({});
            setF(blank);
          }}
        >
          + Add address
        </button>
        {user.addresses.map((a) => (
          <div
            key={a._id}
            className="acc-card"
            style={{ flexDirection: "column" }}
          >
            {a.isDefault && (
              <span
                className="badge badge-orange"
                style={{ width: "fit-content" }}
              >
                Default
              </span>
            )}
            <b>{a.name}</b>
            <span>
              {a.line1}
              {a.line2 && `, ${a.line2}`}
              <br />
              {a.city}, {a.state} {a.pincode}
              <br />
              Phone: {a.phone}
            </span>
            <div className="links">
              <button
                className="linkbtn"
                onClick={() => {
                  setErrs({});
                  setF(a);
                }}
              >
                Edit
              </button>
              <button className="linkbtn" onClick={() => del(a._id)}>
                Remove
              </button>
              {!a.isDefault && (
                <button className="linkbtn" onClick={() => mkDefault(a._id)}>
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {f && (
        <form
          className="card"
          onSubmit={save}
          style={{ maxWidth: 480, marginTop: 16 }}
        >
          <h2>{f._id ? "Edit address" : "New address"}</h2>
          {[
            ["name", "Full name"],
            ["phone", "Mobile number"],
            ["line1", "Address line 1"],
            ["line2", "Address line 2"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
          ].map(([k, l]) => (
            <Field
              key={k}
              label={l}
              value={f[k]}
              error={errs[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          ))}
          <label>
            <input
              type="checkbox"
              checked={f.isDefault}
              onChange={(e) => setF({ ...f, isDefault: e.target.checked })}
            />{" "}
            Make this my default address
          </label>
          <div className="row" style={{ marginTop: 12 }}>
            <Button onClick={() => setF(null)} type="button">
              Cancel
            </Button>
            <Button variant="cart" type="submit">
              Save address
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Account() {
  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <Helmet>
        <title>Your Account — Orvixa</title>
      </Helmet>
      <h1>Your Account</h1>
      <Routes>
        <Route index element={<Home />} />
        <Route path="security" element={<Security />} />
        <Route path="addresses" element={<Addresses />} />
      </Routes>
    </div>
  );
}
