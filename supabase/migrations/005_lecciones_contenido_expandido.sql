-- ============================================================
-- EBIME LAB — Migration 005
-- Expandir lecciones: más tipos de contenido, recursos adjuntos
-- ============================================================

-- Expandir el CHECK constraint de tipo en lecciones
ALTER TABLE public.lecciones
  DROP CONSTRAINT IF EXISTS lecciones_tipo_check;

ALTER TABLE public.lecciones
  ADD CONSTRAINT lecciones_tipo_check
  CHECK (tipo IN ('video','texto','pdf','presentacion','audio','enlace','scorm'));

-- Agregar campos adicionales a lecciones
ALTER TABLE public.lecciones
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS url_externa TEXT,        -- para enlaces externos
  ADD COLUMN IF NOT EXISTS es_obligatoria BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS es_preview BOOLEAN DEFAULT FALSE, -- visible sin inscripción
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tabla de recursos adjuntos por lección (archivos, enlaces adicionales)
CREATE TABLE IF NOT EXISTS public.recursos_leccion (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leccion_id   UUID NOT NULL REFERENCES public.lecciones(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL CHECK (tipo IN ('pdf','enlace','presentacion','archivo','imagen')),
  titulo       TEXT NOT NULL,
  url          TEXT NOT NULL,
  descripcion  TEXT,
  orden        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recursos_leccion ON public.recursos_leccion(leccion_id);

ALTER TABLE public.recursos_leccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recursos_select_auth"
  ON public.recursos_leccion FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "recursos_all_admin"
  ON public.recursos_leccion FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
  );
CREATE POLICY "recursos_all_service"
  ON public.recursos_leccion FOR ALL USING (auth.role() = 'service_role');

-- Trigger updated_at para lecciones
CREATE OR REPLACE FUNCTION set_leccion_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lecciones_updated_at
  BEFORE UPDATE ON public.lecciones
  FOR EACH ROW EXECUTE FUNCTION set_leccion_updated_at();
