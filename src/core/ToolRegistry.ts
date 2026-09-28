/**
 * GATEWA Tool Registry - Herramientas Controladas
 * 
 * Responsabilidades:
 * - Registro de herramientas disponibles
 * - Schemas de entrada/salida
 * - Validación, permisos, auditoría, timeout, aislamiento
 * - Impide que un prompt se convierta en ejecución arbitraria
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  permissions: string[];
  timeout: number;
  requiresConfirmation: boolean;
  status: 'active' | 'disabled' | 'experimental';
}

export interface ToolExecution {
  toolId: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  duration: number;
  timestamp: string;
  authorized: boolean;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Tool: Recuperación de documentos (para RAG futuro)
    this.register({
      id: 'document_retrieval',
      name: 'Recuperación de Documentos',
      description: 'Busca y recupera fragmentos relevantes de documentos',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          workspaceId: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['query', 'workspaceId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          chunks: { type: 'array' },
        },
      },
      permissions: ['read_documents'],
      timeout: 10000,
      requiresConfirmation: false,
      status: 'experimental', // No implementado aún
    });

    // Tool: Búsqueda web (futuro)
    this.register({
      id: 'web_search',
      name: 'Búsqueda Web',
      description: 'Busca información en la web',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          results: { type: 'array' },
        },
      },
      permissions: ['web_access'],
      timeout: 15000,
      requiresConfirmation: true,
      status: 'disabled',
    });
  }

  /**
   * Registra una nueva herramienta
   */
  register(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  /**
   * Obtiene una herramienta
   */
  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * Obtiene todas las herramientas
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Valida si una herramienta puede ejecutarse
   */
  validateExecution(toolId: string, permissions: string[]): { valid: boolean; reason?: string } {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return { valid: false, reason: `Tool ${toolId} not found` };
    }

    if (tool.status !== 'active') {
      return { valid: false, reason: `Tool ${toolId} is ${tool.status}` };
    }

    // Verificar permisos
    const hasPermission = tool.permissions.every(p => permissions.includes(p));
    if (!hasPermission) {
      return { valid: false, reason: `Insufficient permissions for ${toolId}` };
    }

    return { valid: true };
  }

  /**
   * Ejecuta una herramienta (stub - en futuro se conectará con implementaciones reales)
   */
  async execute(toolId: string, input: Record<string, unknown>, permissions: string[]): Promise<ToolExecution> {
    const startTime = Date.now();
    const validation = this.validateExecution(toolId, permissions);

    if (!validation.valid) {
      return {
        toolId,
        input,
        error: validation.reason,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        authorized: false,
      };
    }

    // Por ahora, las herramientas están en estado experimental/disabled
    // En el futuro, aquí se ejecutaría la lógica real
    return {
      toolId,
      input,
      output: { message: `Tool ${toolId} execution not yet implemented` },
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      authorized: true,
    };
  }
}
