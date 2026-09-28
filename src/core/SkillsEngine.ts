/**
 * GATEWA Skills Engine - Registro Formal de Habilidades
 * 
 * Responsabilidades:
 * - Mantener registro de habilidades disponibles
 * - Cada skill tiene: id, descripción, input/output schema, modelo compatible,
 *   herramientas permitidas, permisos, timeout, límites, estado
 * - Seleccionar skill apropiado según intención
 */

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  compatibleModels: string[];
  requiredTools: string[];
  requiredCapabilities: string[];
  permissions: string[];
  timeout: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  status: 'active' | 'deprecated' | 'experimental';
  version: string;
}

export class SkillsEngine {
  private skills: Map<string, SkillDefinition> = new Map();

  constructor() {
    this.registerDefaultSkills();
  }

  private registerDefaultSkills() {
    // Skill: Chat general
    this.register({
      id: 'general_chat',
      name: 'Conversación General',
      description: 'Conversación abierta con el modelo',
      inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { response: { type: 'string' } } },
      compatibleModels: ['*'],
      requiredTools: [],
      requiredCapabilities: ['chat'],
      permissions: ['chat'],
      timeout: 60000,
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
      status: 'active',
      version: '1.0.0',
    });

    // Skill: Resúmen
    this.register({
      id: 'summarization',
      name: 'Resúmen de Texto',
      description: 'Genera resúmenes concisos de textos largos',
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, maxLength: { type: 'number' } } },
      outputSchema: { type: 'object', properties: { summary: { type: 'string' } } },
      compatibleModels: ['*'],
      requiredTools: [],
      requiredCapabilities: ['summarization'],
      permissions: ['chat'],
      timeout: 120000,
      maxInputTokens: 8000,
      maxOutputTokens: 2000,
      status: 'active',
      version: '1.0.0',
    });

    // Skill: Traducción
    this.register({
      id: 'translation',
      name: 'Traducción',
      description: 'Traduce texto entre idiomas',
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, sourceLang: { type: 'string' }, targetLang: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { translation: { type: 'string' } } },
      compatibleModels: ['*'],
      requiredTools: [],
      requiredCapabilities: ['translation'],
      permissions: ['chat'],
      timeout: 60000,
      maxInputTokens: 4000,
      maxOutputTokens: 4000,
      status: 'active',
      version: '1.0.0',
    });

    // Skill: Programación
    this.register({
      id: 'coding',
      name: 'Asistencia de Programación',
      description: 'Genera, explica y depura código',
      inputSchema: { type: 'object', properties: { request: { type: 'string' }, language: { type: 'string' }, context: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { code: { type: 'string' }, explanation: { type: 'string' } } },
      compatibleModels: ['*'],
      requiredTools: [],
      requiredCapabilities: ['coding'],
      permissions: ['chat', 'code_generation'],
      timeout: 120000,
      maxInputTokens: 6000,
      maxOutputTokens: 4000,
      status: 'active',
      version: '1.0.0',
    });

    // Skill: Análisis documental
    this.register({
      id: 'document_analysis',
      name: 'Análisis de Documentos',
      description: 'Analiza y extrae información de documentos',
      inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, query: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { analysis: { type: 'string' }, citations: { type: 'array' } } },
      compatibleModels: ['*'],
      requiredTools: ['document_retrieval'],
      requiredCapabilities: ['analysis'],
      permissions: ['chat', 'read_documents'],
      timeout: 120000,
      maxInputTokens: 8000,
      maxOutputTokens: 4000,
      status: 'active',
      version: '1.0.0',
    });
  }

  /**
   * Registra una nueva skill
   */
  register(skill: SkillDefinition) {
    this.skills.set(skill.id, skill);
  }

  /**
   * Selecciona la skill más apropiada para una intención
   */
  async selectSkill(intention: string): Promise<SkillDefinition | undefined> {
    // Mapeo directo de intención a skill
    const skillMap: Record<string, string> = {
      'general_chat': 'general_chat',
      'summarization': 'summarization',
      'translation': 'translation',
      'coding': 'coding',
      'document_analysis': 'document_analysis',
    };

    const skillId = skillMap[intention];
    if (skillId) {
      return this.skills.get(skillId);
    }

    // Default: general chat
    return this.skills.get('general_chat');
  }

  /**
   * Obtiene todas las skills registradas
   */
  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Obtiene una skill específica
   */
  getSkill(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }
}
