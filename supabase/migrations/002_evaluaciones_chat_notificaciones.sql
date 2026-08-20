-- ============================================================
-- EBIME LAB — Migration 002
-- Evaluaciones, Chat, Notificaciones, Audit
-- ============================================================

-- ── Evaluaciones ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id        UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  instrucciones   TEXT,
  tiempo_limite   INTEGER, -- minutos, NULL = sin límite
  max_intentos    INTEGER DEFAULT 1,
  nota_minima     NUMERIC DEFAULT 60,
  aleatorizar     BOOLEAN DEFAULT FALSE,
  mostrar_feedback BOOLEAN DEFAULT TRUE,
  publicado       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_select_auth" ON public.evaluaciones FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "eval_all_admin"   ON public.evaluaciones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "eval_all_service" ON public.evaluaciones FOR ALL USING (auth.role() = 'service_role');

-- ── Preguntas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preguntas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('seleccion_unica','seleccion_multiple','verdadero_falso','respuesta_corta','respuesta_larga')),
  enunciado       TEXT NOT NULL,
  explicacion     TEXT,
  puntos          NUMERIC DEFAULT 1,
  orden           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preg_select_auth" ON public.preguntas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "preg_all_admin"   ON public.preguntas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "preg_all_service" ON public.preguntas FOR ALL USING (auth.role() = 'service_role');

-- ── Opciones de preguntas ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.opciones_pregunta (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregunta_id   UUID REFERENCES public.preguntas(id) ON DELETE CASCADE,
  texto         TEXT NOT NULL,
  es_correcta   BOOLEAN DEFAULT FALSE,
  orden         INTEGER DEFAULT 0
);

ALTER TABLE public.opciones_pregunta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opc_select_auth" ON public.opciones_pregunta FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "opc_all_admin"   ON public.opciones_pregunta FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "opc_all_service" ON public.opciones_pregunta FOR ALL USING (auth.role() = 'service_role');

-- ── Intentos de evaluación ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_intento  INTEGER DEFAULT 1,
  estado          TEXT DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso','enviado','calificado')),
  puntaje         NUMERIC,
  puntaje_maximo  NUMERIC,
  porcentaje      NUMERIC,
  aprobado        BOOLEAN,
  iniciado_en     TIMESTAMPTZ DEFAULT NOW(),
  enviado_en      TIMESTAMPTZ,
  calificado_en   TIMESTAMPTZ,
  UNIQUE (evaluacion_id, usuario_id, numero_intento)
);

CREATE INDEX idx_intentos_usuario ON public.intentos(usuario_id);
CREATE INDEX idx_intentos_eval    ON public.intentos(evaluacion_id);

ALTER TABLE public.intentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "int_select_own"   ON public.intentos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "int_insert_own"   ON public.intentos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "int_update_own"   ON public.intentos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "int_select_admin" ON public.intentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "int_all_service"  ON public.intentos FOR ALL USING (auth.role() = 'service_role');

-- ── Respuestas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.respuestas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intento_id      UUID REFERENCES public.intentos(id) ON DELETE CASCADE,
  pregunta_id     UUID REFERENCES public.preguntas(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  respuesta_texto TEXT,
  opciones_sel    UUID[], -- IDs de opciones seleccionadas
  es_correcta     BOOLEAN,
  puntos_obtenidos NUMERIC DEFAULT 0,
  feedback        TEXT,
  calificado_en   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_respuestas_intento ON public.respuestas(intento_id);

ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resp_select_own"   ON public.respuestas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "resp_insert_own"   ON public.respuestas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "resp_select_admin" ON public.respuestas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "resp_update_admin" ON public.respuestas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin','instructor'))
);
CREATE POLICY "resp_all_service"  ON public.respuestas FOR ALL USING (auth.role() = 'service_role');

-- ── Conversaciones ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id    UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  asunto      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_select_part" ON public.conversaciones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.participantes_conv WHERE conversacion_id = id AND usuario_id = auth.uid())
);
CREATE POLICY "conv_insert_auth" ON public.conversaciones FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "conv_all_service" ON public.conversaciones FOR ALL USING (auth.role() = 'service_role');

-- ── Participantes de conversación ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.participantes_conv (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id  UUID REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  usuario_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conversacion_id, usuario_id)
);

ALTER TABLE public.participantes_conv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "part_select_own"  ON public.participantes_conv FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "part_insert_auth" ON public.participantes_conv FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "part_all_service" ON public.participantes_conv FOR ALL USING (auth.role() = 'service_role');

-- ── Mensajes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensajes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id  UUID REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  remitente_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido        TEXT NOT NULL,
  leido            BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mensajes_conv ON public.mensajes(conversacion_id, created_at DESC);

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_part" ON public.mensajes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.participantes_conv WHERE conversacion_id = mensajes.conversacion_id AND usuario_id = auth.uid())
);
CREATE POLICY "msg_insert_part" ON public.mensajes FOR INSERT WITH CHECK (
  auth.uid() = remitente_id AND
  EXISTS (SELECT 1 FROM public.participantes_conv WHERE conversacion_id = mensajes.conversacion_id AND usuario_id = auth.uid())
);
CREATE POLICY "msg_all_service" ON public.mensajes FOR ALL USING (auth.role() = 'service_role');

-- ── Notificaciones ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  titulo      TEXT NOT NULL,
  cuerpo      TEXT,
  leida       BOOLEAN DEFAULT FALSE,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON public.notificaciones(usuario_id, leida, created_at DESC);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select_own"  ON public.notificaciones FOR SELECT  USING (auth.uid() = usuario_id);
CREATE POLICY "notif_update_own"  ON public.notificaciones FOR UPDATE  USING (auth.uid() = usuario_id);
CREATE POLICY "notif_all_service" ON public.notificaciones FOR ALL     USING (auth.role() = 'service_role');

-- ── Audit log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES auth.users(id),
  accion      TEXT NOT NULL,
  entidad     TEXT,
  entidad_id  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_usuario ON public.audit_log(usuario_id);
CREATE INDEX idx_audit_fecha   ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_admin" ON public.audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "audit_all_service"  ON public.audit_log FOR ALL USING (auth.role() = 'service_role');

-- Actualizar updated_at en conversaciones al nuevo mensaje
CREATE OR REPLACE FUNCTION update_conversacion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversaciones SET updated_at = NOW() WHERE id = NEW.conversacion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_msg_updated_at
  AFTER INSERT ON public.mensajes
  FOR EACH ROW EXECUTE FUNCTION update_conversacion_timestamp();
