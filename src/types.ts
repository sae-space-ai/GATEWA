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
  createdAt: string;
  updatedAt: string;
}

export type GatewayStatus = 'online' | 'offline' | 'checking';

export interface ChatRequest {
  messages: { role: string; content: string }[];
  model: string;
  stream: boolean;
}

export interface HealthResponse {
  status: string;
  ollamaAvailable: boolean;
  model: string;
  timestamp: string;
}

export interface ModelsResponse {
  models: string[];
  default: string;
}
