# GATEWA - Arquitectura del Núcleo Algorítmico

## Visión General

GATEWA no es un simple chatbot. Es una **plataforma de orquestación de inteligencia artificial** con un núcleo algorítmico completo que gestiona modelos, habilidades, herramientas, contexto, memoria, políticas y ejecución.

## Arquitectura por Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN (Frontend React)                 │
│  Dashboard | Chat | Workspaces | Documents | Assistants | ...  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              IDENTIDAD Y ACCESO (Auth & Permissions)             │
│  Autenticación de usuario | Autorización | Roles | Sesiones    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ORQUESTACIÓN (Orchestrator)                   │
│  Intención → Clasificación → Plan → Permisos → Ejecución       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   MODELOS     │    │   AGENTES     │    │  HABILIDADES  │
│ ModelRouter   │    │ Assistants    │    │ SkillsEngine  │
│               │    │               │    │               │
│ - Descubrir   │    │ - Definir     │    │ - Registro    │
│ - Seleccionar │    │ - System      │    │ - Schemas     │
│ - Routing     │    │ - Tools       │    │ - Selección   │
│ - Capabilities│    │ - Knowledge   │    │ - Validación  │
└───────────────┘    └───────────────┘    └───────────────┘
        ↓                     ↓                     ↓
        └─────────────────────┼─────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  HERRAMIENTAS │    │  CONECTORES   │    │  DOCUMENTOS   │
│ ToolRegistry  │    │ Connectors    │    │ DocIntelligence│
│               │    │               │    │               │
│ - Registro    │    │ - GitHub      │    │ - Ingesta     │
│ - Schemas     │    │ - Drive       │    │ - Chunking    │
│ - Permisos    │    │ - APIs        │    │ - Indexación  │
│ - Ejecución   │    │ - DBs         │    │ - Retrieval   │
│ - Timeout     │    │ - Search      │    │ - Citas       │
└───────────────┘    └───────────────┘    └───────────────┘
        ↓                     ↓                     ↓
        └─────────────────────┼─────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   CONTEXTO    │    │    MEMORIA    │    │  CONOCIMIENTO │
│ ContextEngine │    │ MemoryManager │    │ KnowledgeLayer│
│               │    │               │    │               │
│ - Ventana     │    │ - Conversación│    │ - Bases por   │
│ - Selección   │    │ - Sesión      │    │   workspace   │
│ - Resúmen     │    │ - Workspace   │    │ - RAG         │
│ - Relevancia  │    │ - Persistente │    │ - Embeddings  │
└───────────────┘    └───────────────┘    └───────────────┘
        ↓                     ↓                     ↓
        └─────────────────────┼─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPTS (PromptRegistry)                      │
│  System prompts versionados | Plantillas | Políticas           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    POLÍTICAS (PolicyEngine)                      │
│  Permisos granulares | Autorización | Auditoría                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILIDAD                                │
│  Health checks | Logs | Métricas | Latencia | Errores | Traces │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GATEWA LOCAL BRIDGE                           │
│  Autenticación | Validación | Proxy seguro | Streaming         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         OLLAMA                                   │
│  qwen3:4b (y futuros modelos)                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Módulos del Núcleo

### 1. Orchestrator (Orquestador)
**Propósito:** Núcleo algorítmico que recibe solicitudes, identifica intención, construye plan de ejecución, verifica permisos y coordina todos los componentes.

**Responsabilidades:**
- Recibir solicitudes del usuario
- Identificar intención y clasificar
- Seleccionar modelo, skill, tools apropiados
- Construir plan de ejecución
- Verificar permisos y disponibilidad
- Coordinar ejecución
- Validar resultados
- Entregar respuesta trazable

**Input:** `OrchestratorRequest` (userId, workspaceId, input, context)
**Output:** `OrchestratorResult` (output, model, skill, tools, trace, status)

**Estado:** ✅ IMPLEMENTADO

---

### 2. ModelRouter (Enrutador de Modelos)
**Propósito:** Descubre modelos disponibles, registra capacidades y estado, selecciona modelo apropiado según tarea.

**Responsabilidades:**
- Descubrir modelos en Ollama
- Registrar capacidades (chat, summarization, coding, etc.)
- Seleccionar modelo según intención, skill, recursos
- Preparado para futuros proveedores (OpenAI, Anthropic, etc.)

**Input:** `ModelSelectionCriteria` (intention, skill, workspace, user)
**Output:** `ModelCapability` (id, name, provider, contextWindow, capabilities, status)

**Estado:** ✅ IMPLEMENTADO

---

### 3. SkillsEngine (Motor de Habilidades)
**Propósito:** Registro formal de habilidades con schemas de entrada/salida, modelos compatibles, herramientas permitidas, permisos, timeouts y límites.

**Habilidades Registradas:**
- `general_chat` - Conversación general
- `summarization` - Resúmen de texto
- `translation` - Traducción
- `coding` - Asistencia de programación
- `document_analysis` - Análisis de documentos

**Input:** Intención del usuario
**Output:** `SkillDefinition` (id, name, inputSchema, outputSchema, requiredTools, permissions, timeout)

**Estado:** ✅ IMPLEMENTADO

---

### 4. ToolRegistry (Registro de Herramientas)
**Propósito:** Registro de herramientas controladas con schemas, validación, permisos, auditoría, timeout y aislamiento. Impide que un prompt se convierta en ejecución arbitraria.

**Herramientas Registradas:**
- `document_retrieval` - Recuperación de documentos (experimental)
- `web_search` - Búsqueda web (deshabilitada)

**Input:** `ToolDefinition` (id, inputSchema, outputSchema, permissions, timeout)
**Output:** `ToolExecution` (toolId, input, output, duration, authorized)

**Estado:** ✅ IMPLEMENTADO (herramientas en estado experimental/disabled)

---

### 5. ContextEngine (Motor de Contexto)
**Propósito:** Administra ventana de contexto de los modelos, selecciona información relevante, resume cuando sea necesario, evita enviar documentos completos innecesariamente.

**Responsabilidades:**
- Gestionar historial de conversación
- Construir contexto dentro de límites de tokens
- Seleccionar mensajes relevantes
- Resumir contenido largo

**Input:** `ContextBuildRequest` (conversationId, workspaceId, skill, tools, maxTokens)
**Output:** `ContextBuildResult` (messages, estimatedTokens, truncated)

**Estado:** ✅ IMPLEMENTADO

---

### 6. MemoryManager (Gestor de Memoria)
**Propósito:** Distingue memoria de conversación, contexto temporal de sesión, memoria de workspace y conocimiento persistente. Políticas explícitas de retención, borrado, privacidad y consentimiento.

**Tipos de Memoria:**
- `conversation` - Historial de conversación (30 días)
- `session` - Contexto temporal de sesión (1 día)
- `workspace` - Memoria de workspace (365 días, requiere consentimiento)
- `knowledge` - Conocimiento persistente (permanente, requiere consentimiento)

**Input:** `MemoryEntry` (type, key, value, userId, workspaceId)
**Output:** Recuperación por criterios (type, userId, workspaceId, conversationId)

**Estado:** ✅ IMPLEMENTADO

---

### 7. PromptRegistry (Registro de Prompts)
**Propósito:** System prompts versionados, plantillas y políticas. Evita prompts críticos dispersos por el código.

**Prompts Registrados:**
- `base_chat` - Chat general
- `summarization` - Resúmen
- `translation` - Traducción
- `coding` - Programación
- `document_analysis` - Análisis documental

**Input:** `PromptRequest` (skill, workspace, model, variables)
**Output:** `PromptDefinition` (id, content, version, variables, status)

**Estado:** ✅ IMPLEMENTADO

---

### 8. PolicyEngine (Motor de Políticas)
**Propósito:** Decide qué usuario, agente, modelo, skill, tool o connector puede realizar cada operación. Políticas granulares de permisos.

**Políticas Registradas:**
- Usuarios autenticados pueden chatear
- Usuarios pueden leer sus documentos
- Usuarios pueden usar skills básicas
- Denegar herramientas experimentales sin confirmación
- Denegar ejecución de comandos del sistema

**Input:** `PolicyEvaluation` (principal, action, resource, context)
**Output:** `PolicyResult` (allowed, matchedPolicies, reason)

**Estado:** ✅ IMPLEMENTADO

---

## Capas Pendientes de Implementación

### Document Intelligence Pipeline
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Ingesta, validación, extracción, normalización, chunking, indexación de PDF, DOCX, TXT, Markdown, CSV

### Knowledge Layer
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Bases de conocimiento por workspace sin mezclar información entre proyectos

### RAG (Retrieval Augmented Generation)
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Recuperación de fragmentos relevantes de documentos para augmentar contexto del modelo

### Workflow Engine
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Encadenar pasos (input → clasificación → recuperación → modelo → tool → validación → output)

### Connector Framework
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Integraciones con GitHub, Google Drive, APIs, bases de datos, servicios de búsqueda

### Observability Completo
**Estado:** ⏳ PARCIAL
**Propósito:** Health checks, logs técnicos, métricas, latencia, errores, estado de modelos/bridge/conectores, trazas de ejecución

### Audit Trail
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Registro de operaciones relevantes para auditoría

### Job Queue
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Tareas largas sin depender de una única petición HTTP

### Feature Flags
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Activar capacidades experimentales sin comprometer producción

### Plugin/Extension SDK
**Estado:** ⏳ DISEÑADO, NO IMPLEMENTADO
**Propósito:** Contratos estables para añadir habilidades, herramientas y conectores sin modificar el núcleo

---

## Flujo de Ejecución Completo

```
1. Usuario envía mensaje
   ↓
2. Orchestrator recibe OrchestratorRequest
   ↓
3. PolicyEngine verifica permisos
   ↓
4. Orchestrator identifica intención (general_chat, summarization, etc.)
   ↓
5. SkillsEngine selecciona skill apropiada
   ↓
6. ModelRouter selecciona modelo según skill y capacidades
   ↓
7. ToolRegistry determina herramientas necesarias
   ↓
8. ContextEngine construye contexto (historial + documentos si aplica)
   ↓
9. PromptRegistry obtiene system prompt
   ↓
10. Orchestrator construye OrchestratorPlan
    ↓
11. Backend API ejecuta contra Ollama vía Local Bridge
    ↓
12. Respuesta fluye con streaming
    ↓
13. ContextEngine actualiza historial
    ↓
14. MemoryManager guarda si aplica
    ↓
15. Orchestrator entrega OrchestratorResult con trace completo
```

---

## Principios de Diseño

1. **Zero Trust:** Cada componente verifica permisos antes de ejecutar
2. **Least Privilege:** Cada componente tiene solo los permisos necesarios
3. **Separation of Concerns:** Cada módulo tiene una responsabilidad clara
4. **Extensibility:** Nuevas skills, tools, connectors sin modificar el núcleo
5. **Traceability:** Cada ejecución genera un trace completo
6. **Privacy by Design:** Datos sensibles nunca salen del ordenador local
7. **Security by Design:** Autenticación, autorización y auditoría en cada capa
8. **No Arbitrary Execution:** Los modelos no pueden ejecutar comandos del sistema
9. **Explicit Consent:** Operaciones sensibles requieren consentimiento explícito
10. **Graceful Degradation:** Si un componente falla, el sistema sigue funcionando

---

## Estado Actual del Sistema

### ✅ COMPLETADO Y VERIFICADO
- Núcleo vertical funcional (Web → Cloud → Bridge → Ollama → Respuesta)
- Orchestrator con trazabilidad completa
- ModelRouter con descubrimiento de modelos
- SkillsEngine con 5 habilidades registradas
- ToolRegistry con validación y permisos
- ContextEngine con gestión de ventana de contexto
- MemoryManager con políticas de retención
- PromptRegistry con system prompts versionados
- PolicyEngine con políticas granulares
- Frontend con 9 vistas funcionales
- Backend API con streaming
- Local Bridge con autenticación
- Documentación completa

### ⏳ PENDIENTE DE IMPLEMENTACIÓN
- Document Intelligence Pipeline (ingesta real de documentos)
- Knowledge Layer (bases de conocimiento por workspace)
- RAG (retrieval augmentado)
- Workflow Engine (encadenamiento de pasos)
- Connector Framework (integraciones externas)
- Observability completo (métricas, traces)
- Audit Trail (registro de auditoría)
- Job Queue (tareas largas)
- Feature Flags (capacidades experimentales)
- Plugin SDK (extensiones)

---

## Próximos Pasos

1. **Document Intelligence Pipeline:** Implementar ingesta real de PDF, DOCX, TXT, Markdown
2. **Knowledge Layer:** Construir bases de conocimiento por workspace
3. **RAG Básico:** Implementar chunking, embeddings y retrieval
4. **Workflow Engine:** Encadenar pasos con estados y reintentos
5. **Connector Framework:** Primer conector (GitHub o Google Drive)
6. **Observability:** Métricas, logs estructurados, traces distribuidos

---

## Conclusión

GATEWA ha evolucionado de un simple chatbot a una **plataforma de orquestación de IA** con un núcleo algorítmico completo. El sistema está diseñado para ser extensible, seguro, auditable y respetuoso con la privacidad. Las capas fundamentales están implementadas y verificadas. Las capas avanzadas (RAG, workflows, conectores) están diseñadas y listas para implementación incremental.
