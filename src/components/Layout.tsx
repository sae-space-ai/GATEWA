import { type ReactNode } from 'react';
import { type BridgeStatus, type ViewType } from '../types';
import { 
  LayoutDashboard, MessageSquare, FolderKanban, FileText, 
  Bot, Cpu, Wrench, Activity, Settings, Wifi, WifiOff, Loader2, Menu, X 
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  bridgeStatus: BridgeStatus;
}

const navItems: { id: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'assistants', label: 'Assistants', icon: Bot },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ children, currentView, onNavigate, bridgeStatus }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              G
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">GATEWA</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {bridgeStatus === 'checking' && (
              <>
                <Loader2 size={14} className="animate-spin text-yellow-400" />
                <span className="text-xs text-yellow-400 hidden sm:inline">Verificando...</span>
              </>
            )}
            {bridgeStatus === 'online' && (
              <>
                <Wifi size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">LOCAL AI ONLINE</span>
              </>
            )}
            {bridgeStatus === 'offline' && (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">LOCAL AI OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative z-40 lg:z-auto
            h-[calc(100vh-52px)] w-60 bg-gray-850 border-r border-gray-700
            flex flex-col transition-transform duration-300 shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ backgroundColor: '#1a1d23' }}
        >
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
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
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isActive 
                        ? 'bg-blue-600/20 text-blue-400 font-medium' 
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 text-center">
              GATEWA v1.0.0
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
