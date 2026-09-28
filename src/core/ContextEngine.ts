/**
 * GATEWA Context Engine - Gestión de Ventana de Contexto
 * 
 * Responsabilidades:
 * - Administrar ventana de contexto de los modelos
 * - Seleccionar información relevante
 * - Resumir cuando sea necesario
 * - Evitar enviar documentos completos innecesariamente
 */

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ContextBuildRequest {
  conversationId?: string;
  workspaceId: string;
  skill?: { id: string; maxInputTokens: number };
  tools: string[];
  maxTokens: number;
}

export interface ContextBuildResult {
  messages: ContextMessage[];
  estimatedTokens: number;
  truncated: boolean;
  summary?: string;
}

export class ContextEngine {
  private conversationHistory: Map<string, ContextMessage[]> = new Map();

  /**
   * Construye el contexto para una solicitud
   */
  async buildContext(request: ContextBuildRequest): Promise<ContextBuildResult> {
    const messages: ContextMessage[] = [];
    let estimatedTokens = 0;
    const maxTokens = request.skill?.maxInputTokens || request.maxTokens;

    // 1. Obtener historial de conversación si existe
    if (request.conversationId) {
      const history = this.conversationHistory.get(request.conversationId) || [];
      
      // Añadir mensajes del historial (más recientes primero para priorizar)
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        const msgTokens = this.estimateTokens(msg.content);
        
        if (estimatedTokens + msgTokens > maxTokens * 0.8) {
          // Si excedemos el 80% del límite, resumir el resto
          break;
        }
        
        messages.unshift(msg);
        estimatedTokens += msgTokens;
      }
    }

    return {
      messages,
      estimatedTokens,
      truncated: estimatedTokens > maxTokens * 0.8,
    };
  }

  /**
   * Añade un mensaje al historial de conversación
   */
  addMessage(conversationId: string, message: ContextMessage) {
    const history = this.conversationHistory.get(conversationId) || [];
    history.push(message);
    
    // Limitar historial a 50 mensajes por conversación
    if (history.length > 50) {
      history.shift();
    }
    
    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Obtiene el historial de una conversación
   */
  getHistory(conversationId: string): ContextMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Limpia el historial de una conversación
   */
  clearHistory(conversationId: string) {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Estima el número de tokens en un texto (aproximación simple)
   */
  private estimateTokens(text: string): number {
    // Aproximación: 1 token ≈ 4 caracteres en inglés, 2-3 en español
    return Math.ceil(text.length / 3);
  }

  /**
   * Resume un texto largo (stub - en futuro usará el modelo)
   */
  async summarize(text: string, maxTokens: number): Promise<string> {
    // Por ahora, truncar simple
    const maxChars = maxTokens * 3;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + '... [resumido]';
  }
}
