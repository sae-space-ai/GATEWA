import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { ChatView } from './views/ChatView';
import { WorkspacesView } from './views/WorkspacesView';
import { DocumentsView } from './views/DocumentsView';
import { AssistantsView } from './views/AssistantsView';
import { ModelsView } from './views/ModelsView';
import { ToolsView } from './views/ToolsView';
import { ActivityView } from './views/ActivityView';
import { SettingsView } from './views/SettingsView';
import { 
  type Message, type Conversation, type BridgeStatus, type ViewType,
  type Workspace, type Assistant, type Document, type ModelInfo, type ActivityEntry 
} from './types';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('default');
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('checking');
  const [selectedModel, setSelectedModel] = useState('qwen3:4b');
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Check bridge health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setBridgeStatus(data.bridgeAvailable ? 'online' : 'offline');
        addActivity('bridge', data.bridgeAvailable ? 'Bridge local conectado' : 'Bridge local desconectado');
      } else {
        setBridgeStatus('offline');
      }
    } catch {
      setBridgeStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
        }
      } catch {
        // Models endpoint not available
      }
    };
    fetchModels();
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gatewa-data');
      if (saved) {
        const data = JSON.parse(saved);
        setConversations(data.conversations || []);
        setWorkspaces(data.workspaces || [{ id: 'default', name: 'Principal', description: 'Workspace por defecto', color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        setAssistants(data.assistants || []);
        setDocuments(data.documents || []);
        setActivities(data.activities || []);
        if (data.activeWorkspaceId) setActiveWorkspaceId(data.activeWorkspaceId);
      } else {
        setWorkspaces([{ id: 'default', name: 'Principal', description: 'Workspace por defecto', color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
      }
    } catch {
      setWorkspaces([{ id: 'default', name: 'Principal', description: 'Workspace por defecto', color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gatewa-data', JSON.stringify({
        conversations,
        workspaces,
        assistants,
        documents,
        activities: activities.slice(-100), // Keep last 100
        activeWorkspaceId,
      }));
    } catch {
      // Ignore storage errors
    }
  }, [conversations, workspaces, assistants, documents, activities, activeWorkspaceId]);

  const addActivity = useCallback((type: ActivityEntry['type'], message: string, metadata?: Record<string, unknown>) => {
    const entry: ActivityEntry = {
      id: uuidv4(),
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setActivities(prev => [entry, ...prev].slice(0, 100));
  }, []);

  const createNewConversation = useCallback((assistantId?: string) => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'Nueva conversación',
      messages: [],
      workspaceId: activeWorkspaceId,
      assistantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentView('chat');
    addActivity('chat', 'Nueva conversación creada');
  }, [activeWorkspaceId, addActivity]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
    addActivity('chat', 'Conversación eliminada');
  }, [activeConversationId, addActivity]);

  const sendMessage = useCallback(async (content: string, assistantId?: string) => {
    if (!content.trim() || isGenerating) return;

    let convId = activeConversationId;
    let currentConv = activeConversation;

    // Get assistant system prompt if specified
    const assistant = assistants.find(a => a.id === assistantId);
    const systemMessages = assistant ? [{ role: 'system' as const, content: assistant.systemPrompt }] : [];

    if (!currentConv) {
      const newConv: Conversation = {
        id: uuidv4(),
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        messages: [],
        workspaceId: activeWorkspaceId,
        assistantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
      currentConv = newConv;
    }

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
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const allMessages = [...systemMessages, ...(currentConv?.messages || []), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          model: assistant?.model || selectedModel,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith(' '));

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
            // Skip malformed
          }
        }
      }

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

      addActivity('chat', `Respuesta generada para: "${content.slice(0, 30)}..."`);

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
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
        addActivity('chat', 'Generación cancelada por el usuario');
      } else {
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
        addActivity('system', `Error en chat: ${errorMsg}`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [activeConversationId, activeConversation, isGenerating, selectedModel, activeWorkspaceId, assistants, addActivity]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const regenerateLastMessage = useCallback(() => {
    if (!activeConversation || isGenerating) return;
    const msgs = activeConversation.messages;
    if (msgs.length < 2) return;
    
    // Find last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    
    if (lastUserIdx === -1) return;
    
    const lastUserContent = msgs[lastUserIdx].content;
    const assistantId = activeConversation.assistantId;
    
    // Remove everything after the last user message
    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        return { ...c, messages: c.messages.slice(0, lastUserIdx) };
      }
      return c;
    }));
    
    // Re-send
    setTimeout(() => sendMessage(lastUserContent, assistantId), 100);
  }, [activeConversation, activeConversationId, isGenerating, sendMessage]);

  // Workspace operations
  const createWorkspace = useCallback((name: string, description: string, color: string) => {
    const ws: Workspace = {
      id: uuidv4(),
      name,
      description,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkspaces(prev => [...prev, ws]);
    addActivity('system', `Workspace "${name}" creado`);
  }, [addActivity]);

  const deleteWorkspace = useCallback((id: string) => {
    if (id === 'default') return; // Can't delete default
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    setConversations(prev => prev.filter(c => c.workspaceId !== id));
    setDocuments(prev => prev.filter(d => d.workspaceId !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId('default');
    addActivity('system', 'Workspace eliminado');
  }, [activeWorkspaceId, addActivity]);

  // Assistant operations
  const createAssistant = useCallback((assistant: Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAssistant: Assistant = {
      ...assistant,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAssistants(prev => [...prev, newAssistant]);
    addActivity('assistant', `Asistente "${assistant.name}" creado`);
  }, [addActivity]);

  const deleteAssistant = useCallback((id: string) => {
    setAssistants(prev => prev.filter(a => a.id !== id));
    addActivity('assistant', 'Asistente eliminado');
  }, [addActivity]);

  // Document operations (prepared for future RAG)
  const addDocument = useCallback((doc: Omit<Document, 'id' | 'createdAt' | 'status'>) => {
    const newDoc: Document = {
      ...doc,
      id: uuidv4(),
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [...prev, newDoc]);
    addActivity('document', `Documento "${doc.name}" añadido`);
  }, [addActivity]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    addActivity('document', 'Documento eliminado');
  }, [addActivity]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            bridgeStatus={bridgeStatus}
            selectedModel={selectedModel}
            conversations={conversations}
            workspaces={workspaces}
            assistants={assistants}
            documents={documents}
            activities={activities}
            onNavigate={setCurrentView}
            onNewChat={() => createNewConversation()}
          />
        );
      case 'chat':
        return (
          <ChatView
            conversation={activeConversation}
            conversations={conversations.filter(c => c.workspaceId === activeWorkspaceId)}
            assistants={assistants}
            onSendMessage={sendMessage}
            isGenerating={isGenerating}
            onCancelGeneration={cancelGeneration}
            onRegenerate={regenerateLastMessage}
            bridgeStatus={bridgeStatus}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            models={models}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
          />
        );
      case 'workspaces':
        return (
          <WorkspacesView
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={setActiveWorkspaceId}
            onCreateWorkspace={createWorkspace}
            onDeleteWorkspace={deleteWorkspace}
            conversationCounts={conversations.reduce((acc, c) => {
              acc[c.workspaceId] = (acc[c.workspaceId] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)}
          />
        );
      case 'documents':
        return (
          <DocumentsView
            documents={documents.filter(d => d.workspaceId === activeWorkspaceId)}
            onAddDocument={addDocument}
            onDeleteDocument={deleteDocument}
            activeWorkspaceId={activeWorkspaceId}
          />
        );
      case 'assistants':
        return (
          <AssistantsView
            assistants={assistants}
            models={models}
            defaultModel={selectedModel}
            onCreateAssistant={createAssistant}
            onDeleteAssistant={deleteAssistant}
            onStartChat={(assistantId) => createNewConversation(assistantId)}
          />
        );
      case 'models':
        return (
          <ModelsView
            models={models}
            bridgeStatus={bridgeStatus}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        );
      case 'tools':
        return <ToolsView />;
      case 'activity':
        return <ActivityView activities={activities} />;
      case 'settings':
        return <SettingsView bridgeStatus={bridgeStatus} />;
      default:
        return null;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      bridgeStatus={bridgeStatus}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
