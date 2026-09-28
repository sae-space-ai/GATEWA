import { type BridgeStatus } from '../types';
import { Wifi, WifiOff, Shield, Info } from 'lucide-react';

interface SettingsViewProps {
  bridgeStatus: BridgeStatus;
}

export function SettingsView({ bridgeStatus }: SettingsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Configuración de GATEWA</p>
        </div>

        {/* Bridge Status */}
        <div className="mb-6 p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi size={18} /> Estado del Bridge Local
          </h3>
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            bridgeStatus === 'online' ? 'bg-green-900/20 border border-green-700/50' : 'bg-red-900/20 border border-red-700/50'
          }`}>
            {bridgeStatus === 'online' ? (
              <>
                <Wifi size={20} className="text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">LOCAL AI ONLINE</p>
                  <p className="text-xs text-green-300/70">Bridge conectado y Ollama disponible</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff size={20} className="text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">LOCAL AI OFFLINE</p>
                  <p className="text-xs text-red-300/70">Bridge no disponible. Verifica que esté ejecutándose en tu ordenador.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="mb-6 p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} /> Seguridad
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-sm text-gray-300">Autenticación Bridge</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Bearer Token</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-sm text-gray-300">Comunicación Cloud → Bridge</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">HTTPS cifrado</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-sm text-gray-300">Ollama expuesto a Internet</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">No (seguro)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">Secretos en frontend</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Ninguno</span>
            </div>
          </div>
        </div>

        {/* Architecture Info */}
        <div className="mb-6 p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={18} /> Arquitectura
          </h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p><strong className="text-gray-300">GATEWA Cloud:</strong> Frontend + Backend API desplegados en Vercel</p>
            <p><strong className="text-gray-300">GATEWA Local Bridge:</strong> Servicio en tu Windows que conecta con Ollama</p>
            <p><strong className="text-gray-300">Túnel:</strong> Cloudflare Tunnel (HTTPS seguro, sin puertos abiertos)</p>
            <p><strong className="text-gray-300">Motor IA:</strong> Ollama local → qwen3:4b</p>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-5 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Privacidad</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>• Las conversaciones se almacenan localmente en tu navegador (localStorage)</p>
            <p>• El procesamiento de IA ocurre en tu ordenador mediante Ollama</p>
            <p>• El Cloud solo actúa como intermediario seguro (no almacena contenido)</p>
            <p>• Open WebUI funciona independientemente como otro cliente de Ollama</p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          GATEWA v1.0.0 • Centro Privado de Inteligencia Artificial
        </div>
      </div>
    </div>
  );
}
