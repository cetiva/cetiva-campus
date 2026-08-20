'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import { limpiarTexto } from '@/lib/validacion'
import type { Perfil } from '@/types'

type Form = { nombre:string; apellidos:string; profesion:string; institucion:string; ciudad:string; telefono:string }

export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [form, setForm] = useState<Form>({ nombre:'', apellidos:'', profesion:'', institucion:'', ciudad:'', telefono:'' })
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setPerfil(p)
        setForm({ nombre:p.nombre||'', apellidos:p.apellidos||'', profesion:p.profesion||'', institucion:p.institucion||'', ciudad:p.ciudad||'', telefono:p.telefono||'' })
      }
      setCargando(false)
    }
    cargar()
  }, [router])

  function set(k: keyof Form, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setMsg(''); setGuardando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      nombre: limpiarTexto(form.nombre, 80), apellidos: limpiarTexto(form.apellidos, 80),
      profesion: limpiarTexto(form.profesion, 80), institucion: limpiarTexto(form.institucion, 200),
      ciudad: limpiarTexto(form.ciudad, 100), telefono: limpiarTexto(form.telefono, 30),
    }).eq('id', user.id)
    setGuardando(false)
    setMsg(error ? 'error' : 'ok')
    if (!error) setPerfil(p => p ? { ...p, ...form } : p)
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando tu perfil…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Gestionar perfil</div>
          <h1>Editar perfil</h1>
          <p>Actualiza tus datos personales.</p>
        </div>
        <div className="glass-card">
          {msg === 'ok' && <div className="msg msg-ok">Perfil actualizado correctamente.</div>}
          {msg === 'error' && <div className="msg msg-error">No pudimos guardar. Inténtalo de nuevo.</div>}
          <form onSubmit={guardar} noValidate>
            <div className="grid2">
              <div className="field"><label>Nombre</label><input required value={form.nombre} onChange={e => set('nombre', e.target.value)}/></div>
              <div className="field"><label>Apellidos</label><input required value={form.apellidos} onChange={e => set('apellidos', e.target.value)}/></div>
            </div>
            <div className="grid2">
              <div className="field"><label>Profesión</label><input value={form.profesion} onChange={e => set('profesion', e.target.value)}/></div>
              <div className="field"><label>Ciudad</label><input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}/></div>
            </div>
            <div className="field"><label>Institución</label><input value={form.institucion} onChange={e => set('institucion', e.target.value)}/></div>
            <div className="field"><label>Teléfono</label><input value={form.telefono} onChange={e => set('telefono', e.target.value)}/></div>
            <button className="btn btn-navy" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
