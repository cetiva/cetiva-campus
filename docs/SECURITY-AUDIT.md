# EBIME LAB — Auditoría de Seguridad y Rendimiento
**Fecha:** Agosto 2026 | **Stack:** Next.js 16 + Supabase + Vercel

---

## RESUMEN EJECUTIVO

| Categoría | Antes | Después |
|---|---|---|
| Vulnerabilidades críticas | 2 | 0 |
| Vulnerabilidades altas | 2 | 0 |
| Vulnerabilidades medias | 3 | 0 |
| Dependencias con CVE | 0 | 0 |
| Headers de seguridad | 0/7 | 7/7 |

---

## CAPA 1 — INFRAESTRUCTURA (Vercel + Supabase)

### Fortalezas
- HTTPS/TLS 1.3 obligatorio — Vercel lo fuerza en todos los dominios
- DDoS protection — Vercel Edge Network
- No hay servidor propio — sin SSH, sin puertos expuestos directamente
- WAF básico incluido en Vercel

### Puertos
No hay puertos que gestionar. Todo tráfico es HTTPS/443 vía CDN de Vercel.
Supabase usa pooler en 5432 internamente — nunca expuesto al cliente.

### Recomendaciones
- Activar Vercel Firewall con rate limiting por IP
- Configurar alertas de Supabase para queries lentas

---

## CAPA 2 — BASE DE DATOS

### CRÍTICO RESUELTO: Policy RLS con referencia circular
La policy profiles_select_admin hacía SELECT FROM profiles dentro de una policy de profiles creando un loop.
Fix: función get_my_rol() con SECURITY DEFINER.

### CRÍTICO RESUELTO: CHECK constraint sin instructor
profiles.rol solo aceptaba estudiante|admin. Cambiar a instructor fallaba silenciosamente.
Fix: ALTER TABLE con nuevo constraint incluyendo instructor.

### MEDIO RESUELTO: Emails vacíos en profiles
Usuarios sin email en profiles no aparecían en el admin.
Fix: UPDATE masivo sincronizando con auth.users.

### Estado RLS: TODAS las tablas tienen RLS activo con DENY BY DEFAULT.

---

## CAPA 3 — BACKEND

### CRÍTICO RESUELTO: Respuestas correctas expuestas al cliente
La query de /evaluaciones/[id]/tomar traía es_correcta:true al navegador.
Un estudiante podía ver las respuestas en DevTools > Network antes de terminar.

Fix implementado:
1. Query excluye es_correcta: select id, texto, orden sin el campo
2. Función PostgreSQL calificar_intento() con SECURITY DEFINER califica en servidor
3. Trigger trg_auto_calificar ejecuta la calificación automáticamente

### ALTO RESUELTO: Open redirect en auth callback
?next=https://malicious.com podía redirigir a sitios externos.
Fix: next debe empezar con / y no con //.

### ALTO RESUELTO: Sin headers de seguridad
Fix: 7 headers en next.config.ts
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=63072000
- Content-Security-Policy: default-src self...

### MEDIO RESUELTO: Brute force en login
Fix: delay de 1 segundo en cada fallo + Supabase rate limiting nativo.

### MEDIO RESUELTO: Validación de archivos insuficiente
Fix: whitelist de MIME types + límite de 5MB validado en JavaScript.

---

## CAPA 4 — FRONTEND

### MEDIO RESUELTO: console.error en producción
Fix: solo se ejecuta en NODE_ENV development.

### Fortalezas existentes
- Sin dangerouslySetInnerHTML en todo el codebase
- Validación de inputs en 40+ lugares
- TypeScript estricto
- Tokens JWT gestionados por @supabase/ssr, nunca en localStorage
- Sin contraseñas almacenadas — todo en Supabase Auth (bcrypt)

---

## AUTENTICACIÓN

| Mecanismo | Estado |
|---|---|
| Contraseñas bcrypt | OK — Supabase Auth |
| JWT con expiración 1h | OK |
| Cookies HttpOnly | OK — @supabase/ssr |
| Protección server-side | OK — proxy.ts |
| Validación de rol en servidor | OK — proxy consulta BD |
| Rate limiting | OK — Supabase + delay manual |
| MFA | PENDIENTE — recomendado para admin |

---

## ANÁLISIS DE RENDIMIENTO

### Estado actual
- 41 rutas | 32 estáticas | 6 dinámicas
- 0 vulnerabilidades npm audit
- 0 errores TypeScript

### Optimizaciones pendientes
1. Migrar 12 tags img a Image de Next.js (WebP automático, lazy loading)
2. Paginación en admin/usuarios cuando supere 100 registros
3. Activar Vercel Analytics para Core Web Vitals reales

---

## MANTENIMIENTO — CHECKLIST MENSUAL

```
Seguridad:
[ ] npm audit
[ ] Revisar logs Supabase (errores 5xx, queries lentas)
[ ] Verificar que nuevas tablas tienen RLS activo
[ ] Comprobar que SUPABASE_SERVICE_ROLE_KEY no está en código cliente

Calidad:
[ ] npm run typecheck
[ ] npm run lint
[ ] npm run build
[ ] Revisar que .env.local no está en git

Trimestral:
[ ] npm outdated — actualizar dependencias menores
[ ] Revisar Core Web Vitals en Vercel Analytics
[ ] Backup de esquema SQL de Supabase
```

## ANTE INCIDENTE

```
1. Rotar SUPABASE_SERVICE_ROLE_KEY en Vercel inmediatamente
2. Supabase > Auth > Revoke all tokens
3. Revisar audit_log en BD
4. Notificar usuarios afectados (LFPDPPP art. 20 — 72h)
```

## CLASIFICACIÓN DE VARIABLES DE ENTORNO

| Variable | Exposición | Riesgo |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Pública | Bajo — RLS protege datos |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Pública | Bajo — RLS limita acceso |
| SUPABASE_SERVICE_ROLE_KEY | Solo servidor | CRÍTICO — bypasa RLS |

SUPABASE_SERVICE_ROLE_KEY no aparece en ningún archivo cliente — verificado.
