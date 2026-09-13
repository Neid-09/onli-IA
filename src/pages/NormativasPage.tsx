import { useState, useEffect } from 'react';
import { Search, BookOpen, Scale, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { normativasService, type Normativa } from '../services/normativasService';
import { aiService } from '../services/ai/aiService';

export default function NormativasPage() {
  const [normativas, setNormativas] = useState<Normativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Estado para explicación con IA de una norma
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});

  const fetchNormas = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const results = await normativasService.search(query);
      setNormativas(results);
    } catch (err: any) {
      setError('Hubo un problema al consultar el marco normativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNormas();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNormas(searchQuery);
  };

  const explainWithAI = async (norma: Normativa) => {
    if (explanations[norma.id]) return;

    setExplainingId(norma.id);
    try {
      const prompt = `Explica en 2 párrafos cortos y en lenguaje muy sencillo, cotidiano y práctico para un ciudadano común, qué significa la siguiente norma legal y cómo lo protege o beneficia en sus trámites:
Norma: ${norma.titulo} (${norma.fuente_legal} - ${norma.articulo})
Contenido: ${norma.contenido}`;

      const explanation = await aiService.askAssistant(prompt);
      setExplanations(prev => ({ ...prev, [norma.id]: explanation }));
    } catch (err) {
      console.error('Error al generar explicación:', err);
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto pt-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100 mb-2">
            <Scale size={14} />
            <span>Marco Legal y Transparencia</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Buscador Semántico de <span className="text-blue-600">Normativa y Políticas</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Consulte leyes, decretos y políticas públicas en lenguaje natural. Pregunte sobre plazos, deberes y garantías ciudadanas.
          </p>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="relative mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <div className="pl-6 text-blue-600">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej. ¿Cuánto tiempo tienen para responder una queja de basuras?"
                className="w-full pl-4 pr-32 py-4 bg-transparent text-slate-800 text-base placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
              >
                Buscar
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Consultas frecuentes:</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('término resolver peticiones 15 días'); fetchNormas('término resolver peticiones 15 días'); }}
                className="hover:text-blue-600 underline"
              >
                Plazos de respuesta
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('corte de agua imprevisto'); fetchNormas('corte de agua imprevisto'); }}
                className="hover:text-blue-600 underline"
              >
                Corte de agua
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('silencio administrativo'); fetchNormas('silencio administrativo'); }}
                className="hover:text-blue-600 underline"
              >
                Silencio administrativo
              </button>
            </div>
          </form>
        </div>

        {/* Contenido */}
        <div className="w-full">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-bold text-slate-500">Buscando en la base de datos de normativas...</p>
            </div>
          )}

          {!loading && error && (
            <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
              <AlertCircle size={36} className="text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-900">Error al cargar normativas</h3>
              <p className="text-sm text-slate-600">{error}</p>
              <button
                onClick={() => fetchNormas()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && normativas.length === 0 && (
            <div className="max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
              <BookOpen size={40} className="text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-lg">No se encontraron artículos</h3>
              <p className="text-sm text-slate-500">
                Intente con otros términos de búsqueda como "agua", "aseo", "plazos" o "silencio".
              </p>
              <button
                onClick={() => { setSearchQuery(''); fetchNormas(''); }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Ver todas las normativas
              </button>
            </div>
          )}

          {!loading && !error && normativas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {normativas.map((norma) => (
                <div
                  key={norma.id}
                  className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                        {norma.categoria}
                      </span>
                      {norma.articulo && (
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                          {norma.articulo}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {norma.titulo}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed font-light">
                      {norma.contenido}
                    </p>

                    {/* Explicación generada por IA */}
                    {explanations[norma.id] && (
                      <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl animate-in fade-in duration-300">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1.5">
                          <Sparkles size={14} />
                          <span>Explicación Ciudadana (IA Gemini):</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {explanations[norma.id]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Fuente Oficial
                      </span>
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                        {norma.fuente_legal}
                      </span>
                    </div>

                    {!explanations[norma.id] && (
                      <button
                        onClick={() => explainWithAI(norma)}
                        disabled={explainingId === norma.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {explainingId === norma.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Traduciendo...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Explicar con IA</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
