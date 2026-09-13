-- ==========================================================
-- SCRIPT DE MIGRACIÓN: PANEL DE FUNCIONARIO Y VISTO BUENO IA
-- Proyecto: diplomado
-- Tabla: pqrs (nuevas columnas de resolución y auditoría)
-- ==========================================================

-- 1. Agregar columnas para borrador IA y resolución del funcionario
ALTER TABLE public.pqrs
  ADD COLUMN IF NOT EXISTS respuesta_borrador_ia TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS funcionario_responsable VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fundamento_legal TEXT DEFAULT '';

-- 2. Reforzar política RLS para actualización de respuestas
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON public.pqrs;
DROP POLICY IF EXISTS "Funcionarios y Administradores pueden resolver PQRS" ON public.pqrs;

CREATE POLICY "Funcionarios y Administradores pueden resolver PQRS"
  ON public.pqrs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('funcionario', 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('funcionario', 'administrador')
    )
  );
