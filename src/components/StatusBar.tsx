import { type GatewayStatus } from '../types';
import { Server, Clock } from 'lucide-react';

interface StatusBarProps {
  gatewayStatus: GatewayStatus;
}

export function StatusBar({ gatewayStatus }: StatusBarProps) {
  const statusConfig = {
    online: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Motor local conectado', dot: 'bg-green-400' },
    offline: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Motor local desconectado', dot: 'bg-red-400' },
    checking: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Verificando conexión...', dot: 'bg-yellow-400 animate-pulse' },
  };

  const config = statusConfig[gatewayStatus];

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs">
      <div className="flex items-center gap-2">
        <Server size={12} className="text-gray-400" />
        <span className="text-gray-400">Ollama Chat</span>
        <span className="text-gray-600">|</span>
        <div className={`flex items-center gap-1.5 ${config.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          <span>{config.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-500">
        <Clock size={12} />
        <span>Modelo: qwen3:4b</span>
      </div>
    </div>
  );
}
