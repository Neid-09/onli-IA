import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, FileText, Calendar, User, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { pqrsService } from '../services/pqrsService';
import type { PQRS } from '../types/database.types';

interface Props {
  id: string;
  onNavigate: (path: string) => void;
}

export default function DetalleConsultaPage({ id, onNavigate }: Props) {
  const [item, setItem] = useState<PQRS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const fetchDetalle = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await pqrsService.getById(id);
        if (found) {
          setItem(found);
        } else {
          setError('No se encontró el trámite con el radicado proporcionado.');
        }
        setLoading(false);
      } catch (e) {
        setError('Ocurrió un error al cargar la información del trámite.');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDetalle();
    }
  }, [id]);

  const copiarEnlace = () => {
    const url = `${window.location.origin}/consultas/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }).catch(() => {
      alert("No se pudo copiar el enlace");
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse"></div>
        </div>
        <p className="mt-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Recuperando expediente</p>
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-10 text-center max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{error || 'Expediente no encontrado'}</h2>
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all hover:shadow-lg"
            onClick={() => onNavigate('/consultas')}
          >
            <ArrowLeft size={18} />
            Volver a Consultas
          </button>
        </div>
      </div>
    );
  }

  const isResolved = item.estado === 'Resuelto';
  const statusColor = isResolved ? 'text-emerald-700' : 'text-amber-700';
  const statusBg = isResolved ? 'bg-emerald-50' : 'bg-amber-50';
  const statusBorder = isResolved ? 'border-emerald-200' : 'border-amber-200';

  return (
    <div className="relative min-h-[70vh] py-6 flex flex-col items-center animate-in fade-in duration-700">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-indigo-50/80 rounded-full blur-3xl -z-10" />

      {/* Main Dossier Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden relative">
        
        {/* Top color bar */}
        <div className={`absolute top-0 left-0 w-full h-2 ${isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`} />

        {/* Header Section */}
        <div className="px-6 sm:px-12 pt-12 pb-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600">
                  <FileText size={20} />
                </span>
                <span className="text-xs sm:text-sm font-bold tracking-widest text-slate-400 uppercase">Expediente Oficial</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter font-mono">
                {item.id}
              </h1>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusBg} ${statusBorder} ${statusColor}`}>
                {isResolved ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                <span className="font-bold tracking-wide uppercase text-sm">{item.estado}</span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Radicado el {new Date(item.fechaRadicacion).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Body Section */}
        <div className="px-6 sm:px-12 py-10 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Metadata */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={14} /> Solicitante
                </h3>
                <p className="text-xl font-semibold text-slate-900">{item.solicitante}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={14} /> Categoría
                </h3>
                <span className="inline-flex px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg border border-indigo-100">
                  {item.categoria}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Plazo Legal
                </h3>
                <p className="text-slate-700 font-medium text-lg">{new Date(item.plazoLegal).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare size={14} /> Descripción del Caso
                </h3>
                <div className="relative">
                  <div className="absolute -left-5 -top-3 text-slate-200 text-6xl font-serif">"</div>
                  <p className="text-slate-700 text-lg leading-relaxed relative z-10 pl-2">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Section */}
        {item.respuestaOficial && (
          <div className="px-6 sm:px-12 py-10 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 text-slate-800 opacity-50">
              <ShieldCheck size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Check size={16} /> Resolución Oficial
              </h3>
              <p className="text-xl text-slate-200 leading-relaxed font-light">
                {item.respuestaOficial}
              </p>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="px-6 sm:px-12 py-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button 
            onClick={() => onNavigate('/consultas')}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors w-full sm:w-auto justify-center"
          >
            <span className="p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <ArrowLeft size={16} />
            </span>
            Volver al listado
          </button>
          
          <button 
            onClick={copiarEnlace}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all w-full sm:w-auto ${
              copiado 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5'
            }`}
          >
            {copiado ? <Check size={18} /> : <Copy size={18} />}
            {copiado ? 'Enlace Copiado' : 'Copiar Enlace'}
          </button>
        </div>

      </div>
    </div>
  );
}
