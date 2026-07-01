import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

const SIZE = 180;

export default function CursorGlow() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-SIZE);
  const y = useMotionValue(-SIZE);
  const springX = useSpring(x, { damping: 25, stiffness: 150, mass: 0.3 });
  const springY = useSpring(y, { damping: 25, stiffness: 150, mass: 0.3 });

  useEffect(() => {
    if (reduceMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);

    const handleMove = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [reduceMotion, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        marginLeft: -SIZE / 2,
        marginTop: -SIZE / 2,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,169,116,0.12) 0%, transparent 68%)',
        pointerEvents: 'none',
        zIndex: 40,
        mixBlendMode: 'lighten',
        x: springX,
        y: springY,
      }}
    />
  );
}
