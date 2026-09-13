-- ==========================================================
-- SCRIPT DE CREACIÓN Y CONFIGURACIÓN: BASE DE DATOS SUPABASE
-- Proyecto: diplomado
-- Tabla: pqrs (Gestión y Consulta de Trámites Ciudadanos)
-- ==========================================================

-- 1. Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla principal 'pqrs'
CREATE TABLE IF NOT EXISTS public.pqrs (
    id VARCHAR(50) PRIMARY KEY,
    solicitante VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'En trámite' 
        CHECK (estado IN ('En trámite', 'Resuelto', 'Pendiente', 'Rechazado')),
    fecha_radicacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plazo_legal TIMESTAMPTZ,
    respuesta_oficial TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para optimizar filtros y búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_pqrs_estado ON public.pqrs(estado);
CREATE INDEX IF NOT EXISTS idx_pqrs_categoria ON public.pqrs(categoria);
CREATE INDEX IF NOT EXISTS idx_pqrs_fecha_radicacion ON public.pqrs(fecha_radicacion DESC);

-- 4. Función y Trigger para mantener updated_at actualizado automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_update_pqrs_updated_at ON public.pqrs;
CREATE TRIGGER tr_update_pqrs_updated_at
    BEFORE UPDATE ON public.pqrs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Configurar Row Level Security (RLS)
ALTER TABLE public.pqrs ENABLE ROW LEVEL SECURITY;

-- Política de Lectura: Acceso de consulta público (para ciudadanos / portal de transparencia)
DROP POLICY IF EXISTS "Permitir lectura pública de PQRS" ON public.pqrs;
CREATE POLICY "Permitir lectura pública de PQRS"
    ON public.pqrs
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

-- Política de Inserción: Permitir a cualquier ciudadano radicar una PQRS
DROP POLICY IF EXISTS "Permitir radicación de nuevas PQRS" ON public.pqrs;
CREATE POLICY "Permitir radicación de nuevas PQRS"
    ON public.pqrs
    FOR INSERT
    TO public, anon, authenticated
    WITH CHECK (true);

-- Política de Actualización: Solo usuarios autenticados / administradores
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON public.pqrs;
CREATE POLICY "Permitir actualización a usuarios autenticados"
    ON public.pqrs
    FOR UPDATE
    TO authenticated
    USING (true);

-- 6. Insertar registros iniciales (Semilla de datos)
INSERT INTO public.pqrs (id, solicitante, categoria, descripcion, estado, fecha_radicacion, plazo_legal, respuesta_oficial)
VALUES
  ('PQRS-001', 'Juan Pérez', 'Agua', 'Fuga de agua constante en la tubería principal del barrio.', 'En trámite', '2026-08-15T08:30:00Z', '2026-08-30T08:30:00Z', ''),
  ('PQRS-002', 'María Gómez', 'Basuras', 'No ha pasado el camión recolector de basuras en 3 días.', 'Resuelto', '2026-08-10T14:15:00Z', '2026-08-25T14:15:00Z', 'Se reprogramó la ruta y se realizó la recolección el día 12 de agosto.'),
  ('PQRS-003', 'Carlos Rodríguez', 'Alumbrado', 'Luminaria fundida en el parque principal frente a la alcaldía.', 'En trámite', '2026-08-18T11:45:00Z', '2026-09-02T11:45:00Z', ''),
  ('PQRS-004', 'Ana Martínez', 'Agua', 'El agua llega con mucha turbiedad desde hace una semana.', 'Resuelto', '2026-08-01T09:20:00Z', '2026-08-16T09:20:00Z', 'Se realizó mantenimiento en la planta de tratamiento y se purgó la red local.'),
  ('PQRS-005', 'Pedro Ramírez', 'Basuras', 'Vecinos dejan escombros en la vía pública obstaculizando el paso.', 'En trámite', '2026-08-21T16:05:00Z', '2026-09-05T16:05:00Z', ''),
  ('PQRS-006', 'Lucía Fernández', 'Alumbrado', 'Poste de luz ladeado con riesgo de caída tras la tormenta.', 'Resuelto', '2026-08-05T07:10:00Z', '2026-08-20T07:10:00Z', 'Cuadrilla técnica estabilizó y reforzó la base del poste de manera urgente.'),
  ('PQRS-007', 'Javier Morales', 'Agua', 'Cobro excesivo en la última factura, no corresponde al consumo habitual.', 'En trámite', '2026-08-19T13:40:00Z', '2026-09-03T13:40:00Z', ''),
  ('PQRS-008', 'Sofía Castro', 'Basuras', 'Falta de contenedores de reciclaje en la zona comercial.', 'En trámite', '2026-08-22T10:30:00Z', '2026-09-06T10:30:00Z', ''),
  ('PQRS-009', 'Diego Herrera', 'Alumbrado', 'Luces de la calle parpadean toda la noche y no iluminan bien.', 'Resuelto', '2026-08-12T15:20:00Z', '2026-08-27T15:20:00Z', 'Se reemplazaron los balastros y bombillas defectuosas del sector.'),
  ('PQRS-010', 'Elena Vargas', 'Agua', 'Corte de agua sin previo aviso desde hace más de 12 horas.', 'En trámite', '2026-08-23T08:00:00Z', '2026-09-07T08:00:00Z', '')
ON CONFLICT (id) DO NOTHING;
