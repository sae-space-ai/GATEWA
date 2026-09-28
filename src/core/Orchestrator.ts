/**
 * GATEWA Orchestrator - Núcleo Algorítmico
 * 
 * Responsabilidades:
 * - Recibir solicitudes del usuario
 * - Identificar intención y clasificar
 * - Determinar modelo, agente, skill, tool necesarios
 * - Construir plan de ejecución
 * - Verificar permisos y disponibilidad
 * - Ejecutar acciones autorizadas
 * - Validar resultados
 * - Entregar respuesta trazable
 */

import { type ModelRouter } from './ModelRouter';
import { type SkillsEngine } from './SkillsEngine';
import { type ToolRegistry } from './ToolRegistry';
import { type ContextEngine, type ContextMessage } from './ContextEngine';
import { type MemoryManager } from './MemoryManager';
import { type PromptRegistry } from './PromptRegistry';
import { type PolicyEngine } from './PolicyEngine';

export interface OrchestratorRequest {
  id: string;
  userId: string;
  workspaceId: string;
  conversationId?: string;
  input: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface OrchestratorPlan {
  id: string;
  requestId: string;
  intention: string;
  selectedModel: string;
  selectedSkill?: string;
  selectedTools: string[];
  contextWindow: string[];
  systemPrompt: string;
  permissions: string[];
  estimatedTokens: number;
  createdAt: string;
}

export interface OrchestratorResult {
  requestId: string;
  planId: string;
  output: string;
  model: string;
  skill?: string;
  toolsUsed: string[];
  tokensUsed: number;
  latency: number;
  status: 'success' | 'error' | 'partial';
  error?: string;
  trace: ExecutionTrace[];
  timestamp: string;
}

export interface ExecutionTrace {
  step: number;
  action: string;
  component: string;
  input?: unknown;
  output?: unknown;
  duration: number;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export class Orchestrator {
  private modelRouter: ModelRouter;
  private skillsEngine: SkillsEngine;
  private toolRegistry: ToolRegistry;
  private contextEngine: ContextEngine;
  private memoryManager: MemoryManager;
  private promptRegistry: PromptRegistry;
  private policyEngine: PolicyEngine;

  constructor(
    modelRouter: ModelRouter,
    skillsEngine: SkillsEngine,
    toolRegistry: ToolRegistry,
    contextEngine: ContextEngine,
    memoryManager: MemoryManager,
    promptRegistry: PromptRegistry,
    policyEngine: PolicyEngine
  ) {
    this.modelRouter = modelRouter;
    this.skillsEngine = skillsEngine;
    this.toolRegistry = toolRegistry;
    this.contextEngine = contextEngine;
    this.memoryManager = memoryManager;
    this.promptRegistry = promptRegistry;
    this.policyEngine = policyEngine;
  }

  /**
   * Procesa una solicitud del usuario
   */
  async processRequest(request: OrchestratorRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const trace: ExecutionTrace[] = [];

    try {
      // Step 1: Verificar permisos del usuario
      const permissionCheck = await this.checkPermissions(request);
      trace.push({
        step: 1,
        action: 'check_permissions',
        component: 'PolicyEngine',
        output: permissionCheck,
        duration: Date.now() - startTime,
        status: permissionCheck.allowed ? 'success' : 'error',
      });

      if (!permissionCheck.allowed) {
        throw new Error(`Permission denied: ${permissionCheck.reason}`);
      }

      // Step 2: Identificar intención
      const intention = await this.identifyIntention(request.input);
      trace.push({
        step: 2,
        action: 'identify_intention',
        component: 'Orchestrator',
        input: request.input.slice(0, 100),
        output: intention,
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 3: Seleccionar skill si aplica
      const skill = await this.skillsEngine.selectSkill(intention);
      trace.push({
        step: 3,
        action: 'select_skill',
        component: 'SkillsEngine',
        input: intention,
        output: skill?.id || 'none',
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 4: Seleccionar modelo apropiado
      const model = await this.modelRouter.selectModel({
        intention,
        skill,
        workspaceId: request.workspaceId,
        userId: request.userId,
      });
      trace.push({
        step: 4,
        action: 'select_model',
        component: 'ModelRouter',
        output: model.id,
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 5: Determinar herramientas necesarias
      const tools = skill?.requiredTools || [];
      trace.push({
        step: 5,
        action: 'determine_tools',
        component: 'Orchestrator',
        output: tools,
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 6: Construir contexto
      const context = await this.contextEngine.buildContext({
        conversationId: request.conversationId,
        workspaceId: request.workspaceId,
        skill,
        tools,
        maxTokens: model.contextWindow || 4096,
      });
      trace.push({
        step: 6,
        action: 'build_context',
        component: 'ContextEngine',
        output: { messages: context.messages.length, tokens: context.estimatedTokens },
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 7: Obtener system prompt
      const systemPrompt = await this.promptRegistry.getPrompt({
        skill: skill?.id,
        workspace: request.workspaceId,
        model: model.id,
      });
      trace.push({
        step: 7,
        action: 'get_system_prompt',
        component: 'PromptRegistry',
        output: systemPrompt.id,
        duration: Date.now() - startTime,
        status: 'success',
      });

      // Step 8: Construir plan de ejecución
      const plan: OrchestratorPlan = {
        id: `plan_${Date.now()}`,
        requestId: request.id,
        intention,
        selectedModel: model.id,
        selectedSkill: skill?.id,
        selectedTools: tools,
        contextWindow: context.messages.map((m: ContextMessage) => m.content),
        systemPrompt: systemPrompt.content,
        permissions: permissionCheck.permissions,
        estimatedTokens: context.estimatedTokens,
        createdAt: new Date().toISOString(),
      };

      // Step 9: Ejecutar (delegar al modelo)
      // En esta versión, la ejecución real la hace el backend
      // El orchestrator prepara todo y devuelve el plan
      const result: OrchestratorResult = {
        requestId: request.id,
        planId: plan.id,
        output: '', // Se llenará después de la ejecución
        model: plan.selectedModel,
        skill: plan.selectedSkill,
        toolsUsed: plan.selectedTools,
        tokensUsed: 0,
        latency: Date.now() - startTime,
        status: 'success',
        trace,
        timestamp: new Date().toISOString(),
      };

      return result;

    } catch (error) {
      return {
        requestId: request.id,
        planId: '',
        output: '',
        model: '',
        toolsUsed: [],
        tokensUsed: 0,
        latency: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        trace,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkPermissions(request: OrchestratorRequest): Promise<{
    allowed: boolean;
    permissions: string[];
    reason?: string;
  }> {
    // Por ahora, todos los usuarios autenticados tienen permisos básicos
    // En el futuro, el PolicyEngine decidirá basado en roles, workspace, etc.
    return {
      allowed: true,
      permissions: ['chat', 'read_documents', 'use_skills'],
    };
  }

  private async identifyIntention(input: string): Promise<string> {
    // Heurística simple por ahora
    // En el futuro, se puede usar clasificación con el modelo
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('resum') || lowerInput.includes('sintetiz')) {
      return 'summarization';
    }
    if (lowerInput.includes('traduc') || lowerInput.includes('translat')) {
      return 'translation';
    }
    if (lowerInput.includes('código') || lowerInput.includes('programa') || lowerInput.includes('code')) {
      return 'coding';
    }
    if (lowerInput.includes('analiz') || lowerInput.includes('document')) {
      return 'document_analysis';
    }
    
    return 'general_chat';
  }
}
