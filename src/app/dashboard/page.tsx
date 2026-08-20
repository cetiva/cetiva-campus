'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Curso } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [inscritos, setInscritos] = useState<Set<string>>(new Set())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p || { id: user.id, nombre: user.email || '', apellidos: '' })
      const { data: c } = await supabase.from('cursos').select('*').eq('publicado', true).order('orden')
      setCursos(c || [])
      const { data: ins } = await supabase.from('inscripciones').select('curso_id').eq('usuario_id', user.id)
      setInscritos(new Set((ins || []).map((i: { curso_id: string }) => i.curso_id)))
      setCargando(false)
    }
    cargar()
  }, [router])

  async function inscribir(cursoId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('inscripciones').insert({ usuario_id: user.id, curso_id: cursoId })
    setInscritos(s => new Set(s).add(cursoId))
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando tu formación…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Mis cursos</div>
          <h1>Catálogo de cursos</h1>
          <p>Inscríbete en un curso y empieza tu ruta de aprendizaje.</p>
        </div>

        {cursos.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', color: 'var(--gray)' }}>
            Aún no hay cursos disponibles. Vuelve pronto.
          </div>
        ) : (
          <div className="dash-grid">
            {cursos.map(c => {
              const yaInscrito = inscritos.has(c.id)
              return (
                <article key={c.id} className="curso-card">
                  <div className="curso-spine" style={{ background: c.color }}/>
                  <div className="curso-body">
                    <div className="curso-nivel" style={{ color: c.color }}>{c.nivel}</div>
                    <h3>{c.titulo}</h3>
                    <p>{c.descripcion}</p>
                    <div className="curso-precio">
                      {c.es_gratis
                        ? <span className="precio-gratis">Gratis</span>
                        : <span className="precio-pago">${Number(c.precio).toLocaleString('es-CO')} COP</span>}
                    </div>
                    <div className="curso-meta">
                      <span>{c.duracion_horas} h</span>
                      {yaInscrito ? (
                        <span className="curso-go" style={{ color: c.color, cursor: 'pointer' }}
                          onClick={() => router.push(`/cursos/${c.slug}`)}>Continuar →</span>
                      ) : (
                        <button className="curso-btn" style={{ background: c.color }} onClick={() => inscribir(c.id)}>
                          {c.es_gratis ? 'Inscribirme' : 'Comprar'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
