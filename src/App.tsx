import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatArea } from './components/ChatArea';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { ModelSelector } from './components/ModelSelector';
import { type Message, type Conversation, type GatewayStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('checking');
  const [selectedModel, setSelectedModel] = useState('qwen3:4b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Check gateway health on mount and periodically
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data.ollamaAvailable ? 'online' : 'offline');
      } else {
        setGatewayStatus('offline');
      }
    } catch {
      setGatewayStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setAvailableModels(data.models || []);
        }
      } catch {
        // Models endpoint not available
      }
    };
    fetchModels();
  }, []);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ollama-chat-conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ollama-chat-conversations', JSON.stringify(conversations));
    } catch {
      // Ignore storage errors
    }
  }, [conversations]);

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isGenerating) return;

    let convId = activeConversationId;
    let currentConv = activeConversation;

    // Create new conversation if none active
    if (!currentConv) {
      const newConv: Conversation = {
        id: uuidv4(),
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
      currentConv = newConv;
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const updatedTitle = c.messages.length === 0 
          ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
          : c.title;
        return {
          ...c,
          title: updatedTitle,
          messages: [...c.messages, userMessage, assistantMessage],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    setIsGenerating(true);

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...(currentConv?.messages || []), userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setConversations(prev => prev.map(c => {
                if (c.id === convId) {
                  const msgs = [...c.messages];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...lastMsg, content: accumulated };
                  }
                  return { ...c, messages: msgs };
                }
                return c;
              }));
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Mark streaming as complete
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            msgs[msgs.length - 1] = { ...lastMsg, isStreaming: false };
          }
          return { ...c, messages: msgs, updatedAt: new Date().toISOString() };
        }
        return c;
      }));

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
        setConversations(prev => prev.map(c => {
          if (c.id === convId) {
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = { 
                ...lastMsg, 
                isStreaming: false,
                content: lastMsg.content || '(Generación cancelada)',
              };
            }
            return { ...c, messages: msgs };
          }
          return c;
        }));
      } else {
        // Error occurred
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setConversations(prev => prev.map(c => {
          if (c.id === convId) {
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = { 
                ...lastMsg, 
                isStreaming: false,
                content: `⚠️ Error: ${errorMsg}`,
                isError: true,
              };
            }
            return { ...c, messages: msgs };
          }
          return c;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [activeConversationId, activeConversation, isGenerating, selectedModel]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header 
        gatewayStatus={gatewayStatus}
        isGenerating={isGenerating}
        selectedModel={selectedModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={availableModels}
            onSelectModel={setSelectedModel}
          />
          
          <ChatArea
            conversation={activeConversation}
            onSendMessage={sendMessage}
            isGenerating={isGenerating}
            onCancelGeneration={cancelGeneration}
            gatewayStatus={gatewayStatus}
          />
        </main>
      </div>

      <StatusBar gatewayStatus={gatewayStatus} />
    </div>
  );
}

export default App;
