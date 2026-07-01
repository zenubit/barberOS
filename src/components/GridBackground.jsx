import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ORBS = [
  { size: 460, top: '-8%', left: '-6%', color: 'rgba(43,233,212,0.14)', duration: 28 },
  { size: 380, top: '58%', left: '80%', color: 'rgba(139,155,168,0.14)', duration: 34 },
  { size: 300, top: '82%', left: '8%', color: 'rgba(43,233,212,0.09)', duration: 24 },
];

function makeStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() < 0.8 ? 1 : Math.random() < 0.95 ? 2 : 3,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5,
  }));
}

function makeMeteors(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${5 + Math.random() * 35}%`,
    left: `${Math.random() * 60}%`,
    delay: i * 4 + Math.random() * 3,
    repeatDelay: 6 + Math.random() * 6,
  }));
}

export default function GridBackground() {
  const reduceMotion = useReducedMotion();
  const stars = useMemo(() => makeStars(90), []);
  const meteors = useMemo(() => makeMeteors(3), []);

  return (
    <div className="grid-bg" aria-hidden="true">
      {!reduceMotion && ORBS.map((o, i) => (
        <motion.div
          key={`orb-${i}`}
          style={{
            position: 'absolute', width: o.size, height: o.size, top: o.top, left: o.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 25, 0] }}
          transition={{ duration: o.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {stars.map(s => (
        <motion.div
          key={`star-${s.id}`}
          style={{
            position: 'absolute', top: s.top, left: s.left, width: s.size, height: s.size,
            borderRadius: '50%', background: 'var(--chrome)',
          }}
          animate={reduceMotion ? { opacity: 0.5 } : { opacity: [0.15, 0.9, 0.15] }}
          transition={reduceMotion ? {} : { duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {!reduceMotion && meteors.map(m => (
        <motion.div
          key={`meteor-${m.id}`}
          style={{
            position: 'absolute', top: m.top, left: m.left, width: 2, height: 2, borderRadius: '50%',
            background: 'var(--ink)',
            boxShadow: '0 0 6px 1px rgba(43,233,212,0.8)',
          }}
          initial={{ opacity: 0 }}
          animate={{
            x: [0, 260],
            y: [0, 160],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            repeatDelay: m.repeatDelay,
            delay: m.delay,
            ease: 'easeIn',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 0, right: 2, width: 90, height: 1,
              background: 'linear-gradient(90deg, rgba(43,233,212,0.9), transparent)',
              transform: 'rotate(210deg)', transformOrigin: 'right center',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
