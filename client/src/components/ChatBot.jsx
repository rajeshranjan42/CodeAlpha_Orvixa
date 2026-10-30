import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { api, imgUrl, inr } from "../lib/api";

// ---- edit these to match your store ----
const SUPPORT_EMAIL = "officialrajeshranjan@gmail.com";
const SUPPORT_PHONE = "+91 6287083510";
const ROUTES = { orders: "/orders", account: "/account", login: "/login" };
const STORE_KEY = "orvixa-chat";

const CHIPS = [
  "Track my order",
  "Return an item",
  "Delivery charges",
  "Coupons",
  "Payment options",
  "Show products",
];

const GREETING = {
  from: "bot",
  text: "Hi! I'm the Orvixa assistant. I can help with orders, delivery, returns, payments and coupons, or find a product for you. What do you need?",
};

const FALLBACK = `Sorry, I couldn't find an answer for that. Try asking about delivery, returns, payments or coupons, or type a product name. You can also write to ${SUPPORT_EMAIL}.`;

// ---- products ----
// The catalogue is loaded once (pages of 60, up to 300 products) and searched
// here in the browser, so multi-word questions like "rich dad poor dad" work.
let catalogue;
const loadCatalogue = () => {
  if (!catalogue) {
    catalogue = (async () => {
      const first = await api.get("/products?limit=60&page=1");
      let items = first.items || [];
      for (let p = 2; p <= Math.min(first.pages || 1, 5); p++) {
        const d = await api.get(`/products?limit=60&page=${p}`);
        items = items.concat(d.items || []);
      }
      return items;
    })().catch((e) => {
      catalogue = undefined;
      throw e;
    });
  }
  return catalogue;
};

const FILLER =
  /\b(show|me|find|search|for|do|you|have|i|want|to|buy|need|looking|price|of|the|a|an|and|or|any|some|please|can|get|is|are|there|best|good|cheap|under|available|in|stock|with|my|on|about|product|products|item|items)\b/g;

async function findProducts(text) {
  const base = text
    .toLowerCase()
    .replace(FILLER, " ")
    .split(/[^a-z0-9+]+/)
    .filter((w) => w.length > 1);
  const stems = base.map((w) => (w.length > 3 ? w.replace(/s$/, "") : w));
  if (!stems.length) return { label: "", items: [] };
  const all = await loadCatalogue();
  const items = all
    .map((p) => {
      const hay = `${p.title} ${p.brand} ${p.category}`.toLowerCase();
      return { p, score: stems.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);
  return { label: base.join(" "), items };
}

async function popular() {
  const data = await api.get("/products?section=bestsellers&limit=4");
  return {
    text: "Here are some of our best sellers:",
    products: data.items || [],
    links: [{ label: "Browse all products", to: "/search" }],
  };
}

// ---- answers (taken from your policy pages) ----
const FAQ = [
  {
    re: /\b(thanks|thank you|thx|bye)\b/,
    reply: { text: "You're welcome! Anything else I can help with?" },
  },
  {
    re: /\b(hi|hello|hey|namaste)\b|good (morning|afternoon|evening)/,
    reply: { text: GREETING.text },
  },
  {
    re: /who (are|r) (you|yoy|u)\b|what are you|your name|are you (a |an )?(bot|human|real|ai|robot|person)|what can you (do|help)|how can you help|^\s*(help|menu|options)\s*$/,
    reply: {
      text: `I'm the Orvixa shopping assistant, an automated helper. I can answer questions about orders, delivery, returns, payments and coupons, and help you find products. For anything else, write to ${SUPPORT_EMAIL}.`,
    },
  },
  {
    re: /^\s*((show|see|view|list|display|all|your|our|the|me|some|any)\s+)*(products?|items?|shop|shopping|catalogue|catalog|categories|category)\s*$|what (do )?you (sell|have)|browse|recommend|suggest|best ?sell|popular|trending/,
    reply: popular,
  },
  {
    re: /track|order status|where (is|are) my|my order/,
    reply: {
      text: "You can follow your order from Your Orders by choosing Track package. The status moves through Placed, Confirmed, Packed, Shipped and Delivered.",
      links: [{ label: "Open Your Orders", to: ROUTES.orders }],
    },
  },
  {
    re: /cancel/,
    reply: {
      text: "You can cancel an order yourself from Your Orders while its status is Placed, Confirmed or Packed. Once it is Shipped it can't be cancelled, but you can return it after delivery. Any amount paid is refunded to your original payment method.",
      links: [{ label: "Open Your Orders", to: ROUTES.orders }],
    },
  },
  {
    re: /return|refund|replace|damaged|defective|wrong item|exchange/,
    reply: {
      text: "You can request a return within 7 days of delivery. Open Your Orders and choose Return items on the delivered order. The item should be unused and in its original packaging.\n\nIf it arrived damaged, defective or wrong, we'll arrange a replacement or a full refund. Refunds go to your original payment method within 5 to 10 business days after we receive and inspect the item.",
      links: [{ label: "Open Your Orders", to: ROUTES.orders }],
    },
  },
  {
    re: /(delivery|shipping)\s*(charge|fee|cost|price)|free (delivery|shipping)/,
    reply: {
      text: "Delivery is free on orders of ₹499 or more after discounts. Below ₹499 a ₹40 delivery fee applies. The exact charge is always shown in your order summary before you place the order.",
    },
  },
  {
    re: /deliver|shipping|arrive|how long|when will|dispatch/,
    reply: {
      text: "Orders are usually packed within 1 to 2 business days. After dispatch, delivery takes about 3 to 7 business days depending on your location. Enter your pincode at checkout to confirm we deliver to your area.",
    },
  },
  {
    re: /\b(pay|payment|upi|card|cod|cash on delivery|netbanking)\b/,
    reply: {
      text: "You can pay with UPI, cards or Cash on Delivery. For Cash on Delivery, please keep the exact amount ready. We don't store full card numbers on our servers.",
    },
  },
  {
    re: /coupon|promo|voucher|discount|offer|welcome10|flat100/,
    reply: {
      text: "Here are the current codes:\n• WELCOME10: 10% off on orders of ₹500 or more (up to ₹200)\n• FLAT100: ₹100 off on orders of ₹999 or more\n\nEnter the code at checkout.",
    },
  },
  {
    re: /warranty|genuine|authentic|original/,
    reply: {
      text: "Our products are genuine and come with a 1-year brand warranty. Returns are easy within 7 days of delivery.",
    },
  },
  {
    re: /password|login|log in|sign in|sign up|register|account|profile/,
    reply: {
      text: "You can update your name, phone number, addresses and password from Your Account. You can sign in or create an account from the login page.",
      links: [
        { label: "Your Account", to: ROUTES.account },
        { label: "Sign in", to: ROUTES.login },
      ],
    },
  },
  {
    re: /contact|support|call|email|human|agent|complain|talk to/,
    reply: {
      text: `You can reach our team at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE} (Monday to Saturday, 10 am to 6 pm). Please include your order number so we can help you faster. We usually reply within one business day.`,
      links: [{ label: "Contact page", to: "/contact" }],
    },
  },
];

async function answer(text) {
  const t = text.toLowerCase();
  try {
    const hit = FAQ.find((f) => f.re.test(t));
    if (hit) return typeof hit.reply === "function" ? await hit.reply() : hit.reply;
    const { label, items } = await findProducts(text);
    if (items.length) return { text: "Here is what I found:", products: items };
    if (label)
      return {
        text: `I couldn't find "${label}" in our store. Try another name, or browse everything.`,
        links: [{ label: "Browse all products", to: "/search" }],
      };
  } catch {
    return {
      text: "I couldn't reach the store just now. Please try again in a moment.",
    };
  }
  return { text: FALLBACK };
}

function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* ignore */
  }
  return [GREETING];
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30)));
    } catch {
      /* ignore */
    }
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(raw) {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text }]);
    setBusy(true);
    const reply = await answer(text);
    setMsgs((m) => [...m, { from: "bot", ...reply }]);
    setBusy(false);
  }

  return (
    <>
      {!open && (
        <button
          className="cb-fab"
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
        >
          <MessageCircle size={26} />
        </button>
      )}
      {open && (
        <section
          className="cb-panel"
          role="dialog"
          aria-label="Customer support chat"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <header className="cb-head">
            <div>
              <strong>Orvixa Assistant</strong>
              <span>Orders, delivery, returns and more</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={20} />
            </button>
          </header>

          <div className="cb-log" ref={logRef} role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`cb-msg ${m.from}`}>
                <p>{m.text}</p>
                {m.links && (
                  <div className="cb-links">
                    {m.links.map((l) => (
                      <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
                {m.products && (
                  <div className="cb-products">
                    {m.products.map((p) => (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        onClick={() => setOpen(false)}
                      >
                        <img
                          src={imgUrl(p.images?.[0])}
                          alt=""
                          width="44"
                          height="44"
                          loading="lazy"
                        />
                        <span>
                          {p.title}
                          <b>{inr(p.price)}</b>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="cb-msg bot">
                <p className="cb-typing">Typing…</p>
              </div>
            )}
          </div>

          <div className="cb-chips">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => send(c)} disabled={busy}>
                {c}
              </button>
            ))}
          </div>

          <form
            className="cb-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              aria-label="Your message"
              maxLength={200}
            />
            <button type="submit" aria-label="Send message" disabled={busy}>
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}