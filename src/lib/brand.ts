/**
 * ============================================================
 * CETIVA Campus — Configuración de marca
 * ============================================================
 * Centro de Excelencia en Terapia Infusional y Acceso Vascular
 *
 * INSTRUCCIONES:
 * 1. Edita los valores de BRAND
 * 2. Reemplaza los logos en /public/logo-color.png y /public/logo-white.png
 * 3. Ajusta los colores en globals.css (variables --navy, --cyan, etc.)
 * 4. Actualiza las variables de entorno en Vercel
 * ============================================================
 */

export const BRAND = {
  // ── Identidad básica ─────────────────────────────────────
  name:        'CETIVA Campus',
  shortName:   'CETIVA',
  tagline:     'Centro de Excelencia en Terapia Infusional y Acceso Vascular',
  description: 'Plataforma académica de CETIVA para la formación especializada en terapia infusional y acceso vascular.',

  // ── Empresa / Razón social ───────────────────────────────
  company:     'CETIVA S.A.S.',
  country:     'Colombia',
  city:        'Bogotá D.C.',
  address:     'Bogotá D.C., Colombia',
  email:       'info@cetivainc.com',
  emailLegal:  'info@cetivainc.com',

  // ── URLs ─────────────────────────────────────────────────
  url:        'https://cetiva.online',
  urlLegal:   'https://cetiva.online/terminos',
  urlPrivacy: 'https://cetiva.online/aviso-privacidad',
  urlCookies: 'https://cetiva.online/preferencias-cookies',

  // ── Redes sociales ───────────────────────────────────────
  social: {
    twitter:   '',
    linkedin:  'https://www.linkedin.com/company/cetiva',
    instagram: 'https://www.instagram.com/cetiva.co',
    youtube:   '',
  },

  // ── App externa ──────────────────────────────────────────
  appExterna: {
    nombre: '',
    url:    '',
    label:  '',
  },

  // ── SEO ──────────────────────────────────────────────────
  seo: {
    titleTemplate: '%s — CETIVA Campus',
    defaultTitle:  'CETIVA Campus — Formación en Terapia Infusional y Acceso Vascular',
    description:   'Programas especializados en terapia infusional, acceso vascular y ultrasonografía clínica con estándares internacionales INS, AVA y GAVeCeLT.',
    keywords:      'terapia infusional, acceso vascular, PICC, ultrasonido vascular, RAVA, formación clínica, enfermería vascular',
    themeColor:    '#052A46',
  },

  // ── Contenido de la homepage ─────────────────────────────
  home: {
    heroTitle:    'Formación especializada en acceso vascular y terapia infusional',
    heroSubtitle: 'Programas de educación continua basados en evidencia. Aprende con expertos clínicos activos en la práctica.',
    ctaPrimary:   'Explorar programas →',
    ctaSecondary: 'Ver catálogo',
  },

  // ── Texto legal ──────────────────────────────────────────
  legal: {
    version:            '1.0',
    vigenciaDesde:      '2026',
    responsableNombre:  'CETIVA S.A.S.',
    responsableRFC:     '',
    emailArco:          'info@cetivainc.com',
    plazoRespuestaDias: 10,  // días hábiles (Ley 1581/2012)
  },

  // ── Características habilitadas ──────────────────────────
  features: {
    chat:           true,
    evaluaciones:   true,
    certificados:   true,
    agenda:         true,
    appExterna:     false,
    paginaPublica:  true,
    taxonomiaRef:   false,
  },
} as const

export type Brand = typeof BRAND
