# Guía de Despliegue Completa

## Índice

1. [Requisitos](#requisitos)
2. [Instalación en Windows](#instalación-en-windows)
3. [Configuración del Local Gateway](#configuración-del-local-gateway)
4. [Configuración del Túnel HTTPS](#configuración-del-túnel-https)
5. [Despliegue en Vercel](#despliegue-en-vercel)
6. [Verificación](#verificación)
7. [Operación Diaria](#operación-diaria)
8. [Troubleshooting](#troubleshooting)
9. [Actualización](#actualización)

---

## Requisitos

### Software necesario en tu Windows

| Software | Versión | Propósito |
|----------|---------|-----------|
| Windows | 10/11 | Sistema operativo |
| Node.js | 18+ | Ejecutar el gateway |
| Ollama | Latest | Motor de IA |
| cloudflared | Latest | Túnel HTTPS |
| Git | Latest | Control de versiones |

### Cuentas necesarias

| Servicio | Plan | Propósito |
|----------|------|-----------|
| GitHub | Free | Repositorio de código |
| Vercel | Free | Despliegue cloud |
| Cloudflare | Free | Túnel HTTPS |

---

## Instalación en Windows

### 1. Instalar Node.js

```powershell
# Opción 1: winget
winget install OpenJS.NodeJS.LTS

# Opción 2: Descargar de https://nodejs.org/
```

Verificar:
```powershell
node --version   # Debe ser >= 18
npm --version
```

### 2. Instalar Git

```powershell
winget install Git.Git
```

### 3. Instalar cloudflared

```powershell
winget install Cloudflare.cloudflared
```

Verificar:
```powershell
cloudflared --version
```

### 4. Verificar Ollama

```powershell
ollama --version
ollama list
# Debe mostrar qwen3:4b
```

Si Ollama no está corriendo:
```powershell
ollama serve
# O simplemente abrir Ollama desde el menú inicio
```

---

## Configuración del Local Gateway

### 1. Clonar el repositorio

```powershell
git clone https://github.com/TU_USUARIO/ollama-chat.git
cd ollama-chat
```

### 2. Instalar dependencias del gateway

```powershell
cd local-gateway
npm install
```

### 3. Generar el secreto de autenticación

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANTE: Guarda este valor. Lo necesitarás en múltiples lugares.**

Ejemplo de salida:
```
a3f5b8c9d2e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6
```

### 4. Crear el archivo .env

```powershell
copy .env.example .env
```

Editar `local-gateway/.env`:
```env
GATEWAY_PORT=3456
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
GATEWAY_SECRET=a3f5b8c9d2e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6
MAX_PROMPT_SIZE=50000
REQUEST_TIMEOUT=120000
MAX_CONCURRENT_REQUESTS=3
```

**Reemplaza `GATEWAY_SECRET` con el valor generado en el paso 3.**

### 5. Iniciar el gateway

```powershell
npm start
```

Deberías ver:
```
╔══════════════════════════════════════════════╗
║     OLLAMA LOCAL GATEWAY v1.0.0             ║
╠══════════════════════════════════════════════╣
║  Port:      3456                             ║
║  Ollama:    http://127.0.0.1:11434           ║
║  Model:     qwen3:4b                         ║
║  Bind:      127.0.0.1 (localhost only)       ║
║  Auth:      Bearer token enabled             ║
╚══════════════════════════════════════════════╝

✅ Ollama is reachable. Available models: qwen3:4b
✅ Model "qwen3:4b" is available
```

### 6. Verificar el gateway

En otra terminal:
```powershell
# Health check (sin auth)
curl http://127.0.0.1:3456/health

# Health check (con auth) - reemplaza TU_SECRET
curl -H "Authorization: Bearer TU_SECRET" http://127.0.0.1:3456/api/health

# Probar chat
curl -X POST http://127.0.0.1:3456/api/chat \
  -H "Authorization: Bearer TU_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Hola\"}],\"model\":\"qwen3:4b\",\"stream\":false}"
```

---

## Configuración del Túnel HTTPS

### Opción A: Túnel Rápido (URL temporal, para pruebas)

```powershell
cloudflared tunnel --url http://127.0.0.1:3456
```

Salida:
```
INF +-----------------------------------------------------------+
INF | Your quick Tunnel has been created! Visit it at:          |
INF | https://random-words-xyz.trycloudflare.com               |
INF +-----------------------------------------------------------+
```

**Copia la URL `https://random-words-xyz.trycloudflare.com`**

⚠️ Esta URL cambia cada vez que reinicias cloudflared. Para producción, usa la Opción B.

### Opción B: Túnel Permanente (Recomendado para producción)

#### 1. Login en Cloudflare

```powershell
cloudflared tunnel login
```

Se abrirá el navegador. Selecciona tu dominio.

#### 2. Crear el túnel

```powershell
cloudflared tunnel create ollama-gateway
```

Anota el **Tunnel ID** (ej: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

#### 3. Configurar DNS

```powershell
cloudflared tunnel route dns ollama-gateway gateway.tudominio.com
```

#### 4. Crear archivo de configuración

Crear `C:\Users\TU_USUARIO\.cloudflared\config.yml`:

```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: C:\Users\TU_USUARIO\.cloudflared\a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: gateway.tudominio.com
    service: http://127.0.0.1:3456
    originRequest:
      noTLSVerify: true
      connectTimeout: 10s
  - service: http_status:404
```

#### 5. Iniciar el túnel

```powershell
cloudflared tunnel run ollama-gateway
```

#### 6. (Opcional) Instalar como servicio de Windows

```powershell
cloudflared service install
```

Esto hace que el túnel se inicie automáticamente con Windows.

---

## Despliegue en Vercel

### 1. Crear repositorio en GitHub

```powershell
cd ollama-chat  # raíz del proyecto
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/ollama-chat.git
git push -u origin main
```

### 2. Importar en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Importar desde GitHub: `ollama-chat`
4. Framework Preset: `Vite`
5. **NO** cambiar Build Command ni Output Directory

### 3. Configurar Variables de Entorno

En Vercel → Project → Settings → Environment Variables:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `GATEWAY_PUBLIC_URL` | `https://gateway.tudominio.com` o URL del túnel rápido | Production |
| `GATEWAY_SECRET` | El mismo secreto del gateway local | Production |

### 4. Desplegar

```powershell
# Primera vez
npx vercel

# Producción
npx vercel --prod
```

O usar el despliegue automático desde GitHub (cada push a main).

---

## Verificación

### Checklist de verificación

- [ ] Gateway corriendo en Windows (`npm start` en local-gateway/)
- [ ] Túnel activo (cloudflared corriendo)
- [ ] Vercel desplegado con variables de entorno configuradas
- [ ] Abrir URL de Vercel en navegador
- [ ] Ver indicador "LOCAL ONLINE" en verde
- [ ] Escribir un mensaje y recibir respuesta
- [ ] Open WebUI sigue funcionando independientemente

### Prueba de extremo a extremo

```powershell
# 1. Verificar gateway local
curl http://127.0.0.1:3456/health

# 2. Verificar túnel
curl https://tu-tunnel-url.trycloudflare.com/health

# 3. Verificar backend cloud
curl https://tu-app.vercel.app/api/health
```

---

## Operación Diaria

### Inicio del día

1. Encender el ordenador
2. Asegurar que Ollama está corriendo (verificar icono en bandeja)
3. Iniciar el gateway:
   ```powershell
   cd ollama-chat\local-gateway
   npm start
   ```
4. Iniciar el túnel (si no es servicio):
   ```powershell
   cloudflared tunnel run ollama-gateway
   ```
5. Verificar en el navegador que dice "LOCAL ONLINE"

### Si usaste túnel rápido (temporal)

Cada vez que reinicias cloudflared, la URL cambia:
1. Copiar la nueva URL
2. Actualizar `GATEWAY_PUBLIC_URL` en Vercel
3. Redeploy: `npx vercel --prod`

**Recomendación**: Usa túnel permanente para evitar esto.

### Apagar

1. Cerrar el navegador (la app cloud sigue "viva" pero muestra OFFLINE)
2. Ctrl+C en la terminal del gateway
3. Ctrl+C en la terminal del túnel (si no es servicio)

---

## Troubleshooting

### "LOCAL OFFLINE" en la aplicación

**Causas posibles:**

1. **Ollama no está corriendo**
   ```powershell
   # Verificar
   curl http://127.0.0.1:11434/api/tags
   # Si falla, iniciar Ollama
   ollama serve
   ```

2. **Gateway no está corriendo**
   ```powershell
   cd local-gateway
   npm start
   ```

3. **Túnel no está activo**
   ```powershell
   cloudflared tunnel run ollama-gateway
   ```

4. **URL del túnel cambió** (si usas túnel rápido)
   - Verificar que `GATEWAY_PUBLIC_URL` en Vercel coincide con la URL actual del túnel

5. **Secreto incorrecto**
   - Verificar que `GATEWAY_SECRET` es idéntico en Vercel y en local-gateway/.env

### Error 503 / Gateway unreachable

- El túnel está caído o la URL cambió
- Verificar que cloudflared está corriendo
- Verificar la URL en Vercel

### Error 403 / Forbidden

- El `GATEWAY_SECRET` no coincide
- Regenerar y actualizar en ambos lados

### Error 429 / Too many requests

- Rate limit alcanzado
- Esperar 1 minuto e intentar de nuevo
- Ajustar `MAX_CONCURRENT_REQUESTS` en el gateway si es necesario

### El streaming no funciona

- Verificar que el navegador soporta SSE
- Verificar que no hay proxy intermedio que bloquee streaming
- Probar con `stream: false` como alternativa

### Open WebUI dejó de funcionar

- Nuestra aplicación NO modifica Ollama
- Si Open WebUI no funciona, es un problema independiente
- Verificar que Open WebUI apunta a `http://127.0.0.1:11434`
- Reiniciar Open WebUI

---

## Actualización

### Actualizar el código

```powershell
cd ollama-chat
git pull origin main

# Frontend (se redeploya automáticamente en Vercel si usas auto-deploy)
npm install

# Gateway (si hubo cambios)
cd local-gateway
npm install
# Reiniciar: Ctrl+C y npm start
```

### Actualizar Ollama / modelo

```powershell
# Actualizar Ollama
ollama --version  # Verificar versión actual

# Pull nueva versión del modelo
ollama pull qwen3:4b

# O instalar un modelo adicional
ollama pull llama3.2
# (El selector de modelos en la UI lo detectará automáticamente)
```

### Actualizar cloudflared

```powershell
winget upgrade Cloudflare.cloudflared
```

---

## Backup y Recovery

### Archivos importantes a respaldar

- `local-gateway/.env` (contiene el GATEWAY_SECRET)
- `~/.cloudflared/config.yml` (configuración del túnel permanente)
- `~/.cloudflared/<TUNNEL_ID>.json` (credenciales del túnel)

### Recovery

Si pierdes el GATEWAY_SECRET:
1. Generar uno nuevo
2. Actualizar en `local-gateway/.env`
3. Actualizar en Vercel Environment Variables
4. Reiniciar gateway
5. Redeploy en Vercel (o simplemente esperar a que las variables se actualicen)
