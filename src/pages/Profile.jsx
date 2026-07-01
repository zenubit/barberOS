import React, { useEffect, useState } from 'react';
import { Icon } from '../components/Shared';
import { formatCOP } from '../data/businessData';
import { useAuth } from '../contexts/AuthContext';
import appointmentsService from '../services/appointmentsService';

const STATUS_LABEL = {
  pending: { label: 'Pendiente', cls: 'pill-amber' },
  confirmed: { label: 'Confirmada', cls: 'pill-teal' },
  'in-chair': { label: 'En curso', cls: 'pill-teal' },
  completed: { label: 'Completada', cls: 'pill-green' },
  'no-show': { label: 'No asistió', cls: 'pill-red' },
  cancelled: { label: 'Cancelada', cls: 'pill-ink' },
  'late-cancelled': { label: 'Cancelada tarde', cls: 'pill-ink' },
};

export default function Profile() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await appointmentsService.getUserAppointments(user.id);
      setAppointments(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await appointmentsService.cancelAppointment(id);
      await load();
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">Hola, {profile?.first_name}</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--ink-muted)' }}>Este es tu historial de citas.</p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p>
      ) : appointments.length === 0 ? (
        <div className="surface p-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
          Aún no tienes citas agendadas.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => {
            const status = STATUS_LABEL[a.status] || STATUS_LABEL.pending;
            const cancellable = ['pending', 'confirmed'].includes(a.status);
            return (
              <div key={a.id} className="surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{a.services?.name || 'Servicio'}</h3>
                    <span className={`pill ${status.cls}`}>{status.label}</span>
                  </div>
                  <p className="text-xs font-mono" style={{ color: 'var(--ink-muted)' }}>
                    {a.appointment_date} · {a.appointment_time?.slice(0, 5)} · {a.barbers?.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-teal-glow">{formatCOP(a.services?.price || 0)}</span>
                  {cancellable && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancellingId === a.id}
                      className="btn-ghost !py-2 !px-3 !text-xs flex items-center gap-1.5"
                    >
                      <Icon name="X" size={13} /> {cancellingId === a.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
