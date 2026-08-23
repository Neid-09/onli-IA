import { useState, useEffect } from 'react';
import './DetalleConsultaPage.css';

interface PQRS {
  id: string;
  solicitante: string;
  categoria: string;
  descripcion: string;
  estado: string;
  fechaRadicacion: string;
  plazoLegal: string;
  respuestaOficial: string;
}

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
        const response = await fetch('/api/pqrs');
        if (!response.ok) throw new Error('Error de red');
        const data = await response.json();
        const found = data.find((p: PQRS) => p.id === id);
        
        // Simular tiempo de carga para UX
        setTimeout(() => {
          if (found) {
            setItem(found);
          } else {
            setError('No se encontró el trámite con el radicado proporcionado.');
          }
          setLoading(false);
        }, 500);
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
    // Si estuviéramos usando un enrutador real, copiaríamos la URL actual.
    // Como estamos usando un enfoque basado en estado, construimos la URL manualmente.
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
      <div className="detalle-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="detalle-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="detalle-content" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>{error || 'Trámite no encontrado'}</h2>
          <button className="btn-volver" onClick={() => onNavigate('/consultas')} style={{ margin: '0 auto' }}>
            ← Volver a Consultas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-container">
      <div className="detalle-content">
        <div className="detalle-header">
          <div className="detalle-title-group">
            <h1>{item.id}</h1>
            <span className={`status-badge ${item.estado === 'Resuelto' ? 'status-resolved' : 'status-pending'}`}>
              {item.estado}
            </span>
          </div>
          <div className="detalle-actions">
            <button className="btn-volver" onClick={() => onNavigate('/consultas')} title="Volver a la lista">
              ← Volver
            </button>
            <button className="btn-copiar" onClick={copiarEnlace} title="Copiar enlace directo al trámite">
              {copiado ? '¡Copiado! ✓' : '🔗 Copiar Enlace'}
            </button>
          </div>
        </div>

        <div className="ficha-tecnica">
          <div className="ficha-seccion">
            <span className="ficha-label">Solicitante</span>
            <p className="ficha-valor">{item.solicitante}</p>
          </div>
          <div className="ficha-seccion">
            <span className="ficha-label">Categoría</span>
            <p className="ficha-valor" style={{ color: '#0284c7', fontWeight: 700 }}>{item.categoria}</p>
          </div>
          <div className="ficha-seccion full-width">
            <span className="ficha-label">Descripción del Caso</span>
            <p className="ficha-valor">{item.descripcion}</p>
          </div>
          <div className="ficha-seccion">
            <span className="ficha-label">Fecha de Radicación</span>
            <p className="ficha-valor">{new Date(item.fechaRadicacion).toLocaleDateString()} a las {new Date(item.fechaRadicacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="ficha-seccion">
            <span className="ficha-label">Plazo Legal de Respuesta</span>
            <p className="ficha-valor">{new Date(item.plazoLegal).toLocaleDateString()}</p>
          </div>
        </div>

        {item.respuestaOficial && (
          <div className="respuesta-oficial-box">
            <span className="ficha-label" style={{ color: '#059669' }}>Respuesta Oficial de la Entidad</span>
            <p className="ficha-valor" style={{ marginTop: '10px' }}>{item.respuestaOficial}</p>
          </div>
        )}
      </div>
    </div>
  );
}
