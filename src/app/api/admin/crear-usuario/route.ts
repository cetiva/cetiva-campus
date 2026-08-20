import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // Verificar que quien llama es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    if (!perfil || perfil.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { nombre, apellidos, identificacion, email, password, rol } = await req.json()

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar si el correo ya existe
    const { data: existingUsers } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo.' }, { status: 400 })
    }

    // Crear usuario usando SQL directo via rpc
    const { data: newUserId, error: rpcError } = await adminClient.rpc('crear_usuario_admin', {
      p_email: email,
      p_password: password,
      p_nombre: nombre || '',
      p_apellidos: apellidos || '',
      p_identificacion: identificacion || '',
      p_rol: rol || 'estudiante'
    })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: newUserId })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
