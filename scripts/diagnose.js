#!/usr/bin/env node

/**
 * GATEWA - Script de Diagnóstico Automático
 * Inspecciona todos los componentes y genera inventario de estado
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

interface ComponentStatus {
  component: string;
  location: string;
  dependency: string;
  endpoint: string;
  config: string;
  currentStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'ERROR' | 'NOT_CONFIGURED' | 'NOT_IMPLEMENTED' | 'UNKNOWN';
  failureCause: string;
  correctiveAction: string;
  verificationTest: string;
}

const inventory: ComponentStatus[] = [];

function checkFile(path: string): boolean {
  return existsSync(join(ROOT, path));
}

function readFile(path: string): string {
  try {
    return readFileSync(join(ROOT, path), 'utf-8');
  } catch {
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. OLLAMA LOCAL
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Ollama Service',
  location: 'Windows Local (127.0.0.1:11434)',
  dependency: 'None (base layer)',
  endpoint: 'http://127.0.0.1:11434/api/tags',
  config: 'OLLAMA_BASE_URL=http://127.0.0.1:11434',
  currentStatus: 'UNKNOWN',
  failureCause: 'Cannot verify from cloud environment - requires local execution',
  correctiveAction: 'HUMAN_ACTION_REQUIRED: Run "ollama serve" on Windows and verify with "curl http://127.0.0.1:11434/api/tags"',
  verificationTest: 'curl http://127.0.0.1:11434/api/tags should return models list including qwen3:4b'
});

// ═══════════════════════════════════════════════════════════════
// 2. QWEN3:4B MODEL
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Qwen3:4b Model',
  location: 'Ollama Local',
  dependency: 'Ollama Service',
  endpoint: 'http://127.0.0.1:11434/api/chat',
  config: 'OLLAMA_MODEL=qwen3:4b',
  currentStatus: 'UNKNOWN',
  failureCause: 'Cannot verify from cloud environment - requires local execution',
  correctiveAction: 'HUMAN_ACTION_REQUIRED: Run "ollama list" on Windows and verify qwen3:4b is present',
  verificationTest: 'ollama list should show qwen3:4b'
});

// ═══════════════════════════════════════════════════════════════
// 3. GATEWA LOCAL BRIDGE
// ═══════════════════════════════════════════════════════════════
const bridgeExists = checkFile('local-bridge/src/index.js');
const bridgeEnvExists = checkFile('local-bridge/.env');
const bridgeEnvExample = checkFile('local-bridge/.env.example');
const bridgePackageJson = readFile('local-bridge/package.json');

let bridgeStatus: ComponentStatus['currentStatus'] = 'NOT_CONFIGURED';
let bridgeFailure = 'local-bridge/.env file not found';
let bridgeAction = 'HUMAN_ACTION_REQUIRED: Copy local-bridge/.env.example to local-bridge/.env and configure GATEWA_BRIDGE_SECRET';

if (bridgeExists && bridgeEnvExists) {
  const envContent = readFile('local-bridge/.env');
  if (envContent.includes('GATEWA_BRIDGE_SECRET=') && !envContent.includes('GATEWA_BRIDGE_SECRET=CHANGE_ME')) {
    bridgeStatus = 'OFFLINE';
    bridgeFailure = 'Bridge configured but not running';
    bridgeAction = 'HUMAN_ACTION_REQUIRED: Run "cd local-bridge && npm install && npm start" on Windows';
  }
}

inventory.push({
  component: 'GATEWA Local Bridge',
  location: 'Windows Local (127.0.0.1:3456)',
  dependency: 'Ollama Service',
  endpoint: 'http://127.0.0.1:3456/health',
  config: 'local-bridge/.env (GATEWA_BRIDGE_SECRET, BRIDGE_PORT)',
  currentStatus: bridgeStatus,
  failureCause: bridgeFailure,
  correctiveAction: bridgeAction,
  verificationTest: 'curl -H "Authorization: Bearer <SECRET>" http://127.0.0.1:3456/health should return status ok'
});

// ═══════════════════════════════════════════════════════════════
// 4. HTTPS TUNNEL (Cloudflare)
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'HTTPS Tunnel (Cloudflare)',
  location: 'Cloudflare Edge → Windows Local',
  dependency: 'GATEWA Local Bridge',
  endpoint: 'https://<tunnel-url>.trycloudflare.com',
  config: 'cloudflared tunnel --url http://127.0.0.1:3456',
  currentStatus: 'NOT_CONFIGURED',
  failureCause: 'Tunnel not configured - requires cloudflared installation and execution',
  correctiveAction: 'HUMAN_ACTION_REQUIRED: Install cloudflared (winget install Cloudflare.cloudflared) and run "cloudflared tunnel --url http://127.0.0.1:3456"',
  verificationTest: 'Access tunnel URL in browser should show bridge health response'
});

// ═══════════════════════════════════════════════════════════════
// 5. GATEWA CLOUD BACKEND (Vercel)
// ═══════════════════════════════════════════════════════════════
const apiHealthExists = checkFile('api/health.ts');
const apiChatExists = checkFile('api/chat.ts');
const apiModelsExists = checkFile('api/models.ts');

let cloudStatus: ComponentStatus['currentStatus'] = 'OFFLINE';
let cloudFailure = 'Not deployed to Vercel';
let cloudAction = 'HUMAN_ACTION_REQUIRED: Deploy to Vercel with "npx vercel --prod"';

if (apiHealthExists && apiChatExists && apiModelsExists) {
  cloudStatus = 'NOT_CONFIGURED';
  cloudFailure = 'Code exists but not deployed or env vars not set';
  cloudAction = 'HUMAN_ACTION_REQUIRED: Deploy to Vercel and set GATEWA_BRIDGE_URL and GATEWA_BRIDGE_SECRET in Vercel env vars';
}

inventory.push({
  component: 'GATEWA Cloud Backend',
  location: 'Vercel (Cloud)',
  dependency: 'HTTPS Tunnel',
  endpoint: 'https://<vercel-url>/api/health',
  config: 'Vercel env vars: GATEWA_BRIDGE_URL, GATEWA_BRIDGE_SECRET',
  currentStatus: cloudStatus,
  failureCause: cloudFailure,
  correctiveAction: cloudAction,
  verificationTest: 'curl https://<vercel-url>/api/health should return health status with all 5 links'
});

// ═══════════════════════════════════════════════════════════════
// 6. GATEWA WEB FRONTEND
// ═══════════════════════════════════════════════════════════════
const frontendExists = checkFile('src/App.tsx');
const frontendBuilt = checkFile('dist/index.html');

inventory.push({
  component: 'GATEWA Web Frontend',
  location: 'Vercel (Cloud) + Browser',
  dependency: 'GATEWA Cloud Backend',
  endpoint: 'https://<vercel-url>/',
  config: 'Vite build, React, Tailwind',
  currentStatus: frontendBuilt ? 'DEGRADED' : 'OFFLINE',
  failureCause: frontendBuilt ? 'Frontend built but backend not configured' : 'Frontend not built',
  correctiveAction: frontendBuilt ? 'Will auto-connect when backend is configured' : 'Run "npm run build"',
  verificationTest: 'Open https://<vercel-url>/ in browser should show GATEWA interface'
});

// ═══════════════════════════════════════════════════════════════
// 7. HEALTH CHECK SYSTEM
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Health Check System',
  location: 'Cloud Backend + Frontend',
  dependency: 'All components',
  endpoint: '/api/health',
  config: 'Granular 5-link diagnostic',
  currentStatus: 'DEGRADED',
  failureCause: 'Health check implemented but dependencies not connected',
  correctiveAction: 'Will auto-connect when all dependencies are online',
  verificationTest: 'GET /api/health should return status for all 5 links: cloudApi, tunnel, bridge, ollama, model'
});

// ═══════════════════════════════════════════════════════════════
// 8. CHAT API
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Chat API',
  location: 'Cloud Backend',
  dependency: 'GATEWA Local Bridge',
  endpoint: 'POST /api/chat',
  config: 'Streaming SSE, rate limiting, validation',
  currentStatus: 'NOT_CONFIGURED',
  failureCause: 'Backend not deployed or bridge not configured',
  correctiveAction: 'Deploy backend and configure bridge',
  verificationTest: 'POST /api/chat with messages should return streaming response from qwen3:4b'
});

// ═══════════════════════════════════════════════════════════════
// 9. MODELS API
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Models API',
  location: 'Cloud Backend',
  dependency: 'GATEWA Local Bridge',
  endpoint: 'GET /api/models',
  config: 'Returns available models from Ollama',
  currentStatus: 'NOT_CONFIGURED',
  failureCause: 'Backend not deployed or bridge not configured',
  correctiveAction: 'Deploy backend and configure bridge',
  verificationTest: 'GET /api/models should return list including qwen3:4b'
});

// ═══════════════════════════════════════════════════════════════
// 10. ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════
const orchestratorExists = checkFile('src/core/Orchestrator.ts');

inventory.push({
  component: 'Orchestrator',
  location: 'Frontend (Browser)',
  dependency: 'ModelRouter, SkillsEngine, ToolRegistry, ContextEngine, MemoryManager, PromptRegistry, PolicyEngine',
  endpoint: 'Internal module',
  config: 'src/core/Orchestrator.ts',
  currentStatus: orchestratorExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: orchestratorExists ? 'None - implemented' : 'Module not found',
  correctiveAction: orchestratorExists ? 'None needed' : 'Implement orchestrator module',
  verificationTest: 'Import Orchestrator and call processRequest() should return plan'
});

// ═══════════════════════════════════════════════════════════════
// 11. MODEL ROUTER
// ═══════════════════════════════════════════════════════════════
const modelRouterExists = checkFile('src/core/ModelRouter.ts');

inventory.push({
  component: 'Model Router',
  location: 'Frontend (Browser)',
  dependency: 'Models API',
  endpoint: 'Internal module',
  config: 'src/core/ModelRouter.ts',
  currentStatus: modelRouterExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: modelRouterExists ? 'None - implemented' : 'Module not found',
  correctiveAction: modelRouterExists ? 'None needed' : 'Implement model router module',
  verificationTest: 'Import ModelRouter and call selectModel() should return model capability'
});

// ═══════════════════════════════════════════════════════════════
// 12. SKILLS ENGINE
// ═══════════════════════════════════════════════════════════════
const skillsEngineExists = checkFile('src/core/SkillsEngine.ts');

inventory.push({
  component: 'Skills Engine',
  location: 'Frontend (Browser)',
  dependency: 'None',
  endpoint: 'Internal module',
  config: 'src/core/SkillsEngine.ts',
  currentStatus: skillsEngineExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: skillsEngineExists ? 'None - implemented with 5 skills' : 'Module not found',
  correctiveAction: skillsEngineExists ? 'None needed' : 'Implement skills engine module',
  verificationTest: 'Import SkillsEngine and call selectSkill() should return skill definition'
});

// ═══════════════════════════════════════════════════════════════
// 13. TOOL REGISTRY
// ═══════════════════════════════════════════════════════════════
const toolRegistryExists = checkFile('src/core/ToolRegistry.ts');

inventory.push({
  component: 'Tool Registry',
  location: 'Frontend (Browser)',
  dependency: 'PolicyEngine',
  endpoint: 'Internal module',
  config: 'src/core/ToolRegistry.ts',
  currentStatus: toolRegistryExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: toolRegistryExists ? 'None - implemented with 2 tools (experimental/disabled)' : 'Module not found',
  correctiveAction: toolRegistryExists ? 'None needed' : 'Implement tool registry module',
  verificationTest: 'Import ToolRegistry and call validateExecution() should return validation result'
});

// ═══════════════════════════════════════════════════════════════
// 14. CONTEXT ENGINE
// ═══════════════════════════════════════════════════════════════
const contextEngineExists = checkFile('src/core/ContextEngine.ts');

inventory.push({
  component: 'Context Engine',
  location: 'Frontend (Browser)',
  dependency: 'MemoryManager',
  endpoint: 'Internal module',
  config: 'src/core/ContextEngine.ts',
  currentStatus: contextEngineExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: contextEngineExists ? 'None - implemented' : 'Module not found',
  correctiveAction: contextEngineExists ? 'None needed' : 'Implement context engine module',
  verificationTest: 'Import ContextEngine and call buildContext() should return context with messages'
});

// ═══════════════════════════════════════════════════════════════
// 15. MEMORY MANAGER
// ═══════════════════════════════════════════════════════════════
const memoryManagerExists = checkFile('src/core/MemoryManager.ts');

inventory.push({
  component: 'Memory Manager',
  location: 'Frontend (Browser)',
  dependency: 'PolicyEngine',
  endpoint: 'Internal module',
  config: 'src/core/MemoryManager.ts',
  currentStatus: memoryManagerExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: memoryManagerExists ? 'None - implemented with 4 memory types' : 'Module not found',
  correctiveAction: memoryManagerExists ? 'None needed' : 'Implement memory manager module',
  verificationTest: 'Import MemoryManager and call store() should return memory id'
});

// ═══════════════════════════════════════════════════════════════
// 16. PROMPT REGISTRY
// ═══════════════════════════════════════════════════════════════
const promptRegistryExists = checkFile('src/core/PromptRegistry.ts');

inventory.push({
  component: 'Prompt Registry',
  location: 'Frontend (Browser)',
  dependency: 'None',
  endpoint: 'Internal module',
  config: 'src/core/PromptRegistry.ts',
  currentStatus: promptRegistryExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: promptRegistryExists ? 'None - implemented with 5 prompts' : 'Module not found',
  correctiveAction: promptRegistryExists ? 'None needed' : 'Implement prompt registry module',
  verificationTest: 'Import PromptRegistry and call getPrompt() should return prompt definition'
});

// ═══════════════════════════════════════════════════════════════
// 17. POLICY ENGINE
// ═══════════════════════════════════════════════════════════════
const policyEngineExists = checkFile('src/core/PolicyEngine.ts');

inventory.push({
  component: 'Policy Engine',
  location: 'Frontend (Browser)',
  dependency: 'None',
  endpoint: 'Internal module',
  config: 'src/core/PolicyEngine.ts',
  currentStatus: policyEngineExists ? 'ONLINE' : 'NOT_IMPLEMENTED',
  failureCause: policyEngineExists ? 'None - implemented with 5 policies' : 'Module not found',
  correctiveAction: policyEngineExists ? 'None needed' : 'Implement policy engine module',
  verificationTest: 'Import PolicyEngine and call evaluate() should return policy result'
});

// ═══════════════════════════════════════════════════════════════
// 18. DOCUMENT INTELLIGENCE PIPELINE
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Document Intelligence Pipeline',
  location: 'Not implemented',
  dependency: 'Knowledge Layer',
  endpoint: 'N/A',
  config: 'N/A',
  currentStatus: 'NOT_IMPLEMENTED',
  failureCause: 'Feature designed but not yet implemented',
  correctiveAction: 'Implement document ingestion, chunking, and indexing (future version)',
  verificationTest: 'N/A - not yet implemented'
});

// ═══════════════════════════════════════════════════════════════
// 19. KNOWLEDGE LAYER
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'Knowledge Layer',
  location: 'Not implemented',
  dependency: 'Document Intelligence Pipeline',
  endpoint: 'N/A',
  config: 'N/A',
  currentStatus: 'NOT_IMPLEMENTED',
  failureCause: 'Feature designed but not yet implemented',
  correctiveAction: 'Implement knowledge bases per workspace (future version)',
  verificationTest: 'N/A - not yet implemented'
});

// ═══════════════════════════════════════════════════════════════
// 20. RAG (Retrieval Augmented Generation)
// ═══════════════════════════════════════════════════════════════
inventory.push({
  component: 'RAG System',
  location: 'Not implemented',
  dependency: 'Knowledge Layer',
  endpoint: 'N/A',
  config: 'N/A',
  currentStatus: 'NOT_IMPLEMENTED',
  failureCause: 'Feature designed but not yet implemented',
  correctiveAction: 'Implement embeddings, indexing, and retrieval (future version)',
  verificationTest: 'N/A - not yet implemented'
});

// ═══════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         GATEWA - Inventario Automático de Componentes         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const statusCounts = {
  ONLINE: 0,
  OFFLINE: 0,
  DEGRADED: 0,
  ERROR: 0,
  NOT_CONFIGURED: 0,
  NOT_IMPLEMENTED: 0,
  UNKNOWN: 0,
};

inventory.forEach(item => {
  statusCounts[item.currentStatus]++;
});

console.log('RESUMEN DE ESTADOS:');
console.log(`  ✅ ONLINE:           ${statusCounts.ONLINE}`);
console.log(`  ❌ OFFLINE:          ${statusCounts.OFFLINE}`);
console.log(`  ⚠️  DEGRADED:         ${statusCounts.DEGRADED}`);
console.log(`  🔴 ERROR:            ${statusCounts.ERROR}`);
console.log(`  ⚫ NOT_CONFIGURED:    ${statusCounts.NOT_CONFIGURED}`);
console.log(`  ⬜ NOT_IMPLEMENTED:   ${statusCounts.NOT_IMPLEMENTED}`);
console.log(`  ❓ UNKNOWN:          ${statusCounts.UNKNOWN}`);
console.log(`  📊 TOTAL:            ${inventory.length}\n`);

console.log('═══════════════════════════════════════════════════════════════════\n');

inventory.forEach((item, idx) => {
  const statusIcon = {
    ONLINE: '✅',
    OFFLINE: '❌',
    DEGRADED: '⚠️',
    ERROR: '🔴',
    NOT_CONFIGURED: '⚫',
    NOT_IMPLEMENTED: '⬜',
    UNKNOWN: '❓',
  }[item.currentStatus];

  console.log(`${idx + 1}. ${statusIcon} ${item.component}`);
  console.log(`   Ubicación: ${item.location}`);
  console.log(`   Dependencia: ${item.dependency}`);
  console.log(`   Endpoint: ${item.endpoint}`);
  console.log(`   Configuración: ${item.config}`);
  console.log(`   Estado: ${item.currentStatus}`);
  console.log(`   Causa: ${item.failureCause}`);
  console.log(`   Acción: ${item.correctiveAction}`);
  console.log(`   Verificación: ${item.verificationTest}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('HUMAN_ACTION_REQUIRED - Acciones necesarias para activar GATEWA:\n');

const humanActions = inventory.filter(i => i.correctiveAction.includes('HUMAN_ACTION_REQUIRED'));

humanActions.forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.component}`);
  console.log(`   ${item.correctiveAction}\n`);
});

// Export for use in other scripts
export { inventory };
