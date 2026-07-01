import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Logo, Icon } from './components/Shared';
import { CONTACT_INFO } from './data/businessData';
import GridBackground from './components/GridBackground';
import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeSplash from './components/WelcomeSplash';
import CursorGlow from './components/CursorGlow';

const Admin = lazy(() => import('./pages/Admin'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
    </div>
  );
}

function ProtectedAdminRoute() {
  const { isStaff, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isStaff) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Admin />
    </Suspense>
  );
}

function ProtectedProfileRoute() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return <Profile />;
}

function ProtectedBookingRoute() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/auth?redirect=/reservar" replace />;
  return <Booking />;
}

const NAV_LINKS = [{ to: '/', label: 'Inicio' }];

function NavLink({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className="text-[13px] font-medium tracking-wide transition-colors duration-200"
      style={{ color: isActive ? 'var(--teal)' : 'var(--ink-muted)' }}
    >
      {label}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer hover:scale-110"
      style={{
        borderColor: isDark ? 'rgba(212,169,116,0.3)' : 'rgba(212,165,116,0.4)',
        color: isDark ? 'var(--gold)' : 'var(--gold-dim)',
        backgroundColor: isDark ? 'rgba(212,169,116,0.08)' : 'rgba(212,165,116,0.05)',
      }}
      aria-label="Cambiar tema"
    >
      <Icon name={isDark ? 'Sun' : 'Moon'} size={16} strokeWidth={2} />
    </button>
  );
}

function UserMenu() {
  const { isLoggedIn, profile, signOut, isStaff } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link to="/auth" className="btn-teal !py-2 !px-4 !text-xs inline-flex items-center gap-2">
        <Icon name="LogIn" size={14} />
        <span className="hidden sm:inline">Ingresar</span>
      </Link>
    );
  }

  const initials = profile
    ? `${(profile.first_name || '')[0] || ''}${(profile.first_lastname || '')[0] || ''}`.toUpperCase()
    : '??';

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Menú de usuario" aria-expanded={open} className="flex items-center gap-2 cursor-pointer group">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-semibold" style={{ background: 'var(--teal)', color: 'var(--accent-ink)' }}>
          {initials}
        </div>
        <Icon name="ChevronDown" size={14} style={{ color: 'var(--ink-faint)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} style={{ pointerEvents: 'auto' }} />
          <div className="absolute right-0 top-full mt-2 w-56 py-2 z-50 glass-panel" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{profile?.first_name} {profile?.first_lastname}</p>
              <p className="text-xs truncate" style={{ color: 'var(--ink-faint)' }}>{profile?.email}</p>
            </div>
            <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80" style={{ color: 'var(--ink-muted)' }}>
              <Icon name="User" size={16} /> Mis citas
            </Link>
            {isStaff && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80" style={{ color: 'var(--ink-muted)' }}>
                <Icon name="LayoutDashboard" size={16} /> Panel Admin
              </Link>
            )}
            <button
              onClick={async () => { setOpen(false); await signOut(); window.location.href = '/'; }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:text-red-400 cursor-pointer"
              style={{ color: 'var(--ink-muted)' }}
            >
              <Icon name="LogOut" size={16} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isAdminRoute) return children;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(18,18,18,0.7)', backdropFilter: 'blur(20px) saturate(1.4)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Logo size={36} />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => <NavLink key={link.to} {...link} />)}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/reservar" className="hidden sm:inline-flex btn-teal !py-2.5 !px-5 !text-xs items-center gap-2">
              <Icon name="Calendar" size={14} /> Reservar
            </Link>
            <UserMenu />
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-muted)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={18} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <Link to="/reservar" onClick={() => setMobileMenuOpen(false)} className="btn-teal mt-2 flex items-center justify-center gap-2">
              <Icon name="Calendar" size={14} /> Reservar cita
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <Logo size={28} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80">
                <Icon name="Phone" size={13} style={{ color: 'var(--teal)' }} /> {CONTACT_INFO.phone}
              </a>
              <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80">
                <Icon name="MessageCircle" size={13} style={{ color: 'var(--teal)' }} /> WhatsApp
              </a>
            </div>
          </div>
          <div className="border-t pt-4 text-[11px] font-mono" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
            © {new Date().getFullYear()} {CONTACT_INFO.name}. Agendamiento inteligente para barberías.
          </div>
        </div>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-md mx-auto px-5 py-32 text-center">
      <p className="font-mono text-sm mb-3" style={{ color: 'var(--teal)' }}>404</p>
      <h1 className="font-display font-bold text-2xl mb-3">Página no encontrada</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/" className="btn-teal inline-flex items-center gap-2">
        <Icon name="ArrowLeft" size={16} /> Volver al inicio
      </Link>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/reservar" element={<PageTransition><ProtectedBookingRoute /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/perfil" element={<PageTransition><ProtectedProfileRoute /></PageTransition>} />
        <Route path="/admin/*" element={<PageTransition><ProtectedAdminRoute /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col relative font-sans" style={{ color: 'var(--ink)' }}>
          <GridBackground />
          <CursorGlow />
          <WelcomeSplash />
          <BrowserRouter>
            <AuthProvider>
              <Layout>
                <AnimatedRoutes />
              </Layout>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
