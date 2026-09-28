import { type Workspace } from '../types';
import { Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface WorkspacesViewProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, description: string, color: string) => void;
  onDeleteWorkspace: (id: string) => void;
  conversationCounts: Record<string, number>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#eab308', '#06b6d4'];

export function WorkspacesView({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  conversationCounts,
}: WorkspacesViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleCreate = () => {
    if (name.trim()) {
      onCreateWorkspace(name.trim(), description.trim(), color);
      setName('');
      setDescription('');
      setColor(COLORS[0]);
      setShowCreate(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Workspaces</h1>
            <p className="text-gray-400 text-sm mt-1">Organiza tus proyectos y conversaciones</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Workspace
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Crear Workspace</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre del workspace"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Color:</span>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Check size={14} /> Crear
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <div
              key={ws.id}
              className={`relative p-5 rounded-xl border cursor-pointer transition-all ${
                ws.id === activeWorkspaceId 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
              onClick={() => onSelectWorkspace(ws.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ws.color }} />
                {ws.id !== 'default' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteWorkspace(ws.id); }}
                    className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1">{ws.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{ws.description || 'Sin descripción'}</p>
              <div className="text-xs text-gray-500">
                {conversationCounts[ws.id] || 0} conversaciones
              </div>
              {ws.id === activeWorkspaceId && (
                <div className="absolute top-2 right-2 text-xs text-blue-400 font-medium">Activo</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
