import type { VercelRequest, VercelResponse } from '@vercel/node';

// GATEWA Cloud Backend - Chat endpoint
// Proxies requests to the GATEWA Local Bridge with authentication

const BRIDGE_URL = process.env.GATEWA_BRIDGE_URL;
const BRIDGE_SECRET = process.env.GATEWA_BRIDGE_SECRET;

// Rate limiting (in-memory, per-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getClientIp(req: VercelRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] as string 
    || 'unknown';
}

function validateMessages(messages: unknown): boolean {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > 50) return false;
  
  return messages.every((msg: unknown) => {
    if (typeof msg !== 'object' || msg === null) return false;
    const m = msg as Record<string, unknown>;
    if (!['user', 'assistant', 'system'].includes(m.role as string)) return false;
    if (typeof m.content !== 'string') return false;
    if (m.content.length > 10000) return false;
    return true;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!BRIDGE_URL || !BRIDGE_SECRET) {
    return res.status(500).json({ 
      error: 'GATEWA Bridge not configured. Set GATEWA_BRIDGE_URL and GATEWA_BRIDGE_SECRET environment variables.' 
    });
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait before sending more messages.' });
  }

  const { messages, model, stream } = req.body || {};

  if (!validateMessages(messages)) {
    return res.status(400).json({ 
      error: 'Invalid messages format. Must be an array of {role, content} objects.' 
    });
  }

  const validatedModel = typeof model === 'string' && model.length <= 100 
    ? model 
    : 'qwen3:4b';

  const shouldStream = stream !== false;

  try {
    const bridgeResponse = await fetch(`${BRIDGE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
        'X-GATEWA-Source': 'cloud-backend',
      },
      body: JSON.stringify({
        messages,
        model: validatedModel,
        stream: shouldStream,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!bridgeResponse.ok) {
      const errorText = await bridgeResponse.text().catch(() => 'Unknown error');
      return res.status(bridgeResponse.status).json({ 
        error: `Bridge error: ${errorText}` 
      });
    }

    if (shouldStream && bridgeResponse.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = bridgeResponse.body.getReader();
      const decoder = new TextDecoder();

      const pump = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.write(' [DONE]\n\n');
              res.end();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch {
          res.write(` ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
          res.end();
        }
      };

      await pump();
    } else {
      const data = await bridgeResponse.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return res.status(504).json({ error: 'Bridge timeout. The local service may be unavailable.' });
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(503).json({ error: 'GATEWA Local Bridge unreachable. Please check your local service.' });
    }
    
    return res.status(500).json({ error: `Internal error: ${errorMessage}` });
  }
}
