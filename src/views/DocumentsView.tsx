import { type Document } from '../types';
import { Upload, Trash2, FileText, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface DocumentsViewProps {
  documents: Document[];
  onAddDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteDocument: (id: string) => void;
  activeWorkspaceId: string;
}

export function DocumentsView({ documents, onAddDocument, onDeleteDocument, activeWorkspaceId }: DocumentsViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      onAddDocument({
        name: file.name,
        type: file.type || 'unknown',
        size: file.size,
        workspaceId: activeWorkspaceId,
      });
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona documentos para análisis y trabajo con IA</p>
        </div>

        {/* Upload area */}
        <div
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-300 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p className="text-gray-500 text-xs mb-4">PDF, DOCX, TXT, Markdown (preparado para RAG futuro)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            Seleccionar archivos
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <strong>Arquitectura RAG preparada:</strong> La infraestructura para procesamiento documental (embeddings, chunking, retrieval) está diseñada pero aún no implementada en esta versión. Los documentos se registran como referencia para futuras funcionalidades.
          </div>
        </div>

        {/* Documents list */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No hay documentos en este workspace</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-400" />
                  <div>
                    <p className="text-sm text-white font-medium">{doc.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(doc.size)} • {doc.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
