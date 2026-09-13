-- ==========================================================
-- SCRIPT DE BÚSQUEDA SEMÁNTICA: NORMATIVAS Y POLÍTICAS PÚBLICAS
-- Proyecto: diplomado
-- Extensión: vector (pgvector)
-- ==========================================================

-- 1. Habilitar extensión vector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear tabla de normativas y políticas
CREATE TABLE IF NOT EXISTS public.normativas (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  articulo VARCHAR(100),
  contenido TEXT NOT NULL,
  fuente_legal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS de consulta pública
ALTER TABLE public.normativas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de normativas" ON public.normativas;
CREATE POLICY "Lectura pública de normativas"
  ON public.normativas FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- 3. Crear índice de texto completo (Full-Text Search) para soporte híbrido semántico
CREATE INDEX IF NOT EXISTS idx_normativas_fts 
  ON public.normativas 
  USING GIN (to_tsvector('spanish', titulo || ' ' || contenido || ' ' || fuente_legal));

-- 4. Función de búsqueda semántica híbrida (FTS + Contextual)
CREATE OR REPLACE FUNCTION search_normativas(search_query TEXT, max_results INT DEFAULT 10)
RETURNS TABLE (
  id BIGINT,
  titulo TEXT,
  categoria VARCHAR(100),
  articulo VARCHAR(100),
  contenido TEXT,
  fuente_legal TEXT,
  rank REAL
)
LANGUAGE sql
AS $$
  SELECT 
    id,
    titulo,
    categoria,
    articulo,
    contenido,
    fuente_legal,
    ts_rank_cd(to_tsvector('spanish', titulo || ' ' || contenido || ' ' || fuente_legal), plainto_tsquery('spanish', search_query)) as rank
  FROM public.normativas
  WHERE to_tsvector('spanish', titulo || ' ' || contenido || ' ' || fuente_legal) @@ plainto_tsquery('spanish', search_query)
     OR titulo ILIKE '%' || search_query || '%'
     OR contenido ILIKE '%' || search_query || '%'
  ORDER BY rank DESC
  LIMIT max_results;
$$;

-- 5. Poblar con normativas oficiales colombianas de atención ciudadana y servicios públicos
INSERT INTO public.normativas (titulo, categoria, articulo, contenido, fuente_legal)
VALUES
(
  'Término general para resolver peticiones',
  'Derecho de Petición',
  'Artículo 14',
  'Salvo norma legal especial, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción. Las peticiones de documentos e información deberán resolverse dentro de los diez (10) días siguientes. Las consultas deberán resolverse en un plazo máximo de treinta (30) días.',
  'Ley 1437 de 2011 (Sustituido por Ley 1755 de 2015)'
),
(
  'Peticiones verbales y medios electrónicos',
  'Atención al Ciudadano',
  'Artículo 2.2.3.12.1',
  'Las autoridades deberán habilitar canales presenciales, telefónicos y electrónicos para la recepción y trámite de las peticiones en cualquier formato idóneo, dejando constancia de radicación inmediata y fecha legal de respuesta.',
  'Decreto 1166 de 2016'
),
(
  'Calidad y continuidad del servicio de agua potable',
  'Servicios Públicos',
  'Artículo 136',
  'La empresa prestadora de servicios públicos domiciliarios responderá por la falla en la prestación del servicio. En caso de corte programado, deberá informarse a los usuarios con al menos 24 horas de antelación. Las suspensiones imprevistas deberán atenderse con prioridad de restablecimiento urgente.',
  'Ley 142 de 1994'
),
(
  'Obligaciones del servicio de recolección y aseo',
  'Servicios Públicos',
  'Artículo 2.3.2.2.2.8',
  'El prestador del servicio de aseo tiene la obligación de garantizar frecuencias mínimas de recolección de residuos sólidos ordinarios, divulgación de macro-rutas y atención prioritaria a puntos críticos de acumulación clandestina de escombros y basuras en espacio público.',
  'Decreto 1077 de 2015'
),
(
  'Mantenimiento y cobertura del alumbrado público',
  'Infraestructura',
  'Artículo 2.2.3.6.1.2',
  'El municipio es el responsable de garantizar la adecuada prestación, modernización, expansión y mantenimiento del servicio de alumbrado público en áreas de uso público vehicular y peatonal para salvaguardar la seguridad ciudadana.',
  'Decreto 1073 de 2015'
),
(
  'Silencio Administrativo Positivo y Negativo',
  'Garantías Ciudadanas',
  'Artículo 83',
  'Transcurrido un plazo de tres (3) meses contados a partir de la presentación de una petición sin que se haya notificado decisión expresa, se entenderá que esta es negativa. En los casos expresamente previstos por la ley especial de servicios públicos, opera el silencio administrativo positivo pasados 15 días hábiles.',
  'Ley 1437 de 2011 / Ley 142 de 1994'
),
(
  'Tratamiento de datos personales y confidencialidad',
  'Protección de Datos',
  'Artículo 4',
  'Las entidades públicas deben salvaguardar la privacidad de los datos personales suministrados por los ciudadanos en sus solicitudes y reportes, utilizándolos exclusivamente para el trámite del expediente administrativo.',
  'Ley Estatutaria 1581 de 2012'
)
ON CONFLICT DO NOTHING;
