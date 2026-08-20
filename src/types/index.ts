export interface Perfil {
  id: string
  email?: string
  nombre: string
  apellidos: string
  identificacion?: string
  profesion?: string
  institucion?: string
  ciudad?: string
  telefono?: string
  rol?: 'estudiante' | 'admin' | 'instructor'
  perfil_publico?: boolean
  recibir_correos?: boolean
  created_at?: string
}

export interface Curso {
  id: string
  slug: string
  titulo: string
  descripcion: string
  nivel: string
  color: string
  duracion_horas: number
  es_gratis: boolean
  precio: number
  publicado: boolean
  orden: number
  thumbnail_url?: string
}

export interface Modulo {
  id: string
  curso_id: string
  titulo: string
  orden: number
  lecciones?: Leccion[]
}

export interface Leccion {
  id: string
  modulo_id: string
  titulo: string
  descripcion?: string
  tipo: 'video' | 'texto' | 'pdf' | 'presentacion' | 'audio' | 'enlace' | 'scorm'
  contenido?: string      // URL de video Vimeo/YouTube, texto HTML, URL de PDF/presentación
  url_externa?: string    // URL externa adicional
  duracion_min: number
  orden: number
  es_obligatoria?: boolean
  es_preview?: boolean
  recursos?: RecursoLeccion[]
}

export interface RecursoLeccion {
  id: string
  leccion_id: string
  tipo: 'pdf' | 'enlace' | 'presentacion' | 'archivo' | 'imagen'
  titulo: string
  url: string
  descripcion?: string
  orden: number
}

export interface Inscripcion {
  id?: string
  usuario_id: string
  curso_id: string
  completado?: boolean
  inscrito_en?: string
  ultimo_acceso?: string
  cursos?: Curso
}

export interface Progreso {
  id?: string
  usuario_id: string
  leccion_id: string
  completado: boolean
}

export interface Certificado {
  id: string
  usuario_id: string
  curso_id: string
  emitido_en: string
  codigo: string
  cursos?: Curso
}

export interface EventoAgenda {
  id: string
  usuario_id: string
  titulo: string
  fecha: string
  hora?: string
  tipo: 'estudio' | 'examen' | 'clase' | 'recordatorio'
  completado: boolean
}

// ── Evaluaciones ─────────────────────────────────────────────
export interface Evaluacion {
  id: string
  curso_id: string
  titulo: string
  descripcion?: string
  instrucciones?: string
  tiempo_limite?: number
  max_intentos: number
  nota_minima: number
  aleatorizar: boolean
  mostrar_feedback: boolean
  publicado: boolean
  created_at: string
}

export type TipoPregunta = 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'respuesta_larga'

export interface Pregunta {
  id: string
  evaluacion_id: string
  tipo: TipoPregunta
  enunciado: string
  explicacion?: string
  puntos: number
  orden: number
  opciones?: OpcionPregunta[]
}

export interface OpcionPregunta {
  id: string
  pregunta_id: string
  texto: string
  es_correcta: boolean
  orden: number
}

export interface Intento {
  id: string
  evaluacion_id: string
  usuario_id: string
  numero_intento: number
  estado: 'en_progreso' | 'enviado' | 'calificado'
  puntaje?: number
  puntaje_maximo?: number
  porcentaje?: number
  aprobado?: boolean
  iniciado_en: string
  enviado_en?: string
  calificado_en?: string
}

export interface Respuesta {
  id: string
  intento_id: string
  pregunta_id: string
  usuario_id: string
  respuesta_texto?: string
  opciones_sel?: string[]
  es_correcta?: boolean
  puntos_obtenidos: number
  feedback?: string
}

// ── Chat ─────────────────────────────────────────────────────
export interface Conversacion {
  id: string
  curso_id?: string
  asunto?: string
  created_at: string
  updated_at: string
  participantes?: ParticipanteConv[]
  ultimo_mensaje?: Mensaje
}

export interface ParticipanteConv {
  id: string
  conversacion_id: string
  usuario_id: string
  joined_at: string
  perfil?: Perfil
}

export interface Mensaje {
  id: string
  conversacion_id: string
  remitente_id: string
  contenido: string
  leido: boolean
  created_at: string
  perfil?: Perfil
}

// ── Notificaciones ────────────────────────────────────────────
export interface Notificacion {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  cuerpo?: string
  leida: boolean
  url?: string
  created_at: string
}
