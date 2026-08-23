import { useState, useEffect } from 'react'
import TarjetaTramite from './components/TarjetaTramite'
import ConsultasPage from './pages/ConsultasPage'
import DetalleConsultaPage from './pages/DetalleConsultaPage'
import './App.css'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

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
  const isDetalle = currentPath.startsWith('/consultas/') && currentPath.length > '/consultas/'.length;
  const detalleId = isDetalle ? currentPath.split('/')[2] : null;
  const isInicio = !isConsultas && !isDetalle;

  return (
    <>
      <header className="portal-header">
        <div 
          className="portal-brand" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
          title="Ir al inicio"
        >
          <div className="portal-logo-icon">M</div>
          <div className="portal-title-group">
            <h2 className="portal-main-title">Gobierno Local</h2>
            <p className="portal-subtitle">Atención y Reportes</p>
          </div>
        </div>
        <nav className="portal-nav" aria-label="Navegación principal">
          <button 
            onClick={() => navigate('/')} 
            className="portal-nav-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            Inicio
          </button>
          <button 
            onClick={() => navigate('/consultas')} 
            className="portal-nav-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            Consultar Trámites
          </button>
        </nav>
      </header>

      {isInicio && (
        <main>
          <section className="hero-section">
            <h1>Atención y Servicios al Ciudadano</h1>
            <p className="hero-description">
              Consulte información oficial, acceda a los canales de atención y envíe reportes sobre incidencias en la vía pública de manera rápida y segura.
            </p>
          </section>

          <section id="respuestas" className="respuestas-section" aria-labelledby="respuestas-title">
            <div className="section-header">
              <h2 id="respuestas-title" className="respuestas-heading">Respuestas</h2>
              <p className="respuestas-subtext">
                Seleccione un canal de atención para iniciar un reporte o consultar información del servicio.
              </p>
            </div>

            <div className="respuestas-grid">
              <TarjetaTramite
                titulo="Agua y Alcantarillado"
                descripcion="fugas, cortes, alcantarillado"
                categoria="Servicios Básicos"
              />
              <TarjetaTramite
                titulo="Recolección de Basura"
                descripcion="Horarios, acumulación, puntos críticos"
                categoria="Limpieza"
              />
              <TarjetaTramite
                titulo="Alumbrado Público"
                descripcion="lámparas apagadas, postes caídos"
                categoria="Seguridad e Infraestructura"
              />
            </div>
          </section>
        </main>
      )}

      {isConsultas && <ConsultasPage onNavigate={navigate} />}
      
      {isDetalle && detalleId && <DetalleConsultaPage id={detalleId} onNavigate={navigate} />}

      <footer className="portal-footer">
        <p>© 2026 Gobierno Local - Portal de Atención Ciudadana. Todos los derechos reservados.</p>
      </footer>
    </>
  )
}

export default App
