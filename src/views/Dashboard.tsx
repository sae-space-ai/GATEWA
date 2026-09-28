import { type BridgeStatus, type Conversation, type Workspace, type Assistant, type Document, type ActivityEntry, type ViewType } from '../types';
import { Wifi, WifiOff, MessageSquare, FolderKanban, Bot, FileText, Activity, ArrowRight } from 'lucide-react';

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

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Centro de control de tu IA local</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Bridge Status */}
          <div className={`rounded-xl p-5 border ${
            bridgeStatus === 'online' 
              ? 'bg-green-900/20 border-green-700/50' 
              : bridgeStatus === 'offline'
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-yellow-900/20 border-yellow-700/50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {bridgeStatus === 'online' && <Wifi size={20} className="text-green-400" />}
              {bridgeStatus === 'offline' && <WifiOff size={20} className="text-red-400" />}
              {bridgeStatus === 'checking' && <div className="w-5 h-5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />}
              <span className="text-sm text-gray-400">Bridge Local</span>
            </div>
            <div className={`text-lg font-bold ${
              bridgeStatus === 'online' ? 'text-green-400' : bridgeStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {bridgeStatus === 'online' ? 'ONLINE' : bridgeStatus === 'offline' ? 'OFFLINE' : 'Verificando...'}
            </div>
          </div>

          {/* Active Model */}
          <div className="rounded-xl p-5 bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
              <span className="text-sm text-gray-400">Modelo Activo</span>
            </div>
            <div className="text-lg font-bold text-white">{selectedModel}</div>
          </div>

          {/* Conversations */}
          <div className="rounded-xl p-5 bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Conversaciones</span>
            </div>
            <div className="text-lg font-bold text-white">{conversations.length}</div>
          </div>

          {/* Workspaces */}
          <div className="rounded-xl p-5 bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban size={20} className="text-orange-400" />
              <span className="text-sm text-gray-400">Workspaces</span>
            </div>
            <div className="text-lg font-bold text-white">{workspaces.length}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
                <span>Nueva conversación</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('assistants')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <span>Crear asistente</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <span>Cargar documento</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <Bot size={14} /> Asistentes
                </span>
                <span className="text-white font-medium">{assistants.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <FileText size={14} /> Documentos
                </span>
                <span className="text-white font-medium">{documents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <FolderKanban size={14} /> Workspaces
                </span>
                <span className="text-white font-medium">{workspaces.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Conversaciones Recientes</h3>
            <button
              onClick={() => onNavigate('chat')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Ver todas →
            </button>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No hay conversaciones aún</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map(conv => (
                <div key={conv.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-200 truncate max-w-xs">{conv.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={18} /> Actividad Reciente
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Ver todo →
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map(act => (
                <div key={act.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="text-gray-500 text-xs w-16 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-300 truncate">{act.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
