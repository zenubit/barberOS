import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Shared';
import { formatCOP } from '../data/businessData';
import { useAuth } from '../contexts/AuthContext';
import servicesService from '../services/servicesService';
import barbersService from '../services/barbersService';
import appointmentsService from '../services/appointmentsService';
import { todayISO, toISODate } from '../lib/date';

const STEPS = ['Servicio', 'Barbero', 'Fecha y hora', 'Confirmar'];

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
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(43,233,212,.14)' }}>
          <Icon name="Check" size={28} style={{ color: 'var(--teal)' }} />
        </div>
        <h1 className="font-display font-bold text-2xl mb-3">Cita confirmada</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
          {selectedService?.name} con {selectedBarber?.name} el {selectedDate} a las {selectedTime}.
        </p>
        <button onClick={() => navigate('/perfil')} className="btn-teal">Ver mis citas</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      {/* Stepper */}
      <div className="flex items-center gap-3 mb-12">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                {i < step ? <Icon name="Check" size={14} /> : i + 1}
              </div>
              <span className="hidden sm:inline text-xs font-mono" style={{ color: i === step ? 'var(--teal)' : 'var(--ink-faint)' }}>{label}</span>
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

      {/* Step 0: Servicio */}
      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedService(s)}
              className="surface p-5 text-left transition-all cursor-pointer"
              style={selectedService?.id === s.id ? { borderColor: 'var(--teal)', boxShadow: '0 0 0 1px var(--teal)' } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display font-semibold">{s.name}</h3>
                <span className="font-mono text-teal-glow font-semibold">{formatCOP(s.price)}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{s.duration_minutes} min · {s.subtitle}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Barbero */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {barbers.length === 0 ? (
            <p className="col-span-full text-sm" style={{ color: 'var(--ink-faint)' }}>
              No hay trabajadores asignados a este servicio todavía.
            </p>
          ) : barbers.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBarber(b)}
              className="surface p-5 text-center transition-all cursor-pointer"
              style={selectedBarber?.id === b.id ? { borderColor: 'var(--teal)', boxShadow: '0 0 0 1px var(--teal)' } : {}}
            >
              {b.photo_url ? (
                <img src={b.photo_url} alt={b.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-3" style={{ background: 'var(--surface-3)' }} />
              ) : (
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center font-mono font-bold mb-3" style={{ background: 'var(--surface-3)', color: 'var(--teal)' }}>
                  {b.name?.[0] || '?'}
                </div>
              )}
              <p className="text-sm font-medium">{b.name}</p>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{b.role}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Fecha y hora */}
      {step === 2 && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            {days.map(d => {
              const iso = toISODate(d);
              const active = iso === selectedDate;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className="flex-shrink-0 w-16 py-3 rounded-lg text-center font-mono transition-all cursor-pointer"
                  style={{
                    background: active ? 'var(--teal)' : 'var(--surface-2)',
                    color: active ? 'var(--accent-ink)' : 'var(--ink)',
                    border: `1px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
                  }}
                >
                  <div className="text-[10px] uppercase opacity-80">{d.toLocaleDateString('es-CO', { weekday: 'short' })}</div>
                  <div className="text-sm font-semibold">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Buscando horarios disponibles...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Sin horarios este día. Prueba otra fecha.</p>
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
        </div>
      )}

      {/* Step 3: Confirmar */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="surface p-5">
            <h3 className="font-display font-semibold mb-3">Resumen</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
              <p>Servicio: <span style={{ color: 'var(--ink)' }}>{selectedService?.name}</span></p>
              <p>Barbero: <span style={{ color: 'var(--ink)' }}>{selectedBarber?.name}</span></p>
              <p>Fecha: <span className="font-mono" style={{ color: 'var(--ink)' }}>{selectedDate} · {selectedTime}</span></p>
              <p>Precio: <span className="font-mono text-teal-glow">{formatCOP(selectedService?.price || 0)}</span></p>
            </div>
          </div>

          <div className="grid gap-4">
            <input className="input" placeholder="Nombre completo" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
            <input className="input" placeholder="Teléfono" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
            <input className="input" placeholder="Correo (opcional)" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
          </div>
        </div>
      )}

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
