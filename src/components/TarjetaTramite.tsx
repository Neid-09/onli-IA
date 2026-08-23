import React from 'react';

export interface TarjetaTramiteProps {
  titulo: string;
  descripcion: string;
  categoria: string;
}

export const TarjetaTramite: React.FC<TarjetaTramiteProps> = ({
  titulo,
  descripcion,
  categoria,
}) => {
  // Split description by commas to render items as a list if applicable
  const subItems = descripcion
    ? descripcion.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <article className="tramite-card" aria-labelledby={`title-${titulo.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="tramite-card-header">
        <span className="category-badge">{categoria}</span>
      </div>
      
      <h3 
        id={`title-${titulo.replace(/\s+/g, '-').toLowerCase()}`} 
        className="tramite-card-title"
      >
        {titulo}
      </h3>

      <div className="tramite-card-body">
        {subItems.length > 0 ? (
          <ul className="tramite-items-list" role="list">
            {subItems.map((item, index) => (
              <li key={index} className="tramite-item">
                <span className="tramite-item-bullet" aria-hidden="true"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tramite-desc-text">{descripcion}</p>
        )}
      </div>

      <div className="tramite-card-footer">
        <button 
          type="button" 
          className="tramite-action-btn"
          aria-label={`Iniciar trámite para ${titulo}`}
        >
          Iniciar Reporte
        </button>
      </div>
    </article>
  );
};

export default TarjetaTramite;
