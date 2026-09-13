import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  FileCheck2, 
  Inbox, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  Building2, 
  Lock 
} from 'lucide-react';
import { pqrsService } from '../services/pqrsService';
import type { PQRS } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import ResolucionModal from '../components/funcionario/ResolucionModal';

interface Props {
  onNavigate?: (path: string) => void;
}

export default function FuncionarioPage({ onNavigate }: Props) {
  const { profile, loading: authLoading } = useAuth();
  const [pqrsList, setPqrsList] = useState<PQRS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'en_tramite' | 'con_ia' | 'resueltos'>('en_tramite');
  const [selectedPqr, setSelectedPqr] = useState<PQRS | null>(null);

  const fetchPQRS = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pqrsService.getAll();
      setPqrsList(data);
    } catch (err: any) {
      console.error('Error al cargar trámites:', err);
      setError('No se pudo cargar la bandeja de expedientes. Verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPQRS();
  }, []);

  // Función para calcular días restantes con semáforo
  const calcularSemaforo = (fechaLimiteStr: string, estado: string) => {
    if (estado.toLowerCase() === 'resuelto') {
      return { dias: 0, estado: 'resuelto', label: 'Cerrado Formalmente', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimiteStr);
    limite.setHours(0, 0, 0, 0);

    const diffTime = limite.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { 
        dias: diffDias, 
        estado: 'vencido', 
        label: `Vencido (${Math.abs(diffDias)}d)`, 
        color: 'bg-red-100 text-red-800 border-red-300' 
      };
    } else if (diffDias <= 3) {
      return { 
        dias: diffDias, 
        estado: 'urgente', 
        label: `Urgente (${diffDias}d restantes)`, 
        color: 'bg-amber-100 text-amber-800 border-amber-300' 
      };
    } else {
      return { 
        dias: diffDias, 
        estado: 'en_tiempo', 
        label: `${diffDias} días restantes`, 
        color: 'bg-blue-100 text-blue-800 border-blue-300' 
      };
    }
  };

  // Filtrado de expedientes
  const filteredList = useMemo(() => {
    return pqrsList.filter((item) => {
      const search = searchQuery.toLowerCase();
      const matchSearch = 
        item.id.toLowerCase().includes(search) ||
        item.solicitante.toLowerCase().includes(search) ||
        item.descripcion.toLowerCase().includes(search) ||
        item.categoria.toLowerCase().includes(search);

      if (!matchSearch) return false;

      if (statusFilter === 'en_tramite') {
        return item.estado.toLowerCase() !== 'resuelto';
      }
      if (statusFilter === 'con_ia') {
        return Boolean(item.respuestaBorradorIa) && item.estado.toLowerCase() !== 'resuelto';
      }
      if (statusFilter === 'resueltos') {
        return item.estado.toLowerCase() === 'resuelto';
      }
      return true;
    });
  }, [pqrsList, searchQuery, statusFilter]);

  // Contadores para métricas de gestión
  const metrics = useMemo(() => {
    const total = pqrsList.length;
    const enTramite = pqrsList.filter(p => p.estado.toLowerCase() !== 'resuelto').length;
    const conBorradorIA = pqrsList.filter(p => Boolean(p.respuestaBorradorIa) && p.estado.toLowerCase() !== 'resuelto').length;
    const resueltos = pqrsList.filter(p => p.estado.toLowerCase() === 'resuelto').length;
    
    let urgentesOVencidos = 0;
    pqrsList.forEach(p => {
      if (p.estado.toLowerCase() !== 'resuelto') {
        const sem = calcularSemaforo(p.plazoLegal, p.estado);
        if (sem.estado === 'vencido' || sem.estado === 'urgente') {
          urgentesOVencidos++;
        }
      }
    });

    return { total, enTramite, conBorradorIA, resueltos, urgentesOVencidos };
  }, [pqrsList]);

  // Verificación de acceso por rol
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Validando credenciales de funcionario...</p>
      </div>
    );
  }

  const isAuthorized = profile && (profile.role === 'funcionario' || profile.role === 'administrador');

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-600 mb-6">
          Esta bandeja de despacho y resolución está reservada exclusivamente para funcionarios públicos y administradores del sistema.
        </p>
        <button
          onClick={() => onNavigate?.('/')}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header Institucional */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Building2 size={16} />
              <span>Despacho Jurídico & Administrativo</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              Bandeja de Funcionario
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-400/30 font-bold">
                Human-in-the-Loop
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl font-light leading-relaxed">
              La Inteligencia Artificial pre-analiza las peticiones ciudadanas y redacta borradores normativos. Su función es revisar, ajustar y dar el <strong className="text-emerald-300 font-medium">visto bueno oficial</strong> con firma de despacho.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              {profile.fullName?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Funcionario Activo</p>
              <p className="text-sm font-bold text-white truncate max-w-[170px]">{profile.fullName}</p>
              <p className="text-xs text-slate-300 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de Despacho */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">En Trámite</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.enTramite}</div>
          <p className="text-xs text-slate-500 mt-1">Expedientes pendientes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgentes / Plazo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{metrics.urgentesOVencidos}</div>
          <p className="text-xs text-slate-500 mt-1">Vencidos o ≤ 3 días</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Con Asistencia IA</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600">{metrics.conBorradorIA}</div>
          <p className="text-xs text-slate-500 mt-1">Borrador pre-redactado</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resueltos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{metrics.resueltos}</div>
          <p className="text-xs text-slate-500 mt-1">Visto bueno otorgado</p>
        </div>
      </div>

      {/* Barra de Herramientas y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('en_tramite')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'en_tramite'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({metrics.enTramite})
          </button>
          <button
            onClick={() => setStatusFilter('con_ia')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'con_ia'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Sparkles size={13} className="text-purple-600" />
            <span>Con Borrador IA ({metrics.conBorradorIA})</span>
          </button>
          <button
            onClick={() => setStatusFilter('resueltos')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'resueltos'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Resueltos ({metrics.resueltos})
          </button>
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({metrics.total})
          </button>
        </div>

        {/* Buscador y Refrescar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar radicado, ciudadano..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={fetchPQRS}
            disabled={loading}
            title="Refrescar expedientes"
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Lista de Expedientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-600 text-sm font-medium">Cargando expedientes oficiales...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center">
          <AlertCircle size={36} className="text-red-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-900 mb-1">Error al conectar con la base de datos</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchPQRS}
            className="px-5 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200 text-center p-6">
          <Inbox size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron expedientes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No hay trámites que coincidan con el filtro actual o la búsqueda ingresada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((pqr) => {
            const semaforo = calcularSemaforo(pqr.plazoLegal, pqr.estado);
            const tieneBorrador = Boolean(pqr.respuestaBorradorIa);
            const estaResuelto = pqr.estado.toLowerCase() === 'resuelto';

            return (
              <div
                key={pqr.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Información Principal del Trámite */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md tracking-wider border border-slate-200">
                      {pqr.id}
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                      <Tag size={11} />
                      {pqr.categoria}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${semaforo.color}`}>
                      <Clock size={11} />
                      {semaforo.label}
                    </span>
                    {tieneBorrador && !estaResuelto && (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 flex items-center gap-1">
                        <Sparkles size={11} />
                        Borrador IA Listo
                      </span>
                    )}
                    {estaResuelto && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Visto Bueno Otorgado
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Ciudadano: {pqr.solicitante}</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {pqr.descripcion}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Radicado: {new Date(pqr.fechaRadicacion).toLocaleDateString('es-CO')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Límite legal: {new Date(pqr.plazoLegal).toLocaleDateString('es-CO')}
                    </span>
                    {pqr.funcionarioResponsable && (
                      <span className="text-slate-500 font-medium">
                        Resuelto por: <strong className="text-slate-700">{pqr.funcionarioResponsable}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones del Expediente */}
                <div className="flex items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  {estaResuelto ? (
                    <button
                      onClick={() => setSelectedPqr(pqr)}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Eye size={15} />
                      <span>Ver Expediente Resuelto</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedPqr(pqr)}
                      className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer ${
                        tieneBorrador
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {tieneBorrador ? (
                        <>
                          <Sparkles size={15} />
                          <span>Revisar y Dar Visto Bueno</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 size={15} />
                          <span>Atender con Asistente IA</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Resolución con IA (Human-in-the-Loop) */}
      <ResolucionModal
        pqrs={selectedPqr}
        isOpen={Boolean(selectedPqr)}
        onClose={() => setSelectedPqr(null)}
        onResolved={() => {
          setSelectedPqr(null);
          fetchPQRS();
        }}
      />
    </div>
  );
}
