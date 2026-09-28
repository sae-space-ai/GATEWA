import { type GatewayStatus } from '../types';
import { Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface HeaderProps {
  gatewayStatus: GatewayStatus;
  isGenerating: boolean;
  selectedModel: string;
  onToggleSidebar: () => void;
}

export function Header({ gatewayStatus, isGenerating, selectedModel, onToggleSidebar }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white">Ollama Chat</h1>
        <span className="text-xs text-gray-400 hidden sm:inline">
          {selectedModel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isGenerating && (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs hidden sm:inline">Generando...</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {gatewayStatus === 'checking' && (
            <>
              <Loader2 size={14} className="animate-spin text-yellow-400" />
              <span className="text-xs text-yellow-400">Verificando...</span>
            </>
          )}
          {gatewayStatus === 'online' && (
            <>
              <Wifi size={14} className="text-green-400" />
              <span className="text-xs text-green-400">LOCAL ONLINE</span>
            </>
          )}
          {gatewayStatus === 'offline' && (
            <>
              <WifiOff size={14} className="text-red-400" />
              <span className="text-xs text-red-400">LOCAL OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
