import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon, Skeleton } from '../Shared';

function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;
    const start = performance.now();

    let frame;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

export function KPI({ label, value, icon, format }) {
  const isNumber = typeof value === 'number';
  const animated = useCountUp(isNumber ? value : 0);
  const display = isNumber ? (format ? format(animated) : animated) : value;

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(43,233,212,0.14)' }}>
          <Icon name={icon} size={14} style={{ color: 'var(--teal)' }} />
        </span>
      </div>
      <div className="font-display text-2xl font-bold">{display}</div>
    </div>
  );
}

export function PlaceholderView({ name }) {
  return (
    <div className="surface p-12 text-center">
      <Icon name="Construction" size={32} className="mx-auto mb-4" style={{ color: 'var(--teal)' }} />
      <h3 className="text-xl font-medium">{name}</h3>
      <p className="text-sm mt-2" style={{ color: 'var(--ink-faint)' }}>Próximamente.</p>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="glass-panel w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: 'var(--ink-muted)' }}>
            <Icon name="X" size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-mono uppercase tracking-wide mb-1.5" style={{ color: 'var(--ink-faint)' }}>{label}</span>
      {children}
    </label>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between gap-3"
      style={{ background: 'rgba(239,68,68,.08)', color: '#ff8080', border: '1px solid rgba(239,68,68,.3)' }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Cerrar mensaje de error" className="shrink-0 cursor-pointer">
          <Icon name="X" size={14} />
        </button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
