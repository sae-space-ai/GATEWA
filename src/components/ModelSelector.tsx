import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ModelSelectorProps {
  selectedModel: string;
  availableModels: string[];
  onSelectModel: (model: string) => void;
}

export function ModelSelector({ selectedModel, availableModels, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = availableModels.length > 0 ? availableModels : ['qwen3:4b'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/30">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
        >
          <span className="text-gray-300">Modelo:</span>
          <span className="text-white font-medium">{selectedModel}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
            {models.map(model => (
              <button
                key={model}
                onClick={() => {
                  onSelectModel(model);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-600 transition-colors ${
                  model === selectedModel ? 'text-blue-400 bg-gray-600/50' : 'text-gray-300'
                }`}
              >
                {model}
                {model === selectedModel && (
                  <span className="ml-2 text-xs text-blue-400">✓</span>
                )}
              </button>
            ))}
            {models.length === 1 && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-600">
                Preparado para más modelos
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 hidden sm:block">
        Motor: Ollama Local
      </div>
    </div>
  );
}
