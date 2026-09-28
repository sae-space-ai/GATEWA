# GATEWA

**Centro Privado de Inteligencia Artificial y Pasarela Segura entre la Nube y la IA Local**

GATEWA es una plataforma web profesional que permite utilizar modelos de inteligencia artificial ejecutados físicamente en tu propio ordenador, comenzando con Ollama + Qwen3:4b, con arquitectura extensible para futuros modelos, documentos, herramientas y aplicaciones.

## 🎯 Características V1

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

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura detallada
- [SECURITY.md](./SECURITY.md) - Seguridad y autenticación
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue

## 🚀 Futuras Versiones

- RAG completo con embeddings
- Herramientas modulares (código, MIDI, investigación)
- Multi-usuario con workspaces compartidos
- Análisis documental avanzado
- Integración con más modelos y proveedores

## 📝 Licencia

MIT
