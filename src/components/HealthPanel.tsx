import { type HealthResponse, type LinkDiagnostic, type BridgeStatus } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Clock, Zap, Wifi, WifiOff, Server, Cpu, Cloud } from 'lucide-react';
import { useState } from 'react';

interface HealthPanelProps {
  health: HealthResponse | null;
  isChecking: boolean;
}

export function HealthPanel({ health, isChecking }: HealthPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!health) {
    return (
      <div className="gw-surface p-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-sm text-[var(--gw-text-muted)]">Verificando estado del sistema...</span>
        </div>
      </div>
    );
  }

  const overallStatus = health.overall;
  const isOnline = overallStatus === 'online';

  const links = [
    { key: 'cloudApi', label: 'Cloud API', icon: Cloud, data: health.cloudApi },
    { key: 'tunnel', label: 'Túnel HTTPS', icon: Wifi, data: health.tunnel },
    { key: 'bridge', label: 'Local Bridge', icon: Server, data: health.bridge },
    { key: 'ollama', label: 'Ollama', icon: Cpu, data: health.ollama },
    { key: 'model', label: 'Modelo', icon: Zap, data: health.model },
  ];

  const getStatusColor = (status: BridgeStatus) => {
    switch (status) {
      case 'online': return 'var(--gw-success)';
      case 'offline': return 'var(--gw-error)';
      case 'degraded': return 'var(--gw-warning)';
      case 'error': return 'var(--gw-error)';
      case 'not_configured': return 'var(--gw-text-dim)';
      default: return 'var(--gw-text-muted)';
    }
  };

  const getStatusIcon = (status: BridgeStatus) => {
    switch (status) {
      case 'online': return <CheckCircle2 size={16} style={{ color: 'var(--gw-success)' }} />;
      case 'offline': return <XCircle size={16} style={{ color: 'var(--gw-error)' }} />;
      case 'degraded': return <AlertCircle size={16} style={{ color: 'var(--gw-warning)' }} />;
      case 'error': return <XCircle size={16} style={{ color: 'var(--gw-error)' }} />;
      case 'not_configured': return <WifiOff size={16} style={{ color: 'var(--gw-text-dim)' }} />;
      default: return <Clock size={16} style={{ color: 'var(--gw-text-muted)' }} />;
    }
  };

  return (
    <div className="gw-surface overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--gw-bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${isChecking ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: getStatusColor(overallStatus),
              boxShadow: isOnline ? `0 0 12px ${getStatusColor(overallStatus)}` : 'none',
            }}
          />
          <div className="text-left">
            <div className="text-sm font-semibold text-[var(--gw-text-primary)]">
              {isOnline ? 'GATEWA LOCAL ONLINE' : 'GATEWA LOCAL OFFLINE'}
            </div>
            <div className="text-xs text-[var(--gw-text-muted)]">
              {isOnline
                ? 'Todos los sistemas operativos'
                : `${links.filter(l => l.data.status !== 'online').length} enlace(s) con problema`
              }
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-[var(--gw-text-muted)]" />
        ) : (
          <ChevronDown size={20} className="text-[var(--gw-text-muted)]" />
        )}
      </button>

      {/* Expanded diagnostic */}
      {expanded && (
        <div className="border-t border-[var(--gw-border-subtle)] p-4 space-y-3 gw-animate-fade-in">
          {links.map(({ key, label, icon: Icon, data }) => (
            <div key={key} className="flex items-start gap-3">
              <div className="mt-0.5">
                <Icon size={14} style={{ color: getStatusColor(data.status) }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--gw-text-primary)]">{label}</span>
                  <div className="flex items-center gap-2">
                    {data.latencyMs !== undefined && (
                      <span className="text-xs text-[var(--gw-text-dim)] font-mono">
                        {data.latencyMs}ms
                      </span>
                    )}
                    {getStatusIcon(data.status)}
                  </div>
                </div>
                {data.message && (
                  <p className="text-xs text-[var(--gw-text-muted)] mt-0.5 truncate">
                    {data.message}
                  </p>
                )}
                {data.lastChecked && (
                  <p className="text-xs text-[var(--gw-text-dim)] mt-0.5">
                    Última comprobación: {new Date(data.lastChecked).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Error detail */}
          {health.error && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--gw-error-dim)] border border-[var(--gw-error)]/20">
              <p className="text-xs text-[var(--gw-error)] font-mono break-all">
                {health.error}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-2 border-t border-[var(--gw-border-subtle)]">
            <p className="text-xs text-[var(--gw-text-dim)] text-center">
              Diagnóstico completo · {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
