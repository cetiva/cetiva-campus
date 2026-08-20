'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

export default function AvancePage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [stats, setStats] = useState({ inscritos: 0, completados: 0, lecciones: 0, certificados: 0 })
  const [cursos, setCursos] = useState<Array<{ completado: boolean; cursos?: { titulo?: string; color?: string } }>>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      const { data: ins } = await supabase.from('inscripciones')
        .select('completado, curso_id, cursos(titulo, color, duracion_horas)').eq('usuario_id', user.id)
      const { count: lecc } = await supabase.from('progreso').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id)
      const { count: certs } = await supabase.from('certificados').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id)
      const lista = ins || []
      setCursos(lista as Array<{ completado: boolean; cursos?: { titulo?: string; color?: string } }>)
      setStats({ inscritos: lista.length, completados: lista.filter((i: {completado: boolean}) => i.completado).length, lecciones: lecc || 0, certificados: certs || 0 })
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando tu avance…</div></div>
  const pct = stats.inscritos ? Math.round((stats.completados / stats.inscritos) * 100) : 0

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Actividad</div>
          <h1>Mi avance</h1>
          <p>Tu progreso general en la formación.</p>
        </div>
        <div className="stats-row">
          <div className="stat-box"><b style={{ color: 'var(--cyan)' }}>{stats.inscritos}</b><span>Cursos inscritos</span></div>
          <div className="stat-box"><b style={{ color: 'var(--green)' }}>{stats.completados}</b><span>Completados</span></div>
          <div className="stat-box"><b style={{ color: 'var(--purple)' }}>{stats.lecciones}</b><span>Lecciones vistas</span></div>
          <div className="stat-box"><b style={{ color: 'var(--orange)' }}>{stats.certificados}</b><span>Certificados</span></div>
        </div>
        <div className="glass-card" style={{ marginTop: 20 }}>
          <h3 style={{ color: 'var(--navy)', marginBottom: 14, fontSize: 18 }}>Progreso general</h3>
          <div className="prog-bar"><div className="prog-fill" style={{ width: pct + '%' }}/></div>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>{pct}% de tus cursos completados</p>
        </div>
        <div className="glass-card" style={{ marginTop: 20 }}>
          <h3 style={{ color: 'var(--navy)', marginBottom: 16, fontSize: 18 }}>Mis cursos</h3>
          {cursos.length === 0 ? (
            <p style={{ color: 'var(--gray)' }}>Aún no te has inscrito. <a href="/dashboard" style={{ color: 'var(--cyan)', fontWeight: 700 }}>Explorar el catálogo →</a></p>
          ) : (
            <div className="avance-list">
              {cursos.map((c, i) => (
                <div key={i} className="avance-item">
                  <span className="avance-dot" style={{ background: c.cursos?.color || 'var(--cyan)' }}/>
                  <span className="avance-titulo">{c.cursos?.titulo || 'Curso'}</span>
                  <span className="avance-estado" style={{ color: c.completado ? 'var(--green)' : 'var(--gray)' }}>
                    {c.completado ? 'Completado ✓' : 'En progreso'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
