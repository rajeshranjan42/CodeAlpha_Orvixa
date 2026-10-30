import { useEffect, useRef, useState, useCallback } from 'react';

export function useFetch(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true, error: null });
  const run = useCallback(() => {
    let live = true;
    set((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => live && set({ data, loading: false, error: null }))
      .catch((error) => live && set({ data: null, loading: false, error }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(run, [run]);
  return { ...state, reload: run };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function useFocusTrap(active, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const prev = document.activeElement;
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    (el.querySelector(sel) || el).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key !== 'Tab') return;
      const nodes = [...el.querySelectorAll(sel)];
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [active, onClose]);
  return ref;
}

export function flyToCart(imgEl) {
  const target = document.getElementById('cart-icon');
  if (!imgEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = imgEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const clone = imgEl.cloneNode();
  Object.assign(clone.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', zIndex: 9999, pointerEvents: 'none', objectFit: 'cover', borderRadius: '8px', transformOrigin: 'center' });
  document.body.appendChild(clone);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = clone.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(.1)`, opacity: .4 },
  ], { duration: 550, easing: 'cubic-bezier(.5,0,.75,0)' });
  anim.onfinish = () => clone.remove();
}
