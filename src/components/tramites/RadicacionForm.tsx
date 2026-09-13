import React, { useState } from 'react';
import { Send, CheckCircle2, Copy, Check, FileText, User, Mail, Tag, AlertCircle, Sparkles, ScanLine } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pqrsService } from '../../services/pqrsService';
import DocumentScannerModal from './DocumentScannerModal';
import type { ExtractedDocumentData } from '../../services/ai/aiTypes';

interface Props {
  onSuccess?: (id: string) => void;
}

export default function RadicacionForm({ onSuccess }: Props) {
  const { profile } = useAuth();
  const [solicitante, setSolicitante] = useState(profile?.fullName || '');
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState(profile?.email || '');
  const [categoria, setCategoria] = useState('Servicios Básicos');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radicadoCreado, setRadicadoCreado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [ocrApplied, setOcrApplied] = useState(false);

  const handleOcrExtracted = (data: ExtractedDocumentData) => {
    if (data.solicitante) setSolicitante(data.solicitante);
    if (data.identificacion) setIdentificacion(data.identificacion);
    if (data.email) setEmail(data.email);
    if (data.categoria) setCategoria(data.categoria);
    if (data.asunto) setAsunto(data.asunto);
    if (data.descripcion) setDescripcion(data.descripcion);
    setOcrApplied(true);
  };

  // Sincronizar automáticamente si el usuario se autentica
  React.useEffect(() => {
    if (profile) {
      if (!solicitante) setSolicitante(profile.fullName || '');
      if (!email) setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!descripcion.trim() || !solicitante.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);

    try {
      // Generar consecutivo de radicado único
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const radicadoId = `PQRS-${new Date().getFullYear()}-${randomSuffix}`;
      
      // Plazo legal de 15 días hábiles (~21 días calendario)
      const fechaRadicacion = new Date();
      const plazoLegal = new Date();
      plazoLegal.setDate(fechaRadicacion.getDate() + 21);

      const nuevoTramite = {
        id: radicadoId,
        solicitante: solicitante.trim(),
        categoria,
        descripcion: asunto ? `[${asunto.trim()}] ${descripcion.trim()}` : descripcion.trim(),
        estado: 'En trámite',
        fechaRadicacion: fechaRadicacion.toISOString(),
        plazoLegal: plazoLegal.toISOString(),
        respuestaOficial: '',
      };

      await pqrsService.create(nuevoTramite);
      setRadicadoCreado(radicadoId);
      if (onSuccess) onSuccess(radicadoId);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al radicar la petición. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const copiarRadicado = () => {
    if (!radicadoCreado) return;
    navigator.clipboard.writeText(radicadoCreado).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const resetForm = () => {
    setRadicadoCreado(null);
    setAsunto('');
    setDescripcion('');
    setIdentificacion('');
  };

  if (radicadoCreado) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-emerald-100 text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-500/10">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">¡Petición Radicada con Éxito!</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          Su documento ha sido ingresado al sistema oficial y ha quedado registrado en la base de datos central.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 max-w-md mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Número de Radicado Oficial
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-black text-slate-900">{radicadoCreado}</span>
            <button
              onClick={copiarRadicado}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-xs"
              title="Copiar radicado"
            >
              {copiado ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Plazo de respuesta legal: 15 días hábiles conforme al Código Contencioso Administrativo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/consultas/${radicadoCreado}`}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            Ver Detalle del Trámite
          </a>
          <button
            onClick={resetForm}
            className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Radicar Otra Petición
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Ventanilla Única de Radicación</h3>
            <p className="text-slate-500 text-sm">Ingrese su derecho de petición, queja, reclamo o solicitud ciudadana</p>
          </div>
        </div>

        {/* Botón Escanear OCR */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer shrink-0"
        >
          <ScanLine size={16} />
          <span>Escanear Documento (OCR IA)</span>
        </button>
      </div>

      {ocrApplied && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-emerald-600 shrink-0" />
            <span>
              <strong>¡Documento escaneado exitosamente!</strong> Los campos han sido autocompletados con el análisis multimodal. Por favor revisa y ajusta los datos antes de radicar.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOcrApplied(false)}
            className="text-xs text-emerald-700 hover:underline font-semibold ml-2"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solicitante */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} /> Nombre Completo *
            </label>
            <input
              type="text"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Ej. Carlos Alberto Pérez"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Cédula o Identificación */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={14} /> Documento de Identidad
            </label>
            <input
              type="text"
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              placeholder="Ej. C.C. 1.020.304.506"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail size={14} /> Correo de Notificación
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="notificaciones@correo.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Categoría de la Solicitud *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="Agua y Alcantarillado">Agua y Alcantarillado</option>
              <option value="Basuras">Recolección de Basuras y Limpieza</option>
              <option value="Alumbrado">Alumbrado Público y Red Eléctrica</option>
              <option value="Vías y Espacio Público">Vías y Espacio Público</option>
              <option value="Seguridad y Convivencia">Seguridad y Convivencia</option>
              <option value="Trámite Administrativo">Trámite Administrativo General</option>
            </select>
          </div>
        </div>

        {/* Asunto */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Asunto o Título de la Petición
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Resumen corto del requerimiento (ej. Fuga de agua en manzana 4)"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Texto de la Petición Escrita */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Contenido Escrito de la Petición (Hechos y Solicitud) *
          </label>
          <textarea
            rows={5}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa con claridad los hechos, dirección o sector afectado y lo que solicita a la administración municipal..."
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Sparkles size={18} className="animate-spin text-blue-200" />
                <span>Radicando y delegando marco normativo con IA...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Radicar Petición Oficial</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Escáner y OCR Multimodal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onExtracted={handleOcrExtracted}
      />
    </div>
  );
}
