import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

const SIZE = 260;

export default function CursorGlow() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-SIZE);
  const y = useMotionValue(-SIZE);
  const springX = useSpring(x, { damping: 28, stiffness: 180, mass: 0.5 });
  const springY = useSpring(y, { damping: 28, stiffness: 180, mass: 0.5 });

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
        background: 'radial-gradient(circle, rgba(31,229,214,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 45,
        mixBlendMode: 'screen',
        x: springX,
        y: springY,
      }}
    />
  );
}
