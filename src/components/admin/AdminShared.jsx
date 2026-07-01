import React from 'react';
import { Icon } from '../Shared';

export function KPI({ label, value, icon }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,245,212,0.1)' }}>
          <Icon name={icon} size={14} style={{ color: 'var(--teal)' }} />
        </span>
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: 'var(--ink-muted)' }}>
            <Icon name="X" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
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
