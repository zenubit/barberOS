import React, { useEffect, useState } from 'react';
import { ErrorBanner, TableSkeleton } from './AdminShared';
import usersService from '../../services/usersService';
import barbersService from '../../services/barbersService';
import BarbersManager from './BarbersManager';

const ROLES = [
  { value: 'customer', label: 'Cliente' },
  { value: 'barber', label: 'Barbero' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];
const STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'suspended', label: 'Suspendido' },
];

function UsersTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setProfiles(await usersService.getAllProfiles() || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (profile, role) => {
    if (role === profile.role) return;
    setBusyId(profile.id);
    setError(null);
    try {
      await usersService.updateRole(profile.id, role);

      if (role !== 'customer') {
        const existing = await barbersService.getBarberByProfileId(profile.id);
        if (!existing) {
          await barbersService.createBarber({
            profile_id: profile.id,
            name: `${profile.first_name} ${profile.first_lastname}`.trim(),
            role: role === 'super_admin' ? 'Super admin' : role === 'admin' ? 'Admin' : 'Barbero',
            phone: profile.phone || null,
            email: profile.email || null,
            status: 'active',
          });
        }
      }
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (profile, status) => {
    if (status === profile.status) return;
    setBusyId(profile.id);
    setError(null);
    try {
      await usersService.updateStatus(profile.id, status);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      {loading ? <div className="surface overflow-hidden"><TableSkeleton cols={4} /></div> : (
        <div className="surface overflow-hidden overflow-x-auto">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Correo / teléfono</th><th>Rol</th><th>Estado</th></tr></thead>
            <tbody>
              {profiles.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin usuarios todavía.</td></tr>
              )}
              {profiles.map(p => (
                <tr key={p.id}>
                  <td>{p.first_name} {p.first_lastname}</td>
                  <td>
                    <span className="text-xs">{p.email}</span><br />
                    <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{p.phone || '—'}</span>
                  </td>
                  <td>
                    <select
                      className="input !py-1.5 !text-xs !w-auto"
                      value={p.role}
                      disabled={busyId === p.id}
                      aria-label={`Rol de ${p.first_name}`}
                      onChange={e => changeRole(p, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="input !py-1.5 !text-xs !w-auto"
                      value={p.status}
                      disabled={busyId === p.id}
                      aria-label={`Estado de ${p.first_name}`}
                      onChange={e => changeStatus(p, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

export default function TeamManager() {
  const [tab, setTab] = useState('users');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl">Usuarios y equipo</h2>
      </div>

      <div className="flex gap-2 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {[{ id: 'users', label: 'Usuarios' }, { id: 'barbers', label: 'Trabajadores' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer"
            style={tab === t.id ? { background: 'var(--teal)', color: 'var(--accent-ink)' } : { color: 'var(--ink-muted)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersTab /> : <BarbersManager />}
    </div>
  );
}
