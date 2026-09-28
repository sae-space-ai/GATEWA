# Seguridad

## Principios de Seguridad

1. **Zero Trust**: Ningún componente confía en otro por defecto
2. **Mínimo Privilegio**: Cada componente tiene solo los permisos necesarios
3. **Defensa en Profundidad**: Múltiples capas de seguridad
4. **Sin Exposición Directa**: Ollama nunca es accesible desde Internet
5. **Secretos Protegidos**: Nunca en código, nunca en frontend

## Autenticación Gateway ↔ Backend Cloud

### Mecanismo: Bearer Token

```
Backend Cloud → Local Gateway
Authorization: Bearer <GATEWAY_SECRET>
```

- El `GATEWAY_SECRET` es un token de 256 bits (32 bytes hex)
- Se genera con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Debe ser idéntico en:
  - Variable de entorno `GATEWAY_SECRET` en Vercel
  - Variable de entorno `GATEWAY_SECRET` en local-gateway/.env
- Se compara con función de tiempo constante (previene timing attacks)

### Generación del Secreto

```bash
# En tu ordenador Windows (PowerShell o CMD):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Resultado ejemplo: a3f5b8c9d2e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6
```

## Túnel HTTPS Seguro

### Cloudflare Tunnel (Recomendado)

**Ventajas:**
- Gratuito
- Sin puertos abiertos en router
- TLS automático
- Conexión outbound-only (el túnel sale de tu PC, no entra)
- DDoS protection incluida
- Zero Trust compatible

**Configuración:**

```bash
# 1. Instalar cloudflared
winget install Cloudflare.cloudflared

# 2. Túnel rápido (URL temporal, ideal para pruebas)
cloudflared tunnel --url http://127.0.0.1:3456

# 3. Para URL permanente, crear túnel nombrado:
cloudflared tunnel login
cloudflared tunnel create ollama-gateway
cloudflared tunnel route dns ollama-gateway gateway.tudominio.com
cloudflared tunnel run ollama-gateway
```

**Configuración del túnel permanente** (`~/.cloudflared/config.yml`):
```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\TU_USUARIO\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: gateway.tudominio.com
    service: http://127.0.0.1:3456
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### Alternativa: ngrok

```bash
# Instalar ngrok
winget install ngrok

# Iniciar túnel
ngrok http 3456 --auth-token TU_TOKEN
```

## Protección del Gateway Local

### Bind Address
- El gateway escucha **EXCLUSIVAMENTE** en `127.0.0.1:3456`
- **NUNCA** en `0.0.0.0` sin túnel seguro
- Solo accesible desde el propio ordenador o a través del túnel

### Rate Limiting
- Backend Cloud: 20 requests/minuto por IP
- Gateway Local: 3 solicitudes concurrentes máximo

### Validación de Inputs
- Tamaño máximo de prompt: 50,000 caracteres
- Máximo 50 mensajes por solicitud
- Validación de roles (user/assistant/system)
- Sanitización de modelos permitidos

### Timeout
- Backend → Gateway: 120 segundos
- Gateway → Ollama: 120 segundos
- Health check: 10 segundos

### Headers de Seguridad
- Helmet.js en el gateway (protección contra XSS, clickjacking, etc.)
- CORS deshabilitado (solo backend-to-backend)
- Content-Type enforcement

## Lo que NO se hace

- ❌ No se expone el puerto 11434 de Ollama a Internet
- ❌ No se abre el puerto 11434 en el router
- ❌ No se usa `OLLAMA_HOST=0.0.0.0` sin capa de seguridad
- ❌ No hay secretos en el código frontend
- ❌ No hay secretos en el repositorio
- ❌ No se ejecutan comandos del sistema desde el gateway
- ❌ No se accede a la red local desde el gateway
- ❌ No se usa localhost como dirección de Ollama desde el cloud

## Variables de Entorno

### Cloud (Vercel)
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GATEWAY_PUBLIC_URL` | URL HTTPS del túnel | `https://gateway.tudominio.com` |
| `GATEWAY_SECRET` | Token de autenticación | `a3f5b8...` (64 chars hex) |

### Local Gateway
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GATEWAY_PORT` | Puerto del gateway | `3456` |
| `OLLAMA_BASE_URL` | URL de Ollama | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Modelo por defecto | `qwen3:4b` |
| `GATEWAY_SECRET` | Token (igual al cloud) | `a3f5b8...` |
| `MAX_PROMPT_SIZE` | Tamaño máximo prompt | `50000` |
| `REQUEST_TIMEOUT` | Timeout en ms | `120000` |
| `MAX_CONCURRENT_REQUESTS` | Requests simultáneos | `3` |

## Auditoría de Seguridad

### Checklist
- [ ] No hay secretos en el código fuente
- [ ] `.env` está en `.gitignore`
- [ ] `.env.example` no contiene secretos reales
- [ ] El gateway solo escucha en 127.0.0.1
- [ ] La autenticación usa comparación de tiempo constante
- [ ] Los inputs están validados y limitados
- [ ] Los timeouts están configurados
- [ ] El túnel usa HTTPS
- [ ] No hay puertos abiertos en el router para Ollama

### Comandos de verificación

```bash
# Verificar que no hay secretos en el código
grep -r "GATEWAY_SECRET=" --include="*.ts" --include="*.tsx" --include="*.js" src/ api/
# (Solo debe aparecer en .env.example con valor placeholder)

# Verificar que no hay localhost apuntando a Ollama desde el cloud
grep -r "127.0.0.1:11434" --include="*.ts" --include="*.tsx" api/ src/
# (No debe encontrar nada - solo el gateway debe conocer esta URL)
```

## Incident Response

### Si el GATEWAY_SECRET se compromete:
1. Generar un nuevo secreto inmediatamente
2. Actualizar en Vercel (Environment Variables)
3. Actualizar en local-gateway/.env
4. Reiniciar el gateway
5. El cambio es inmediato (no requiere redeploy si se usa variable de entorno)

### Si el túnel se compromete:
1. Detener cloudflared
2. Crear un nuevo túnel (nueva URL)
3. Actualizar GATEWAY_PUBLIC_URL en Vercel
4. Reiniciar el túnel

### Si el ordenador está apagado:
- La aplicación cloud sigue funcionando
- Muestra "LOCAL OFFLINE" claramente
- No hay error, simplemente no puede generar respuestas
- Al volver a encender, se reconecta automáticamente
