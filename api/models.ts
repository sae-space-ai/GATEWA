import type { VercelRequest, VercelResponse } from '@vercel/node';

// Models endpoint - returns available models from Ollama via Local Gateway

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
      models: ['qwen3:4b'],
      default: 'qwen3:4b',
      message: 'Gateway not configured - returning defaults',
    });
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/api/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GATEWAY_SECRET}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        models: data.models || ['qwen3:4b'],
        default: data.default || 'qwen3:4b',
      });
    } else {
      return res.status(200).json({
        models: ['qwen3:4b'],
        default: 'qwen3:4b',
        message: 'Could not fetch models from gateway',
      });
    }
  } catch {
    return res.status(200).json({
      models: ['qwen3:4b'],
      default: 'qwen3:4b',
      message: 'Gateway unreachable - returning defaults',
    });
  }
}
