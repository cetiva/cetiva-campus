'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import { validarPassword } from '@/lib/validacion'
import type { Perfil } from '@/types'

export const dynamic = 'force-dynamic'

type Tab = 'prefs' | 'password' | 'eliminar'

export default function PrivacidadPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [prefs, setPrefs] = useState({ perfil_publico: false, recibir_correos: true })
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [pw, setPw] = useState({ nueva:'', repetir:'' })
  const [pwMsg, setPwMsg] = useState({ tipo:'', texto:'' })
  const [pwGuardando, setPwGuardando] = useState(false)
  const [confirmarTexto, setConfirmarTexto] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [tab, setTab] = useState<Tab>('prefs')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) { setPerfil(p); setPrefs({ perfil_publico: p.perfil_publico??false, recibir_correos: p.recibir_correos??true }) }
      setCargando(false)
    }
    cargar()
  }, [router])

  async function alternar(k: 'perfil_publico'|'recibir_correos') {
    const nuevo = { ...prefs, [k]: !prefs[k] }
    setPrefs(nuevo)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ [k]: nuevo[k] }).eq('id', user.id)
    setMsg('Preferencias guardadas.')
    setTimeout(() => setMsg(''), 2000)
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg({ tipo:'', texto:'' })
    const err = validarPassword(pw.nueva)
    if (err) { setPwMsg({ tipo:'error', texto:err }); return }
    if (pw.nueva !== pw.repetir) { setPwMsg({ tipo:'error', texto:'Las contraseñas no coinciden.' }); return }
    setPwGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pw.nueva })
    setPwGuardando(false)
    if (error) setPwMsg({ tipo:'error', texto:'No pudimos actualizar. Inténtalo de nuevo.' })
    else { setPwMsg({ tipo:'ok', texto:'Contraseña actualizada correctamente.' }); setPw({ nueva:'', repetir:'' }) }
  }

  async function eliminarCuenta() {
    if (confirmarTexto !== 'ELIMINAR') return
    setEliminando(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Configuración</div>
          <h1>Privacidad y seguridad</h1>
          <p>Gestiona tus preferencias y datos personales.</p>
        </div>
        <div className="perfil-tabs">
          <button className={tab==='prefs'?'active':''} onClick={() => setTab('prefs')}>Preferencias</button>
          <button className={tab==='password'?'active':''} onClick={() => setTab('password')}>Cambiar contraseña</button>
          <button className={tab==='eliminar'?'active':''} onClick={() => setTab('eliminar')}>Eliminar cuenta</button>
        </div>
        {tab === 'prefs' && (
          <div className="glass-card">
            {msg && <div className="msg msg-ok">{msg}</div>}
            {(['perfil_publico','recibir_correos'] as const).map(k => (
              <div className="priv-opt" key={k}>
                <div>
                  <b>{k==='perfil_publico'?'Perfil público':'Recibir correos'}</b>
                  <span>{k==='perfil_publico'?'Permite que otros vean tu perfil.':'Recibe novedades y actualizaciones de cursos.'}</span>
                </div>
                <button className={`toggle${prefs[k]?' on':''}`} onClick={() => alternar(k)}>
                  <span className="toggle-dot"/>
                </button>
              </div>
            ))}
          </div>
        )}
        {tab === 'password' && (
          <div className="glass-card">
            {pwMsg.texto && <div className={`msg msg-${pwMsg.tipo==='ok'?'ok':'error'}`}>{pwMsg.texto}</div>}
            <form onSubmit={cambiarPassword} noValidate>
              <div className="field"><label>Nueva contraseña</label><input type="password" required value={pw.nueva} onChange={e => setPw(p => ({...p,nueva:e.target.value}))} placeholder="Mín. 8: mayúscula, minúscula, número"/></div>
              <div className="field"><label>Repetir contraseña</label><input type="password" required value={pw.repetir} onChange={e => setPw(p => ({...p,repetir:e.target.value}))}/></div>
              <button className="btn btn-navy" type="submit" disabled={pwGuardando}>{pwGuardando?'Actualizando…':'Actualizar contraseña'}</button>
            </form>
          </div>
        )}
        {tab === 'eliminar' && (
          <div className="glass-card danger-zone">
            <h3>Eliminar cuenta</h3>
            <p>Esta acción es permanente e irreversible. Se eliminarán tu perfil, inscripciones y progreso.</p>
            <div className="field" style={{marginTop:20}}>
              <label>Escribe <strong>ELIMINAR</strong> para confirmar</label>
              <input value={confirmarTexto} onChange={e => setConfirmarTexto(e.target.value)} placeholder="ELIMINAR"/>
            </div>
            <button className="btn btn-danger" disabled={confirmarTexto!=='ELIMINAR'||eliminando} onClick={eliminarCuenta}>
              {eliminando?'Eliminando…':'Eliminar mi cuenta'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
