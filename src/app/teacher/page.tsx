'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

export default function TeacherPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [cursos, setCursos] = useState<Array<{id:string;titulo:string;color:string;nivel:string;duracion_horas:number}>>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState(false)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol || '')) { router.push('/inicio'); return }
      setAcceso(true)
      const { data: c } = await supabase.from('cursos').select('*').order('orden')
      setCursos(c || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>
  if (!acceso) return null

  const stats = [
    { label: 'Mis cursos', val: cursos.length, color: 'var(--cyan)' },
    { label: 'Estudiantes', val: '—', color: 'var(--navy)' },
    { label: 'Tasa de aprobación', val: '—', color: 'var(--green)' },
    { label: 'Evaluaciones activas', val: '—', color: 'var(--purple)' },
  ]

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Instructor</div>
          <h1>Panel del instructor</h1>
          <p>Gestiona tus cursos y revisa el progreso de tus estudiantes.</p>
        </div>

        <div className="teacher-grid">
          {stats.map(s => (
            <div className="teacher-card" key={s.label}>
              <h3>{s.label}</h3>
              <div className="val" style={{color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{marginBottom:24}}>
          <h2 style={{color:'var(--navy)',fontSize:18,fontWeight:800,marginBottom:18}}>Mis cursos asignados</h2>
          {cursos.length === 0 ? (
            <p style={{color:'var(--gray)'}}>No tienes cursos asignados. Contacta al administrador.</p>
          ) : (
            <div className="adm-curso-list">
              {cursos.map(c => (
                <div key={c.id} className="adm-curso-row glass-card" style={{padding:0}}>
                  <div className="adm-curso-spine" style={{background:c.color}}/>
                  <div className="adm-curso-info">
                    <div className="adm-nivel" style={{color:c.color}}>{c.nivel}</div>
                    <div className="adm-curso-titulo">{c.titulo}</div>
                    <div className="adm-curso-meta"><span>{c.duracion_horas}h</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <h2 style={{color:'var(--navy)',fontSize:18,fontWeight:800,marginBottom:16}}>Actividad reciente</h2>
          <p style={{color:'var(--gray)',fontSize:15}}>Los reportes de progreso de estudiantes estarán disponibles en la Fase 4 del desarrollo.</p>
        </div>
      </main>
    </div>
  )
}
