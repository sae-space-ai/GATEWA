import { type ModelInfo, type BridgeStatus } from '../types';
import { Cpu, Check, Wifi, WifiOff } from 'lucide-react';

interface ModelsViewProps {
  models: ModelInfo[];
  bridgeStatus: BridgeStatus;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export function ModelsView({ models, bridgeStatus, selectedModel, onSelectModel }: ModelsViewProps) {
  const modelList = models.length > 0 ? models : [{ name: 'qwen3:4b' } as ModelInfo];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Models</h1>
          <p className="text-gray-400 text-sm mt-1">Modelos disponibles en tu Ollama local</p>
        </div>

        {/* Connection status */}
        <div className={`mb-6 p-4 rounded-lg border ${
          bridgeStatus === 'online' ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'
        }`}>
          <div className="flex items-center gap-3">
            {bridgeStatus === 'online' ? <Wifi size={18} className="text-green-400" /> : <WifiOff size={18} className="text-red-400" />}
            <span className={`text-sm font-medium ${bridgeStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
              {bridgeStatus === 'online' ? 'Conectado a Ollama local' : 'Ollama no disponible'}
            </span>
          </div>
        </div>

        {/* Models grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelList.map((model) => {
            const modelName = typeof model === 'string' ? model : model.name;
            const isSelected = modelName === selectedModel;
            
            return (
              <div
                key={modelName}
                onClick={() => onSelectModel(modelName)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Cpu size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{modelName}</h3>
                      {typeof model !== 'string' && model.size && (
                        <p className="text-xs text-gray-500">{model.size}</p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={20} className="text-blue-400" />}
                </div>
                {typeof model !== 'string' && model.modifiedAt && (
                  <p className="text-xs text-gray-500">
                    Modificado: {new Date(model.modifiedAt).toLocaleDateString()}
                  </p>
                )}
                {isSelected && (
                  <div className="mt-3 text-xs text-blue-400 font-medium">Modelo activo</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Nota:</strong> Los modelos se ejecutan localmente en tu ordenador mediante Ollama. 
            Para instalar nuevos modelos, usa <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">ollama pull nombre_modelo</code> en tu terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
