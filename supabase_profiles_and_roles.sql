-- ==========================================================
-- SCRIPT DE MIGRACIÓN: PERFILES DE USUARIO Y ROLES (RBAC)
-- Proyecto: diplomado
-- Roles: ciudadano, funcionario, administrador
-- ==========================================================

-- 1. Crear tabla 'profiles' vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'ciudadano'
    CHECK (role IN ('ciudadano', 'funcionario', 'administrador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS en 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura: los perfiles son públicos o visibles para usuarios autenticados
DROP POLICY IF EXISTS "Lectura de perfiles para usuarios autenticados" ON public.profiles;
CREATE POLICY "Lectura de perfiles para usuarios autenticados"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Política de actualización: cada usuario solo puede editar su propio perfil
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 3. Función y Trigger para auto-crear perfil cuando un usuario se registra con Google o Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'ciudadano')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
