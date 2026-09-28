import { type ReactNode } from 'react';
import { type BridgeStatus, type ViewType, type HealthResponse } from '../types';
import { 
  LayoutDashboard, MessageSquare, FolderKanban, FileText, 
  Bot, Cpu, Wrench, Activity, Settings, Menu, X, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { HealthPanel } from './HealthPanel';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  bridgeStatus: BridgeStatus;
  health?: HealthResponse | null;
  isChecking?: boolean;
  onRetryHealth?: () => void;
}

const navItems: { id: ViewType; label: string; icon: typeof LayoutDashboard; subtitle?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, subtitle: 'Centro de control' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, subtitle: 'Conversación' },
  { id: 'workspaces', label: 'Workspaces', icon: FolderKanban, subtitle: 'Proyectos' },
  { id: 'documents', label: 'Documents', icon: FileText, subtitle: 'Archivos' },
  { id: 'assistants', label: 'Assistants', icon: Bot, subtitle: 'Agentes' },
  { id: 'models', label: 'Models', icon: Cpu, subtitle: 'Motores IA' },
  { id: 'tools', label: 'Tools', icon: Wrench, subtitle: 'Habilidades' },
  { id: 'activity', label: 'Activity', icon: Activity, subtitle: 'Registro' },
  { id: 'settings', label: 'Settings', icon: Settings, subtitle: 'Configuración' },
];

export function Layout({ children, currentView, onNavigate, bridgeStatus, health, isChecking, onRetryHealth }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getStatusColor = (status: BridgeStatus) => {
    switch (status) {
      case 'online': return 'var(--gw-success)';
      case 'offline': return 'var(--gw-error)';
      case 'degraded': return 'var(--gw-warning)';
      case 'error': return 'var(--gw-error)';
      case 'not_configured': return 'var(--gw-text-dim)';
      default: return 'var(--gw-warning)';
    }
  };

  const getStatusLabel = (status: BridgeStatus) => {
    switch (status) {
      case 'online': return 'LOCAL AI ONLINE';
      case 'offline': return 'LOCAL AI OFFLINE';
      case 'degraded': return 'DEGRADADO';
      case 'error': return 'ERROR';
      case 'not_configured': return 'NO CONFIGURADO';
      default: return 'VERIFICANDO...';
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--gw-bg-void)' }}>
      {/* ── HEADER ── */}
      <header className="gw-surface-glass flex items-center justify-between px-4 py-2.5 border-b border-[var(--gw-border-subtle)] shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[var(--gw-bg-elevated)] transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Logo + Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img src="/gatewa-logo.svg" alt="" className="w-9 h-9" />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--gw-bg-base)]"
                style={{ backgroundColor: getStatusColor(bridgeStatus) }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight gw-gradient-text leading-none">
                GATEWA
              </h1>
              <p className="text-[10px] text-[var(--gw-text-dim)] tracking-widest uppercase leading-none mt-0.5">
                Local AI Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border"
               style={{
                 borderColor: `${getStatusColor(bridgeStatus)}40`,
                 background: `${getStatusColor(bridgeStatus)}10`,
               }}>
            {bridgeStatus === 'checking' && (
              <Loader2 size={12} className="animate-spin" style={{ color: 'var(--gw-warning)' }} />
            )}
            {bridgeStatus !== 'checking' && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${bridgeStatus === 'online' ? 'gw-animate-pulse-glow' : ''}`}
                style={{ backgroundColor: getStatusColor(bridgeStatus), color: getStatusColor(bridgeStatus) }}
              />
            )}
            <span
              className="text-[11px] font-semibold tracking-wider"
              style={{ color: getStatusColor(bridgeStatus) }}
            >
              {getStatusLabel(bridgeStatus)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside
          className={`
            fixed lg:relative z-40 lg:z-auto
            h-[calc(100vh-52px)] w-64
            flex flex-col transition-transform duration-300 shrink-0
            border-r border-[var(--gw-border-subtle)]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ background: 'var(--gw-bg-base)' }}
        >
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                      ${isActive 
                        ? 'text-[var(--gw-primary-300)]'
                        : 'text-[var(--gw-text-muted)] hover:bg-[var(--gw-bg-elevated)] hover:text-[var(--gw-text-secondary)]'
                      }
                    `}
                    style={isActive ? {
                      background: 'linear-gradient(90deg, rgba(212,132,26,0.12) 0%, transparent 100%)',
                      borderLeft: '2px solid var(--gw-primary-500)',
                    } : {}}
                  >
                    <Icon size={17} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      {item.subtitle && (
                        <div className="text-[10px] opacity-60">{item.subtitle}</div>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-1 h-4 rounded-full" style={{ background: 'var(--gw-gradient-primary)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar footer - Health Panel */}
          <div className="p-3 border-t border-[var(--gw-border-subtle)]">
            <HealthPanel 
              health={health || null} 
              isChecking={isChecking || false}
              onRetry={onRetryHealth}
            />
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Subtle ambient gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 20% 0%, rgba(212,132,26,0.04) 0%, transparent 50%)',
            }}
          />
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
