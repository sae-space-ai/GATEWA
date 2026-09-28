import { type BridgeStatus, type Conversation, type Workspace, type Assistant, type Document, type ActivityEntry, type ViewType } from '../types';
import { Wifi, WifiOff, MessageSquare, FolderKanban, Bot, FileText, Activity, ArrowRight, Cpu, Zap } from 'lucide-react';

interface DashboardProps {
  bridgeStatus: BridgeStatus;
  selectedModel: string;
  conversations: Conversation[];
  workspaces: Workspace[];
  assistants: Assistant[];
  documents: Document[];
  activities: ActivityEntry[];
  onNavigate: (view: ViewType) => void;
  onNewChat: () => void;
}

export function Dashboard({
  bridgeStatus,
  selectedModel,
  conversations,
  workspaces,
  assistants,
  documents,
  activities,
  onNavigate,
  onNewChat,
}: DashboardProps) {
  const recentConversations = conversations.slice(0, 5);
  const recentActivities = activities.slice(0, 8);

  const getStatusColor = (status: BridgeStatus) => {
    switch (status) {
      case 'online': return 'var(--gw-success)';
      case 'offline': return 'var(--gw-error)';
      case 'degraded': return 'var(--gw-warning)';
      case 'error': return 'var(--gw-error)';
      default: return 'var(--gw-warning)';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="mb-8 relative">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
               style={{ background: 'radial-gradient(circle, var(--gw-primary-500) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8" style={{ background: 'var(--gw-gradient-primary)' }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--gw-primary-400)' }}>
                Private AI Workspace
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--gw-text-primary)] tracking-tight mb-2">
              Centro de Control
            </h1>
            <p className="text-[var(--gw-text-muted)]">
              Orquestación de inteligencia artificial local y segura
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Bridge Status */}
          <div className="gw-surface p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                 style={{ background: getStatusColor(bridgeStatus) }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: `${getStatusColor(bridgeStatus)}20` }}>
                  {bridgeStatus === 'online' ? <Wifi size={18} style={{ color: getStatusColor(bridgeStatus) }} /> : <WifiOff size={18} style={{ color: getStatusColor(bridgeStatus) }} />}
                </div>
                <span className="text-xs font-medium text-[var(--gw-text-muted)] uppercase tracking-wider">Bridge Local</span>
              </div>
              <div className="text-xl font-bold" style={{ color: getStatusColor(bridgeStatus) }}>
                {bridgeStatus === 'online' ? 'ONLINE' : bridgeStatus === 'offline' ? 'OFFLINE' : bridgeStatus.toUpperCase()}
              </div>
              <div className="text-xs text-[var(--gw-text-dim)] mt-1">
                {bridgeStatus === 'online' ? 'Motor IA disponible' : 'Verificar conexión'}
              </div>
            </div>
          </div>

          {/* Active Model */}
          <div className="gw-surface p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                 style={{ background: 'var(--gw-accent-500)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(192,132,252,0.15)' }}>
                  <Cpu size={18} style={{ color: 'var(--gw-accent-400)' }} />
                </div>
                <span className="text-xs font-medium text-[var(--gw-text-muted)] uppercase tracking-wider">Modelo Activo</span>
              </div>
              <div className="text-xl font-bold text-[var(--gw-text-primary)]">{selectedModel}</div>
              <div className="text-xs text-[var(--gw-text-dim)] mt-1">Ollama Local</div>
            </div>
          </div>

          {/* Conversations */}
          <div className="gw-surface p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                 style={{ background: 'var(--gw-secondary-500)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(34,211,238,0.15)' }}>
                  <MessageSquare size={18} style={{ color: 'var(--gw-secondary-400)' }} />
                </div>
                <span className="text-xs font-medium text-[var(--gw-text-muted)] uppercase tracking-wider">Conversaciones</span>
              </div>
              <div className="text-xl font-bold text-[var(--gw-text-primary)]">{conversations.length}</div>
              <div className="text-xs text-[var(--gw-text-dim)] mt-1">Historial local</div>
            </div>
          </div>

          {/* Workspaces */}
          <div className="gw-surface p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
                 style={{ background: 'var(--gw-primary-500)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(212,132,26,0.15)' }}>
                  <FolderKanban size={18} style={{ color: 'var(--gw-primary-400)' }} />
                </div>
                <span className="text-xs font-medium text-[var(--gw-text-muted)] uppercase tracking-wider">Workspaces</span>
              </div>
              <div className="text-xl font-bold text-[var(--gw-text-primary)]">{workspaces.length}</div>
              <div className="text-xs text-[var(--gw-text-dim)] mt-1">Proyectos activos</div>
            </div>
          </div>
        </div>

        {/* Quick Actions + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="gw-surface p-5">
            <h3 className="text-sm font-semibold text-[var(--gw-text-primary)] mb-4 uppercase tracking-wider">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={onNewChat}
                disabled={bridgeStatus !== 'online'}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: bridgeStatus === 'online' ? 'var(--gw-gradient-primary)' : 'var(--gw-bg-elevated)',
                  color: bridgeStatus === 'online' ? 'var(--gw-text-inverse)' : 'var(--gw-text-muted)',
                }}
              >
                <span className="flex items-center gap-2">
                  <Zap size={16} />
                  Nueva conversación
                </span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('assistants')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium text-[var(--gw-text-secondary)] hover:bg-[var(--gw-bg-elevated)]"
                style={{ background: 'var(--gw-bg-elevated)' }}
              >
                <span className="flex items-center gap-2">
                  <Bot size={16} style={{ color: 'var(--gw-accent-400)' }} />
                  Crear asistente
                </span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium text-[var(--gw-text-secondary)] hover:bg-[var(--gw-bg-elevated)]"
                style={{ background: 'var(--gw-bg-elevated)' }}
              >
                <span className="flex items-center gap-2">
                  <FileText size={16} style={{ color: 'var(--gw-secondary-400)' }} />
                  Cargar documento
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="gw-surface p-5">
            <h3 className="text-sm font-semibold text-[var(--gw-text-primary)] mb-4 uppercase tracking-wider">Resumen del Sistema</h3>
            <div className="space-y-3">
              {[
                { icon: Bot, label: 'Asistentes', value: assistants.length, color: 'var(--gw-accent-400)' },
                { icon: FileText, label: 'Documentos', value: documents.length, color: 'var(--gw-secondary-400)' },
                { icon: FolderKanban, label: 'Workspaces', value: workspaces.length, color: 'var(--gw-primary-400)' },
                { icon: MessageSquare, label: 'Conversaciones', value: conversations.length, color: 'var(--gw-text-secondary)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--gw-border-subtle)] last:border-0">
                  <span className="text-sm text-[var(--gw-text-muted)] flex items-center gap-2">
                    <item.icon size={14} style={{ color: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--gw-text-primary)] font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="gw-surface p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--gw-text-primary)] uppercase tracking-wider">Conversaciones Recientes</h3>
            <button
              onClick={() => onNavigate('chat')}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{ color: 'var(--gw-primary-400)', background: 'rgba(212,132,26,0.1)' }}
            >
              Ver todas →
            </button>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-[var(--gw-text-dim)] text-center py-6">No hay conversaciones aún</p>
          ) : (
            <div className="space-y-1">
              {recentConversations.map(conv => (
                <div key={conv.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--gw-bg-elevated)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <MessageSquare size={14} className="text-[var(--gw-text-dim)] shrink-0" />
                    <span className="text-sm text-[var(--gw-text-secondary)] truncate">{conv.title}</span>
                  </div>
                  <span className="text-xs text-[var(--gw-text-dim)] shrink-0 ml-2">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="gw-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--gw-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} style={{ color: 'var(--gw-primary-400)' }} />
              Actividad Reciente
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{ color: 'var(--gw-primary-400)', background: 'rgba(212,132,26,0.1)' }}
            >
              Ver todo →
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-[var(--gw-text-dim)] text-center py-6">Sin actividad reciente</p>
          ) : (
            <div className="space-y-1">
              {recentActivities.map(act => (
                <div key={act.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="text-[var(--gw-text-dim)] text-xs font-mono w-16 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[var(--gw-text-secondary)] truncate">{act.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
