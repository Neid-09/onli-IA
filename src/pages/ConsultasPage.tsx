import { useState, useEffect } from 'react';
import './ConsultasPage.css';

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

export default function ConsultasPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [data, setData] = useState<PQRS[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pqrs');
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor.');
      }
      const result = await response.json();
      // Retardo de 800ms para visualizar la microanimación de carga (spinner)
      setTimeout(() => {
        setData(result);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      setError('Hubo un problema al cargar los trámites. Por favor, revisa tu conexión o intenta de nuevo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    <div className="consultas-container">
      <div className="consultas-header">
        <h1>Consulta de Trámites</h1>
        <p>Realiza seguimiento a tus peticiones, quejas, reclamos y sugerencias de manera transparente.</p>
        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Buscar por ID, solicitante, descripción o categoría..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="consultas-content">
        {loading && (
          <div className="state-container loading-state">
            <div className="spinner"></div>
            <h2>Cargando información...</h2>
            <p>Conectando con el servidor para obtener los trámites recientes.</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-container error-state">
            <div className="error-icon">⚠️</div>
            <h2>Fallo de Conexión</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchData}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="state-container empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No se encontraron trámites</h2>
            <p>Intenta ajustar tu búsqueda para ver otros resultados.</p>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <div className="pqrs-grid">
            {filteredData.map((item) => (
              <div 
                key={item.id} 
                className="pqrs-card" 
                onClick={() => onNavigate(`/consultas/${item.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <span className="pqrs-id">{item.id}</span>
                  <span className={`status-badge ${item.estado === 'Resuelto' ? 'status-resolved' : 'status-pending'}`}>
                    {item.estado}
                  </span>
                </div>
                <div className="card-body">
                  <h3 className="category">{item.categoria}</h3>
                  <p className="description">{item.descripcion}</p>
                  <div className="details">
                    <p><strong>Solicitante:</strong> <span>{item.solicitante}</span></p>
                    <p><strong>Radicado:</strong> <span>{new Date(item.fechaRadicacion).toLocaleDateString()}</span></p>
                    <p><strong>Plazo Legal:</strong> <span>{new Date(item.plazoLegal).toLocaleDateString()}</span></p>
                  </div>
                  {item.respuestaOficial && (
                    <div style={{ marginTop: '16px', background: 'rgba(5, 150, 105, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}><strong>Respuesta Oficial:</strong> {item.respuestaOficial}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
