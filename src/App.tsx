import { useState, useEffect } from 'react'
import TarjetaTramite from './components/TarjetaTramite'
import ConsultasPage from './pages/ConsultasPage'
import DetalleConsultaPage from './pages/DetalleConsultaPage'
import ChatInterface from './components/chat/ChatInterface'
import UserNav from './components/auth/UserNav'
import { AuthProvider } from './context/AuthContext'
import RadicacionForm from './components/tramites/RadicacionForm'
import NormativasPage from './pages/NormativasPage'
import { Sparkles, FilePlus2, LayoutGrid, Scale } from 'lucide-react'

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [homeTab, setHomeTab] = useState<'radicar' | 'servicios'>('radicar');

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const isConsultas = currentPath === '/consultas';
  const isNormativas = currentPath === '/normativas';
  const isDetalle = currentPath.startsWith('/consultas/') && currentPath.length > '/consultas/'.length;
  const detalleId = isDetalle ? currentPath.split('/')[2] : null;
  const isInicio = !isConsultas && !isDetalle && !isNormativas;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 bg-white/95 supports-backdrop-blur:bg-white/60">
        <div className="max-w-7xl mx-auto">
          <div className="py-4 border-b border-slate-900/10 lg:px-8 lg:border-0 flex items-center justify-between px-4 sm:px-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('/')} 
              title="Ir al inicio"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
                M
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Gobierno Local</h2>
                <p className="text-sm text-slate-500 leading-tight">Atención y Reportes</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <button 
                  onClick={() => navigate('/')} 
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${isInicio ? 'text-blue-600' : 'text-slate-600'}`}
                >
                  Inicio
                </button>
                <button 
                  onClick={() => navigate('/consultas')} 
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${isConsultas ? 'text-blue-600' : 'text-slate-600'}`}
                >
                  Consultar Trámites
                </button>
                <button 
                  onClick={() => navigate('/normativas')} 
                  className={`text-sm font-medium transition-colors hover:text-blue-600 flex items-center gap-1.5 ${isNormativas ? 'text-blue-600' : 'text-slate-600'}`}
                >
                  <Scale size={15} />
                  <span>Normativa & Leyes</span>
                </button>
              </nav>
              <div className="pl-4 border-l border-slate-200">
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isInicio && (
          <main className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="text-center py-16 space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Atención y Servicios al <span className="text-blue-600">Ciudadano</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Consulte información oficial, acceda a los canales de atención y radique peticiones o reportes ciudadanos directamente en línea.
              </p>

              {/* Selector de Pestañas Home */}
              <div className="flex justify-center pt-4">
                <div className="inline-flex p-1.5 bg-slate-200/80 rounded-2xl shadow-inner gap-1">
                  <button
                    onClick={() => setHomeTab('radicar')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      homeTab === 'radicar'
                        ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FilePlus2 size={18} />
                    <span>Radicar Petición Escrita</span>
                  </button>
                  <button
                    onClick={() => setHomeTab('servicios')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      homeTab === 'servicios'
                        ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={18} />
                    <span>Servicios Destacados</span>
                  </button>
                </div>
              </div>
            </section>

            {homeTab === 'radicar' ? (
              <section className="animate-in fade-in duration-300">
                <RadicacionForm onSuccess={(id) => navigate(`/consultas/${id}`)} />
              </section>
            ) : (
              <section id="respuestas" className="space-y-8 animate-in fade-in duration-300" aria-labelledby="respuestas-title">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <h2 id="respuestas-title" className="text-3xl font-bold text-slate-900">Servicios Destacados</h2>
                  <p className="text-slate-600 text-lg">
                    Seleccione un área para consultar información oficial del servicio.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <TarjetaTramite
                    titulo="Agua y Alcantarillado"
                    descripcion="Reporte fugas, cortes, y problemas de alcantarillado en su sector."
                    categoria="Servicios Básicos"
                  />
                  <TarjetaTramite
                    titulo="Recolección de Basura"
                    descripcion="Consulte horarios, y reporte acumulación o puntos críticos."
                    categoria="Limpieza"
                  />
                  <TarjetaTramite
                    titulo="Alumbrado Público"
                    descripcion="Reporte luminarias apagadas, parpadeantes o postes caídos."
                    categoria="Infraestructura"
                  />
                </div>
              </section>
            )}
          </main>
        )}

        {isConsultas && <ConsultasPage onNavigate={navigate} />}
        {isNormativas && <NormativasPage />}
        {isDetalle && detalleId && <DetalleConsultaPage id={detalleId} onNavigate={navigate} />}
      </div>

      <footer className="w-full bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Gobierno Local - Portal de Atención Ciudadana. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Floating Chat Button / Chat Interface */}
      {isChatOpen ? (
        <ChatInterface onClose={() => setIsChatOpen(false)} />
      ) : (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-full shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-1 hover:bg-blue-700 transition-all duration-300"
        >
          <Sparkles size={20} />
          <span className="font-medium">Asistente Virtual</span>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

