import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Shared';
import { formatCOP } from '../data/businessData';
import { useAuth } from '../contexts/AuthContext';
import servicesService from '../services/servicesService';
import barbersService from '../services/barbersService';
import appointmentsService from '../services/appointmentsService';
import { todayISO, toISODate } from '../lib/date';

const STEPS = [
  { label: 'Servicio', icon: 'Scissors' },
  { label: 'Barbero', icon: 'UserCheck' },
  { label: 'Fecha y hora', icon: 'CalendarDays' },
  { label: 'Confirmar', icon: 'Check' },
];

const fadeStep = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

function nextDays(n) {
  const days = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function Booking() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await servicesService.getAllServices();
      setServices(s || []);
      // Si venimos de "Reservar" en una tarjeta de servicio del Home,
      // preseleccionamos ese servicio y avanzamos directo a elegir barbero.
      const preselectId = location.state?.serviceId;
      if (preselectId) {
        const match = (s || []).find(sv => sv.id === preselectId);
        if (match) { setSelectedService(match); setStep(1); }
      }
    })();
  }, []);

  useEffect(() => {
    if (profile) {
      setContact({
        name: `${profile.first_name || ''} ${profile.first_lastname || ''}`.trim(),
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!selectedService) return;
    (async () => {
      const b = await barbersService.getBarbersByService(selectedService.id);
      setBarbers(b || []);
      setSelectedBarber(null);
    })();
  }, [selectedService]);

  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return;
    setSelectedTime(null);
    setLoadingSlots(true);
    appointmentsService
      .getAvailableSlots(selectedBarber.id, selectedService.id, selectedDate, contact.phone || null)
      .then(setSlots)
      .catch(err => setError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [selectedBarber, selectedService, selectedDate]);

  const days = useMemo(() => nextDays(14), []);

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedBarber;
    if (step === 2) return !!selectedTime;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await appointmentsService.createAppointment({
        user_id: user?.id || null,
        client_name: contact.name,
        client_phone: contact.phone,
        client_email: contact.email || null,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        appointment_time: `${selectedTime}:00`,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'No se pudo crear la cita');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(43,233,212,.14)', border: '1px solid rgba(43,233,212,.3)' }}
        >
          <Icon name="PartyPopper" size={32} style={{ color: 'var(--teal)' }} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="font-display font-bold text-2xl mb-3"
        >
          Cita confirmada
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="glass-panel inline-block px-6 py-4 text-sm mb-8"
          style={{ color: 'var(--ink-muted)' }}
        >
          <span style={{ color: 'var(--ink)' }}>{selectedService?.name}</span> con{' '}
          <span style={{ color: 'var(--ink)' }}>{selectedBarber?.name}</span><br />
          {selectedDate} a las {selectedTime}
        </motion.p>
        <div>
          <button onClick={() => navigate('/perfil')} className="btn-teal">Ver mis citas</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      {/* Stepper */}
      <div className="flex items-center gap-2 sm:gap-3 mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2">
              <div className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                {i < step ? <Icon name="Check" size={14} /> : <Icon name={s.icon} size={14} />}
              </div>
              <span className="hidden sm:inline text-xs font-mono" style={{ color: i === step ? 'var(--teal)' : 'var(--ink-faint)' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.08)', color: '#ff8080', border: '1px solid rgba(239,68,68,.3)' }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 0: Servicio */}
        {step === 0 && (
          <motion.div key="step-0" {...fadeStep} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map(s => {
              const active = selectedService?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className="glass-panel p-5 text-left cursor-pointer relative"
                  style={active ? { borderColor: 'var(--teal)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px var(--teal), 0 0 24px -8px rgba(43,233,212,.4)' } : {}}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--teal)' }}>
                      <Icon name="Check" size={12} style={{ color: 'var(--accent-ink)' }} />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43,233,212,0.12)' }}>
                      <Icon name="Scissors" size={16} style={{ color: 'var(--teal)' }} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-display font-semibold">{s.name}</h3>
                      {s.subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{s.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
                      <Icon name="Clock3" size={12} /> {s.duration_minutes} min
                    </span>
                    <span className="font-mono text-sm text-teal-glow font-semibold">{formatCOP(s.price)}</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Step 1: Barbero */}
        {step === 1 && (
          <motion.div key="step-1" {...fadeStep} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {barbers.length === 0 ? (
              <p className="col-span-full text-sm glass-panel p-6 text-center" style={{ color: 'var(--ink-faint)' }}>
                No hay trabajadores asignados a este servicio todavía.
              </p>
            ) : barbers.map(b => {
              const active = selectedBarber?.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBarber(b)}
                  className="glass-panel p-5 text-center cursor-pointer relative"
                  style={active ? { borderColor: 'var(--teal)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px var(--teal), 0 0 24px -8px rgba(43,233,212,.4)' } : {}}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--teal)' }}>
                      <Icon name="Check" size={12} style={{ color: 'var(--accent-ink)' }} />
                    </span>
                  )}
                  {b.photo_url ? (
                    <img src={b.photo_url} alt={b.name} className="w-14 h-14 mx-auto rounded-full object-cover mb-3" style={{ background: 'var(--surface-3)' }} />
                  ) : (
                    <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center font-mono font-bold mb-3" style={{ background: 'var(--surface-3)', color: 'var(--teal)' }}>
                      {b.name?.[0] || '?'}
                    </div>
                  )}
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{b.role}</p>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Step 2: Fecha y hora */}
        {step === 2 && (
          <motion.div key="step-2" {...fadeStep}>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
              {days.map(d => {
                const iso = toISODate(d);
                const active = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className="flex-shrink-0 w-16 py-3 rounded-xl text-center font-mono cursor-pointer transition-all"
                    style={active
                      ? { background: 'linear-gradient(180deg, #2BE9D4 0%, #1FCCC0 50%, #0E8078 100%)', color: 'var(--accent-ink)', border: '1px solid #0E8078', boxShadow: '0 6px 16px -4px rgba(43,233,212,.4)' }
                      : { background: 'rgba(21,26,36,0.5)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-[10px] uppercase opacity-80">{d.toLocaleDateString('es-CO', { weekday: 'short' })}</div>
                    <div className="text-sm font-semibold">{d.getDate()}</div>
                  </button>
                );
              })}
            </div>

            {loadingSlots ? (
              <div className="glass-panel p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Buscando horarios disponibles...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Sin horarios este día. Prueba otra fecha.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map(s => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                    className={`slot ${!s.available ? 'disabled' : ''} ${selectedTime === s.time ? 'active' : ''}`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirmar */}
        {step === 3 && (
          <motion.div key="step-3" {...fadeStep} className="space-y-6">
            <div className="hud glass-panel p-6">
              <span className="hud-bl" /><span className="hud-br" />
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Icon name="Sparkles" size={16} style={{ color: 'var(--gold)' }} /> Resumen de tu cita
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--ink-faint)' }}>Servicio</span>
                  <span style={{ color: 'var(--ink)' }}>{selectedService?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--ink-faint)' }}>Barbero</span>
                  <span style={{ color: 'var(--ink)' }}>{selectedBarber?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--ink-faint)' }}>Fecha</span>
                  <span className="font-mono" style={{ color: 'var(--ink)' }}>{selectedDate} · {selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--ink-faint)' }}>Precio</span>
                  <span className="font-mono text-teal-glow font-semibold text-base">{formatCOP(selectedService?.price || 0)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <input className="input" placeholder="Nombre completo" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
              <input className="input" placeholder="Teléfono" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
              <input className="input" placeholder="Correo (opcional)" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className="btn-ghost"
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          Atrás
        </button>

        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-teal">
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !contact.name || !contact.phone}
            className="btn-teal"
          >
            {submitting ? 'Confirmando...' : 'Confirmar cita'}
          </button>
        )}
      </div>
    </div>
  );
}
