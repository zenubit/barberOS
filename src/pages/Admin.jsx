import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Logo } from '../components/Shared';
import { useAuth } from '../contexts/AuthContext';
import DashboardView from '../components/admin/DashboardView';
import AppointmentsManager from '../components/admin/AppointmentsManager';
import BarbersManager from '../components/admin/BarbersManager';
import ServicesManager from '../components/admin/ServicesManager';
import ScheduleManager from '../components/admin/ScheduleManager';
import { PlaceholderView } from '../components/admin/AdminShared';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { id: 'citas', icon: 'Calendar', label: 'Citas' },
  { id: 'equipo', icon: 'Users', label: 'Trabajadores' },
  { id: 'servicios', icon: 'Scissors', label: 'Servicios' },
  { id: 'horario', icon: 'Clock', label: 'Horarios y bloqueos' },
  { id: 'tienda', icon: 'ShoppingBag', label: 'Tienda' },
  { id: 'caja', icon: 'Banknote', label: 'Caja y gastos' },
  { id: 'sorteos', icon: 'Gift', label: 'Sorteos' },
];

export default function Admin() {
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full overflow-hidden flex" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r flex flex-col transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Logo size={26} />
          <div className="text-[10px] font-mono tracking-widest uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>admin</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(it => (
            <button
              key={it.id}
              onClick={() => { setView(it.id); setSidebarOpen(false); }}
              className={`sb-item w-full ${view === it.id ? 'active' : ''}`}
            >
              <Icon name={it.icon} size={16} /> {it.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-semibold" style={{ background: 'var(--teal)', color: '#06120F' }}>
              {(profile?.first_name || '?')[0]}
            </div>
            <div className="text-xs">{profile?.first_name} {profile?.first_lastname}</div>
          </div>
          <button onClick={() => navigate('/')} className="w-full mt-2 text-xs py-2 flex items-center justify-center gap-2 cursor-pointer" style={{ color: 'var(--ink-muted)' }}>
            <Icon name="ExternalLink" size={12} /> Ver como cliente
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 px-5 sm:px-8 h-14 border-b flex items-center gap-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-muted)' }}>
            <Icon name="Menu" size={16} />
          </button>
          <div className="text-sm font-medium capitalize">{NAV_ITEMS.find(n => n.id === view)?.label}</div>
        </header>

        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {view === 'dashboard' && <DashboardView />}
          {view === 'citas' && <AppointmentsManager />}
          {view === 'equipo' && <BarbersManager />}
          {view === 'servicios' && <ServicesManager />}
          {view === 'horario' && <ScheduleManager />}
          {view === 'tienda' && <PlaceholderView name="Tienda de productos" />}
          {view === 'caja' && <PlaceholderView name="Caja y gastos" />}
          {view === 'sorteos' && <PlaceholderView name="Sorteos" />}
        </main>
      </div>
    </div>
  );
}
