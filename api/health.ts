import type { VercelRequest, VercelResponse } from '@vercel/node';

// GATEWA Health check - diagnóstico granular por eslabón
// CLOUD API → TUNNEL → BRIDGE → OLLAMA → MODEL

const BRIDGE_URL = process.env.GATEWA_BRIDGE_URL;
const BRIDGE_SECRET = process.env.GATEWA_BRIDGE_SECRET;

type LinkStatus = 'online' | 'offline' | 'degraded' | 'error' | 'not_configured' | 'checking';

interface LinkDiagnostic {
  status: LinkStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

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

  const now = new Date().toISOString();

  // 1. CLOUD API: siempre online si responde
  const cloudApi: LinkDiagnostic = {
    status: 'online',
    latencyMs: 0,
    message: 'Cloud API responding',
    lastChecked: now,
  };

  // 2. BRIDGE URL configurada?
  if (!BRIDGE_URL || !BRIDGE_SECRET) {
    return res.status(200).json({
      status: 'degraded',
      overall: 'not_configured',
      cloudApi,
      bridge: {
        status: 'not_configured' as LinkStatus,
        message: 'GATEWA_BRIDGE_URL or GATEWA_BRIDGE_SECRET not set in Vercel env vars',
        lastChecked: now,
      },
      tunnel: {
        status: 'not_configured' as LinkStatus,
        message: 'Cannot check tunnel: bridge URL not configured',
        lastChecked: now,
      },
      ollama: {
        status: 'not_configured' as LinkStatus,
        message: 'Cannot check Ollama: bridge not configured',
        lastChecked: now,
      },
      model: {
        status: 'not_configured' as LinkStatus,
        name: 'qwen3:4b',
        message: 'Cannot check model: bridge not configured',
        lastChecked: now,
      },
      timestamp: now,
    });
  }

  // 3. Intentar contactar el bridge a través del túnel
  const bridgeStart = Date.now();
  try {
    const response = await fetch(`${BRIDGE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BRIDGE_SECRET}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    const bridgeLatency = Date.now() - bridgeStart;

    if (response.ok) {
      const data = await response.json();

      const ollamaStatus: LinkStatus = data.ollamaAvailable ? 'online' : 'offline';
      const modelAvailable = data.modelAvailable ?? false;

      return res.status(200).json({
        status: 'ok',
        overall: data.ollamaAvailable ? 'online' : 'degraded',
        cloudApi,
        tunnel: {
          status: 'online' as LinkStatus,
          latencyMs: bridgeLatency,
          message: `Tunnel reachable at ${new URL(BRIDGE_URL).hostname}`,
          lastChecked: now,
        },
        bridge: {
          status: 'online' as LinkStatus,
          latencyMs: bridgeLatency,
          message: `Bridge v${data.version || 'unknown'} responding`,
          lastChecked: now,
        },
        ollama: {
          status: ollamaStatus,
          message: data.ollamaAvailable ? 'Ollama reachable at 127.0.0.1:11434' : 'Ollama not reachable from bridge',
          lastChecked: now,
        },
        model: {
          status: modelAvailable ? 'online' as LinkStatus : 'offline' as LinkStatus,
          name: data.model || 'qwen3:4b',
          message: modelAvailable ? 'Model loaded and ready' : 'Model not found in Ollama',
          lastChecked: now,
        },
        bridgeVersion: data.version,
        timestamp: now,
      });
    } else {
      return res.status(200).json({
        status: 'degraded',
        overall: 'error',
        cloudApi,
        tunnel: {
          status: 'online' as LinkStatus,
          latencyMs: Date.now() - bridgeStart,
          message: 'Tunnel reachable but bridge returned error',
          lastChecked: now,
        },
        bridge: {
          status: 'error' as LinkStatus,
          message: `Bridge returned HTTP ${response.status}`,
          lastChecked: now,
        },
        ollama: {
          status: 'unknown' as LinkStatus,
          message: 'Cannot determine: bridge error',
          lastChecked: now,
        },
        model: {
          status: 'unknown' as LinkStatus,
          name: 'qwen3:4b',
          message: 'Cannot determine: bridge error',
          lastChecked: now,
        },
        timestamp: now,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const bridgeLatency = Date.now() - bridgeStart;

    // Distinguir entre túnel caído y bridge caído
    let tunnelStatus: LinkStatus = 'error';
    let tunnelMessage = 'Tunnel unreachable';

    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      tunnelStatus = 'error';
      tunnelMessage = 'Tunnel timeout (10s) - tunnel may be down or bridge not responding';
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch')) {
      tunnelStatus = 'offline';
      tunnelMessage = 'Tunnel URL not reachable - cloudflared may not be running';
    }

    return res.status(200).json({
      status: 'error',
      overall: 'offline',
      cloudApi,
      tunnel: {
        status: tunnelStatus,
        latencyMs: bridgeLatency,
        message: tunnelMessage,
        lastChecked: now,
      },
      bridge: {
        status: 'offline' as LinkStatus,
        message: 'Bridge unreachable through tunnel',
        lastChecked: now,
      },
      ollama: {
        status: 'unknown' as LinkStatus,
        message: 'Cannot determine: tunnel/bridge down',
        lastChecked: now,
      },
      model: {
        status: 'unknown' as LinkStatus,
        name: 'qwen3:4b',
        message: 'Cannot determine: tunnel/bridge down',
        lastChecked: now,
      },
      error: errorMessage,
      timestamp: now,
    });
  }
}
