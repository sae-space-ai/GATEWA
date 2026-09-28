# GATEWA

**Centro Privado de Inteligencia Artificial y Pasarela Segura entre la Nube y la IA Local**

GATEWA es una **plataforma de orquestación de inteligencia artificial** con un núcleo algorítmico completo que permite utilizar modelos de IA ejecutados físicamente en tu propio ordenador. No es un simple chatbot: es un sistema modular y extensible para orquestar modelos, habilidades, herramientas, contexto, memoria, políticas y ejecución.

## 🎯 Estado Actual (V1)

### ✅ Núcleo Algorítmico Completo

- ✅ **Orchestrator** - Núcleo que recibe solicitudes, identifica intención, construye plan, verifica permisos y coordina ejecución
- ✅ **ModelRouter** - Descubre modelos, registra capacidades, selecciona modelo apropiado
- ✅ **SkillsEngine** - 5 habilidades registradas (chat, resumen, traducción, código, análisis documental)
- ✅ **ToolRegistry** - Herramientas controladas con schemas, validación, permisos, timeout
- ✅ **ContextEngine** - Gestión de ventana de contexto, selección de información relevante
- ✅ **MemoryManager** - 4 tipos de memoria (conversación, sesión, workspace, conocimiento) con políticas
- ✅ **PromptRegistry** - System prompts versionados, plantillas, políticas
- ✅ **PolicyEngine** - Políticas granulares de permisos con prioridad y condiciones

### ✅ Infraestructura Funcional

- ✅ **Chat con streaming** - Conversación en tiempo real con qwen3:4b
- ✅ **Dashboard** - Estado del sistema, actividad, accesos rápidos
- ✅ **Workspaces** - Organización por proyectos
- ✅ **Assistants** - Agentes especializados con system prompts
- ✅ **Models** - Gestión de modelos disponibles en Ollama
- ✅ **Documents** - Preparado para carga y RAG futuro
- ✅ **Tools** - Arquitectura modular para herramientas futuras
- ✅ **Activity** - Trazabilidad técnica sin datos privados
- ✅ **Settings** - Configuración segura
- ✅ **LOCAL AI ONLINE/OFFLINE** - Estado claro del bridge
- ✅ **Markdown + código** - Renderizado completo con botón copiar
- ✅ **Seguridad** - Autenticación, rate limiting, sin secretos en frontend

## 🏗️ Arquitectura

```
┌──────────┐     ┌────────────────┐     ┌─────────────────┐     ┌───────────────┐     ┌─────────┐
│ Navegador│────▶│ GATEWA Cloud   │────▶│ GATEWA Backend  │────▶│ GATEWA Local  │────▶│ Ollama  │
│          │     │ (Frontend)     │     │ (Vercel API)    │     │ Bridge        │     │ Local   │
└──────────┘     └────────────────┘     └─────────────────┘     └───────────────┘     └─────────┘
                                                                                              │
                                                                                       qwen3:4b
```

**Flujo:**
```
Internet → GATEWA Web → Backend API → HTTPS + Bearer Token → 
Cloudflare Tunnel → Local Bridge (127.0.0.1:3456) → 
Ollama (127.0.0.1:11434) → qwen3:4b
```

**Open WebUI** funciona independientemente como otro cliente de Ollama.

## ⚡ Inicio Rápido

### Requisitos
- Windows 10/11
- Node.js 18+
- Ollama con qwen3:4b
- Cuenta GitHub + Vercel + Cloudflare

### 1. Clonar
```bash
git clone https://github.com/TU_USUARIO/gatewa.git
cd gatewa
```

### 2. Configurar Local Bridge
```bash
cd local-bridge
npm install

# Generar secreto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Crear .env
copy .env.example .env
# Editar .env con el secreto generado
```

### 3. Iniciar Bridge
```bash
cd local-bridge
npm start
```

### 4. Túnel HTTPS
```bash
# Instalar cloudflared
winget install Cloudflare.cloudflared

# Iniciar túnel
cloudflared tunnel --url http://127.0.0.1:3456
```

### 5. Variables en Vercel
| Variable | Valor |
|----------|-------|
| `GATEWA_BRIDGE_URL` | URL HTTPS del túnel |
| `GATEWA_BRIDGE_SECRET` | Mismo secreto del bridge |

### 6. Desplegar
```bash
npm install
npx vercel --prod
```

## 📁 Estructura

```
gatewa/
├── api/                    # Backend Cloud (Vercel)
│   ├── chat.ts            # Chat con streaming
│   ├── health.ts          # Health check
│   └── models.ts          # Modelos disponibles
├── src/                    # Frontend React
│   ├── App.tsx            # App principal
│   ├── components/        # Componentes UI
│   ├── views/             # Vistas (Dashboard, Chat, etc.)
│   └── types.ts           # Tipos TypeScript
├── local-bridge/           # Servicio local Windows
│   ├── src/index.js       # Bridge principal
│   └── .env.example
├── .env.example            # Variables cloud
├── README.md
├── ARCHITECTURE.md
├── SECURITY.md
└── DEPLOYMENT.md
```

## 🔒 Seguridad

- Zero Trust entre componentes
- Bearer token autenticación
- Túnel HTTPS (sin puertos abiertos)
- Sin secretos en frontend
- Rate limiting y timeouts
- Validación de inputs
- Ollama nunca expuesto a Internet

Ver [SECURITY.md](./SECURITY.md) para detalles.

## 📖 Documentación

- [ARCHITECTURE_CORE.md](./ARCHITECTURE_CORE.md) - **Arquitectura del Núcleo Algorítmico** (Orchestrator, ModelRouter, SkillsEngine, etc.)
- [INVENTORY.md](./INVENTORY.md) - **Inventario completo** de módulos con propósito, input, output, dependencias, permisos, estado
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura de infraestructura
- [SECURITY.md](./SECURITY.md) - Seguridad y autenticación
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue

## 🚀 Próximas Versiones

### V2 - Document Intelligence & RAG
- Document Intelligence Pipeline (ingesta real de PDF, DOCX, TXT, MD, CSV)
- Knowledge Layer (bases de conocimiento por workspace)
- RAG (Retrieval Augmented Generation con chunking, embeddings, retrieval)

### V3 - Workflows & Connectors
- Workflow Engine (encadenamiento de pasos con estados y reintentos)
- Connector Framework (GitHub, Google Drive, APIs, bases de datos)

### V4 - Observability & Extensions
- Observability completo (métricas, traces, logs estructurados)
- Audit Trail (registro de auditoría)
- Job Queue (tareas largas)
- Feature Flags (capacidades experimentales)
- Plugin SDK (extensiones con contratos estables)

## 🚀 Futuras Versiones

- RAG completo con embeddings
- Herramientas modulares (código, MIDI, investigación)
- Multi-usuario con workspaces compartidos
- Análisis documental avanzado
- Integración con más modelos y proveedores

## 📝 Licencia

MIT
