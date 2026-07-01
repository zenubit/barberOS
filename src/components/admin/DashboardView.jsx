import React, { useEffect, useState } from 'react';
import { KPI } from './AdminShared';
import { formatCOP } from '../../data/businessData';
import appointmentsService from '../../services/appointmentsService';
import barbersService from '../../services/barbersService';
import servicesService from '../../services/servicesService';
import { todayISO } from '../../lib/date';

export default function DashboardView({ barberId = null }) {
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, revenue: 0, barbers: 0, services: 0 });
  const [todayList, setTodayList] = useState([]);

  useEffect(() => {
    (async () => {
      if (barberId) {
        const todayAppts = await appointmentsService.getAllAppointments({ date: todayISO(), barberId });
        const pending = todayAppts.filter(a => a.status === 'pending');
        const completed = todayAppts.filter(a => a.status === 'completed');
        const revenue = completed.reduce((sum, a) => sum + Number(a.services?.price || 0), 0);
        setStats({ today: todayAppts.length, pending: pending.length, completed: completed.length, revenue, barbers: 0, services: 0 });
        setTodayList(todayAppts);
        return;
      }

      const [todayAppts, pending, barbers, services] = await Promise.all([
        appointmentsService.getAllAppointments({ date: todayISO() }),
        appointmentsService.getAllAppointments({ status: 'pending' }),
        barbersService.getAllBarbers(),
        servicesService.getAllServicesAdmin(),
      ]);
      setStats({ today: todayAppts?.length || 0, pending: pending?.length || 0, completed: 0, revenue: 0, barbers: barbers?.length || 0, services: services?.length || 0 });
      setTodayList(todayAppts || []);
    })();
  }, [barberId]);

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-6">{barberId ? 'Mi día' : 'Dashboard'}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label={barberId ? 'Mis citas hoy' : 'Citas hoy'} value={stats.today} icon="Calendar" />
        <KPI label="Pendientes" value={stats.pending} icon="Clock" />
        {barberId ? (
          <>
            <KPI label="Completadas hoy" value={stats.completed} icon="CheckCircle2" />
            <KPI label="Ingresos hoy" value={stats.revenue} icon="Wallet" format={formatCOP} />
          </>
        ) : (
          <>
            <KPI label="Trabajadores" value={stats.barbers} icon="Users" />
            <KPI label="Servicios activos" value={stats.services} icon="Layers" />
          </>
        )}
      </div>

      <h3 className="font-display font-semibold mb-4">{barberId ? 'Mi agenda de hoy' : 'Agenda de hoy'}</h3>
      <div className="surface overflow-hidden overflow-x-auto">
        <table className="table">
          <thead><tr><th>Hora</th><th>Cliente</th><th>Servicio</th>{!barberId && <th>Trabajador</th>}<th>Estado</th></tr></thead>
          <tbody>
            {todayList.length === 0 && (
              <tr><td colSpan={barberId ? 4 : 5} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin citas hoy.</td></tr>
            )}
            {todayList.map(a => (
              <tr key={a.id}>
                <td className="font-mono">{a.appointment_time?.slice(0, 5)}</td>
                <td>{a.client_name}</td>
                <td>{a.services?.name}</td>
                {!barberId && <td>{a.barbers?.name}</td>}
                <td><span className="pill pill-teal">{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
