/**
 * GATEWA Prompt Registry - System Prompts Versionados
 * 
 * Responsabilidades:
 * - Mantener registro de system prompts
 * - Versionado de prompts
 * - Evitar prompts críticos dispersos por el código
 * - Plantillas y políticas
 */

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  content: string;
  version: string;
  skillId?: string;
  workspaceId?: string;
  modelId?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'deprecated' | 'draft';
}

export interface PromptRequest {
  skill?: string;
  workspace?: string;
  model?: string;
  variables?: Record<string, string>;
}

export class PromptRegistry {
  private prompts: Map<string, PromptDefinition> = new Map();

  constructor() {
    this.registerDefaultPrompts();
  }

  private registerDefaultPrompts() {
    // Prompt base para chat general
    this.register({
      id: 'base_chat',
      name: 'Chat General',
      description: 'System prompt base para conversaciones generales',
      content: 'Eres GATEWA, un asistente de IA útil y seguro. Responde de forma clara, concisa y precisa. Si no sabes algo, admítelo. No inventes información.',
      version: '1.0.0',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    });

    // Prompt para resúmen
    this.register({
      id: 'summarization',
      name: 'Resúmen de Texto',
      description: 'System prompt para generación de resúmenes',
      content: 'Eres un experto en resumir textos. Tu tarea es crear resúmenes concisos que capturen los puntos clave del texto original. Mantén la esencia del contenido sin añadir información nueva. Estructura el resumen de forma clara y legible.',
      version: '1.0.0',
      skillId: 'summarization',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    });

    // Prompt para traducción
    this.register({
      id: 'translation',
      name: 'Traducción',
      description: 'System prompt para traducción entre idiomas',
      content: 'Eres un traductor profesional. Traduce el texto manteniendo el tono, estilo y significado original. Si hay ambigüedad, elige la interpretación más natural en el idioma destino. No añadas explicaciones a menos que se te pidan.',
      version: '1.0.0',
      skillId: 'translation',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    });

    // Prompt para programación
    this.register({
      id: 'coding',
      name: 'Asistencia de Programación',
      description: 'System prompt para asistencia en programación',
      content: 'Eres un programador experto. Genera código limpio, eficiente y bien documentado. Explica tus decisiones de diseño cuando sea relevante. Si hay errores en el código del usuario, identíficalos y sugiere correcciones. Usa las mejores prácticas del lenguaje.',
      version: '1.0.0',
      skillId: 'coding',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    });

    // Prompt para análisis documental
    this.register({
      id: 'document_analysis',
      name: 'Análisis de Documentos',
      description: 'System prompt para análisis de documentos',
      content: 'Eres un analista de documentos experto. Examina el contenido proporcionado con atención al detalle. Extrae información relevante, identifica patrones y proporciona análisis estructurados. Cita las fuentes cuando sea apropiado. Si la información es insuficiente, indícalo claramente.',
      version: '1.0.0',
      skillId: 'document_analysis',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    });
  }

  /**
   * Registra un nuevo prompt
   */
  register(prompt: Omit<PromptDefinition, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }) {
    const now = new Date().toISOString();
    this.prompts.set(prompt.id, {
      ...prompt,
      createdAt: prompt.createdAt || now,
      updatedAt: prompt.updatedAt || now,
    });
  }

  /**
   * Obtiene el prompt apropiado según el contexto
   */
  async getPrompt(request: PromptRequest): Promise<PromptDefinition> {
    // Buscar por skill
    if (request.skill) {
      const skillPrompt = Array.from(this.prompts.values()).find(
        p => p.skillId === request.skill && p.status === 'active'
      );
      if (skillPrompt) return skillPrompt;
    }

    // Buscar por workspace
    if (request.workspace) {
      const workspacePrompt = Array.from(this.prompts.values()).find(
        p => p.workspaceId === request.workspace && p.status === 'active'
      );
      if (workspacePrompt) return workspacePrompt;
    }

    // Default: base chat
    return this.prompts.get('base_chat') || {
      id: 'default',
      name: 'Default',
      description: 'Default system prompt',
      content: 'Eres un asistente útil.',
      version: '1.0.0',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };
  }

  /**
   * Obtiene todos los prompts
   */
  getAllPrompts(): PromptDefinition[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Obtiene un prompt específico
   */
  getPromptById(id: string): PromptDefinition | undefined {
    return this.prompts.get(id);
  }
}
