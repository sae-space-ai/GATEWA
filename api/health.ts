import type { VercelRequest, VercelResponse } from '@vercel/node';

// Health check endpoint - verifies connectivity to Local Gateway and Ollama

const GATEWAY_URL = process.env.GATEWAY_PUBLIC_URL;
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GATEWAY_URL || !GATEWAY_SECRET) {
    return res.status(200).json({
      status: 'degraded',
      ollamaAvailable: false,
      model: 'qwen3:4b',
      message: 'Gateway not configured',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GATEWAY_SECRET}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: 'ok',
        ollamaAvailable: data.ollamaAvailable ?? false,
        model: data.model ?? 'qwen3:4b',
        gatewayVersion: data.version ?? 'unknown',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(200).json({
        status: 'degraded',
        ollamaAvailable: false,
        model: 'qwen3:4b',
        message: `Gateway returned ${response.status}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(200).json({
      status: 'error',
      ollamaAvailable: false,
      model: 'qwen3:4b',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
