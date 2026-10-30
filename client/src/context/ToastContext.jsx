import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const reduce = useReducedMotion();
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((a) => [...a.slice(-3), { id, message, type }]);
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} className={`toast ${t.type}`} role="status" layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }} transition={{ duration: .25 }}>
              {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{t.message}</span>
              <i className="toast-bar" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
