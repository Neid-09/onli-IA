import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, FileText, User, Calendar, Tag, Loader2, Save, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pqrsService } from '../../services/pqrsService';
import { aiService } from '../../services/ai/aiService';
import type { PQRS } from '../../types/database.types';

interface Props {
  pqrs: PQRS | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (updatedPqrs: PQRS) => void;
}

export default function ResolucionModal({ pqrs, isOpen, onClose, onResolved }: Props) {
  const { profile } = useAuth();
  const [respuesta, setRespuesta] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);

  React.useEffect(() => {
    if (pqrs) {
      setRespuesta(pqrs.respuestaOficial || pqrs.respuestaBorradorIa || '');
      setFundamento(pqrs.fundamentoLegal || '');
      setAiGenerated(Boolean(pqrs.respuestaBorradorIa && !pqrs.respuestaOficial));
      setError(null);
    }
  }, [pqrs]);

  if (!isOpen || !pqrs) return null;

  const handleGenerateAI = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await aiService.generateOfficialResolution(
        pqrs.solicitante,
        pqrs.categoria,
        pqrs.descripcion,
        pqrs.id
      );

      setRespuesta(result.propuesta);
      setFundamento(result.fundamento);
      setAiGenerated(true);

      // Guardar borrador silenciosamente en segundo plano
      await pqrsService.guardarBorradorIA(pqrs.id, result.propuesta, result.fundamento);
    } catch (err: any) {
      setError(err.message || 'Error al generar la propuesta con el copiloto de IA.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!respuesta.trim()) return;
    setSaving(true);
    try {
      await pqrsService.guardarBorradorIA(pqrs.id, respuesta, fundamento);
      alert('Borrador guardado exitosamente.');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el borrador.');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndResolve = async () => {
    if (!respuesta.trim()) {
      setError('Por favor redacta o genera una respuesta oficial antes de dar el visto bueno.');
      return;
    }

    const funcionarioNombre = profile?.fullName || 'Funcionario Responsable';
    const confirmApprove = window.confirm(
      `¿Confirmas dar tu VISTO BUENO y emitir esta resolución oficial para el radicado ${pqrs.id}?\n\nEl expediente pasará a estado "Resuelto" y será visible de inmediato para el ciudadano.`
    );

    if (!confirmApprove) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await pqrsService.resolverPQRS(
        pqrs.id,
        respuesta,
        funcionarioNombre,
        fundamento
      );
      onResolved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al resolver y emitir la respuesta oficial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-mono font-bold text-sm">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-mono tracking-tight">{pqrs.id}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  pqrs.estado === 'Resuelto' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {pqrs.estado}
                </span>
              </div>
              <p className="text-xs text-slate-400">Atención y Resolución Administrativa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tarjeta de Datos del Peticionario */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <User size={13} /> Peticionario
                </span>
                <p className="font-bold text-slate-900 text-sm">{pqrs.solicitante}</p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Tag size={13} /> Categoría
                </span>
                <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                  {pqrs.categoria}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Calendar size={13} /> Plazo Legal
                </span>
                <p className="font-bold text-slate-800 text-sm">{new Date(pqrs.plazoLegal).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Hechos y Solicitud del Ciudadano:
              </span>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                "{pqrs.descripcion}"
              </p>
            </div>
          </div>

          {/* Sección de Delegación a la IA y Visto Bueno */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <span>Resolución Oficial (Human-in-the-Loop)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  La IA pre-redacta la respuesta según la ley. Revisa y aprueba antes de emitir.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generating || saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>IA redactando con base en leyes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{respuesta ? 'Regenerar Propuesta con IA' : 'Delegar a la IA (Redactar Propuesta)'}</span>
                  </>
                )}
              </button>
            </div>

            {aiGenerated && (
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600 shrink-0" />
                  <strong>Propuesta sugerida por Copiloto IA:</strong> Puedes editar directamente el texto abajo.
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-indigo-700 border border-indigo-200">
                  Pendiente Visto Bueno
                </span>
              </div>
            )}

            {/* Editor de Respuesta Oficial */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Texto de la Resolución Oficial (Editable) *
              </label>
              <textarea
                rows={7}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Presiona 'Delegar a la IA' para generar una propuesta formal fundamentada, o escribe directamente la respuesta oficial aquí..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed font-sans"
              />
            </div>

            {/* Fundamento Legal */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Scale size={14} /> Fundamento Jurídico / Artículos Citados
              </label>
              <input
                type="text"
                value={fundamento}
                onChange={(e) => setFundamento(e.target.value)}
                placeholder="Ej. Ley 1437 de 2011, Artículo 14 / Decreto 1077 de 2015"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-xs transition-colors"
          >
            Cerrar sin guardar
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !respuesta.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={handleApproveAndResolve}
              disabled={saving || !respuesta.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Emitiendo Resolución...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Dar Visto Bueno y Emitir Respuesta Oficial</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
