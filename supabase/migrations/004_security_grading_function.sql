-- ============================================================
-- EBIME LAB — Migration 004
-- SEGURIDAD: Función de calificación server-side
-- Las respuestas correctas NUNCA viajan al cliente
-- ============================================================

-- Función que califica un intento completo en el servidor
-- Solo accesible via service_role o trigger
CREATE OR REPLACE FUNCTION public.calificar_intento(p_intento_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos del owner, no del usuario
AS $$
DECLARE
  v_evaluacion_id UUID;
  v_nota_minima NUMERIC;
  v_puntaje_total NUMERIC := 0;
  v_puntaje_max NUMERIC := 0;
  v_tiene_abiertas BOOLEAN := FALSE;
  v_porcentaje NUMERIC;
  v_aprobado BOOLEAN;
  v_resp RECORD;
  v_opcion_correcta UUID;
  v_correctas UUID[];
  v_seleccionadas UUID[];
  v_es_correcta BOOLEAN;
  v_puntos NUMERIC;
BEGIN
  -- Obtener evaluación
  SELECT i.evaluacion_id, e.nota_minima
  INTO v_evaluacion_id, v_nota_minima
  FROM public.intentos i
  JOIN public.evaluaciones e ON e.id = i.evaluacion_id
  WHERE i.id = p_intento_id;

  -- Verificar si tiene preguntas abiertas
  SELECT EXISTS(
    SELECT 1 FROM public.preguntas
    WHERE evaluacion_id = v_evaluacion_id
    AND tipo IN ('respuesta_corta', 'respuesta_larga')
  ) INTO v_tiene_abiertas;

  -- Calificar cada respuesta
  FOR v_resp IN
    SELECT r.id, r.pregunta_id, r.opciones_sel, p.tipo, p.puntos
    FROM public.respuestas r
    JOIN public.preguntas p ON p.id = r.pregunta_id
    WHERE r.intento_id = p_intento_id
  LOOP
    v_puntaje_max := v_puntaje_max + v_resp.puntos;
    v_es_correcta := NULL;
    v_puntos := 0;

    IF v_resp.tipo = 'seleccion_unica' OR v_resp.tipo = 'verdadero_falso' THEN
      SELECT id INTO v_opcion_correcta
      FROM public.opciones_pregunta
      WHERE pregunta_id = v_resp.pregunta_id AND es_correcta = TRUE
      LIMIT 1;

      IF v_resp.opciones_sel IS NOT NULL AND
         array_length(v_resp.opciones_sel, 1) = 1 AND
         v_resp.opciones_sel[1] = v_opcion_correcta THEN
        v_es_correcta := TRUE;
        v_puntos := v_resp.puntos;
      ELSE
        v_es_correcta := FALSE;
      END IF;

    ELSIF v_resp.tipo = 'seleccion_multiple' THEN
      SELECT ARRAY_AGG(id ORDER BY id) INTO v_correctas
      FROM public.opciones_pregunta
      WHERE pregunta_id = v_resp.pregunta_id AND es_correcta = TRUE;

      IF v_resp.opciones_sel IS NOT NULL THEN
        SELECT ARRAY_AGG(unnest ORDER BY unnest) INTO v_seleccionadas
        FROM unnest(v_resp.opciones_sel);
      END IF;

      IF v_correctas IS NOT DISTINCT FROM v_seleccionadas THEN
        v_es_correcta := TRUE;
        v_puntos := v_resp.puntos;
      ELSE
        v_es_correcta := FALSE;
      END IF;

    ELSE
      -- Abiertas: pendiente de calificación manual
      v_es_correcta := NULL;
      v_puntos := 0;
    END IF;

    IF v_es_correcta = TRUE THEN
      v_puntaje_total := v_puntaje_total + v_puntos;
    END IF;

    -- Actualizar respuesta con calificación
    UPDATE public.respuestas
    SET es_correcta = v_es_correcta,
        puntos_obtenidos = v_puntos,
        calificado_en = NOW()
    WHERE id = v_resp.id;
  END LOOP;

  -- Calcular resultado final
  v_porcentaje := CASE WHEN v_puntaje_max > 0
    THEN (v_puntaje_total / v_puntaje_max) * 100
    ELSE 0 END;

  v_aprobado := CASE
    WHEN v_tiene_abiertas THEN NULL  -- Pendiente
    ELSE v_porcentaje >= v_nota_minima
  END;

  -- Actualizar intento
  UPDATE public.intentos
  SET estado = CASE WHEN v_tiene_abiertas THEN 'enviado' ELSE 'calificado' END,
      puntaje = v_puntaje_total,
      puntaje_maximo = v_puntaje_max,
      porcentaje = v_porcentaje,
      aprobado = v_aprobado,
      calificado_en = CASE WHEN NOT v_tiene_abiertas THEN NOW() ELSE NULL END
  WHERE id = p_intento_id;
END;
$$;

-- Trigger: auto-calificar cuando se marca un intento como 'enviado'
CREATE OR REPLACE FUNCTION public.trigger_calificar_intento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'enviado' AND OLD.estado = 'en_progreso' THEN
    PERFORM public.calificar_intento(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_auto_calificar
  AFTER UPDATE OF estado ON public.intentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calificar_intento();

-- RLS en opciones_pregunta: ocultar es_correcta a estudiantes durante examen
-- Los estudiantes pueden ver las opciones pero NO el campo es_correcta
CREATE OR REPLACE VIEW public.opciones_examen AS
SELECT id, pregunta_id, texto, orden
FROM public.opciones_pregunta;
-- (La vista no expone es_correcta)

COMMENT ON FUNCTION public.calificar_intento IS
  'Califica un intento completo server-side. Las respuestas correctas nunca se envían al cliente.';
