'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Evaluacion, Intento } from '@/types'

export default function EvaluacionesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [evals, setEvals] = useState<(Evaluacion & { cursos?: { titulo: string } })[]>([])
  const [intentos, setIntentos] = useState<Intento[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      // Evaluaciones de cursos inscritos
      const { data: ins } = await supabase.from('inscripciones').select('curso_id').eq('usuario_id', user.id)
      const cursoIds = (ins || []).map((i: { curso_id: string }) => i.curso_id)
      if (cursoIds.length > 0) {
        const { data: ev } = await supabase.from('evaluaciones')
          .select('*, cursos(titulo)').in('curso_id', cursoIds).eq('publicado', true)
        setEvals(ev || [])
      }
      const { data: ints } = await supabase.from('intentos').select('*').eq('usuario_id', user.id)
      setIntentos(ints || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando evaluaciones…</div></div>

  function getIntento(evalId: string) {
    return intentos.filter(i => i.evaluacion_id === evalId).sort((a,b) => b.numero_intento - a.numero_intento)[0]
  }

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Estudiante</div>
          <h1>Mis evaluaciones</h1>
          <p>Evaluaciones disponibles en tus cursos inscritos.</p>
        </div>
        {evals.length === 0 ? (
          <div className="glass-card" style={{textAlign:'center',padding:'48px 24px',color:'var(--gray)'}}>
            <div style={{fontSize:40,marginBottom:12}}>📝</div>
            <p>No tienes evaluaciones disponibles aún.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {evals.map(ev => {
              const intento = getIntento(ev.id)
              const aprobado = intento?.aprobado
              const enviado = intento?.estado === 'enviado' || intento?.estado === 'calificado'
              const agotado = intento && intento.numero_intento >= ev.max_intentos && enviado
              return (
                <div key={ev.id} className="glass-card" style={{display:'flex',alignItems:'center',gap:20}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--cyan)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>
                      {(ev.cursos as { titulo?: string })?.titulo}
                    </div>
                    <div style={{fontSize:17,fontWeight:800,color:'var(--navy)',marginBottom:4}}>{ev.titulo}</div>
                    <div style={{fontSize:13,color:'var(--gray)',display:'flex',gap:16,flexWrap:'wrap'}}>
                      <span>Nota mínima: <strong>{ev.nota_minima}%</strong></span>
                      <span>Intentos: <strong>{intento?.numero_intento || 0}/{ev.max_intentos}</strong></span>
                      {ev.tiempo_limite && <span>Tiempo: <strong>{ev.tiempo_limite} min</strong></span>}
                      {intento && <span>Último resultado: <strong style={{color: aprobado ? 'var(--green)' : '#C0392B'}}>{intento.porcentaje?.toFixed(0)}%</strong></span>}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                    {intento && <span className={`badge ${aprobado ? 'badge-green' : 'badge-orange'}`}>{aprobado ? '✓ Aprobado' : enviado ? 'No aprobado' : 'En progreso'}</span>}
                    {!agotado && (
                      <button className="btn btn-cyan btn-sm" onClick={() => router.push(`/evaluaciones/${ev.id}/tomar`)}>
                        {intento && enviado ? 'Reintentar' : 'Comenzar'}
                      </button>
                    )}
                    {intento && enviado && (
                      <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/evaluaciones/${ev.id}/resultados`)}>Ver resultados</button>
                    )}
                    {agotado && !aprobado && <span style={{fontSize:13,color:'var(--gray)'}}>Sin intentos disponibles</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
