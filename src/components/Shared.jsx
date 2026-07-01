import React from 'react';
import * as LucideIcons from 'lucide-react';
import logo from '../assets/logo.png';

export const Icon = ({ name, size = 18, className = '', strokeWidth = 1.75, ...rest }) => {
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon) return <span className={className} {...rest} />;
  return <LucideIcon size={size} strokeWidth={strokeWidth} className={className} {...rest} />;
};

export const Logo = ({ size = 40, showText = true, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <img src={logo} alt="BarberOS" style={{ width: size, height: 'auto' }} />
    {showText && (
      <div className="leading-none font-display font-bold tracking-tight" style={{ fontSize: size * 0.5 }}>
        <span style={{ color: 'var(--ink)' }}>Barber</span>
        <span className="text-teal-glow">OS</span>
        <span className="cursor-blink">_</span>
      </div>
    )}
  </div>
);

export const HudCorners = () => (
  <>
    <span className="hud-bl" />
    <span className="hud-br" />
  </>
);
