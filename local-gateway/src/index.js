/**
 * LOCAL GATEWAY - Secure bridge between Cloud Backend and local Ollama
 * 
 * This service runs exclusively on the local Windows machine.
 * It is the ONLY component that communicates directly with Ollama at 127.0.0.1:11434.
 * 
 * Security features:
 * - Bearer token authentication for all requests
 * - Request size limits
 * - Timeout enforcement
 * - Concurrency control
 * - No arbitrary command execution
 * - No access to local network beyond Ollama
 * - Principle of minimum privilege
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from local-gateway directory
config({ path: join(__dirname, '..', '.env') });

// ============================================================
// CONFIGURATION
// ============================================================
const PORT = parseInt(process.env.GATEWAY_PORT || '3456', 10);
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b';
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || '';
const MAX_PROMPT_SIZE = parseInt(process.env.MAX_PROMPT_SIZE || '50000', 10); // 50KB max
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '120000', 10); // 2 min
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3', 10);

// ============================================================
// STATE
// ============================================================
let activeRequests = 0;

// ============================================================
// VALIDATION
// ============================================================
if (!GATEWAY_SECRET) {
  console.error('❌ FATAL: GATEWAY_SECRET is not set. Create a .env file in local-gateway/ with GATEWAY_SECRET=<your-secret>');
  console.error('   Generate a secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: false, // No browser CORS - only backend-to-backend
}));

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }
  
  const token = authHeader.slice(7);
  
  // Constant-time comparison to prevent timing attacks
  if (!secureCompare(token, GATEWAY_SECRET)) {
    return res.status(403).json({ error: 'Forbidden: Invalid credentials' });
  }
  
  next();
}

function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================
// CONCURRENCY CONTROL
// ============================================================
function concurrencyControl(req, res, next) {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many concurrent requests. Please wait.',
      activeRequests,
      maxConcurrent: MAX_CONCURRENT_REQUESTS,
    });
  }
  activeRequests++;
  
  res.on('finish', () => {
    activeRequests = Math.max(0, activeRequests - 1);
  });
  res.on('close', () => {
    activeRequests = Math.max(0, activeRequests - 1);
  });
  
  next();
}

// ============================================================
// INPUT VALIDATION
// ============================================================
function validateChatRequest(req, res, next) {
  const { messages, model, stream } = req.body;
  
  // Validate messages
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  
  if (messages.length === 0 || messages.length > 50) {
    return res.status(400).json({ error: 'messages must contain 1-50 items' });
  }
  
  let totalSize = 0;
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return res.status(400).json({ error: 'Each message must be an object' });
    }
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return res.status(400).json({ error: `Invalid role: ${msg.role}. Must be user, assistant, or system` });
    }
    if (typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'Message content must be a string' });
    }
    totalSize += msg.content.length;
    if (totalSize > MAX_PROMPT_SIZE) {
      return res.status(400).json({ error: `Total prompt size exceeds limit of ${MAX_PROMPT_SIZE} characters` });
    }
  }
  
  // Validate model (only allow known models)
  if (model && typeof model !== 'string') {
    return res.status(400).json({ error: 'model must be a string' });
  }
  
  next();
}

// ============================================================
// OLLAMA COMMUNICATION
// ============================================================
async function checkOllamaAvailability() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return { available: false, models: [] };
    
    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

async function checkModelAvailable(modelName) {
  const { available, models } = await checkOllamaAvailability();
  if (!available) return false;
  return models.includes(modelName);
}

// ============================================================
// ROUTES
// ============================================================

// Health check (no auth required for basic health)
app.get('/health', async (req, res) => {
  try {
    const { available, models } = await checkOllamaAvailability();
    const modelAvailable = models.includes(OLLAMA_MODEL);
    
    res.json({
      status: available ? 'ok' : 'degraded',
      ollamaAvailable: available,
      modelAvailable,
      model: OLLAMA_MODEL,
      version: '1.0.0',
      activeRequests,
      maxConcurrent: MAX_CONCURRENT_REQUESTS,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      ollamaAvailable: false,
      error: err.message,
    });
  }
});

// Authenticated health check
app.get('/api/health', authenticate, async (req, res) => {
  const { available, models } = await checkOllamaAvailability();
  res.json({
    status: available ? 'ok' : 'degraded',
    ollamaAvailable: available,
    modelAvailable: models.includes(OLLAMA_MODEL),
    model: OLLAMA_MODEL,
    availableModels: models,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Get available models
app.get('/api/models', authenticate, async (req, res) => {
  try {
    const { available, models } = await checkOllamaAvailability();
    
    if (!available) {
      return res.status(503).json({ error: 'Ollama is not available' });
    }
    
    res.json({
      models: models.length > 0 ? models : [OLLAMA_MODEL],
      default: OLLAMA_MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch models: ${err.message}` });
  }
});

// Chat endpoint - the main functionality
app.post('/api/chat', 
  authenticate, 
  concurrencyControl, 
  validateChatRequest, 
  async (req, res) => {
    const { messages, model, stream } = req.body;
    const requestedModel = model || OLLAMA_MODEL;
    const shouldStream = stream !== false;
    
    // Check if model exists
    const modelExists = await checkModelAvailable(requestedModel);
    if (!modelExists) {
      return res.status(400).json({ 
        error: `Model "${requestedModel}" is not available in Ollama. Available models will be checked.`,
        requestedModel,
        defaultModel: OLLAMA_MODEL,
      });
    }
    
    try {
      // Forward to Ollama
      const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: requestedModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: shouldStream,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      
      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        return res.status(ollamaResponse.status).json({ 
          error: `Ollama error: ${errorText}` 
        });
      }
      
      if (shouldStream) {
        // Stream response from Ollama
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            
            // Parse Ollama's NDJSON and convert to SSE format
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  res.write(`data: ${JSON.stringify({ content: parsed.message.content })}\n\n`);
                }
                if (parsed.done) {
                  res.write('data: [DONE]\n\n');
                  res.end();
                  return;
                }
              } catch {
                // Skip malformed lines
              }
            }
          }
        } catch (streamErr) {
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream error' });
          } else {
            res.end();
          }
        }
      } else {
        // Non-streaming response
        const data = await ollamaResponse.json();
        res.json({
          message: data.message || { role: 'assistant', content: '' },
          model: requestedModel,
          done: true,
        });
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        return res.status(504).json({ error: 'Request to Ollama timed out' });
      }
      return res.status(502).json({ error: `Failed to communicate with Ollama: ${err.message}` });
    }
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     OLLAMA LOCAL GATEWAY v1.0.0             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Port:      ${PORT}                              ║`);
  console.log(`║  Ollama:    ${OLLAMA_BASE_URL.padEnd(30)}  ║`);
  console.log(`║  Model:     ${OLLAMA_MODEL.padEnd(30)}  ║`);
  console.log(`║  Bind:      127.0.0.1 (localhost only)       ║`);
  console.log(`║  Auth:      Bearer token enabled             ║`);
  console.log(`║  Max conc:  ${String(MAX_CONCURRENT_REQUESTS).padEnd(30)}  ║`);
  console.log(`║  Timeout:   ${String(REQUEST_TIMEOUT / 1000).padEnd(30)}  ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  This gateway listens ONLY on 127.0.0.1');
  console.log('⚠️  Use Cloudflare Tunnel or similar to expose it securely');
  console.log('');
  
  // Check Ollama connectivity
  checkOllamaAvailability().then(({ available, models }) => {
    if (available) {
      console.log(`✅ Ollama is reachable. Available models: ${models.join(', ') || 'none'}`);
      if (models.includes(OLLAMA_MODEL)) {
        console.log(`✅ Model "${OLLAMA_MODEL}" is available`);
      } else {
        console.log(`⚠️  Model "${OLLAMA_MODEL}" not found in Ollama`);
        console.log(`   Available: ${models.join(', ') || 'none'}`);
      }
    } else {
      console.log('❌ Ollama is NOT reachable at ' + OLLAMA_BASE_URL);
      console.log('   Make sure Ollama is running (ollama serve)');
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gateway...');
  server.close(() => {
    console.log('✅ Gateway stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gateway...');
  server.close(() => {
    console.log('✅ Gateway stopped');
    process.exit(0);
  });
});

export default app;
