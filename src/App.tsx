import TarjetaTramite from './components/TarjetaTramite'
import './App.css'

function App() {
  return (
    <>
      <header className="portal-header">
        <div className="portal-brand">
          <div className="portal-logo-icon">M</div>
          <div className="portal-title-group">
            <h2 className="portal-main-title">Gobierno Local</h2>
            <p className="portal-subtitle">Atención y Reportes</p>
          </div>
        </div>
        <nav className="portal-nav" aria-label="Navegación principal">
          <a href="#respuestas" className="portal-nav-link">Inicio</a>
          <a href="#tramites" className="portal-nav-link">Trámites y Servicios</a>
          <a href="#contacto" className="portal-nav-link">Contacto</a>
        </nav>
      </header>

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

      <footer className="portal-footer">
        <p>© 2026 Gobierno Local - Portal de Atención Ciudadana. Todos los derechos reservados.</p>
      </footer>
    </>
  )
}

export default App
