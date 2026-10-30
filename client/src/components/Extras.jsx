import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/* Scroll progress bar (top) and floating back-to-top button. */
export default function Extras() {
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
        setShow(window.scrollY > 600);
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" style={{ transform: `scaleX(${reduce ? 0 : p})` }} />
      <AnimatePresence>
        {show && (
          <motion.button
            className="to-top-fab"
            aria-label="Back to top"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            whileHover={reduce ? undefined : { y: -3 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}