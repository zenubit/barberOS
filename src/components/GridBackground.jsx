import React from 'react';
import { motion } from 'framer-motion';

export default function GridBackground() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,245,212,.25), transparent)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
