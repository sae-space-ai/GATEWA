# Ollama Chat - Aplicación Web con IA Local

Aplicación web profesional que utiliza tu instancia local de Ollama (qwen3:4b) como motor de inteligencia artificial, accesible desde cualquier dispositivo a través de Internet, manteniendo la seguridad y privacidad de tus datos.

## 🏗️ Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐     ┌─────────┐
│  Navegador  │────▶│  Frontend (React) │────▶│  Backend Cloud  │────▶│  Local Gateway   │────▶│ Ollama  │
│  (Cualquier)│     │  (Vercel)         │     │  (Vercel API)   │     │  (Tu Windows)    │     │ Local   │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘     └─────────┘
                                                                                                      │
                                                                                               qwen3:4b
```

### Componentes

| Componente | Ubicación | Tecnología | Función |
|-----------|-----------|-----------|---------|
| **Frontend** | Vercel (Cloud) | React + Vite + Tailwind | Interfaz de usuario |
| **Backend API** | Vercel (Cloud) | Node.js Serverless | Proxy seguro, auth, rate limiting |
| **Local Gateway** | Tu Windows | Node.js + Express | Puente seguro a Ollama |
| **Túnel HTTPS** | Cloudflare Tunnel | cloudflared | Conexión segura Internet→Local |
| **Ollama** | Tu Windows | Ollama | Motor de IA local |

### Flujo de datos

```
Internet → Frontend → POST /api/chat → Backend Cloud
  → HTTPS con Bearer Token → Túnel Cloudflare
  → Local Gateway (127.0.0.1:3456) → Ollama (127.0.0.1:11434) → qwen3:4b
```

## ⚡ Inicio Rápido

### Requisitos Previos

- ✅ Windows 10/11
- ✅ Ollama instalado y funcionando con qwen3:4b
- ✅ Node.js 18+ instalado
- ✅ Cuenta de GitHub
- ✅ Cuenta de Vercel (gratuita)
- ✅ Cuenta de Cloudflare (gratuita)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/ollama-chat.git
cd ollama-chat
```

### 2. Configurar el Local Gateway

```bash
cd local-gateway
npm install

# Generar un secreto seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copia el valor generado

# Crear archivo .env
copy .env.example .env
# Editar .env con tu secreto generado
```

### 3. Iniciar el Local Gateway

```bash
cd local-gateway
npm start
```

Deberías ver:
```
╔══════════════════════════════════════════════╗
║     OLLAMA LOCAL GATEWAY v1.0.0             ║
╠══════════════════════════════════════════════╣
║  ✅ Ollama is reachable
║  ✅ Model "qwen3:4b" is available
```

### 4. Configurar el túnel HTTPS

```bash
# Instalar cloudflared (una sola vez)
winget install Cloudflare.cloudflared

# Iniciar túnel temporal (para pruebas)
cloudflared tunnel --url http://127.0.0.1:3456
```

Copia la URL HTTPS generada (ej: `https://random-words.trycloudflare.com`)

### 5. Configurar variables de entorno en Vercel

En Vercel Dashboard → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `GATEWAY_PUBLIC_URL` | URL HTTPS del túnel (ej: `https://random-words.trycloudflare.com`) |
| `GATEWAY_SECRET` | El mismo secreto generado en el paso 2 |

### 6. Desplegar en Vercel

```bash
# Desde la raíz del proyecto
npm install
npx vercel --prod
```

### 7. ¡Listo!

Abre la URL de Vercel en tu navegador. Deberías ver **LOCAL ONLINE** en la esquina superior derecha.

## 📁 Estructura del Proyecto

```
ollama-chat/
├── api/                    # Backend Cloud (Vercel Serverless)
│   ├── chat.ts            # Endpoint de chat con streaming
│   ├── health.ts          # Health check del gateway
│   └── models.ts          # Lista de modelos disponibles
├── src/                    # Frontend React
│   ├── App.tsx            # Componente principal
│   ├── components/        # Componentes UI
│   │   ├── ChatArea.tsx
│   │   ├── Header.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBar.tsx
│   ├── types.ts           # Tipos TypeScript
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globales
├── local-gateway/          # Servicio local (Windows)
│   ├── src/
│   │   └── index.js       # Gateway principal
│   ├── .env.example       # Plantilla de configuración
│   └── package.json
├── .env.example            # Variables cloud (sin secretos)
├── .gitignore
├── vercel.json            # Configuración Vercel
├── README.md              # Este archivo
├── ARCHITECTURE.md        # Documentación de arquitectura
├── SECURITY.md            # Documentación de seguridad
└── DEPLOYMENT.md          # Guía de despliegue completa
```

## 🔒 Seguridad

- **Zero Trust**: El gateway solo acepta solicitudes autenticadas con token Bearer
- **Sin exposición directa**: Ollama nunca se expone a Internet
- **Túnel HTTPS**: Toda comunicación cloud→local viaja cifrada
- **Sin secretos en frontend**: Todas las credenciales están en variables de entorno del backend
- **Rate limiting**: Protección contra abuso
- **Timeouts**: Prevención de conexiones colgadas
- **Validación de inputs**: Sanitización de todas las entradas

Ver [SECURITY.md](./SECURITY.md) para detalles completos.

## 🧪 Desarrollo Local

```bash
# Frontend
npm run dev

# Backend (simulado localmente)
# Las API routes funcionan con `vercel dev`
npx vercel dev

# Gateway (en otra terminal)
cd local-gateway && npm start
```

## 📝 Licencia

MIT
