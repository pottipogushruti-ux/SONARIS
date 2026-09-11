import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Waves,
  Radar,
  Map as MapIcon,
  BookOpen,
  History,
  FileText,
  Database,
  Network,
  Info,
  Menu,
  X,
  Gauge,
} from 'lucide-react';
import { SonarisLogo } from './SonarisLogo';
import { BackendStatusIndicator } from './BackendStatusIndicator';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sonar-analysis', label: 'Sonar Analysis', icon: Waves },
  { to: '/live-detection', label: 'Live Detection', icon: Radar },
  { to: '/mission-map', label: 'Mission Map', icon: MapIcon },
  { to: '/case-studies', label: 'Case Studies', icon: BookOpen },
  { to: '/detection-history', label: 'Detection History', icon: History },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/data-ai', label: 'Data & AI', icon: Database },
  { to: '/architecture', label: 'Architecture', icon: Network },
  { to: '/performance', label: 'Performance', icon: Gauge },
  { to: '/about', label: 'About SONARIS', icon: Info },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-abyss-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-abyss-700 bg-abyss-900/60 shrink-0">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col border-r border-abyss-700 bg-abyss-900">
            <SidebarContent onNavigate={() => setMobileOpen(false)} showClose onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="flex items-center justify-between border-b border-abyss-700 bg-abyss-900/80 px-4 py-3 lg:hidden">
          <button
            className="btn-ghost !px-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <SonarisLogo compact />
          <BackendStatusIndicator compact />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  showClose,
  onClose,
}: {
  onNavigate: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-5 border-b border-abyss-700">
        <SonarisLogo />
        {showClose && (
          <button className="btn-ghost !px-2" onClick={onClose} aria-label="Close navigation menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-signal-500/10 text-signal-400 border border-signal-500/30'
                  : 'text-slate-400 border border-transparent hover:bg-abyss-800 hover:text-slate-200'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-abyss-700 px-5 py-4">
        <BackendStatusIndicator />
      </div>
    </>
  );
}
