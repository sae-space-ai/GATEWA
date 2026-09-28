# Arquitectura del Sistema

## Visión General

Ollama Chat sigue una arquitectura de tres capas con separación estricta de responsabilidades:

1. **Cloud Application** (Frontend + Backend API) - Desplegada en Vercel
2. **Secure Tunnel** (Cloudflare Tunnel) - Conexión cifrada
3. **Local Gateway** - Servicio en Windows que accede a Ollama

## Diagrama de Arquitectura Detallado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUD (Vercel)                                    │
│                                                                             │
│  ┌─────────────┐     ┌──────────────────────────────────────────────┐      │
│  │   Frontend   │────▶│  Backend API (Serverless Functions)          │      │
│  │   (React)    │     │                                              │      │
│  │             │     │  POST /api/chat  → Proxy + Auth + Rate Limit │      │
│  │  - Chat UI  │     │  GET  /api/health → Gateway health check     │      │
│  │  - Sidebar  │     │  GET  /api/models → Available models         │      │
│  │  - Markdown │     │                                              │      │
│  │  - Streaming│     │  Environment:                                │      │
│  │  - History  │     │  - GATEWAY_PUBLIC_URL (HTTPS tunnel URL)     │      │
│  └─────────────┘     │  - GATEWAY_SECRET (Bearer token)             │      │
│                       └──────────────────┬───────────────────────────┘      │
│                                          │                                  │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │
                                    HTTPS + Bearer Token
                                           │
┌──────────────────────────────────────────┼──────────────────────────────────┐
│                              TUNNEL      │                                  │
│  ┌───────────────────────────────────────▼──────────────────────────────┐   │
│  │                    Cloudflare Tunnel (cloudflared)                    │   │
│  │                                                                       │   │
│  │  - Terminación TLS en edge de Cloudflare                             │   │
│  │  - Conexión outbound-only desde tu PC                                │   │
│  │  - Sin puertos abiertos en router                                    │   │
│  │  - URL pública HTTPS: https://xxx.trycloudflare.com                  │   │
│  └───────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│                              HTTP (localhost)                               │
│                                          │                                  │
│  ┌───────────────────────────────────────▼──────────────────────────────┐   │
│  │                    LOCAL GATEWAY (Express)                            │   │
│  │                                                                       │   │
│  │  Escucha: 127.0.0.1:3456 (SOLO localhost)                            │   │
│  │                                                                       │   │
│  │  Funciones:                                                           │   │
│  │  - Autenticación Bearer token                                        │   │
│  │  - Validación de inputs                                              │   │
│  │  - Rate limiting / Concurrency control                               │   │
│  │  - Timeout enforcement                                               │   │
│  │  - Proxy a Ollama con streaming                                      │   │
│  │  - Health checks                                                     │   │
│  │                                                                       │   │
│  │  Seguridad:                                                           │   │
│  │  - No ejecuta comandos del sistema                                   │   │
│  │  - No accede a red local más allá de 127.0.0.1                      │   │
│  │  - Principio de mínimo privilegio                                    │   │
│  └───────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│                              HTTP (localhost)                               │
│                                          │                                  │
│  ┌───────────────────────────────────────▼──────────────────────────────┐   │
│  │                         OLLAMA                                        │   │
│  │                                                                       │   │
│  │  Endpoint: http://127.0.0.1:11434                                    │   │
│  │  Modelo: qwen3:4b                                                    │   │
│  │  API: /api/chat, /api/tags                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    TU ORDENADOR WINDOWS (LOCAL)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Separación de Responsabilidades

### Frontend (React)
- **NO** tiene acceso a credenciales del gateway
- **NO** se comunica directamente con Ollama
- **SOLO** habla con el Backend API del mismo dominio
- Maneja UI, estado local, historial en localStorage
- Renderiza markdown y código
- Streaming de respuestas

### Backend API (Vercel Serverless)
- **ÚNICO** punto de contacto entre Internet y el Gateway
- Almacena secretos en variables de entorno (nunca en código)
- Aplica rate limiting
- Valida y sanitiza inputs
- Reenvía solicitudes autenticadas al Gateway
- Maneja streaming SSE

### Local Gateway
- **ÚNICO** componente que conoce la dirección de Ollama (127.0.0.1:11434)
- Escucha SOLO en 127.0.0.1 (no en 0.0.0.0)
- Requiere autenticación Bearer token en TODAS las rutas sensibles
- Valida tamaño de prompts
- Controla concurrencia
- No ejecuta comandos del sistema
- No accede a la red local

### Túnel (Cloudflare Tunnel)
- Conexión outbound-only (no requiere puertos abiertos)
- TLS termination en el edge
- Sin exposición directa de servicios locales
- URL HTTPS pública

## Flujo de una Solicitud de Chat

```
1. Usuario escribe mensaje en el navegador
2. Frontend → POST /api/chat (con mensajes y modelo)
3. Backend API valida input, aplica rate limit
4. Backend API → POST https://tunnel-url/api/chat
   Headers: Authorization: Bearer <GATEWAY_SECRET>
5. Cloudflare Tunnel → reenvía a 127.0.0.1:3456
6. Gateway valida token, valida input, verifica modelo
7. Gateway → POST http://127.0.0.1:11434/api/chat
8. Ollama procesa con qwen3:4b
9. Respuesta fluye en sentido inverso con streaming SSE
10. Frontend renderiza progresivamente
```

## Open WebUI (Paralelo e Independiente)

```
Open WebUI → http://127.0.0.1:11434 → Ollama → qwen3:4b
```

Open WebUI sigue funcionando como cliente independiente de Ollama.
Nuestra aplicación es OTRO cliente independiente. No hay interferencia.

## Escalabilidad Futura

- **Más modelos**: El selector de modelos ya está preparado
- **Más gateways**: Se pueden añadir más instancias locales
- **Autenticación de usuarios**: Se puede añadir en el frontend/backend
- **Base de datos**: Para historial persistente en cloud
- **WebSocket**: Para funcionalidades en tiempo real adicionales
