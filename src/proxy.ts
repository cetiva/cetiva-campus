import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que requieren autenticación (cualquier usuario)
// IMPORTANTE: usar rutas exactas o con / al final para evitar falsos positivos
// Ej: '/privacidad' NO debe capturar '/aviso-privacidad'
const PROTECTED_AUTH = [
  '/home', '/inicio', '/dashboard', '/avance', '/agenda',
  '/perfil', '/privacidad', '/cursos/', '/evaluaciones',
  '/certificados', '/chat',
]

// Rutas públicas explícitas — NUNCA redirigir aunque otras reglas coincidan
const PUBLIC_ROUTES = [
  '/terminos', '/aviso-privacidad', '/preferencias-cookies',
  '/contacto', '/nosotros', '/cursos', '/programas', '/eventos',
  '/verificar/', '/login', '/registro', '/recuperar',
]

// Rutas que requieren rol admin
const PROTECTED_ADMIN = ['/admin']

// Rutas que requieren rol instructor o admin
const PROTECTED_INSTRUCTOR = ['/teacher', '/instructor']

// Rutas de auth — redirigen al home si ya estás logueado
const AUTH_ROUTES = ['/login', '/registro', '/recuperar']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(c) {
          c.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          c.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Sin sesión → login
  // Primero verificar si es ruta pública explícita (nunca redirigir)
  const isPublic = PUBLIC_ROUTES.some(p => path.startsWith(p))
  if (isPublic) return response

  const needsAuth = [...PROTECTED_AUTH, ...PROTECTED_ADMIN, ...PROTECTED_INSTRUCTOR]
    .some(p => path.startsWith(p))
  if (needsAuth && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión en auth routes → home
  const isAuthRoute = AUTH_ROUTES.some(p => path.startsWith(p))
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Protección de rutas por rol — verificar perfil
  const needsRole = [...PROTECTED_ADMIN, ...PROTECTED_INSTRUCTOR]
    .some(p => path.startsWith(p))
  if (needsRole && user) {
    const { data: perfil } = await supabase
      .from('profiles').select('rol').eq('id', user.id).single()
    const rol = perfil?.rol || 'estudiante'

    if (PROTECTED_ADMIN.some(p => path.startsWith(p)) && rol !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    if (PROTECTED_INSTRUCTOR.some(p => path.startsWith(p)) && !['admin','instructor'].includes(rol)) {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
