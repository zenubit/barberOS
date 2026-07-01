import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import Raffles from './pages/Raffles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/sorteos', label: 'Sorteos' },
];

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

/**
 * Dropdown en Portal: se posiciona con coordenadas absolutas del viewport
 * (getBoundingClientRect) en vez de `position: absolute` anidado, para que
 * nunca quede "atrapado" por un ancestro con backdrop-filter/transform
 * (el header usa backdrop-filter, lo que crea un containing block nuevo
 * para hijos `position: fixed` y rompía el posicionamiento del menú).
 */
function UserMenu() {
  const { isLoggedIn, profile, signOut, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

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
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        aria-label="Menú de usuario"
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-semibold" style={{ background: 'var(--teal)', color: 'var(--accent-ink)' }}>
          {initials}
        </div>
        <Icon name="ChevronDown" size={14} style={{ color: 'var(--ink-faint)' }} />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setOpen(false)} />
          <div
            className="fixed w-56 py-2 glass-panel"
            style={{ top: coords.top, right: coords.right, zIndex: 91, maxHeight: '75vh', overflowY: 'auto' }}
          >
            <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{profile?.first_name} {profile?.first_lastname}</p>
              <p className="text-xs truncate" style={{ color: 'var(--ink-faint)' }}>{profile?.email}</p>
            </div>
            <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80" style={{ color: 'var(--ink-muted)' }}>
              <Icon name="User" size={16} /> Mis citas
            </Link>
            <Link to="/sorteos" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80" style={{ color: 'var(--ink-muted)' }}>
              <Icon name="Gift" size={16} /> Sorteos
            </Link>
            {isStaff && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80" style={{ color: 'var(--ink-muted)' }}>
                <Icon name="LayoutDashboard" size={16} /> Panel Admin
              </Link>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:text-red-400 cursor-pointer disabled:opacity-50"
              style={{ color: 'var(--ink-muted)' }}
            >
              <Icon name="LogOut" size={16} /> {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </>,
        document.body
      )}
    </>
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
        style={{ background: 'rgba(10,13,17,0.75)', backdropFilter: 'blur(20px) saturate(1.4)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Logo size={36} />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => <NavLink key={link.to} {...link} />)}
          </nav>

          <div className="flex items-center gap-3">
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
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2.5"
                style={{ color: 'var(--ink-muted)' }}
              >
                {link.label}
              </Link>
            ))}
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
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
            <span>© {new Date().getFullYear()} {CONTACT_INFO.name}. Agendamiento inteligente para barberías.</span>
            <a
              href="https://zenubit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--ink-faint)' }}
            >
              Creado por <span style={{ color: 'var(--gold)' }}>Zenubit</span>
            </a>
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
        <Route path="/tienda" element={<PageTransition><Shop /></PageTransition>} />
        <Route path="/sorteos" element={<PageTransition><Raffles /></PageTransition>} />
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
      <div className="min-h-screen flex flex-col relative isolate font-sans" style={{ color: 'var(--ink)' }}>
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
    </ErrorBoundary>
  );
}
