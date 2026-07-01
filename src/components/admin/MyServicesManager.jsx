import React, { useEffect, useState } from 'react';
import { formatCOP } from '../../data/businessData';
import { ErrorBanner } from './AdminShared';
import servicesService from '../../services/servicesService';
import barbersService from '../../services/barbersService';

export default function MyServicesManager({ barberId }) {
  const [services, setServices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        servicesService.getAllServicesAdmin(),
        barbersService.getBarberServiceIds(barberId),
      ]);
      setServices(all || []);
      setSelectedIds(mine || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (barberId) load(); }, [barberId]);

  const toggle = async (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    setSelectedIds(next);
    setSaving(true);
    setError(null);
    try {
      await barbersService.setBarberServices(barberId, next);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la selección');
      setSelectedIds(selectedIds);
    } finally {
      setSaving(false);
    }
  };

  if (!barberId) {
    return <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No tienes una ficha de barbero vinculada todavía.</p>;
  }

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-2">Mis servicios</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
        Elige qué cortes del catálogo ofreces. El catálogo (precios y duración) lo administra el super admin.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p>
      ) : services.length === 0 ? (
        <div className="surface p-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
          Aún no hay servicios en el catálogo. Pídele al super admin que los cree.
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(s => (
            <label
              key={s.id}
              className="surface p-4 flex items-center justify-between gap-3 cursor-pointer"
              style={selectedIds.includes(s.id) ? { borderColor: 'var(--teal)' } : {}}
            >
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.includes(s.id)} disabled={saving} onChange={() => toggle(s.id)} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{s.duration_minutes} min</p>
                </div>
              </div>
              <span className="font-mono text-sm text-teal-glow">{formatCOP(s.price)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
