import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { ErrorBanner, TableSkeleton } from './AdminShared';
import rafflesService from '../../services/rafflesService';

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function RafflesManager() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(currentMonthISO());
  const [eligible, setEligible] = useState(null);
  const [checkingEligible, setCheckingEligible] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRaffles(await rafflesService.getRaffles() || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los sorteos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const checkEligible = async () => {
    setCheckingEligible(true);
    setError(null);
    try {
      setEligible(await rafflesService.getEligibleUsers(month) || []);
    } catch (err) {
      setError(err.message || 'No se pudo consultar los elegibles');
    } finally {
      setCheckingEligible(false);
    }
  };

  const drawRaffle = async () => {
    if (!confirm(`¿Ejecutar el sorteo del mes ${month.slice(0, 7)}? Esta acción no se puede deshacer.`)) return;
    setDrawing(true);
    setError(null);
    try {
      await rafflesService.executeRaffle(month);
      setEligible(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo ejecutar el sorteo');
    } finally {
      setDrawing(false);
    }
  };

  const markRedeemed = async (id) => {
    setError(null);
    try {
      await rafflesService.redeemPrize(id);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo marcar como redimido');
    }
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-6">Sorteos</h2>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="surface p-5 mb-8">
        <h3 className="font-display font-semibold mb-4">Ejecutar sorteo mensual</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs" style={{ color: 'var(--ink-faint)' }}>
            Mes
            <input type="month" className="input mt-1" value={month.slice(0, 7)} onChange={e => setMonth(`${e.target.value}-01`)} />
          </label>
          <button onClick={checkEligible} disabled={checkingEligible} className="btn-ghost !py-2.5 !text-xs">
            {checkingEligible ? 'Consultando...' : 'Ver elegibles'}
          </button>
          <button onClick={drawRaffle} disabled={drawing} className="btn-teal !py-2.5 !text-xs flex items-center gap-2">
            <Icon name="Gift" size={14} /> {drawing ? 'Sorteando...' : 'Ejecutar sorteo'}
          </button>
        </div>

        {eligible && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--ink-faint)' }}>
              {eligible.length} cliente{eligible.length !== 1 ? 's' : ''} elegible{eligible.length !== 1 ? 's' : ''} (2+ citas completadas este mes)
            </p>
            {eligible.length > 0 && (
              <ul className="text-sm space-y-1">
                {eligible.map(u => (
                  <li key={u.user_id} style={{ color: 'var(--ink-muted)' }}>
                    {u.full_name} · {u.completed_appointments} citas
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <h3 className="font-display font-semibold mb-4">Historial</h3>
      {loading ? <div className="surface overflow-hidden"><TableSkeleton cols={5} /></div> : (
        <div className="surface overflow-hidden overflow-x-auto">
          <table className="table">
            <thead><tr><th>Mes</th><th>Ganador</th><th>Elegibles</th><th>Expira</th><th>Estado</th></tr></thead>
            <tbody>
              {raffles.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin sorteos todavía.</td></tr>
              )}
              {raffles.map(r => (
                <tr key={r.id}>
                  <td className="font-mono">{r.raffle_month?.slice(0, 7)}</td>
                  <td>{r.profiles ? `${r.profiles.first_name} ${r.profiles.first_lastname}` : '—'}</td>
                  <td className="font-mono">{r.eligible_count}</td>
                  <td className="font-mono text-xs">{r.prize_expires_at ? new Date(r.prize_expires_at).toLocaleDateString('es-CO') : '—'}</td>
                  <td>
                    {r.prize_redeemed ? (
                      <span className="pill pill-green">Redimido</span>
                    ) : (
                      <button onClick={() => markRedeemed(r.id)} className="pill pill-amber cursor-pointer">Marcar redimido</button>
                    )}
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
