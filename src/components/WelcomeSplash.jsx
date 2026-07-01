import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Shared';

const KEY = 'barberos-welcomed';

export default function WelcomeSplash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: skip persistence */ }
    const timer = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--bg)', zIndex: 100 }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onClick={() => setShow(false)}
        >
          <motion.div
            className="text-center px-6"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex justify-center"
            >
              <Logo size={72} showText={false} />
            </motion.div>
            <motion.h1
              className="font-display font-semibold text-2xl sm:text-3xl mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              Bienvenido a <span className="text-teal-glow">BarberOS</span>
            </motion.h1>
            <motion.p
              className="text-sm mt-2"
              style={{ color: 'var(--ink-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Agendamiento inteligente para barberías
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
