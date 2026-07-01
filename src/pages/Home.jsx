import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon, Skeleton } from '../components/Shared';
import { formatCOP } from '../data/businessData';
import servicesService from '../services/servicesService';
import barbersService from '../services/barbersService';

const FEATURES = [
  { icon: 'Users', title: 'Varios trabajadores', desc: 'Cada barbero con su propio horario, servicios y disponibilidad.' },
  { icon: 'Layers', title: 'Varios servicios', desc: 'Duración y capacidad configurables por servicio.' },
  { icon: 'CalendarClock', title: 'Bloqueos inteligentes', desc: 'Almuerzo, días libres o vacaciones sin pisar turnos.' },
  { icon: 'Star', title: 'Clientes frecuentes', desc: 'Franjas reservadas para quienes ya son de la casa.' },
];

function handleSpotlight(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export default function Home() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, b] = await Promise.all([servicesService.getAllServices(), barbersService.getAllBarbers()]);
        if (mounted) { setServices(s || []); setBarbers(b || []); }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pill pill-teal mb-6">
            <span className="cursor-blink">●</span> reservas abiertas
          </div>
          <h1
            className="font-display font-semibold leading-[1.05] max-w-3xl"
            style={{ fontSize: 'clamp(2.5rem, 2rem + 4vw, 4.5rem)' }}
          >
            Agenda tu cita <span className="text-teal-glow italic">en segundos</span><span className="cursor-blink">_</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] md:text-[17px]" style={{ color: 'var(--ink-muted)' }}>
            Elige tu servicio, tu barbero de confianza y el horario que más te convenga.
            Disponibilidad real, sin cruces ni sorpresas.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/reservar" className="btn-teal inline-flex items-center gap-2">
              <Icon name="Calendar" size={16} /> Reservar ahora
            </Link>
            <a href="#servicios" className="btn-ghost inline-flex items-center gap-2">
              Ver servicios <Icon name="ArrowDown" size={14} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onMouseMove={handleSpotlight}
              className="hud surface spotlight-card p-6"
            >
              <span className="hud-bl" /><span className="hud-br" />
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(43,233,212,0.14)' }}>
                <Icon name={f.icon} size={18} style={{ color: 'var(--teal)' }} />
              </div>
              <h3 className="font-display font-semibold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="max-w-6xl mx-auto px-5 sm:px-8 pb-24 scroll-mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-display italic text-base" style={{ color: 'var(--teal)' }}>Servicios</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-1">Qué puedes agendar</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="glass-panel p-6">
                <Skeleton className="h-5 w-2/3 rounded mb-3" />
                <Skeleton className="h-4 w-1/2 rounded mb-6" />
                <Skeleton className="h-6 w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="surface p-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
            Aún no hay servicios configurados. Agrégalos desde el panel admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="glass-panel p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg">{s.name}</h3>
                  <span className="pill pill-teal">{s.duration_minutes} min</span>
                </div>
                {s.subtitle && <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>{s.subtitle}</p>}
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-teal-glow">{formatCOP(s.price)}</span>
                  <Link to="/reservar" className="text-xs font-medium hover:opacity-80" style={{ color: 'var(--teal)' }}>
                    Reservar →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Equipo */}
      {barbers.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
          <span className="font-display italic text-base" style={{ color: 'var(--teal)' }}>Equipo</span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl mt-1 mb-8">Nuestros barberos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {barbers.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
                className="surface p-5 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center font-mono font-bold text-lg mb-3" style={{ background: 'var(--surface-3)', color: 'var(--teal)' }}>
                  {b.name?.[0] || '?'}
                </div>
                <p className="font-medium text-sm">{b.name}</p>
                <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{b.role}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        <div className="hud glass-panel p-10 md:p-14 text-center">
          <span className="hud-bl" /><span className="hud-br" />
          <h2 className="font-display font-bold text-2xl md:text-4xl mb-4">
            ¿Listo para tu próxima cita<span className="cursor-blink">_</span>?
          </h2>
          <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: 'var(--ink-muted)' }}>
            Reserva en menos de un minuto, sin llamadas ni esperas.
          </p>
          <Link to="/reservar" className="btn-teal inline-flex items-center gap-2">
            <Icon name="Calendar" size={16} /> Reservar cita
          </Link>
        </div>
      </section>
    </div>
  );
}
