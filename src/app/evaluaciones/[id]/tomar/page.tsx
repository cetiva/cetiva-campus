'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Evaluacion, Pregunta, OpcionPregunta, Intento } from '@/types'

type RespLocal = { texto?: string; opciones: string[] }

export default function TomarEvaluacionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [ev, setEv] = useState<Evaluacion|null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [respuestas, setRespuestas] = useState<Record<string, RespLocal>>({})
  const [intento, setIntento] = useState<Intento|null>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState<number|null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const [userId, setUserId] = useState<string>('')

  const enviar = useCallback(async () => {
    if (!intento || enviando) return
    setEnviando(true)
    const supabase = createClient()
    const preg = preguntas
    let puntajeMax = 0

    // Guardar respuestas y calificar automáticamente
    // SEGURIDAD: Las respuestas se guardan SIN calificar en el cliente
    // La calificación real la hace la DB Function en el servidor
    for (const p of preg) {
      puntajeMax += p.puntos
      const resp = respuestas[p.id]

      // Solo guardamos qué seleccionó el usuario — sin calcular si es correcto
      await supabase.from('respuestas').insert({
        intento_id: intento.id, pregunta_id: p.id, usuario_id: userId,
        respuesta_texto: resp?.texto || null,
        opciones_sel: resp?.opciones || [],
        es_correcta: null,      // Se calcula en el servidor
        puntos_obtenidos: 0,    // Se calcula en el servidor
      })
    }

    const tieneAbiertas = preg.some(p => ['respuesta_corta','respuesta_larga'].includes(p.tipo))
    const estado = 'enviado' // Siempre enviado — el servidor califica via trigger
    const porcentaje = 0     // El servidor lo calcula
    const aprobado = false   // El servidor lo calcula

    await supabase.from('intentos').update({
      estado, puntaje: null, puntaje_maximo: puntajeMax,
      porcentaje: null, aprobado: null,
      enviado_en: new Date().toISOString(),
    }).eq('id', intento.id)

    if (timerRef.current) clearInterval(timerRef.current)
    router.push(`/evaluaciones/${id}/resultados`)
  }, [intento, enviando, preguntas, respuestas, ev, id, userId, router])

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: evData } = await supabase.from('evaluaciones').select('*').eq('id', id).single()
      if (!evData) { router.push('/evaluaciones'); return }
      setEv(evData)

      // SEGURIDAD: NO traer es_correcta al cliente — se califica en el servidor vía RLS
      // Solo traemos id, texto y orden de opciones
      const { data: pData } = await supabase.from('preguntas')
        .select('id, evaluacion_id, tipo, enunciado, puntos, orden, opciones_pregunta(id, texto, orden)')
        .eq('evaluacion_id', id).order('orden')
      const preguntasData = (pData || []).map((p: Pregunta & { opciones_pregunta?: OpcionPregunta[] }) => ({
        ...p, opciones: p.opciones_pregunta || []
      }))
      const lista = evData.aleatorizar
        ? [...preguntasData].sort(() => Math.random() - 0.5)
        : preguntasData
      setPreguntas(lista)

      // Crear intento
      const { data: intentosExist } = await supabase.from('intentos')
        .select('*').eq('evaluacion_id', id).eq('usuario_id', user.id).order('numero_intento', { ascending: false }).limit(1)
      const numIntento = intentosExist && intentosExist.length > 0 ? intentosExist[0].numero_intento + 1 : 1
      const { data: nuevoIntento } = await supabase.from('intentos').insert({
        evaluacion_id: id, usuario_id: user.id, numero_intento: numIntento, estado: 'en_progreso'
      }).select().single()
      setIntento(nuevoIntento)

      if (evData.tiempo_limite) {
        setTiempoRestante(evData.tiempo_limite * 60)
      }
      setCargando(false)
    }
    cargar()
  }, [id, router])

  useEffect(() => {
    if (tiempoRestante === null) return
    timerRef.current = setInterval(() => {
      setTiempoRestante(t => {
        if (t !== null && t <= 1) { enviar(); return 0 }
        return t !== null ? t - 1 : null
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [tiempoRestante, enviar])

  function setOpcion(pregId: string, opcionId: string, tipo: string) {
    setRespuestas(prev => {
      const curr = prev[pregId] || { opciones: [] }
      if (tipo === 'seleccion_unica' || tipo === 'verdadero_falso') {
        return { ...prev, [pregId]: { ...curr, opciones: [opcionId] } }
      } else {
        const sel = curr.opciones.includes(opcionId)
          ? curr.opciones.filter(o => o !== opcionId)
          : [...curr.opciones, opcionId]
        return { ...prev, [pregId]: { ...curr, opciones: sel } }
      }
    })
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Preparando evaluación…</div></div>

  const formatTiempo = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  const respondidas = Object.keys(respuestas).filter(k => respuestas[k].opciones.length > 0 || respuestas[k].texto?.trim()).length

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>

      {/* Header fijo */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,.96)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--line)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontWeight:800,color:'var(--navy)',fontSize:16}}>{ev?.titulo}</div>
          <div style={{fontSize:13,color:'var(--gray)'}}>{respondidas}/{preguntas.length} respondidas</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          {tiempoRestante !== null && (
            <div style={{fontWeight:800,fontSize:18,color: tiempoRestante < 60 ? '#C0392B' : 'var(--navy)'}}>
              ⏱ {formatTiempo(tiempoRestante)}
            </div>
          )}
          <button className="btn btn-cyan" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar evaluación'}
          </button>
        </div>
      </div>

      <main style={{maxWidth:780,margin:'0 auto',padding:'32px 24px 80px'}}>
        {ev?.instrucciones && (
          <div className="glass-card" style={{marginBottom:24,background:'rgba(22,163,196,.06)',border:'1px solid rgba(22,163,196,.2)'}}>
            <p style={{fontSize:14,color:'var(--ink)'}}><strong>Instrucciones:</strong> {ev.instrucciones}</p>
          </div>
        )}

        {preguntas.map((p, idx) => {
          const resp = respuestas[p.id] || { opciones: [] }
          return (
            <div key={p.id} className="glass-card" style={{marginBottom:18}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--gray)',textTransform:'uppercase',letterSpacing:'.1em'}}>
                  Pregunta {idx+1} · {p.puntos} punto{p.puntos !== 1 ? 's' : ''}
                </span>
                <span style={{fontSize:11,fontWeight:700,background:'rgba(36,69,154,.08)',color:'var(--navy)',padding:'2px 10px',borderRadius:99}}>
                  {p.tipo.replace(/_/g,' ')}
                </span>
              </div>
              <p style={{fontWeight:700,color:'var(--ink)',fontSize:16,marginBottom:16,lineHeight:1.5}}>{p.enunciado}</p>

              {/* Opciones */}
              {['seleccion_unica','seleccion_multiple','verdadero_falso'].includes(p.tipo) && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(p.opciones || []).map(op => {
                    const sel = resp.opciones.includes(op.id)
                    return (
                      <button key={op.id} onClick={() => setOpcion(p.id, op.id, p.tipo)}
                        style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:12,
                          border:`2px solid ${sel ? 'var(--cyan)' : 'var(--line)'}`,
                          background: sel ? 'rgba(22,163,196,.08)' : '#fff',
                          textAlign:'left',cursor:'pointer',transition:'all .15s'}}>
                        <span style={{width:22,height:22,borderRadius: p.tipo === 'seleccion_multiple' ? 6 : '50%',
                          border:`2px solid ${sel ? 'var(--cyan)' : 'var(--line)'}`,
                          background: sel ? 'var(--cyan)' : 'transparent',flexShrink:0,
                          display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12}}>
                          {sel && '✓'}
                        </span>
                        <span style={{fontSize:15,color:'var(--ink)'}}>{op.texto}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Respuesta abierta */}
              {['respuesta_corta','respuesta_larga'].includes(p.tipo) && (
                <textarea
                  placeholder={p.tipo === 'respuesta_corta' ? 'Escribe tu respuesta…' : 'Desarrolla tu respuesta…'}
                  value={resp.texto || ''}
                  onChange={e => setRespuestas(prev => ({...prev,[p.id]:{...(prev[p.id]||{opciones:[]}),texto:e.target.value}}))}
                  style={{width:'100%',minHeight: p.tipo === 'respuesta_larga' ? 140 : 70,padding:'12px 16px',
                    borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:15,resize:'vertical'}}
                />
              )}
            </div>
          )
        })}

        <button className="btn btn-cyan btn-block" onClick={enviar} disabled={enviando} style={{marginTop:8}}>
          {enviando ? 'Enviando…' : `Enviar evaluación (${respondidas}/${preguntas.length} respondidas)`}
        </button>
      </main>
    </div>
  )
}
