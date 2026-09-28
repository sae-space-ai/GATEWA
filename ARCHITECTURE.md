# GATEWA - Arquitectura

## Visión General

GATEWA es un Centro Privado de Inteligencia Artificial con arquitectura de tres capas:

1. **GATEWA Cloud** (Frontend + Backend API) - Vercel
2. **Secure Tunnel** (Cloudflare Tunnel) - Conexión cifrada
3. **GATEWA Local Bridge** - Servicio en Windows que accede a Ollama

## Diagrama Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GATEWA CLOUD (Vercel)                             │
│                                                                             │
│  ┌─────────────┐     ┌──────────────────────────────────────────────┐      │
│  │   Frontend   │────▶│  Backend API (Serverless Functions)          │      │
│  │   (React)    │     │                                              │      │
│  │             │     │  POST /api/chat  → Proxy + Auth + Rate Limit │      │
│  │  Dashboard  │     │  GET  /api/health → Bridge health check      │      │
│  │  Chat       │     │  GET  /api/models → Available models         │      │
│  │  Workspaces │     │                                              │      │
│  │  Documents  │     │  Environment:                                │      │
│  │  Assistants │     │  - GATEWA_BRIDGE_URL (HTTPS tunnel URL)      │      │
│  │  Models     │     │  - GATEWA_BRIDGE_SECRET (Bearer token)       │      │
│  │  Tools      │     │                                              │      │
│  │  Activity   │     └──────────────────┬───────────────────────────┘      │
│  │  Settings   │                        │                                  │
│  └─────────────┘                        │                                  │
└─────────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                   HTTPS + Bearer Token
                                          │
┌─────────────────────────────────────────┼──────────────────────────────────┐
│                             TUNNEL      │                                  │
│  ┌──────────────────────────────────────▼──────────────────────────────┐   │
│  │                    Cloudflare Tunnel (cloudflared)                   │   │
│  │  - TLS en edge, outbound-only, sin puertos abiertos                 │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│  ┌──────────────────────────────────────▼──────────────────────────────┐   │
│  │                GATEWA LOCAL BRIDGE (Express)                        │   │
│  │  Escucha: 127.0.0.1:3456 (SOLO localhost)                          │   │
│  │  - Auth Bearer, validación, rate limit, timeouts                   │   │
│  │  - Proxy a Ollama con streaming                                    │   │
│  │  - Sin comandos del sistema, sin acceso a red local                │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│  ┌──────────────────────────────────────▼──────────────────────────────┐   │
│  │                         OLLAMA                                       │   │
│  │  Endpoint: http://127.0.0.1:11434                                   │   │
│  │  Modelo: qwen3:4b (extensible a más modelos)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    TU ORDENADOR WINDOWS (LOCAL)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Separación de Responsabilidades

| Componente | Responsabilidades | NO hace |
|-----------|-------------------|---------|
| **Frontend** | UI, estado local, historial, streaming | Acceder a credenciales, comunicarse con Ollama |
| **Backend API** | Proxy seguro, auth, rate limit, validación | Ejecutar IA, almacenar conversaciones |
| **Local Bridge** | Conectar con Ollama, autenticar, validar | Acceder a red local, ejecutar comandos |
| **Túnel** | Cifrado HTTPS, conexión segura | Almacenar datos, ejecutar lógica |
| **Ollama** | Inferencia de modelos | Comunicación directa con Internet |

## Open WebUI (Independiente)

```
Open WebUI → http://127.0.0.1:11434 → Ollama → qwen3:4b
GATEWA     → Bridge → Túnel → Cloud → Navegador
```

Ambos son clientes independientes del mismo Ollama. No interfieren.

## Privacidad

| Dónde | Qué se procesa |
|-------|---------------|
| **Local (Ollama)** | Todo el contenido de las conversaciones |
| **Local (Bridge)** | Tránsito cifrado, sin almacenamiento |
| **Cloud (Backend)** | Solo proxy, sin almacenamiento de contenido |
| **Navegador** | Historial en localStorage (local al usuario) |

## Extensibilidad Futura

- **Más modelos**: Selector ya preparado
- **RAG**: Arquitectura Documents preparada
- **Tools**: Arquitectura modular diseñada
- **Multi-usuario**: Workspaces como base
- **Multi-bridge**: Cada usuario con su propio bridge
