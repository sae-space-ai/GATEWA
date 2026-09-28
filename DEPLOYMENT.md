# GATEWA - Guía de Despliegue

## Requisitos

### Software en Windows
- Windows 10/11
- Node.js 18+
- Ollama con qwen3:4b
- cloudflared
- Git

### Cuentas
- GitHub (Free)
- Vercel (Free)
- Cloudflare (Free)

---

## 1. Instalación en Windows

### Node.js
```powershell
winget install OpenJS.NodeJS.LTS
node --version  # >= 18
```

### cloudflared
```powershell
winget install Cloudflare.cloudflared
cloudflared --version
```

### Verificar Ollama
```powershell
ollama --version
ollama list  # Debe mostrar qwen3:4b
```

---

## 2. Configurar GATEWA Local Bridge

```powershell
git clone https://github.com/TU_USUARIO/gatewa.git
cd gatewa\local-bridge
npm install

# Generar secreto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# ⚠️ GUARDA ESTE VALOR

# Crear .env
copy .env.example .env
# Editar .env con el secreto generado
```

### Iniciar Bridge
```powershell
npm start
```

Deberías ver:
```
╔══════════════════════════════════════════════════╗
║         GATEWA LOCAL BRIDGE v1.0.0              ║
╠══════════════════════════════════════════════════╣
║  ✅ Ollama is reachable                          ║
║  ✅ Model "qwen3:4b" is available                ║
╚══════════════════════════════════════════════════╝
```

### Verificar
```powershell
curl -H "Authorization: Bearer TU_SECRET" http://127.0.0.1:3456/health
```

---

## 3. Túnel HTTPS

### Opción A: Túnel Rápido (pruebas)
```powershell
cloudflared tunnel --url http://127.0.0.1:3456
# Copia la URL: https://xxx.trycloudflare.com
```

### Opción B: Túnel Permanente (producción)
```powershell
cloudflared tunnel login
cloudflared tunnel create gatewa-bridge
cloudflared tunnel route dns gatewa-bridge gatewa.tudominio.com
cloudflared tunnel run gatewa-bridge

# Como servicio Windows:
cloudflared service install
```

---

## 4. Desplegar GATEWA Cloud

### GitHub
```powershell
cd gatewa  # raíz del proyecto
git init
git add .
git commit -m "Initial GATEWA commit"
git remote add origin https://github.com/TU_USUARIO/gatewa.git
git push -u origin main
```

### Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Importar repositorio `gatewa`
3. Framework Preset: `Vite`

### Variables de Entorno en Vercel
| Variable | Valor |
|----------|-------|
| `GATEWA_BRIDGE_URL` | URL HTTPS del túnel |
| `GATEWA_BRIDGE_SECRET` | Mismo secreto del bridge |

### Desplegar
```powershell
npx vercel --prod
```

---

## 5. Verificación

- [ ] Bridge corriendo
- [ ] Túnel activo
- [ ] Vercel desplegado con variables
- [ ] Abrir URL de Vercel → "LOCAL AI ONLINE"
- [ ] Enviar mensaje → recibir respuesta
- [ ] Open WebUI sigue funcionando

---

## 6. Operación Diaria

### Inicio
1. Encender ordenador
2. Verificar Ollama corriendo
3. `cd local-bridge && npm start`
4. `cloudflared tunnel run gatewa-bridge` (si no es servicio)
5. Verificar "LOCAL AI ONLINE" en navegador

### Si usas túnel rápido
La URL cambia cada vez:
1. Copiar nueva URL
2. Actualizar `GATEWA_BRIDGE_URL` en Vercel
3. `npx vercel --prod`

---

## 7. Troubleshooting

### "LOCAL AI OFFLINE"
1. Verificar Ollama: `curl http://127.0.0.1:11434/api/tags`
2. Verificar Bridge: `npm start` en local-bridge/
3. Verificar túnel: `cloudflared tunnel run gatewa-bridge`
4. Verificar URL en Vercel coincide con túnel actual
5. Verificar GATEWA_BRIDGE_SECRET idéntico en ambos lados

### Error 503
- Túnel caído o URL cambió

### Error 403
- GATEWA_BRIDGE_SECRET no coincide

### Error 429
- Rate limit alcanzado, esperar 1 minuto

### Open WebUI no funciona
- No relacionado con GATEWA
- Verificar que apunta a http://127.0.0.1:11434

---

## 8. Actualización

```powershell
cd gatewa
git pull origin main
npm install

# Bridge (si hubo cambios)
cd local-bridge
npm install
# Reiniciar: Ctrl+C y npm start
```

### Actualizar modelo
```powershell
ollama pull qwen3:4b  # Nueva versión
ollama pull llama3.2  # Modelo adicional
```

---

## 9. Backup

Archivos importantes:
- `local-bridge/.env` (GATEWA_BRIDGE_SECRET)
- `~/.cloudflared/config.yml`
- `~/.cloudflared/<TUNNEL_ID>.json`

### Recovery
Si pierdes el secreto:
1. Generar nuevo
2. Actualizar en `local-bridge/.env`
3. Actualizar en Vercel
4. Reiniciar bridge
