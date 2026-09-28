import { type Conversation, type GatewayStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { Send, StopCircle, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  onCancelGeneration: () => void;
  gatewayStatus: GatewayStatus;
}

export function ChatArea({
  conversation,
  onSendMessage,
  isGenerating,
  onCancelGeneration,
  gatewayStatus,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!conversation || conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {gatewayStatus === 'online' 
                ? '¿En qué puedo ayudarte?' 
                : 'Motor local no disponible'}
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              {gatewayStatus === 'online'
                ? 'Escribe un mensaje para comenzar una conversación con qwen3:4b ejecutándose en tu ordenador.'
                : 'Tu ordenador local no está disponible. Asegúrate de que Ollama y el Gateway local estén ejecutándose.'}
            </p>
            {gatewayStatus === 'offline' && (
              <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-2 rounded-lg">
                <AlertTriangle size={16} />
                <span>LOCAL OFFLINE - Verifica tu conexión y servicios</span>
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

      {/* Input area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  gatewayStatus === 'online'
                    ? 'Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)'
                    : 'Motor local no disponible...'
                }
                disabled={gatewayStatus !== 'online' || isGenerating}
                rows={1}
                className="w-full resize-none rounded-xl bg-gray-700 border border-gray-600 px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ maxHeight: '200px' }}
              />
            </div>
            
            {isGenerating ? (
              <button
                type="button"
                onClick={onCancelGeneration}
                className="p-3 rounded-xl bg-red-600 hover:bg-red-700 transition-colors shrink-0"
                aria-label="Cancelar generación"
              >
                <StopCircle size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || gatewayStatus !== 'online'}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
