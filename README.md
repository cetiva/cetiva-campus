# White-Label LMS — Plataforma educativa lista para desplegar

Sistema LMS (Learning Management System) completo, listo para ser personalizado con tu marca y desplegado en minutos usando GitHub + Supabase + Vercel.

## Stack tecnológico

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Hosting:** Vercel (CDN global, HTTPS automático)
- **CI/CD:** GitHub Actions

---

## Personalización de marca (5 minutos)

**Edita UN solo archivo:** `src/lib/brand.ts`

```typescript
export const BRAND = {
  name:     'Mi Academia',
  tagline:  'Formación profesional en línea',
  company:  'Mi Empresa, S.A. de C.V.',
  url:      'https://miacademia.com',
  email:    'contacto@miacademia.com',
  // ... ver brand.ts para todas las opciones
}
```

**Reemplaza los logos:**
- `public/logo-color.png` — logo para fondo claro (recomendado: 400×160px PNG con fondo transparente)
- `public/logo-white.png` — logo para fondo oscuro (versión blanca)

**Activa/desactiva funcionalidades:**
```typescript
features: {
  chat:          true,   // Chat en tiempo real
  evaluaciones:  true,   // Sistema de exámenes
  certificados:  true,   // Certificados verificables
  agenda:        true,   // Agenda personal
  appExterna:    false,  // Botón a app externa en dashboard
}
```

---

## Despliegue paso a paso

### 1. Supabase — Base de datos

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_evaluaciones_chat_notificaciones.sql`
   - `supabase/migrations/003_fixes_roles_rls.sql`
   - `supabase/migrations/004_security_grading_function.sql`
   - `supabase/migrations/005_lecciones_contenido_expandido.sql`
3. Ve a **Authentication → URL Configuration**:
   - Site URL: `https://tudominio.com`
   - Redirect URLs: `https://tudominio.com/auth/callback`
4. Ve a **Storage → New bucket**: nombre `portadas`, marcar **Public**
5. Ve a **Database → Replication**: activar tabla `mensajes`
6. Copia tus claves desde **Settings → API Keys (Legacy)**

### 2. GitHub — Repositorio

```bash
git init -b main
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/mi-lms.git
git push -u origin main
```

O usa **GitHub Desktop** sin terminal.

### 3. Vercel — Hosting

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repositorio de GitHub
3. Framework: **Next.js** (auto-detectado)
4. Agrega las **Environment Variables**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (service role — SECRETO) |
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.com` |

5. Clic en **Deploy**
6. Ve a **Settings → Domains** → agrega tu dominio

### 4. DNS

En tu proveedor de dominio (Cloudflare, Hostinger, etc.):
```
A     @    →  IP que indique Vercel
CNAME www  →  cname.vercel-dns.com
```

---

## Roles de usuario

| Rol | Capacidades |
|---|---|
| `estudiante` | Ver cursos, evaluaciones, certificados, chat, agenda |
| `instructor` | Todo lo de estudiante + gestionar cursos y evaluaciones, ver reportes |
| `admin` | Control total de la plataforma |

**Primer administrador:** Regístrate normalmente, luego en Supabase SQL Editor:
```sql
UPDATE public.profiles SET rol = 'admin' WHERE email = 'tu@email.com';
```

---

## Funcionalidades incluidas

### Área pública
- Homepage con hero, áreas de conocimiento y CTA
- Catálogo de cursos público
- Páginas legales (Términos, Aviso de Privacidad, Cookies)
- Verificación de certificados por código único
- Sitemap y robots.txt

### Estudiante
- Dashboard con tiles de acceso rápido
- Catálogo e inscripción a cursos
- Reproductor multi-formato: Video (Vimeo/YouTube), PDF, Presentaciones, Audio, Texto, Enlaces
- Recursos adjuntos por lección
- Sistema de evaluaciones (selección única/múltiple, V/F, abiertas)
- Resultados y feedback por pregunta
- Certificados verificables con código único
- Chat en tiempo real con instructores
- Agenda personal de estudio
- Mi avance con estadísticas de progreso

### Instructor
- Dashboard con métricas reales
- Gestión de cursos (crear, editar, publicar)
- Editor de contenido: módulos, lecciones y recursos adjuntos
- Generador de evaluaciones (banco de preguntas, tipos de pregunta)
- Lista de estudiantes con progreso individual
- Reportes grupales por evaluación
- Calificación de preguntas abiertas

### Administrador
- Dashboard con KPIs de la plataforma
- Gestión completa de usuarios y cambio de roles
- Gestión de cursos y contenido
- Reportes globales (usuarios, cursos, aprobación, mensajes)
- Gestión de perfiles y roles disponibles
- Panel de perfiles con capacidades y restricciones

### Seguridad
- Row Level Security (RLS) en todas las tablas
- Headers de seguridad HTTP (CSP, HSTS, X-Frame, etc.)
- Calificación server-side (respuestas correctas nunca viajan al cliente)
- Protección de rutas por rol en middleware
- Validación de inputs y sanitización
- Rate limiting en login

---

## Estructura del proyecto

```
src/
├── lib/
│   ├── brand.ts          ← ÚNICO archivo a editar para cambiar de marca
│   ├── supabase.ts       ← Cliente Supabase singleton
│   ├── validacion.ts     ← Utilidades de validación
│   └── niveles.ts        ← Colores de niveles (fuente única de verdad)
├── types/
│   └── index.ts          ← Tipos TypeScript de toda la plataforma
├── components/
│   ├── UserHeader.tsx    ← Header con menú desplegable por rol
│   ├── BrandPanel.tsx    ← Panel de marca en auth
│   ├── CookieBanner.tsx  ← Banner de cookies
│   └── public/
│       ├── PublicNav.tsx
│       └── PublicFooter.tsx
└── app/
    ├── (auth) login, registro, recuperar
    ├── (privadas) inicio, dashboard, cursos/[slug], avance, agenda, perfil, privacidad
    ├── (evaluaciones) evaluaciones/, evaluaciones/[id]/tomar, resultados
    ├── (social) chat/, chat/[id]
    ├── (admin) admin/, admin/cursos, admin/home, admin/usuarios, admin/reportes, admin/perfiles
    ├── (instructor) instructor/home, teacher/, teacher/evaluaciones, teacher/estudiantes, teacher/reportes
    └── (público) page, cursos, programas, eventos, nosotros, contacto, terminos, aviso-privacidad
```

---

## Migraciones SQL (ejecutar en orden)

| Archivo | Contenido |
|---|---|
| `001_initial_schema.sql` | Tablas base: profiles, cursos, módulos, lecciones, inscripciones, progreso, certificados, agenda |
| `002_evaluaciones_chat_notificaciones.sql` | Evaluaciones, preguntas, intentos, respuestas, chat, notificaciones, audit_log |
| `003_fixes_roles_rls.sql` | Fix RLS circular, función get_my_rol(), constraint instructor, sync emails |
| `004_security_grading_function.sql` | Calificación server-side, trigger automático |
| `005_lecciones_contenido_expandido.sql` | Tipos de contenido expandidos, tabla recursos_leccion |

---

## Mantenimiento

```bash
# Revisar vulnerabilidades (mensual)
npm audit

# Verificar build limpio
npm run typecheck && npm run lint && npm run build

# Actualizar dependencias (trimestral)
npm outdated
npm update
```

---

*White-Label LMS — Desarrollado con Next.js 16, Supabase y Vercel*
