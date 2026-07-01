import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { formatCOP } from '../../data/businessData';
import appointmentsService from '../../services/appointmentsService';
import barbersService from '../../services/barbersService';

const STATUSES = ['pending', 'confirmed', 'in-chair', 'completed', 'no-show', 'cancelled', 'late-cancelled'];

export default function AppointmentsManager() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', barberId: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        appointmentsService.getAllAppointments({
          date: filters.date || undefined,
          status: filters.status || undefined,
          barberId: filters.barberId || undefined,
        }),
        barbersService.getAllBarbers(true),
      ]);
      setAppointments(a || []);
      setBarbers(b || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const changeStatus = async (id, status) => {
    await appointmentsService.updateAppointment(id, { status });
    await load();
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-6">Citas</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" className="input !w-auto" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
        <select className="input !w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Todos los estados</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input !w-auto" value={filters.barberId} onChange={e => setFilters({ ...filters, barberId: e.target.value })}>
          <option value="">Todos los trabajadores</option>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p> : (
        <div className="surface overflow-hidden overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Trabajador</th><th>Precio</th><th>Estado</th></tr></thead>
            <tbody>
              {appointments.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin citas para este filtro.</td></tr>
              )}
              {appointments.map(a => (
                <tr key={a.id}>
                  <td className="font-mono">{a.appointment_date} {a.appointment_time?.slice(0,5)}</td>
                  <td>{a.client_name}<br /><span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{a.client_phone}</span></td>
                  <td>{a.services?.name}</td>
                  <td>{a.barbers?.name}</td>
                  <td className="font-mono text-teal-glow">{formatCOP(a.services?.price || 0)}</td>
                  <td>
                    <select
                      className="input !py-1.5 !text-xs !w-auto"
                      value={a.status}
                      onChange={e => changeStatus(a.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
