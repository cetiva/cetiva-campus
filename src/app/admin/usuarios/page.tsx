'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

type NuevoUsuario = { nombre: string; apellidos: string; identificacion: string; email: string; password: string; rol: string }

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [toast, setToast] = useState('')
  const [toastError, setToastError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [creando, setCreando] = useState(false)
  const [nuevo, setNuevo] = useState<NuevoUsuario>({
    nombre: '', apellidos: '', identificacion: '', email: '', password: '', rol: 'estudiante'
  })

  function setN(k: keyof NuevoUsuario, v: string) { setNuevo(f => ({ ...f, [k]: v })) }

  async function cargarUsuarios() {
    const { data } = await createClient().from('profiles').select('*').order('created_at', { ascending: false })
    setUsuarios(data || [])
  }

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || p.rol !== 'admin') { router.push('/inicio'); return }
      await cargarUsuarios()
      setCargando(false)
    }
    cargar()
  }, [router])

  async function cambiarRol(uid: string, nuevoRol: string) {
    await createClient().from('profiles').update({ rol: nuevoRol }).eq('id', uid)
    await cargarUsuarios()
    setToast('Rol actualizado')
    setTimeout(() => setToast(''), 2500)
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setToastError('')
    if (!nuevo.nombre || !nuevo.apellidos || !nuevo.email || !nuevo.password) {
      setToastError('Nombre, apellidos, correo y contraseña son obligatorios.')
      return
    }
    if (nuevo.password.length < 8) {
      setToastError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setCreando(true)
    try {
      const res = await fetch('/api/admin/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo),
      })
      const data = await res.json()
      if (!res.ok) {
        setToastError(data.error || 'No se pudo crear el usuario.')
        setCreando(false)
        return
      }
      setToast('Usuario creado exitosamente')
      setMostrarForm(false)
      setNuevo({ nombre: '', apellidos: '', identificacion: '', email: '', password: '', rol: 'estudiante' })
      await cargarUsuarios()
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToastError('Error de conexión. Intenta de nuevo.')
    }
    setCreando(false)
  }

  const filtrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellidos} ${u.email}`.toLowerCase().includes(filtro.toLowerCase())
  )

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando usuarios…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <div className="eyebrow">Administración</div>
            <h1>Gestión de usuarios</h1>
            <p>{usuarios.length} usuarios registrados en la plataforma.</p>
          </div>
          <button className="btn btn-cyan" onClick={() => { setMostrarForm(!mostrarForm); setToastError('') }}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo usuario'}
          </button>
        </div>

        {toast && <div className="msg msg-ok" style={{marginBottom:16}}>{toast}</div>}
        {toastError && <div className="msg msg-error" style={{marginBottom:16}}>{toastError}</div>}

        {mostrarForm && (
          <div className="glass-card" style={{marginBottom:24,padding:28}}>
            <h3 style={{marginBottom:20,fontSize:18,fontWeight:700,color:'var(--navy)'}}>Crear nuevo usuario</h3>
            <form onSubmit={crearUsuario} noValidate>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                <div className="field">
                  <label>Nombre *</label>
                  <input required value={nuevo.nombre} onChange={e => setN('nombre', e.target.value)} />
                </div>
                <div className="field">
                  <label>Apellidos *</label>
                  <input required value={nuevo.apellidos} onChange={e => setN('apellidos', e.target.value)} />
                </div>
                <div className="field">
                  <label>Identificación</label>
                  <input value={nuevo.identificacion} onChange={e => setN('identificacion', e.target.value)} placeholder="CC, CE o pasaporte" />
                </div>
                <div className="field">
                  <label>Rol</label>
                  <select value={nuevo.rol} onChange={e => setN('rol', e.target.value)}
                    style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:15,width:'100%',color:'var(--navy)',fontWeight:700}}>
                    <option value="estudiante">Estudiante</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field">
                  <label>Correo electrónico *</label>
                  <input type="email" required value={nuevo.email} onChange={e => setN('email', e.target.value)} placeholder="usuario@correo.com" />
                </div>
                <div className="field">
                  <label>Contraseña * (mín. 8 caracteres)</label>
                  <input type="password" required value={nuevo.password} onChange={e => setN('password', e.target.value)} placeholder="Mín. 8 caracteres" />
                </div>
              </div>
              <button className="btn btn-cyan" type="submit" disabled={creando}>
                {creando ? 'Creando…' : 'Crear usuario'}
              </button>
            </form>
          </div>
        )}

        <div className="glass-card" style={{marginBottom:16}}>
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            style={{width:'100%',padding:'11px 16px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:15}}/>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Profesión</th><th>Ciudad</th><th>Rol</th><th>Registro</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--gray)'}}>Sin resultados</td></tr>
              ) : filtrados.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:700}}>{u.nombre} {u.apellidos}</td>
                  <td style={{color:'var(--gray)',fontSize:13}}>{u.email}</td>
                  <td style={{color:'var(--gray)'}}>{u.profesion || '—'}</td>
                  <td style={{color:'var(--gray)'}}>{u.ciudad || '—'}</td>
                  <td>
                    <select value={u.rol || 'estudiante'} onChange={e => cambiarRol(u.id, e.target.value)}
                      style={{padding:'4px 8px',borderRadius:8,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:13,fontWeight:700,color:'var(--navy)'}}>
                      <option value="estudiante">Estudiante</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{color:'var(--gray)',fontSize:13}}>{u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
