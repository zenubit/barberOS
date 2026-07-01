import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Logo } from '../components/Shared';
import { useAuth } from '../contexts/AuthContext';
import { useMyBarber } from '../hooks/useMyBarber';
import barbersService from '../services/barbersService';
import DashboardView from '../components/admin/DashboardView';
import AppointmentsManager from '../components/admin/AppointmentsManager';
import TeamManager from '../components/admin/TeamManager';
import ServicesManager from '../components/admin/ServicesManager';
import MyServicesManager from '../components/admin/MyServicesManager';
import ScheduleManager from '../components/admin/ScheduleManager';
import ProductsManager from '../components/admin/ProductsManager';
import CashManager from '../components/admin/CashManager';
import RafflesManager from '../components/admin/RafflesManager';

// Solo dos roles de staff: barber y super_admin (el rol 'admin' se eliminó,
// era idéntico a barber salvo por el permiso de inventario). Cada barbero
// gestiona únicamente su propio día/citas/horario/caja. Solo super_admin ve
// el negocio completo (todas las citas, todos los horarios, caja global) y
// tiene acceso a usuarios, catálogo maestro, tienda y sorteos. Un barbero
// puntual puede recibir el permiso delegado de inventario (can_manage_inventory)
// desde el panel de Usuarios, sin necesidad de un rol separado.
function buildNavItems(role, myBarberId, canManageInventory) {
  const isSuperAdmin = role === 'super_admin';
  const hasInventoryAccess = isSuperAdmin || (role === 'barber' && canManageInventory);

  const items = [
    {
      id: 'dashboard',
      icon: 'LayoutDashboard',
      label: isSuperAdmin ? 'Dashboard' : 'Mi día',
      render: () => <DashboardView barberId={isSuperAdmin ? null : myBarberId} />,
    },
    {
      id: 'citas',
      icon: 'Calendar',
      label: isSuperAdmin ? 'Citas' : 'Mis citas',
      render: () => <AppointmentsManager fixedBarberId={isSuperAdmin ? null : myBarberId} />,
    },
  ];

  if (isSuperAdmin) {
    items.push({ id: 'equipo', icon: 'Users', label: 'Usuarios y equipo', render: () => <TeamManager /> });
    items.push({ id: 'catalogo', icon: 'Scissors', label: 'Catálogo de servicios', render: () => <ServicesManager /> });
  }

  items.push({ id: 'mis-servicios', icon: 'ListChecks', label: 'Mis servicios', render: () => <MyServicesManager barberId={myBarberId} /> });

  if (isSuperAdmin) {
    items.push({ id: 'horarios', icon: 'Clock', label: 'Horarios (todos)', render: () => <ScheduleManager /> });
  }
  items.push({ id: 'mi-horario', icon: 'CalendarClock', label: 'Mi horario', render: () => <ScheduleManager fixedBarberId={myBarberId} /> });

  if (hasInventoryAccess) {
    items.push({ id: 'tienda', icon: 'ShoppingBag', label: 'Tienda', render: () => <ProductsManager /> });
  }
  if (isSuperAdmin) {
    items.push({ id: 'caja-global', icon: 'Banknote', label: 'Caja global', render: () => <CashManager /> });
    items.push({ id: 'sorteos', icon: 'Gift', label: 'Sorteos', render: () => <RafflesManager /> });
  }
  items.push({ id: 'mi-caja', icon: 'Wallet', label: 'Mi caja', render: () => <CashManager fixedBarberId={myBarberId} /> });

  return items;
}

export default function Admin() {
  const { profile, signOut } = useAuth();
  const { barberId: myBarberId, loading: barberLoading, refetch: refetchBarber } = useMyBarber(profile);
  const [signingOut, setSigningOut] = useState(false);
  const navItems = useMemo(
    () => buildNavItems(profile?.role, myBarberId, profile?.can_manage_inventory),
    [profile?.role, myBarberId, profile?.can_manage_inventory]
  );

  const [view, setView] = useState(navItems[0]?.id || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const navigate = useNavigate();

  const activeItem = navItems.find(n => n.id === view) || navItems[0];

  // Super admin / admin también son barberos ("tienen silla propia") — si
  // por algún motivo su cuenta no tiene ficha en `barbers` (ej. rol asignado
  // directo en BD), se pueden auto-activar como barbero desde aquí.
  const activateAsBarber = async () => {
    if (!profile) return;
    setActivating(true);
    try {
      await barbersService.createBarber({
        profile_id: profile.id,
        name: `${profile.first_name} ${profile.first_lastname}`.trim(),
        role: 'Barbero',
        phone: profile.phone || null,
        email: profile.email || null,
        status: 'active',
      });
      await refetchBarber();
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(false);
    }
  };

  const handleSignOut = async () => {
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

  return (
    <div className="h-screen w-full overflow-hidden flex" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r flex flex-col transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => navigate('/')} className="cursor-pointer" aria-label="Ir al inicio">
            <Logo size={26} />
          </button>
          <div className="text-[10px] font-mono tracking-widest uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>
            {profile?.role === 'super_admin' ? 'super admin' : 'barbero'}
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(it => (
            <button
              key={it.id}
              onClick={() => { setView(it.id); setSidebarOpen(false); }}
              className={`sb-item w-full ${view === it.id ? 'active' : ''}`}
            >
              <Icon name={it.icon} size={16} /> {it.label}
            </button>
          ))}

          {!barberLoading && !myBarberId && (
            <button
              onClick={activateAsBarber}
              disabled={activating}
              className="sb-item w-full"
              style={{ color: 'var(--gold)' }}
              title="Habilita tu propio horario, servicios y caja como barbero"
            >
              <Icon name="Scissors" size={16} />
              {activating ? 'Activando…' : 'Activarme como barbero'}
            </button>
          )}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-semibold" style={{ background: 'var(--teal)', color: 'var(--accent-ink)' }}>
              {(profile?.first_name || '?')[0]}
            </div>
            <div className="text-xs">{profile?.first_name} {profile?.first_lastname}</div>
          </div>
          <button
            onClick={() => navigate('/', { state: { viewAsClient: true } })}
            className="w-full mt-2 text-xs py-2 flex items-center justify-center gap-2 cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            <Icon name="ExternalLink" size={12} /> Ver como cliente
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full mt-1 text-xs py-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ color: 'var(--danger)' }}
          >
            <Icon name="LogOut" size={12} /> {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 px-5 sm:px-8 h-14 border-b flex items-center gap-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-muted)' }}>
            <Icon name="Menu" size={16} />
          </button>
          <div className="text-sm font-medium capitalize">{activeItem?.label}</div>
        </header>

        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {barberLoading ? (
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p>
          ) : (
            activeItem?.render()
          )}
        </main>
      </div>
    </div>
  );
}
