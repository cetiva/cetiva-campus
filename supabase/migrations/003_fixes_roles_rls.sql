-- ============================================================
-- EBIME LAB — Migration 003
-- Fix RLS admin, agregar instructor al CHECK constraint,
-- mejorar trigger handle_new_user
-- ============================================================

-- Fix 1: Agregar rol 'instructor' al CHECK constraint de profiles
-- Primero eliminar el constraint viejo, luego agregar el nuevo
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_rol_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('estudiante', 'instructor', 'admin'));

-- Fix 2: Policy para que admin vea TODOS los profiles
-- (evitamos referencia circular usando una función)
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid()
$$;

-- Eliminar policy existente si existe (evitar error de duplicado)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_my_rol() = 'admin');

-- Fix 3: Trigger mejorado — garantiza que email siempre se guarda
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, nombre, apellidos,
    profesion, institucion, ciudad, telefono
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre',
             split_part(COALESCE(NEW.email,''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'profesion', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'institucion', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'ciudad', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'telefono', ''), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    nombre = CASE
      WHEN profiles.nombre = '' OR profiles.nombre IS NULL
      THEN EXCLUDED.nombre ELSE profiles.nombre END,
    apellidos = CASE
      WHEN profiles.apellidos = '' OR profiles.apellidos IS NULL
      THEN EXCLUDED.apellidos ELSE profiles.apellidos END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 4: Actualizar emails faltantes en profiles existentes
-- (para usuarios que ya estaban registrados antes del fix)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Fix 5: Actualizar nombres de profiles con nombre vacío
UPDATE public.profiles p
SET nombre = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id
  AND (p.nombre IS NULL OR p.nombre = '');
