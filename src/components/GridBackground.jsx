import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ORBS = [
  { size: 560, top: '-14%', left: '-8%', color: 'rgba(31,229,214,0.18)', duration: 34 },
  { size: 460, top: '58%', left: '80%', color: 'rgba(212,165,116,0.14)', duration: 40 },
  { size: 380, top: '82%', left: '2%', color: 'rgba(31,229,214,0.12)', duration: 30 },
];

const STAR_COLORS = ['var(--chrome)', 'var(--chrome)', 'var(--chrome)', 'var(--teal)', 'var(--gold)'];

function makeStars(count) {
  return Array.from({ length: count }, (_, i) => {
    const sizeRoll = Math.random();
    return {
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: sizeRoll < 0.7 ? 1 : sizeRoll < 0.92 ? 2 : 3,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      duration: 2.5 + Math.random() * 3.5,
      delay: Math.random() * 6,
    };
  });
}

function makeMeteors(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${4 + Math.random() * 38}%`,
    left: `${Math.random() * 65}%`,
    delay: i * 5 + Math.random() * 4,
    repeatDelay: 7 + Math.random() * 8,
  }));
}

export default function GridBackground() {
  const reduceMotion = useReducedMotion();
  const stars = useMemo(() => makeStars(150), []);
  const meteors = useMemo(() => makeMeteors(4), []);

  return (
    <div className="grid-bg" aria-hidden="true">
      {!reduceMotion && ORBS.map((o, i) => (
        <motion.div
          key={`orb-${i}`}
          style={{
            position: 'absolute', width: o.size, height: o.size, top: o.top, left: o.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: 'blur(14px)',
          }}
          animate={{ x: [0, 36, -24, 0], y: [0, -24, 30, 0] }}
          transition={{ duration: o.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={reduceMotion ? {} : { x: [0, 6, -4, 0], y: [0, -4, 5, 0] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'easeInOut' }}
      >
        {stars.map(s => (
          <motion.div
            key={`star-${s.id}`}
            style={{
              position: 'absolute', top: s.top, left: s.left, width: s.size, height: s.size,
              borderRadius: '50%', background: s.color,
              boxShadow: s.size >= 2 ? `0 0 ${s.size * 2}px 0.5px currentColor` : 'none',
              color: s.color,
            }}
            animate={reduceMotion ? { opacity: 0.55 } : { opacity: [0.12, 0.95, 0.12] }}
            transition={reduceMotion ? {} : { duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {!reduceMotion && meteors.map(m => (
        <motion.div
          key={`meteor-${m.id}`}
          style={{
            position: 'absolute', top: m.top, left: m.left, width: 2, height: 2, borderRadius: '50%',
            background: 'var(--gold-dim)',
            boxShadow: '0 0 8px 1.5px rgba(212,165,116,0.6)',
          }}
          initial={{ opacity: 0 }}
          animate={{
            x: [0, 280],
            y: [0, 175],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatDelay: m.repeatDelay,
            delay: m.delay,
            ease: 'easeIn',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 0, right: 2, width: 110, height: 1,
              background: 'linear-gradient(90deg, rgba(212,165,116,0.85), transparent)',
              transform: 'rotate(210deg)', transformOrigin: 'right center',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
