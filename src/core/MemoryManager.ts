/**
 * GATEWA Memory Manager - Gestión de Memoria
 * 
 * Responsabilidades:
 * - Distinguir memoria de conversación, contexto temporal de sesión,
 *   memoria de workspace y conocimiento persistente
 * - Políticas explícitas de retención, borrado, privacidad y consentimiento
 */

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'session' | 'workspace' | 'knowledge';
  key: string;
  value: unknown;
  userId: string;
  workspaceId: string;
  conversationId?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryPolicy {
  maxEntries: number;
  retentionDays: number;
  allowCrossWorkspace: boolean;
  requireConsent: boolean;
}

export class MemoryManager {
  private memory: Map<string, MemoryEntry> = new Map();
  private policies: Map<string, MemoryPolicy> = new Map();

  constructor() {
    // Políticas por defecto
    this.policies.set('conversation', {
      maxEntries: 1000,
      retentionDays: 30,
      allowCrossWorkspace: false,
      requireConsent: false,
    });

    this.policies.set('session', {
      maxEntries: 100,
      retentionDays: 1, // 1 día
      allowCrossWorkspace: false,
      requireConsent: false,
    });

    this.policies.set('workspace', {
      maxEntries: 500,
      retentionDays: 365,
      allowCrossWorkspace: false,
      requireConsent: true,
    });

    this.policies.set('knowledge', {
      maxEntries: 10000,
      retentionDays: -1, // Permanente
      allowCrossWorkspace: false,
      requireConsent: true,
    });
  }

  /**
   * Guarda una entrada de memoria
   */
  async store(entry: Omit<MemoryEntry, 'id' | 'createdAt'>): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const policy = this.policies.get(entry.type);

    if (!policy) {
      throw new Error(`Unknown memory type: ${entry.type}`);
    }

    // Verificar consentimiento si es requerido
    if (policy.requireConsent && !entry.metadata?.consentGiven) {
      throw new Error(`Consent required for ${entry.type} memory`);
    }

    const fullEntry: MemoryEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };

    this.memory.set(id, fullEntry);

    // Limpiar entradas expiradas
    this.cleanup();

    return id;
  }

  /**
   * Recupera una entrada de memoria
   */
  async retrieve(id: string): Promise<MemoryEntry | undefined> {
    const entry = this.memory.get(id);
    if (!entry) return undefined;

    // Verificar expiración
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.memory.delete(id);
      return undefined;
    }

    return entry;
  }

  /**
   * Busca entradas de memoria por criterios
   */
  async search(criteria: {
    type?: MemoryEntry['type'];
    userId?: string;
    workspaceId?: string;
    conversationId?: string;
    key?: string;
  }): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];

    for (const entry of this.memory.values()) {
      if (criteria.type && entry.type !== criteria.type) continue;
      if (criteria.userId && entry.userId !== criteria.userId) continue;
      if (criteria.workspaceId && entry.workspaceId !== criteria.workspaceId) continue;
      if (criteria.conversationId && entry.conversationId !== criteria.conversationId) continue;
      if (criteria.key && entry.key !== criteria.key) continue;

      results.push(entry);
    }

    return results;
  }

  /**
   * Elimina una entrada de memoria
   */
  async delete(id: string): Promise<boolean> {
    return this.memory.delete(id);
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanup() {
    const now = new Date();
    for (const [id, entry] of this.memory.entries()) {
      if (entry.expiresAt && new Date(entry.expiresAt) < now) {
        this.memory.delete(id);
      }
    }
  }

  /**
   * Obtiene la política para un tipo de memoria
   */
  getPolicy(type: MemoryEntry['type']): MemoryPolicy | undefined {
    return this.policies.get(type);
  }
}
