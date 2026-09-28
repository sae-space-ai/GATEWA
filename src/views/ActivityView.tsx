import { type ActivityEntry } from '../types';
import { Activity, MessageSquare, FileText, Bot, Settings, Wifi } from 'lucide-react';

interface ActivityViewProps {
  activities: ActivityEntry[];
}

const typeIcons: Record<string, typeof Activity> = {
  chat: MessageSquare,
  document: FileText,
  assistant: Bot,
  system: Settings,
  bridge: Wifi,
};

const typeColors: Record<string, string> = {
  chat: 'text-purple-400',
  document: 'text-blue-400',
  assistant: 'text-pink-400',
  system: 'text-gray-400',
  bridge: 'text-green-400',
};

export function ActivityView({ activities }: ActivityViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Activity</h1>
          <p className="text-gray-400 text-sm mt-1">Registro de actividad técnica (sin datos privados)</p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Sin actividad registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map(act => {
              const Icon = typeIcons[act.type] || Activity;
              const color = typeColors[act.type] || 'text-gray-400';
              
              return (
                <div key={act.id} className="flex items-center gap-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <Icon size={18} className={color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{act.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(act.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-700 rounded">
                    {act.type}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Privacidad:</strong> El registro de actividad captura eventos técnicos 
            (conexiones, errores, acciones del sistema) pero no almacena el contenido de las conversaciones ni datos personales.
          </p>
        </div>
      </div>
    </div>
  );
}
