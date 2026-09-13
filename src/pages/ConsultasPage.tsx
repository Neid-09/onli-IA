import { useState, useEffect } from 'react';
import { Search, AlertCircle, Info, ArrowRight, ShieldCheck, Clock, Shield, LogIn } from 'lucide-react';
import { pqrsService } from '../services/pqrsService';
import type { PQRS } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/auth/LoginModal';

export default function ConsultasPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<PQRS[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Si es ciudadano, solo consulta los trámites que le pertenecen
      const userIdFilter = (profile?.role === 'ciudadano' && user?.id) ? user.id : undefined;
      const result = await pqrsService.getAll(userIdFilter);
      setData(result);
      setLoading(false);
    } catch (err: any) {
      setError('Hubo un problema al cargar los trámites. Por favor, revisa tu conexión o intenta de nuevo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [user?.id, profile?.role, authLoading]);

  const filteredData = data.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchLower) ||
      item.solicitante.toLowerCase().includes(searchLower) ||
      item.descripcion.toLowerCase().includes(searchLower) ||
      item.categoria.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="relative min-h-screen pb-20 animate-in fade-in duration-700">
      {/* Ambient background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-indigo-50/80 to-transparent -z-10" />

      <div className="max-w-6xl mx-auto pt-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {user && profile?.role === 'ciudadano' ? (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 mb-4">
                <Shield size={13} />
                <span>Bandeja Personal de Ciudadano</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Mis Peticiones & Resoluciones
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed">
                Expedientes radicados por <strong className="font-semibold text-slate-800">{profile.fullName}</strong>. Las respuestas oficiales aquí mostradas son de carácter privado y exclusivo para usted.
              </p>
            </>
          ) : user && (profile?.role === 'funcionario' || profile?.role === 'administrador') ? (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 mb-4">
                <ShieldCheck size={13} />
                <span>Vista Oficial de Despacho</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Consulta General de Expedientes
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed">
                Supervisión administrativa y seguimiento de expedientes radicados por los ciudadanos.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Consulta de Trámites
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed">
                Consulte el estado general de su expediente con el número de radicado. Para ver el contenido íntegro y su respuesta oficial, identifíquese con su cuenta ciudadana.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Iniciar Sesión para ver Mis Respuestas</span>
                </button>
              </div>
            </>
          )}
          
          {/* Search Bar */}
          <div className="relative mt-10 max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="pl-6 text-indigo-500">
                <Search size={24} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                placeholder="Ej. PQR-2026-001 o nombre del solicitante..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-6 py-5 bg-transparent text-slate-900 text-lg placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        <div className="w-full">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse"></div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sincronizando expedientes...</h2>
              <p className="text-slate-500">Conectando de forma segura con el servidor central.</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-sm max-w-2xl mx-auto">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Fallo de Conexión</h2>
              <p className="text-slate-600 mb-8 max-w-md text-lg">{error}</p>
              <button 
                onClick={fetchData}
                className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Reintentar Conexión
              </button>
            </div>
          )}

          {!loading && !error && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-sm max-w-2xl mx-auto">
              <Info size={48} className="text-indigo-300 mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No se encontraron expedientes</h2>
              <p className="text-slate-600 text-lg">Verifique el número de radicado o intente con otros términos de búsqueda.</p>
            </div>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((item) => {
                const isResolved = item.estado === 'Resuelto';
                return (
                  <div 
                    key={item.id} 
                    onClick={() => onNavigate(`/consultas/${item.id}`)}
                    className="group relative bg-white rounded-2xl p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${isResolved ? 'bg-emerald-400 group-hover:bg-emerald-500' : 'bg-amber-400 group-hover:bg-amber-500'}`} />

                    <div className="flex justify-between items-start mb-5 mt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono tracking-wide">
                        {item.id}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isResolved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isResolved ? <ShieldCheck size={14} /> : <Clock size={14} />}
                        {item.estado}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                      {item.categoria}
                    </h3>
                    
                    <p className="text-slate-600 text-sm mb-8 line-clamp-3 flex-1 font-light leading-relaxed">
                      {item.descripcion}
                    </p>
                    
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Radicado</span>
                        <span className="text-slate-800 font-medium text-sm">{new Date(item.fechaRadicacion).toLocaleDateString()}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
