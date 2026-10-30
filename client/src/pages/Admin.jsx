import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Image,
  FileText,
  ClipboardList,
  Ticket,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { api, getToken, imgUrl, inr } from "../lib/api";
import { useFetch } from "../lib/hooks";
import { Button, Skeleton } from "../components/ui";
import Field from "../components/Field";
import { useToast } from "../context/ToastContext";
import { Pill } from "./Orders";

const STATUSES = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];
const TABS = [
  ["Dashboard", LayoutDashboard],
  ["Products", Package],
  ["Banners", Image],
  ["Pages", FileText],
  ["Orders", ClipboardList],
  ["Coupons", Ticket],
];

function CountUp({ to, money }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      ref.current.textContent = money ? inr(to) : to;
      return;
    }
    const c = animate(0, to, {
      duration: 0.9,
      onUpdate: (v) => {
        if (ref.current)
          ref.current.textContent = money ? inr(Math.round(v)) : Math.round(v);
      },
    });
    return () => c.stop();
  }, [to, money, reduce]);
  return <b ref={ref}>0</b>;
}

function Dashboard() {
  const { data: s, loading } = useFetch(() => api.get("/admin/stats"), []);
  if (loading) return <Skeleton h={300} />;
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <CountUp to={s.revenue} money />
          <span className="muted">Revenue</span>
        </div>
        <div className="stat">
          <CountUp to={s.orders} />
          <span className="muted">Orders</span>
        </div>
        <div className="stat">
          <CountUp to={s.products} />
          <span className="muted">Products</span>
        </div>
        <div className="stat">
          <CountUp to={s.users} />
          <span className="muted">Customers</span>
        </div>
      </div>
      <div className="card">
        <h3>Revenue, last 30 days</h3>
        {s.daily.length === 0 ? (
          <p className="muted">No orders in the last 30 days.</p>
        ) : (
          <div className="bars" role="img" aria-label="Revenue by day">
            {s.daily.map((d, i) => (
              <motion.i
                key={d._id}
                title={`${d._id}: ${inr(d.revenue)}`}
                style={{ height: `${(d.revenue / max) * 100}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="stat-grid">
        <div className="card">
          <h3>Orders by status</h3>
          {s.byStatus.map((b) => (
            <div className="row between" key={b._id}>
              <Pill s={b._id} />
              <b>{b.count}</b>
            </div>
          ))}
          {!s.byStatus.length && <p className="muted">No orders yet.</p>}
        </div>
        <div className="card">
          <h3>Top 5 products</h3>
          {s.top.map((t) => (
            <div className="row between" key={t._id}>
              <span className="clamp2">{t.title}</span>
              <b>{t.units}</b>
            </div>
          ))}
          {!s.top.length && <p className="muted">No sales yet.</p>}
        </div>
        <div className="card">
          <h3>Low stock</h3>
          {s.lowStock.map((p) => (
            <div className="row between" key={p._id}>
              <span className="clamp2">{p.title}</span>
              <b className="red">{p.stock}</b>
            </div>
          ))}
          {!s.lowStock.length && <p className="muted">All stocked.</p>}
        </div>
      </div>
    </>
  );
}

function ImagePicker({ value, onChange }) {
  const [err, setErr] = useState("");
  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setErr("Only JPEG, PNG or WebP images are allowed");
    if (file.size > 2 * 1024 * 1024)
      return setErr("Image must be 2 MB or smaller");
    setErr("");
    const fd = new FormData();
    fd.append("image", file);
    try {
      onChange((await api.upload("/admin/upload", fd)).url);
    } catch (x) {
      setErr(x.message);
    }
  };
  return (
    <div>
      {value && (
        <img
          src={imgUrl(value)}
          alt="Preview"
          width="90"
          height="90"
          style={{ borderRadius: 6, marginBottom: 6 }}
        />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
      />
      {err && (
        <div className="msg red" role="alert">
          {err}
        </div>
      )}
    </div>
  );
}

function ImagesPicker({ images = [], onChange }) {
  const [err, setErr] = useState("");
  const add = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setErr("Only JPEG, PNG or WebP images are allowed");
    if (file.size > 2 * 1024 * 1024)
      return setErr("Image must be 2 MB or smaller");
    if (images.length >= 6) return setErr("You can add up to 6 images");
    setErr("");
    const fd = new FormData();
    fd.append("image", file);
    try {
      onChange([...images, (await api.upload("/admin/upload", fd)).url]);
    } catch (x) {
      setErr(x.message);
    }
  };
  const remove = (i) => onChange(images.filter((_, k) => k !== i));
  const makeMain = (i) =>
    onChange([images[i], ...images.filter((_, k) => k !== i)]);
  return (
    <div>
      <div className="row wrap" style={{ alignItems: "flex-start" }}>
        {images.map((u, i) => (
          <div key={u + i} style={{ width: 96 }}>
            <img
              src={imgUrl(u)}
              alt={`Product image ${i + 1}`}
              width="96"
              height="96"
              style={{ borderRadius: 6, objectFit: "cover" }}
            />
            <div className="small">
              {i === 0 ? (
                <b>Main image</b>
              ) : (
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => makeMain(i)}
                >
                  Make main
                </button>
              )}
            </div>
            <button type="button" className="linkbtn" onClick={() => remove(i)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <label style={{ display: "block", marginTop: 8 }}>
        Add image:{" "}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={add}
        />
      </label>
      {err && (
        <div className="msg red" role="alert">
          {err}
        </div>
      )}
    </div>
  );
}

function Products() {
  const toast = useToast();
  const { data, loading, reload } = useFetch(
    () => api.get("/admin/products"),
    [],
  );
  const [f, setF] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const body = {
      ...f,
      price: +f.price,
      mrp: +f.mrp,
      stock: +f.stock,
      lowStockAt: +f.lowStockAt,
      bullets: String(f.bullets).split("\n").filter(Boolean),
    };
    try {
      f._id
        ? await api.put(`/admin/products/${f._id}`, body)
        : await api.post("/admin/products", body);
      toast("Product saved");
      setF(null);
      reload();
    } catch (x) {
      toast(x.message, "error");
    }
  };
  const blank = {
    title: "",
    brand: "Orvixa",
    category: "",
    price: "",
    mrp: "",
    stock: 10,
    lowStockAt: 5,
    description: "",
    bullets: "",
    images: [],
  };
  return (
    <>
      <Button variant="cart" onClick={() => setF(blank)}>
        + New product
      </Button>
      {f && (
        <form
          className="card"
          onSubmit={save}
          style={{ marginTop: 12, maxWidth: 560 }}
        >
          {[
            ["title", "Title"],
            ["brand", "Brand"],
            ["category", "Category"],
            ["price", "Price (₹)"],
            ["mrp", "M.R.P. (₹)"],
            ["stock", "Stock"],
            ["lowStockAt", "Low-stock alert at"],
          ].map(([k, l]) => (
            <Field
              key={k}
              label={l}
              value={f[k]}
              type={
                ["price", "mrp", "stock", "lowStockAt"].includes(k)
                  ? "number"
                  : "text"
              }
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
              required
            />
          ))}
          <Field
            label="Description"
            textarea
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
          <Field
            label="Bullets (one per line)"
            textarea
            value={Array.isArray(f.bullets) ? f.bullets.join("\n") : f.bullets}
            onChange={(e) => setF({ ...f, bullets: e.target.value })}
          />
          <ImagesPicker
            images={f.images}
            onChange={(images) => setF({ ...f, images })}
          />
          <div className="row" style={{ marginTop: 12 }}>
            <Button type="button" onClick={() => setF(null)}>
              Cancel
            </Button>
            <Button variant="cart" type="submit">
              Save product
            </Button>
          </div>
        </form>
      )}
      <div className="tbl-wrap card" style={{ marginTop: 12 }}>
        {loading ? (
          <Skeleton h={200} />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>{p.category}</td>
                  <td>{inr(p.price)}</td>
                  <td className={p.stock <= p.lowStockAt ? "red" : ""}>
                    {p.stock}
                  </td>
                  <td>
                    <button className="linkbtn" onClick={() => setF(p)}>
                      Edit
                    </button>{" "}
                    ·{" "}
                    <button
                      className="linkbtn"
                      onClick={async () => {
                        if (confirm("Delete this product?")) {
                          await api.del(`/admin/products/${p._id}`);
                          reload();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Banners() {
  const toast = useToast();
  const { data, loading, reload } = useFetch(
    () => api.get("/admin/banners"),
    [],
  );
  const [f, setF] = useState(null);
  const move = async (i, d) => {
    const ids = data.map((b) => b._id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    await api.post("/admin/banners/reorder", { ids });
    reload();
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      f._id
        ? await api.put(`/admin/banners/${f._id}`, f)
        : await api.post("/admin/banners", { ...f, order: data.length });
      setF(null);
      reload();
      toast("Banner saved");
    } catch (x) {
      toast(x.message, "error");
    }
  };
  return (
    <>
      <Button
        variant="cart"
        onClick={() =>
          setF({ kind: "hero", title: "", subtitle: "", image: "", link: "/" })
        }
      >
        + New banner
      </Button>
      {f && (
        <form
          className="card"
          onSubmit={save}
          style={{ maxWidth: 480, marginTop: 12 }}
        >
          <label>
            Type{" "}
            <select
              className="sel"
              value={f.kind}
              onChange={(e) => setF({ ...f, kind: e.target.value })}
            >
              <option value="hero">Hero</option>
              <option value="promo">Promo</option>
            </select>
          </label>
          <Field
            label="Title"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <Field
            label="Subtitle"
            value={f.subtitle}
            onChange={(e) => setF({ ...f, subtitle: e.target.value })}
          />
          <Field
            label="Link"
            value={f.link}
            onChange={(e) => setF({ ...f, link: e.target.value })}
          />
          <ImagePicker
            value={f.image}
            onChange={(u) => setF({ ...f, image: u })}
          />
          <div className="row" style={{ marginTop: 12 }}>
            <Button type="button" onClick={() => setF(null)}>
              Cancel
            </Button>
            <Button variant="cart" type="submit">
              Save banner
            </Button>
          </div>
        </form>
      )}
      {loading ? (
        <Skeleton h={120} />
      ) : (
        data.map((b, i) => (
          <motion.div
            layout
            key={b._id}
            className="card row"
            style={{ marginTop: 12 }}
          >
            <img
              src={imgUrl(b.image)}
              alt=""
              width="120"
              height="40"
              style={{ objectFit: "cover", borderRadius: 4 }}
            />
            <span style={{ flex: 1 }}>
              {b.title} <span className="muted small">({b.kind})</span>
            </span>
            <button
              className="icon-btn"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label="Move up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              className="icon-btn"
              disabled={i === data.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Move down"
            >
              <ArrowDown size={16} />
            </button>
            <button className="linkbtn" onClick={() => setF(b)}>
              Edit
            </button>
            <button
              className="linkbtn"
              onClick={async () => {
                await api.del(`/admin/banners/${b._id}`);
                reload();
              }}
            >
              Delete
            </button>
          </motion.div>
        ))
      )}
    </>
  );
}

function Pages() {
  const toast = useToast();
  const { data, loading, reload } = useFetch(() => api.get("/admin/pages"), []);
  const [f, setF] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/pages/${f._id}`, {
        title: f.title,
        content: f.content,
      });
      toast("Page saved");
      setF(null);
      reload();
    } catch (x) {
      toast(x.message, "error");
    }
  };
  if (loading) return <Skeleton h={160} />;
  return (
    <>
      {data.map((p) => (
        <div key={p._id} className="card row between">
          <span>
            <b>{p.title}</b> <span className="muted small">/page/{p.slug}</span>
          </span>
          <button className="linkbtn" onClick={() => setF(p)}>
            Edit
          </button>
        </div>
      ))}
      {f && (
        <form className="card" onSubmit={save} style={{ maxWidth: 640 }}>
          <Field
            label="Title"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <Field
            label="Content"
            textarea
            value={f.content}
            onChange={(e) => setF({ ...f, content: e.target.value })}
            style={{ minHeight: 220 }}
          />
          <div className="row">
            <Button type="button" onClick={() => setF(null)}>
              Cancel
            </Button>
            <Button variant="cart" type="submit">
              Save page
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

function Orders() {
  const toast = useToast();
  const { data, loading, reload } = useFetch(
    () => api.get("/admin/orders"),
    [],
  );
  const set = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast("Status updated");
      reload();
    } catch (x) {
      toast(x.message, "error");
    }
  };
  const csv = async () => {
    const res = await fetch("/api/admin/orders.csv", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), {
      href: url,
      download: "orders.csv",
    }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Button onClick={csv}>Export CSV</Button>
      <div className="tbl-wrap card" style={{ marginTop: 12 }}>
        {loading ? (
          <Skeleton h={200} />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o._id}>
                  <td>#{o._id.slice(-8).toUpperCase()}</td>
                  <td>{o.user?.email}</td>
                  <td>{inr(o.total)}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <select
                      className="sel"
                      aria-label="Order status"
                      value={o.status}
                      onChange={(e) => set(o._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Coupons() {
  const toast = useToast();
  const { data, loading, reload } = useFetch(
    () => api.get("/admin/coupons"),
    [],
  );
  const [f, setF] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const body = {
      ...f,
      value: +f.value,
      minOrder: +f.minOrder,
      maxDiscount: +f.maxDiscount,
      expiresAt: f.expiresAt || undefined,
    };
    try {
      f._id
        ? await api.put(`/admin/coupons/${f._id}`, body)
        : await api.post("/admin/coupons", body);
      setF(null);
      reload();
      toast("Coupon saved");
    } catch (x) {
      toast(x.message, "error");
    }
  };
  return (
    <>
      <Button
        variant="cart"
        onClick={() =>
          setF({
            code: "",
            type: "percent",
            value: 10,
            minOrder: 0,
            maxDiscount: 0,
            expiresAt: "",
            active: true,
          })
        }
      >
        + New coupon
      </Button>
      {f && (
        <form
          className="card"
          onSubmit={save}
          style={{ maxWidth: 420, marginTop: 12 }}
        >
          <Field
            label="Code"
            value={f.code}
            onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
            required
          />
          <label>
            Type{" "}
            <select
              className="sel"
              value={f.type}
              onChange={(e) => setF({ ...f, type: e.target.value })}
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat ₹</option>
            </select>
          </label>
          <div style={{ height: 12 }} />
          <Field
            label="Value"
            type="number"
            value={f.value}
            onChange={(e) => setF({ ...f, value: e.target.value })}
          />
          <Field
            label="Minimum order (₹)"
            type="number"
            value={f.minOrder}
            onChange={(e) => setF({ ...f, minOrder: e.target.value })}
          />
          <Field
            label="Max discount (₹, percent only)"
            type="number"
            value={f.maxDiscount}
            onChange={(e) => setF({ ...f, maxDiscount: e.target.value })}
          />
          <label>
            Expires{" "}
            <input
              className="inp"
              type="date"
              value={(f.expiresAt || "").slice(0, 10)}
              onChange={(e) => setF({ ...f, expiresAt: e.target.value })}
            />
          </label>
          <label style={{ display: "block", margin: "10px 0" }}>
            <input
              type="checkbox"
              checked={f.active}
              onChange={(e) => setF({ ...f, active: e.target.checked })}
            />{" "}
            Active
          </label>
          <div className="row">
            <Button type="button" onClick={() => setF(null)}>
              Cancel
            </Button>
            <Button variant="cart" type="submit">
              Save coupon
            </Button>
          </div>
        </form>
      )}
      <div className="tbl-wrap card" style={{ marginTop: 12 }}>
        {loading ? (
          <Skeleton h={120} />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Expires</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td>
                    <b>{c.code}</b>
                    {!c.active && " (off)"}
                  </td>
                  <td>
                    {c.type === "percent"
                      ? `${c.value}%${c.maxDiscount ? ` up to ${inr(c.maxDiscount)}` : ""}`
                      : inr(c.value)}
                  </td>
                  <td>{inr(c.minOrder)}</td>
                  <td>
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td>
                    <button className="linkbtn" onClick={() => setF(c)}>
                      Edit
                    </button>{" "}
                    ·{" "}
                    <button
                      className="linkbtn"
                      onClick={async () => {
                        await api.del(`/admin/coupons/${c._id}`);
                        reload();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("Dashboard");
  const View = { Dashboard, Products, Banners, Pages, Orders, Coupons }[tab];
  return (
    <div className="admin">
      <Helmet>
        <title>Admin — Orvixa</title>
      </Helmet>
      <aside>
        <nav aria-label="Admin">
          {TABS.map(([t, I]) => (
            <button key={t} aria-current={tab === t} onClick={() => setTab(t)}>
              <I size={18} /> {t}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <h1>{tab}</h1>
        <View />
      </main>
    </div>
  );
}
