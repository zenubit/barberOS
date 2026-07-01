import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon, Skeleton } from '../components/Shared';
import { useAuth } from '../contexts/AuthContext';
import rafflesService from '../services/rafflesService';

const PRIZE_LABELS = {
  free_cut: 'Corte gratis',
  free_service: 'Servicio gratis',
  discount: 'Descuento especial',
};

function monthLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function Raffles() {
  const { isLoggedIn, user } = useAuth();
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await rafflesService.getRaffles();
        if (mounted) setRaffles(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const thisMonth = currentMonthStart();
  const currentRaffle = raffles.find(r => r.raffle_month === thisMonth);
  const pastRaffles = raffles.filter(r => r.raffle_month !== thisMonth);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-24 md:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <span className="font-display italic text-base" style={{ color: 'var(--teal)' }}>Sorteos</span>
        <h1 className="font-display font-semibold text-3xl md:text-4xl mt-1">Premios mensuales</h1>
        <p className="mt-3 max-w-xl text-sm" style={{ color: 'var(--ink-muted)' }}>
          Cada mes sorteamos un premio entre los clientes que completaron al menos una cita.
          Agenda y asiste a tu cita para entrar automáticamente.
        </p>
      </motion.div>

      {/* Sorteo del mes actual */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hud glass-panel p-8 md:p-10 mb-10 text-center"
      >
        <span className="hud-bl" /><span className="hud-br" />
        <Icon name="Gift" size={32} style={{ color: 'var(--gold)' }} className="mx-auto mb-4" />
        <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--ink-faint)' }}>
          Sorteo de {monthLabel(thisMonth)}
        </p>

        {loading ? (
          <Skeleton className="h-8 w-48 mx-auto rounded" />
        ) : currentRaffle ? (
          <>
            <h2 className="font-display font-bold text-2xl mb-2">
              {PRIZE_LABELS[currentRaffle.prize_type] || 'Premio especial'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              {currentRaffle.winner_id
                ? (currentRaffle.profiles
                    ? `Ganador: ${currentRaffle.profiles.first_name} ${currentRaffle.profiles.first_lastname}`
                    : (currentRaffle.winner_id === user?.id ? '¡Tú ganaste este sorteo! 🎉' : 'Ya tenemos ganador'))
                : 'Sorteo en proceso'}
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display font-bold text-2xl mb-2">Aún no se ha realizado</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--ink-muted)' }}>
              El sorteo de este mes se hace al cierre. Completa una cita para quedar habilitado.
            </p>
          </>
        )}

        {!isLoggedIn && (
          <Link to="/auth" className="btn-teal inline-flex items-center gap-2 mt-6">
            <Icon name="LogIn" size={16} /> Inicia sesión para participar
          </Link>
        )}
        {isLoggedIn && !currentRaffle?.winner_id && (
          <Link to="/reservar" className="btn-gold inline-flex items-center gap-2 mt-6">
            <Icon name="Calendar" size={16} /> Agenda tu cita
          </Link>
        )}
      </motion.div>

      {/* Historial */}
      {!loading && pastRaffles.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--ink)' }}>Ganadores anteriores</h3>
          <div className="space-y-3">
            {pastRaffles.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 8) * 0.05 }}
                className="surface p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,165,116,0.12)' }}>
                    <Icon name="Trophy" size={16} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{monthLabel(r.raffle_month)}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                      {PRIZE_LABELS[r.prize_type] || 'Premio especial'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {r.winner_id ? (
                    <p className="text-xs font-mono" style={{ color: 'var(--ink-muted)' }}>
                      {r.profiles
                        ? `${r.profiles.first_name} ${r.profiles.first_lastname}`
                        : (r.winner_id === user?.id ? 'Tú' : 'Cliente ganador')}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Sin ganador</p>
                  )}
                  {r.prize_redeemed && <span className="pill pill-green mt-1">Reclamado</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
