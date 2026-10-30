import { useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import { useFetch } from "../lib/hooks";
import { Button, Skeleton, AnimatedTick } from "../components/ui";
import Field from "../components/Field";

const TOPICS = [
  [
    "Where is my order?",
    "Open Your Orders and choose Track package to see each stage of delivery.",
  ],
  [
    "How do I cancel an order?",
    "You can cancel while the order is Placed, Confirmed or Packed. Open Your Orders and choose Cancel order.",
  ],
  [
    "How do I return an item?",
    "Delivered items can be returned within 7 days. Open Your Orders and choose Return items.",
  ],
  [
    "When is delivery free?",
    "Delivery is free on orders of ₹499 or more. Below that, a ₹40 fee applies.",
  ],
  ["Which payment methods do you accept?", "UPI, cards and Cash on Delivery."],
];

function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  return items.map(([q, a], i) => (
    <div className="acc-item" key={q}>
      <button
        className="acc-q"
        aria-expanded={open === i}
        aria-controls={`acc-${i}`}
        onClick={() => setOpen(open === i ? null : i)}
      >
        {q}
        <ChevronDown
          size={18}
          style={{
            transform: open === i ? "rotate(180deg)" : "none",
            transition: "transform .25s",
          }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open === i && (
          <motion.div
            id={`acc-${i}`}
            role="region"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <p className="muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ));
}

function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      er.email = "Enter a valid email address";
    if (f.message.trim().length < 10)
      er.message = "Tell us a little more (at least 10 characters)";
    setErrs(er);
    if (!Object.keys(er).length) setDone(true);
  };
  if (done)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: "center" }}
      >
        <AnimatedTick />
        <h2>Message sent</h2>
        <p className="muted">
          Thanks, {f.name}. We reply within one business day.
        </p>
      </motion.div>
    );
  return (
    <form onSubmit={submit} noValidate style={{ maxWidth: 440 }}>
      <Field
        label="Name"
        value={f.name}
        error={errs.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />
      <Field
        label="Email"
        type="email"
        value={f.email}
        error={errs.email}
        onChange={(e) => setF({ ...f, email: e.target.value })}
      />
      <Field
        label="Message"
        textarea
        value={f.message}
        error={errs.message}
        onChange={(e) => setF({ ...f, message: e.target.value })}
      />
      <Button variant="cart" type="submit">
        Send message
      </Button>
    </form>
  );
}

export default function Static({ help, contact }) {
  const params = useParams();
  const slug = contact ? "contact" : params.slug;
  const { data, loading, error } = useFetch(
    () =>
      help
        ? Promise.resolve({
            title: "Customer Service",
            content: "Browse common questions below.",
          })
        : api.get(`/content/pages/${slug}`),
    [slug, help],
  );
  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <Helmet>
        <title>{data?.title || "Orvixa"} — Orvixa</title>
      </Helmet>
      <div className="card">
        {loading && <Skeleton h={200} />}
        {error && (
          <>
            <h1>Page not found</h1>
            <p className="muted">We couldn&apos;t find that page.</p>
          </>
        )}
        {data && (
          <>
            <h1>{data.title}</h1>
            {data.content.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </>
        )}
        {help && <Accordion items={TOPICS} />}
        {contact && <ContactForm />}
      </div>
    </div>
  );
}
