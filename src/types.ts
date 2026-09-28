// ============================================================
// GATEWA - Type Definitions
// ============================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  workspaceId: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  workspaceId: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: string;
  // RAG: futuro - chunks, embeddings, etc.
}

export interface ModelInfo {
  name: string;
  size?: string;
  modifiedAt?: string;
  digest?: string;
}

export interface ActivityEntry {
  id: string;
  type: 'chat' | 'document' | 'assistant' | 'system' | 'bridge';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type BridgeStatus = 'online' | 'offline' | 'degraded' | 'error' | 'not_configured' | 'checking';
export type ViewType = 'dashboard' | 'chat' | 'workspaces' | 'documents' | 'assistants' | 'models' | 'tools' | 'activity' | 'settings';

export interface LinkDiagnostic {
  status: BridgeStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
  name?: string;
}

export interface HealthResponse {
  status: string;
  overall: BridgeStatus;
  cloudApi: LinkDiagnostic;
  tunnel: LinkDiagnostic;
  bridge: LinkDiagnostic;
  ollama: LinkDiagnostic;
  model: LinkDiagnostic;
  bridgeVersion?: string;
  error?: string;
  timestamp: string;
}

export interface ModelsResponse {
  models: ModelInfo[];
  default: string;
}

export interface GatewaySettings {
  bridgeUrl: string;
  bridgeConnected: boolean;
  lastChecked: string | null;
}
