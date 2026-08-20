'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Evaluacion, Intento, Pregunta, Respuesta } from '@/types'

export default function ResultadosPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [ev, setEv] = useState<Evaluacion|null>(null)
  const [intento, setIntento] = useState<Intento|null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [respuestas, setRespuestas] = useState<Respuesta[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      const { data: evData } = await supabase.from('evaluaciones').select('*').eq('id', id).single()
      setEv(evData)
      const { data: intentos } = await supabase.from('intentos').select('*')
        .eq('evaluacion_id', id).eq('usuario_id', user.id).order('numero_intento', { ascending: false }).limit(1)
      const ultimo = intentos?.[0]
      setIntento(ultimo || null)
      if (ultimo) {
        const { data: resps } = await supabase.from('respuestas').select('*').eq('intento_id', ultimo.id)
        setRespuestas(resps || [])
      }
      const { data: pData } = await supabase.from('preguntas')
        .select('*, opciones_pregunta(*)').eq('evaluacion_id', id).order('orden')
      setPreguntas((pData || []).map((p: Pregunta & { opciones_pregunta?: unknown[] }) => ({...p, opciones: p.opciones_pregunta || []})))
      setCargando(false)
    }
    cargar()
  }, [id, router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando resultados…</div></div>
  if (!intento) return <div className="priv-bg"><div className="dash-loading">Sin resultados disponibles.</div></div>

  const pendienteCalif = intento.estado === 'enviado'
  const pct = intento.porcentaje?.toFixed(1)
  const aprobado = intento.aprobado

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main style={{maxWidth:780,margin:'0 auto',padding:'40px 24px 80px'}}>
        {/* Resumen */}
        <div className="glass-card" style={{textAlign:'center',marginBottom:28,padding:'40px 28px'}}>
          <div style={{fontSize:56,marginBottom:12}}>
            {pendienteCalif ? '⏳' : aprobado ? '🎉' : '📋'}
          </div>
          <h1 style={{fontSize:28,fontWeight:900,color:'var(--navy)',marginBottom:8}}>{ev?.titulo}</h1>
          {pendienteCalif ? (
            <p style={{color:'var(--gray)',fontSize:16}}>Tu evaluación fue enviada y está pendiente de calificación por el docente.</p>
          ) : (
            <>
              <div style={{fontSize:52,fontWeight:900,color: aprobado ? 'var(--green)' : '#C0392B',lineHeight:1}}>{pct}%</div>
              <div style={{fontSize:16,color:'var(--gray)',marginTop:4}}>{intento.puntaje} / {intento.puntaje_maximo} puntos</div>
              <div style={{marginTop:16}}>
                <span className={`badge ${aprobado ? 'badge-green' : 'badge-orange'}`} style={{fontSize:15,padding:'6px 18px'}}>
                  {aprobado ? '✓ Aprobado' : '✗ No aprobado'} · Nota mínima: {ev?.nota_minima}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Detalle por pregunta */}
        {!pendienteCalif && ev?.mostrar_feedback && preguntas.map((p, idx) => {
          const resp = respuestas.find(r => r.pregunta_id === p.id)
          const correcta = resp?.es_correcta
          return (
            <div key={p.id} className="glass-card" style={{marginBottom:14,borderLeft:`4px solid ${correcta === true ? 'var(--green)' : correcta === false ? '#C0392B' : 'var(--gray)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:12,color:'var(--gray)',fontWeight:700}}>Pregunta {idx+1}</span>
                <span style={{fontSize:13,fontWeight:700,color: correcta === true ? 'var(--green)' : correcta === false ? '#C0392B' : 'var(--gray)'}}>
                  {correcta === true ? `+${resp?.puntos_obtenidos} pts` : correcta === false ? '0 pts' : 'Pendiente'}
                </span>
              </div>
              <p style={{fontWeight:700,color:'var(--ink)',marginBottom:10}}>{p.enunciado}</p>
              {p.explicacion && correcta === false && (
                <div style={{background:'rgba(22,163,196,.06)',borderRadius:10,padding:'10px 14px',fontSize:14,color:'var(--ink)'}}>
                  <strong>Explicación:</strong> {p.explicacion}
                </div>
              )}
            </div>
          )
        })}

        <div style={{display:'flex',gap:12,marginTop:24}}>
          <button className="btn btn-navy" onClick={() => router.push('/evaluaciones')}>Volver a evaluaciones</button>
          <button className="btn btn-ghost" onClick={() => router.push('/avance')}>Ver mi avance</button>
        </div>
      </main>
    </div>
  )
}
