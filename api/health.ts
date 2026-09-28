import type { VercelRequest, VercelResponse } from '@vercel/node';

// GATEWA Health check - verifies connectivity to Local Bridge and Ollama

const BRIDGE_URL = process.env.GATEWA_BRIDGE_URL;
const BRIDGE_SECRET = process.env.GATEWA_BRIDGE_SECRET;

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

  if (!BRIDGE_URL || !BRIDGE_SECRET) {
    return res.status(200).json({
      status: 'degraded',
      bridgeAvailable: false,
      ollamaAvailable: false,
      model: 'qwen3:4b',
      message: 'GATEWA Bridge not configured',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch(`${BRIDGE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: 'ok',
        bridgeAvailable: true,
        ollamaAvailable: data.ollamaAvailable ?? false,
        model: data.model ?? 'qwen3:4b',
        bridgeVersion: data.version ?? 'unknown',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(200).json({
        status: 'degraded',
        bridgeAvailable: false,
        ollamaAvailable: false,
        model: 'qwen3:4b',
        message: `Bridge returned ${response.status}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(200).json({
      status: 'error',
      bridgeAvailable: false,
      ollamaAvailable: false,
      model: 'qwen3:4b',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
