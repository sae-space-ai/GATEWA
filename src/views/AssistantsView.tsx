import { type Assistant, type ModelInfo } from '../types';
import { Plus, Trash2, MessageSquare, Bot } from 'lucide-react';
import { useState } from 'react';

interface AssistantsViewProps {
  assistants: Assistant[];
  models: ModelInfo[];
  defaultModel: string;
  onCreateAssistant: (assistant: Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteAssistant: (id: string) => void;
  onStartChat: (assistantId: string) => void;
}

export function AssistantsView({ assistants, models, defaultModel, onCreateAssistant, onDeleteAssistant, onStartChat }: AssistantsViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState(defaultModel);
  const [temperature, setTemperature] = useState(0.7);

  const allModels = models.length > 0 ? models.map(m => typeof m === 'string' ? m : m.name) : [defaultModel];

  const handleCreate = () => {
    if (name.trim() && systemPrompt.trim()) {
      onCreateAssistant({ name: name.trim(), description: description.trim(), systemPrompt: systemPrompt.trim(), model, temperature });
      setName(''); setDescription(''); setSystemPrompt(''); setModel(defaultModel); setTemperature(0.7);
      setShowCreate(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Assistants</h1>
            <p className="text-gray-400 text-sm mt-1">Crea agentes especializados con instrucciones personalizadas</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
            <Plus size={16} /> Nuevo Asistente
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Crear Asistente</h3>
            <div className="space-y-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del asistente" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción breve" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Instrucciones del sistema (system prompt)... Ej: Eres un experto en programación Python. Responde de forma concisa con ejemplos de código." rows={4} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Modelo</label>
                  <select value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {allModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Temperatura: {temperature}</label>
                  <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full mt-2" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Crear</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {assistants.length === 0 ? (
          <div className="text-center py-12">
            <Bot size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No hay asistentes creados</p>
            <p className="text-gray-500 text-sm">Crea un asistente especializado para tareas específicas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assistants.map(assistant => (
              <div key={assistant.id} className="p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
                      <Bot size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{assistant.name}</h3>
                      <p className="text-xs text-gray-500">{assistant.model}</p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteAssistant(assistant.id)} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                {assistant.description && <p className="text-sm text-gray-400 mb-3">{assistant.description}</p>}
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{assistant.systemPrompt}</p>
                <button onClick={() => onStartChat(assistant.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-lg text-sm text-blue-400 transition-colors">
                  <MessageSquare size={14} /> Iniciar conversación
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
