import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileImage, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { aiService } from '../../services/ai/aiService';
import type { ExtractedDocumentData } from '../../services/ai/aiTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: ExtractedDocumentData) => void;
}

export default function DocumentScannerModal({ isOpen, onClose, onExtracted }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }

    // Límite de 8MB
    if (selectedFile.size > 8 * 1024 * 1024) {
      setError('La imagen no debe superar los 8MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!preview || !file) return;

    setLoading(true);
    setError(null);

    try {
      const extracted = await aiService.extractFromDocument(preview, file.type);
      onExtracted(extracted);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el documento con el modelo de OCR.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden relative">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
              {aiService.getProviderName()}
            </span>
          </div>
          <h3 className="text-xl font-black">Digitalización con OCR Multimodal</h3>
          <p className="text-blue-100 text-sm mt-1">
            Sube o toma una foto de tu documento escrito o escaneado para autocompletar tu petición.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!preview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">
                Arrastra aquí tu documento o haz clic para seleccionarlo
              </h4>
              <p className="text-xs text-slate-500">
                Admite fotos de cartas manuscritas, derechos de petición o formatos escaneados (PNG, JPG o WEBP)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-900 flex items-center justify-center">
                <img
                  src={preview}
                  alt="Vista previa del documento"
                  className="max-h-64 w-auto object-contain"
                />
                {loading && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                    <Loader2 size={36} className="animate-spin text-blue-400 mb-3" />
                    <p className="font-bold text-sm">Analizando documento con IA Multimodal...</p>
                    <p className="text-xs text-slate-300 mt-1">Transcribiendo texto y extrayendo datos estructurados</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <FileImage size={14} /> {file?.name} ({(file!.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Cambiar archivo
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcess}
              disabled={!preview || loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Extrayendo...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Procesar con OCR</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
