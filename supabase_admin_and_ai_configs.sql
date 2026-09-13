-- ==========================================================
-- SCRIPT DE MIGRACIÓN: PANEL ADMINISTRATIVO Y CONFIGURACIÓN DE IA
-- Proyecto: diplomado
-- Tabla: system_ai_configs y políticas de seguridad RBAC
-- ==========================================================

-- 1. Crear tabla de configuraciones de IA por tipo
CREATE TABLE IF NOT EXISTS public.system_ai_configs (
  id VARCHAR(50) PRIMARY KEY, -- 'chat_assistant', 'ocr_multimodal', 'embeddings_search'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL DEFAULT 'gemini', -- 'gemini', 'grok', 'openai'
  model_name VARCHAR(100) NOT NULL DEFAULT 'gemini-flash-latest',
  api_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS en system_ai_configs
ALTER TABLE public.system_ai_configs ENABLE ROW LEVEL SECURITY;

-- Política de lectura: cualquier usuario autenticado o anónimo puede consultar configuraciones activas
DROP POLICY IF EXISTS "Lectura de configs de IA" ON public.system_ai_configs;
CREATE POLICY "Lectura de configs de IA"
  ON public.system_ai_configs FOR SELECT
  TO authenticated, anon
  USING (true);

-- Política de escritura: solo administradores pueden modificar configuraciones de IA
DROP POLICY IF EXISTS "Escritura de configs de IA solo admin" ON public.system_ai_configs;
CREATE POLICY "Escritura de configs de IA solo admin"
  ON public.system_ai_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );

-- 3. Actualizar políticas en 'profiles' para que los administradores puedan gestionar roles
DROP POLICY IF EXISTS "Administradores pueden actualizar cualquier perfil" ON public.profiles;
CREATE POLICY "Administradores pueden actualizar cualquier perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'administrador'
    )
  );

-- 4. Sembrar configuraciones de IA iniciales (las claves API se configuran desde el panel de administración o variables de entorno)
INSERT INTO public.system_ai_configs (id, name, description, provider, model_name, api_key, is_active)
VALUES
(
  'chat_assistant',
  'Asistente Virtual y Razonamiento (Chat)',
  'Modelo encargado de responder dudas en tiempo real y orientar al ciudadano en trámites.',
  'gemini',
  'gemini-flash-latest',
  '',
  true
),
(
  'ocr_multimodal',
  'Digitalización y OCR Multimodal',
  'Modelo de visión para transcribir documentos escaneados o manuscritos y autocompletar radicaciones.',
  'gemini',
  'gemini-flash-latest',
  '',
  true
),
(
  'embeddings_search',
  'Búsqueda Semántica de Normativa',
  'Motor de consulta en lenguaje natural sobre leyes, decretos y políticas públicas.',
  'gemini',
  'gemini-3.5-flash-lite',
  '',
  true
)
ON CONFLICT (id) DO UPDATE SET
  provider = EXCLUDED.provider,
  model_name = EXCLUDED.model_name,
  api_key = CASE 
    WHEN EXCLUDED.api_key IS NOT NULL AND EXCLUDED.api_key <> '' THEN EXCLUDED.api_key 
    ELSE system_ai_configs.api_key 
  END,
  updated_at = NOW();

-- 5. Promover al usuario neiderqm09@gmail.com como 'administrador' si ya existe en profiles
UPDATE public.profiles
SET role = 'administrador'
WHERE email = 'neiderqm09@gmail.com';
