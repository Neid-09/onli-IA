import { Sparkles, ArrowRight } from 'lucide-react';

interface TarjetaTramiteProps {
  titulo: string;
  descripcion: string;
  categoria: string;
}

export default function TarjetaTramite({ titulo, descripcion, categoria }: TarjetaTramiteProps) {
  return (
    <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-500 flex flex-col h-full overflow-hidden">
      {/* Glow effect in background for AI aesthetic */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:bg-gradient-to-br group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-700" />
      
      <div className="relative mb-5 flex justify-between items-start">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100/80 border border-slate-200/60 backdrop-blur-sm">
          {categoria}
        </span>
        
        {/* Subtle AI indicator */}
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-300 border border-transparent group-hover:border-blue-100 shadow-sm">
          <Sparkles size={14} />
        </div>
      </div>
      
      <h3 className="relative text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
        {titulo}
      </h3>
      
      <p className="relative text-slate-500 flex-1 leading-relaxed text-sm">
        {descripcion}
      </p>
      
      {/* Prompt-like action button */}
      <div className="relative mt-6 pt-4 border-t border-slate-100">
        <button className="w-full flex items-center justify-between bg-slate-50/50 hover:bg-blue-50/80 text-slate-600 hover:text-blue-700 text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-300 border border-slate-200/60 hover:border-blue-200/80 group/btn shadow-sm hover:shadow">
          <span className="flex items-center gap-2">
            Preguntar al asistente
          </span>
          <ArrowRight size={16} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}
