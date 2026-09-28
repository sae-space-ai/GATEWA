import { Wrench, AlertCircle } from 'lucide-react';

export function ToolsView() {
  const plannedTools = [
    { name: 'Análisis de código', description: 'Ejecutar y analizar fragmentos de código de forma segura', status: 'planned' },
    { name: 'Generación MIDI', description: 'Crear y editar archivos MIDI con IA', status: 'planned' },
    { name: 'Investigación', description: 'Búsqueda y síntesis de información', status: 'planned' },
    { name: 'Traducción', description: 'Traducción de documentos entre idiomas', status: 'planned' },
    { name: 'Resumen', description: 'Generar resúmenes de textos largos', status: 'planned' },
    { name: 'Extracción de datos', description: 'Extraer información estructurada de documentos', status: 'planned' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Tools</h1>
          <p className="text-gray-400 text-sm mt-1">Herramientas modulares para extender las capacidades de GATEWA</p>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong>Arquitectura modular:</strong> Las herramientas se incorporarán de forma progresiva y autorizada. 
            Ningún modelo puede ejecutar comandos arbitrarios del sistema ni obtener acceso general al ordenador.
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plannedTools.map((tool) => (
            <div key={tool.name} className="p-5 bg-gray-800/50 border border-gray-700 rounded-xl opacity-60">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Wrench size={20} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{tool.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                    Planificado
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{tool.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Principio de seguridad:</strong> Cada herramienta requiere autorización explícita 
            y opera dentro de límites estrictos. La ejecución de código y el acceso a recursos del sistema están completamente 
            controlados y auditados.
          </p>
        </div>
      </div>
    </div>
  );
}
