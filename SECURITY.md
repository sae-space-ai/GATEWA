# GATEWA - Seguridad

## Principios

1. **Zero Trust**: Ningún componente confía en otro por defecto
2. **Mínimo Privilegio**: Cada componente tiene solo los permisos necesarios
3. **Defensa en Profundidad**: Múltiples capas de seguridad
4. **Sin Exposición Directa**: Ollama nunca accesible desde Internet
5. **Secretos Protegidos**: Nunca en código, nunca en frontend

## Autenticación Bridge ↔ Cloud

### Bearer Token
```
Backend Cloud → Local Bridge
Authorization: Bearer <GATEWA_BRIDGE_SECRET>
```

- Token de 256 bits (32 bytes hex)
- Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Debe ser idéntico en Vercel y local-bridge/.env
- Comparación de tiempo constante (previene timing attacks)

## Túnel HTTPS

### Cloudflare Tunnel (Recomendado)
- Gratuito, sin puertos abiertos
- TLS automático, outbound-only
- DDoS protection incluida

```bash
# Instalación
winget install Cloudflare.cloudflared

# Túnel rápido (pruebas)
cloudflared tunnel --url http://127.0.0.1:3456

# Túnel permanente
cloudflared tunnel login
cloudflared tunnel create gatewa-bridge
cloudflared tunnel route dns gatewa-bridge gatewa.tudominio.com
```

## Protección del Bridge

| Medida | Implementación |
|--------|---------------|
| **Bind** | Solo 127.0.0.1:3456 |
| **Auth** | Bearer token obligatorio |
| **Rate limit** | 3 concurrentes, 20/min cloud |
| **Timeout** | 120s máximo |
| **Input** | 50KB max, 50 mensajes max |
| **Headers** | Helmet.js (XSS, clickjacking) |
| **CORS** | Deshabilitado (solo backend-to-backend) |

## Lo que NO se hace

- ❌ Puerto 11434 expuesto a Internet
- ❌ Puerto abierto en router
- ❌ `OLLAMA_HOST=0.0.0.0` sin seguridad
- ❌ Secretos en código frontend
- ❌ Secretos en repositorio
- ❌ Comandos del sistema desde bridge
- ❌ Acceso a red local desde bridge
- ❌ localhost como dirección de Ollama desde cloud

## Variables de Entorno

### Cloud (Vercel)
| Variable | Descripción |
|----------|-------------|
| `GATEWA_BRIDGE_URL` | URL HTTPS del túnel |
| `GATEWA_BRIDGE_SECRET` | Token autenticación |

### Local Bridge
| Variable | Descripción |
|----------|-------------|
| `BRIDGE_PORT` | Puerto (default: 3456) |
| `OLLAMA_BASE_URL` | URL de Ollama |
| `OLLAMA_MODEL` | Modelo por defecto |
| `GATEWA_BRIDGE_SECRET` | Token (igual al cloud) |
| `MAX_PROMPT_SIZE` | Tamaño máximo prompt |
| `REQUEST_TIMEOUT` | Timeout en ms |
| `MAX_CONCURRENT_REQUESTS` | Requests simultáneos |

## Auditoría

```bash
# Verificar sin secretos en código
grep -r "GATEWA_BRIDGE_SECRET=" --include="*.ts" --include="*.tsx" src/ api/

# Verificar sin localhost Ollama en cloud
grep -r "127.0.0.1:11434" --include="*.ts" --include="*.tsx" api/ src/
```

## Incident Response

### Si GATEWA_BRIDGE_SECRET se compromete:
1. Generar nuevo secreto
2. Actualizar en Vercel
3. Actualizar en local-bridge/.env
4. Reiniciar bridge

### Si el túnel se compromete:
1. Detener cloudflared
2. Crear nuevo túnel
3. Actualizar GATEWA_BRIDGE_URL en Vercel

### Si el ordenador está apagado:
- GATEWA Cloud sigue funcionando
- Muestra "LOCAL AI OFFLINE"
- Se reconecta automáticamente al encender
