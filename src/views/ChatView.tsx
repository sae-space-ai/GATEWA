import { type Conversation, type BridgeStatus, type Assistant, type ModelInfo } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { Send, StopCircle, Plus, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatViewProps {
  conversation: Conversation | null;
  conversations: Conversation[];
  assistants: Assistant[];
  onSendMessage: (content: string, assistantId?: string) => void;
  isGenerating: boolean;
  onCancelGeneration: () => void;
  onRegenerate: () => void;
  bridgeStatus: BridgeStatus;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  models: ModelInfo[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (assistantId?: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatView({
  conversation,
  conversations,
  assistants,
  onSendMessage,
  isGenerating,
  onCancelGeneration,
  onRegenerate,
  bridgeStatus,
  selectedModel,
  onSelectModel,
  models,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAssistantDropdown, setShowAssistantDropdown] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allModels = models.length > 0 ? models.map(m => typeof m === 'string' ? m : m.name) : ['qwen3:4b'];
  const activeAssistant = assistants.find(a => a.id === selectedAssistantId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim(), selectedAssistantId);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversation list sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-800/30 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={() => onNewConversation(selectedAssistantId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={14} />
            Nueva conversación
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-xs text-center mt-4 px-2">Sin conversaciones</p>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    conv.id === activeConversationId ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/30">
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
              >
                <span className="text-gray-300">Modelo:</span>
                <span className="text-white font-medium">{selectedModel}</span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>
              {showModelDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50">
                  {allModels.map(m => (
                    <button
                      key={m}
                      onClick={() => { onSelectModel(m); setShowModelDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 ${m === selectedModel ? 'text-blue-400' : 'text-gray-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assistant selector */}
            {assistants.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  <span className="text-gray-300">Asistente:</span>
                  <span className="text-white font-medium">{activeAssistant?.name || 'Ninguno'}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                {showAssistantDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50">
                    <button
                      onClick={() => { setSelectedAssistantId(undefined); setShowAssistantDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-600 text-gray-300"
                    >
                      Sin asistente
                    </button>
                    {assistants.map(a => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedAssistantId(a.id); setShowAssistantDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 ${a.id === selectedAssistantId ? 'text-blue-400' : 'text-gray-300'}`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {conversation && conversation.messages.length > 0 && !isGenerating && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-300"
              title="Regenerar última respuesta"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Regenerar</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!conversation || conversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {bridgeStatus === 'online' ? '¿En qué puedo ayudarte?' : 'IA Local no disponible'}
              </h2>
              <p className="text-gray-400 text-sm max-w-md mb-4">
                {bridgeStatus === 'online'
                  ? `Conversando con ${selectedModel} a través de tu GATEWA Local Bridge.`
                  : 'Tu bridge local no está disponible. Verifica que GATEWA Local Bridge esté ejecutándose en tu ordenador.'}
              </p>
              {activeAssistant && (
                <div className="mt-2 px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-lg text-sm text-purple-300">
                  Usando asistente: <strong>{activeAssistant.name}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {conversation.messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={bridgeStatus === 'online' ? 'Escribe tu mensaje... (Enter para enviar)' : 'IA Local no disponible...'}
                disabled={bridgeStatus !== 'online' || isGenerating}
                rows={1}
                className="flex-1 resize-none rounded-xl bg-gray-700 border border-gray-600 px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ maxHeight: '200px' }}
              />
              {isGenerating ? (
                <button type="button" onClick={onCancelGeneration} className="p-3 rounded-xl bg-red-600 hover:bg-red-700 shrink-0" aria-label="Cancelar">
                  <StopCircle size={20} />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim() || bridgeStatus !== 'online'} className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0 disabled:opacity-50" aria-label="Enviar">
                  <Send size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
