/**
 * GATEWA Policy Engine - Motor de Políticas
 * 
 * Responsabilidades:
 * - Decidir qué usuario, agente, modelo, skill, tool o connector
 *   puede realizar cada operación
 * - Políticas granulares de permisos
 * - Separación entre autenticación y autorización
 */

export interface Policy {
  id: string;
  name: string;
  description: string;
  resource: string; // 'chat', 'document', 'tool', 'skill', 'workspace'
  action: string; // 'create', 'read', 'update', 'delete', 'execute'
  principal: string; // 'user', 'assistant', 'system'
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown>;
  priority: number;
}

export interface PolicyEvaluation {
  principal: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
}

export interface PolicyResult {
  allowed: boolean;
  matchedPolicies: string[];
  reason?: string;
}

export class PolicyEngine {
  private policies: Policy[] = [];

  constructor() {
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies() {
    // Política: Usuarios autenticados pueden chatear
    this.register({
      id: 'allow_chat_authenticated',
      name: 'Chat para usuarios autenticados',
      description: 'Permite a usuarios autenticados usar el chat',
      resource: 'chat',
      action: 'create',
      principal: 'user',
      effect: 'allow',
      priority: 10,
    });

    // Política: Usuarios pueden leer sus documentos
    this.register({
      id: 'allow_read_own_documents',
      name: 'Lectura de documentos propios',
      description: 'Permite a usuarios leer documentos de su workspace',
      resource: 'document',
      action: 'read',
      principal: 'user',
      effect: 'allow',
      priority: 10,
    });

    // Política: Usuarios pueden usar skills básicas
    this.register({
      id: 'allow_basic_skills',
      name: 'Uso de skills básicas',
      description: 'Permite usar skills básicas como chat, resumen, traducción',
      resource: 'skill',
      action: 'execute',
      principal: 'user',
      effect: 'allow',
      conditions: { skillId: ['general_chat', 'summarization', 'translation', 'coding'] },
      priority: 10,
    });

    // Política: Denegar acceso a herramientas experimentales sin confirmación
    this.register({
      id: 'deny_experimental_tools',
      name: 'Denegar herramientas experimentales',
      description: 'Bloquea herramientas experimentales sin confirmación explícita',
      resource: 'tool',
      action: 'execute',
      principal: 'user',
      effect: 'deny',
      conditions: { toolStatus: 'experimental' },
      priority: 100,
    });

    // Política: Denegar ejecución de comandos del sistema
    this.register({
      id: 'deny_system_commands',
      name: 'Denegar comandos del sistema',
      description: 'Bloquea cualquier intento de ejecutar comandos del sistema',
      resource: 'system',
      action: 'execute',
      principal: '*',
      effect: 'deny',
      priority: 1000,
    });
  }

  /**
   * Registra una nueva política
   */
  register(policy: Policy) {
    this.policies.push(policy);
    // Ordenar por prioridad (mayor prioridad primero)
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evalúa si una operación está permitida
   */
  async evaluate(evaluation: PolicyEvaluation): Promise<PolicyResult> {
    const matchedPolicies: string[] = [];
    let finalEffect: 'allow' | 'deny' = 'deny'; // Default deny

    for (const policy of this.policies) {
      // Verificar si la política aplica
      if (this.policyMatches(policy, evaluation)) {
        matchedPolicies.push(policy.id);
        
        // Si es deny y tiene alta prioridad, denegar inmediatamente
        if (policy.effect === 'deny' && policy.priority >= 100) {
          return {
            allowed: false,
            matchedPolicies,
            reason: `Denied by policy: ${policy.name}`,
          };
        }
        
        finalEffect = policy.effect;
      }
    }

    return {
      allowed: finalEffect === 'allow',
      matchedPolicies,
      reason: finalEffect === 'allow' ? 'Allowed by policies' : 'No matching allow policy',
    };
  }

  /**
   * Verifica si una política aplica a una evaluación
   */
  private policyMatches(policy: Policy, evaluation: PolicyEvaluation): boolean {
    // Verificar resource
    if (policy.resource !== '*' && policy.resource !== evaluation.resource) {
      return false;
    }

    // Verificar action
    if (policy.action !== '*' && policy.action !== evaluation.action) {
      return false;
    }

    // Verificar principal
    if (policy.principal !== '*' && policy.principal !== evaluation.principal) {
      return false;
    }

    // Verificar condiciones si existen
    if (policy.conditions) {
      for (const [key, value] of Object.entries(policy.conditions)) {
        const contextValue = evaluation.context?.[key];
        
        if (Array.isArray(value)) {
          // Si el valor es un array, verificar que el contexto esté en el array
          if (!value.includes(contextValue)) {
            return false;
          }
        } else {
          // Si no es array, verificar igualdad
          if (contextValue !== value) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Obtiene todas las políticas
   */
  getAllPolicies(): Policy[] {
    return [...this.policies];
  }

  /**
   * Obtiene una política específica
   */
  getPolicy(id: string): Policy | undefined {
    return this.policies.find(p => p.id === id);
  }
}
