/**
 * GATEWA Model Router - Descubrimiento y Selección de Modelos
 * 
 * Responsabilidades:
 * - Descubrir modelos disponibles en Ollama
 * - Registrar capacidades y estado de cada modelo
 * - Seleccionar modelo apropiado según tarea, recursos, privacidad
 * - Preparado para futuros proveedores (cloud, locales)
 */

export interface ModelCapability {
  id: string;
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic' | 'local';
  contextWindow: number;
  capabilities: string[];
  status: 'available' | 'unavailable' | 'loading';
  size?: string;
  lastChecked: string;
}

export interface ModelSelectionCriteria {
  intention: string;
  skill?: { id: string; requiredCapabilities: string[] };
  workspaceId: string;
  userId: string;
  preferredProvider?: string;
  maxTokens?: number;
}

export class ModelRouter {
  private models: Map<string, ModelCapability> = new Map();
  private lastDiscovery: number = 0;
  private discoveryInterval: number = 60000; // 1 minuto

  constructor() {
    // Registrar modelo por defecto
    this.registerDefaultModel();
  }

  private registerDefaultModel() {
    this.models.set('qwen3:4b', {
      id: 'qwen3:4b',
      name: 'Qwen 3 4B',
      provider: 'ollama',
      contextWindow: 32768,
      capabilities: ['chat', 'summarization', 'translation', 'coding', 'analysis'],
      status: 'available',
      lastChecked: new Date().toISOString(),
    });
  }

  /**
   * Descubre modelos disponibles desde Ollama
   */
  async discoverModels(): Promise<ModelCapability[]> {
    const now = Date.now();
    if (now - this.lastDiscovery < this.discoveryInterval) {
      return Array.from(this.models.values());
    }

    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        for (const model of models) {
          const modelName = typeof model === 'string' ? model : model.name;
          if (!this.models.has(modelName)) {
            this.models.set(modelName, {
              id: modelName,
              name: modelName,
              provider: 'ollama',
              contextWindow: 32768, // Default
              capabilities: ['chat'],
              status: 'available',
              size: model.size,
              lastChecked: new Date().toISOString(),
            });
          }
        }
        
        this.lastDiscovery = now;
      }
    } catch (error) {
      console.error('Model discovery failed:', error);
    }

    return Array.from(this.models.values());
  }

  /**
   * Selecciona el modelo más apropiado para la tarea
   */
  async selectModel(criteria: ModelSelectionCriteria): Promise<ModelCapability> {
    // Asegurar que tenemos modelos descubiertos
    if (this.models.size === 0) {
      await this.discoverModels();
    }

    // Si hay skill con capacidades requeridas, filtrar
    if (criteria.skill?.requiredCapabilities) {
      const suitable = Array.from(this.models.values()).filter(m =>
        m.status === 'available' &&
        criteria.skill!.requiredCapabilities.every(cap => m.capabilities.includes(cap))
      );
      if (suitable.length > 0) {
        return suitable[0];
      }
    }

    // Si hay proveedor preferido, usarlo
    if (criteria.preferredProvider) {
      const preferred = Array.from(this.models.values()).find(
        m => m.provider === criteria.preferredProvider && m.status === 'available'
      );
      if (preferred) return preferred;
    }

    // Por defecto, usar el primer modelo disponible
    const available = Array.from(this.models.values()).find(m => m.status === 'available');
    if (available) return available;

    // Fallback al modelo por defecto
    return this.models.get('qwen3:4b') || {
      id: 'qwen3:4b',
      name: 'Qwen 3 4B',
      provider: 'ollama',
      contextWindow: 32768,
      capabilities: ['chat'],
      status: 'unavailable',
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Obtiene todos los modelos registrados
   */
  getModels(): ModelCapability[] {
    return Array.from(this.models.values());
  }

  /**
   * Obtiene un modelo específico
   */
  getModel(id: string): ModelCapability | undefined {
    return this.models.get(id);
  }

  /**
   * Actualiza el estado de un modelo
   */
  updateModelStatus(id: string, status: ModelCapability['status']) {
    const model = this.models.get(id);
    if (model) {
      model.status = status;
      model.lastChecked = new Date().toISOString();
    }
  }
}
