'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Evaluacion, Pregunta, OpcionPregunta } from '@/types'

type TipoPregunta = 'seleccion_unica'|'seleccion_multiple'|'verdadero_falso'|'respuesta_corta'|'respuesta_larga'

const TIPOS: Record<TipoPregunta, string> = {
  seleccion_unica: 'Selección única', seleccion_multiple: 'Selección múltiple',
  verdadero_falso: 'Verdadero / Falso', respuesta_corta: 'Respuesta corta', respuesta_larga: 'Respuesta larga'
}

function ModalCrearEval({ cursos, onCrear, onCerrar }: {
  cursos: Array<{id:string;titulo:string}>
  onCrear: (data: Partial<Evaluacion>) => void
  onCerrar: () => void
}) {
  const [f, setF] = useState({ titulo:'', curso_id:'', nota_minima:'60', max_intentos:'1', tiempo_limite:'', aleatorizar:false, instrucciones:'' })
  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="adm-modal">
        <div className="adm-modal-hd"><h2>Nueva evaluación</h2><button className="adm-modal-close" onClick={onCerrar}>✕</button></div>
        <div className="adm-modal-body">
          <form onSubmit={e => { e.preventDefault(); onCrear({ titulo:f.titulo, curso_id:f.curso_id||undefined, nota_minima:Number(f.nota_minima), max_intentos:Number(f.max_intentos), tiempo_limite:f.tiempo_limite?Number(f.tiempo_limite):undefined, aleatorizar:f.aleatorizar, instrucciones:f.instrucciones||undefined }) }}>
            <div className="field"><label>Título</label><input required value={f.titulo} onChange={e => setF({...f,titulo:e.target.value})}/></div>
            <div className="field"><label>Curso (opcional)</label>
              <select value={f.curso_id} onChange={e => setF({...f,curso_id:e.target.value})}>
                <option value="">Sin curso específico</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
              </select>
            </div>
            <div className="field"><label>Instrucciones</label><textarea value={f.instrucciones} onChange={e => setF({...f,instrucciones:e.target.value})} style={{width:'100%',padding:'10px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',minHeight:70}}/></div>
            <div className="grid3">
              <div className="field"><label>Nota mínima (%)</label><input type="number" min="0" max="100" value={f.nota_minima} onChange={e => setF({...f,nota_minima:e.target.value})}/></div>
              <div className="field"><label>Intentos máx.</label><input type="number" min="1" value={f.max_intentos} onChange={e => setF({...f,max_intentos:e.target.value})}/></div>
              <div className="field"><label>Tiempo (min, 0=sin límite)</label><input type="number" min="0" value={f.tiempo_limite} onChange={e => setF({...f,tiempo_limite:e.target.value})}/></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <input type="checkbox" id="aleat" checked={f.aleatorizar} onChange={e => setF({...f,aleatorizar:e.target.checked})}/>
              <label htmlFor="aleat" style={{fontSize:14,fontWeight:600,color:'var(--ink)'}}>Aleatorizar preguntas</label>
            </div>
            <div style={{display:'flex',gap:10}}><button className="btn btn-cyan" type="submit">Crear evaluación</button><button className="btn btn-ghost" type="button" onClick={onCerrar}>Cancelar</button></div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ModalPreguntas({ evalId, onCerrar }: { evalId: string; onCerrar: () => void }) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [modo, setModo] = useState<'lista'|'nueva'>('lista')
  const [tipo, setTipo] = useState<TipoPregunta>('seleccion_unica')
  const [enunciado, setEnunciado] = useState('')
  const [explicacion, setExplicacion] = useState('')
  const [puntos, setPuntos] = useState('1')
  const [opciones, setOpciones] = useState([{texto:'',correcta:false},{texto:'',correcta:false}])
  const [guardando, setGuardando] = useState(false)

  const cargarPreguntas = useCallback(async () => {
    const { data } = await createClient().from('preguntas')
      .select('*, opciones_pregunta(*)').eq('evaluacion_id', evalId).order('orden')
    setPreguntas((data || []).map((p: Pregunta & {opciones_pregunta?: OpcionPregunta[]}) => ({...p, opciones: p.opciones_pregunta||[]})))
  }, [evalId])

  useEffect(() => { cargarPreguntas() }, [cargarPreguntas])

  async function guardarPregunta() {
    if (!enunciado.trim()) return
    setGuardando(true)
    const supabase = createClient()
    const { data: preg } = await supabase.from('preguntas').insert({
      evaluacion_id: evalId, tipo, enunciado: enunciado.trim(),
      explicacion: explicacion.trim()||null, puntos: Number(puntos), orden: preguntas.length
    }).select().single()
    if (preg && ['seleccion_unica','seleccion_multiple','verdadero_falso'].includes(tipo)) {
      const opts = tipo === 'verdadero_falso'
        ? [{texto:'Verdadero',correcta:false},{texto:'Falso',correcta:false}]
        : opciones.filter(o => o.texto.trim())
      for (let i=0; i<opts.length; i++) {
        await supabase.from('opciones_pregunta').insert({ pregunta_id: preg.id, texto: opts[i].texto, es_correcta: opts[i].correcta, orden: i })
      }
    }
    setEnunciado(''); setExplicacion(''); setPuntos('1'); setOpciones([{texto:'',correcta:false},{texto:'',correcta:false}])
    setModo('lista'); cargarPreguntas(); setGuardando(false)
  }

  async function eliminarPregunta(pid: string) {
    await createClient().from('preguntas').delete().eq('id', pid)
    cargarPreguntas()
  }

  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="adm-modal" style={{maxWidth:680}}>
        <div className="adm-modal-hd">
          <h2>{modo==='lista' ? `Preguntas (${preguntas.length})` : 'Nueva pregunta'}</h2>
          <div style={{display:'flex',gap:8}}>
            {modo==='lista' && <button className="btn btn-cyan btn-sm" onClick={() => setModo('nueva')}>+ Agregar</button>}
            <button className="adm-modal-close" onClick={modo==='nueva'? ()=>setModo('lista') : onCerrar}>✕</button>
          </div>
        </div>
        <div className="adm-modal-body">
          {modo === 'lista' ? (
            preguntas.length === 0 ? (
              <div style={{textAlign:'center',padding:'32px',color:'var(--gray)'}}>No hay preguntas. Agrega la primera.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {preguntas.map((p, i) => (
                  <div key={p.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',borderRadius:12,background:'rgba(36,69,154,.04)',border:'1px solid var(--line)'}}>
                    <span style={{fontWeight:800,color:'var(--gray)',fontSize:12,minWidth:22}}>{i+1}.</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'var(--ink)',marginBottom:3,fontSize:14}}>{p.enunciado}</div>
                      <div style={{fontSize:12,color:'var(--gray)'}}>{TIPOS[p.tipo as TipoPregunta]} · {p.puntos} pt{p.puntos!==1?'s':''}</div>
                    </div>
                    <button onClick={() => eliminarPregunta(p.id)} style={{background:'none',border:0,color:'#C0392B',cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="field"><label>Tipo de pregunta</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as TipoPregunta)}>
                  {Object.entries(TIPOS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="field"><label>Enunciado</label><textarea value={enunciado} onChange={e => setEnunciado(e.target.value)} style={{width:'100%',padding:'10px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',minHeight:70}} required/></div>
              <div className="grid2">
                <div className="field"><label>Puntos</label><input type="number" min="0.5" step="0.5" value={puntos} onChange={e => setPuntos(e.target.value)}/></div>
                <div className="field"><label>Explicación (opcional)</label><input value={explicacion} onChange={e => setExplicacion(e.target.value)} placeholder="Para mostrar al estudiante"/></div>
              </div>
              {['seleccion_unica','seleccion_multiple'].includes(tipo) && (
                <div>
                  <label style={{display:'block',fontSize:14,fontWeight:700,marginBottom:8,color:'var(--ink)'}}>Opciones</label>
                  {opciones.map((o, i) => (
                    <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <input type={tipo==='seleccion_multiple'?'checkbox':'radio'} checked={o.correcta}
                        onChange={() => setOpciones(ops => ops.map((op,j) => tipo==='seleccion_unica' ? {...op,correcta:j===i} : j===i?{...op,correcta:!op.correcta}:op))}/>
                      <input value={o.texto} onChange={e => setOpciones(ops => ops.map((op,j) => j===i?{...op,texto:e.target.value}:op))}
                        placeholder={`Opción ${i+1}`} style={{flex:1,padding:'8px 12px',borderRadius:10,border:'1px solid var(--line)',fontFamily:'inherit'}}/>
                      {opciones.length>2 && <button onClick={() => setOpciones(ops => ops.filter((_,j)=>j!==i))} style={{background:'none',border:0,color:'var(--gray)',cursor:'pointer'}}>✕</button>}
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" style={{marginTop:4}} onClick={() => setOpciones(o => [...o,{texto:'',correcta:false}])}>+ Opción</button>
                </div>
              )}
              {tipo === 'verdadero_falso' && (
                <div style={{display:'flex',gap:12,marginBottom:12}}>
                  {['Verdadero','Falso'].map(v => (
                    <button key={v} type="button" onClick={() => {}}
                      style={{padding:'10px 24px',borderRadius:99,border:'2px solid var(--line)',fontWeight:700,fontSize:14,background:'#fff',cursor:'pointer'}}>
                      {v}
                    </button>
                  ))}
                  <span style={{fontSize:13,color:'var(--gray)',alignSelf:'center'}}>(marca cuál es la correcta arriba)</span>
                </div>
              )}
              <div style={{display:'flex',gap:10,marginTop:12}}>
                <button className="btn btn-cyan" onClick={guardarPregunta} disabled={guardando||!enunciado.trim()}>{guardando?'Guardando…':'Guardar pregunta'}</button>
                <button className="btn btn-ghost" onClick={() => setModo('lista')}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeacherEvaluacionesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [evals, setEvals] = useState<Evaluacion[]>([])
  const [cursos, setCursos] = useState<Array<{id:string;titulo:string}>>([])
  const [cargando, setCargando] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalPreguntas, setModalPreguntas] = useState<string|null>(null)

  const cargarEvals = useCallback(async () => {
    const { data } = await createClient().from('evaluaciones').select('*').order('created_at', { ascending: false })
    setEvals(data || [])
  }, [])

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol||'')) { router.push('/inicio'); return }
      await cargarEvals()
      const { data: c } = await supabase.from('cursos').select('id, titulo').order('titulo')
      setCursos(c || [])
      setCargando(false)
    }
    cargar()
  }, [router, cargarEvals])

  async function crearEval(data: Partial<Evaluacion>) {
    await createClient().from('evaluaciones').insert(data)
    setModalCrear(false); cargarEvals()
  }

  async function togglePublicado(ev: Evaluacion) {
    await createClient().from('evaluaciones').update({ publicado: !ev.publicado }).eq('id', ev.id)
    cargarEvals()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta evaluación?')) return
    await createClient().from('evaluaciones').delete().eq('id', id)
    cargarEvals()
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Instructor</div>
          <h1>Generador de evaluaciones</h1>
          <p>Crea exámenes, agrega preguntas y gestiona el banco de preguntas.</p>
        </div>
        <div className="adm-toolbar">
          <span className="adm-count">{evals.length} evaluación{evals.length!==1?'es':''}</span>
          <button className="btn btn-cyan" onClick={() => setModalCrear(true)}>+ Nueva evaluación</button>
        </div>
        {evals.length === 0 ? (
          <div className="glass-card" style={{textAlign:'center',padding:'48px',color:'var(--gray)'}}>No hay evaluaciones. Crea la primera.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {evals.map(ev => (
              <div key={ev.id} className="glass-card adm-curso-row" style={{padding:0}}>
                <div className="adm-curso-spine" style={{background: ev.publicado ? 'var(--green)' : 'var(--gray)'}}/>
                <div className="adm-curso-info">
                  <div className="adm-curso-top">
                    <span className={`adm-pub-badge ${ev.publicado?'pub':'draft'}`}>{ev.publicado?'Publicada':'Borrador'}</span>
                  </div>
                  <div className="adm-curso-titulo">{ev.titulo}</div>
                  <div className="adm-curso-meta">
                    <span>Nota mínima: {ev.nota_minima}%</span>·
                    <span>Intentos: {ev.max_intentos}</span>
                    {ev.tiempo_limite && <><span>·</span><span>⏱ {ev.tiempo_limite} min</span></>}
                    {ev.aleatorizar && <><span>·</span><span>🔀 Aleatoria</span></>}
                  </div>
                </div>
                <div className="adm-curso-acc">
                  <button className="adm-acc-btn accent" title="Preguntas" onClick={() => setModalPreguntas(ev.id)}>📝</button>
                  <button className="adm-acc-btn" title={ev.publicado?'Despublicar':'Publicar'} onClick={() => togglePublicado(ev)}>👁</button>
                  <button className="adm-acc-btn danger" title="Eliminar" onClick={() => eliminar(ev.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {modalCrear && <ModalCrearEval cursos={cursos} onCrear={crearEval} onCerrar={() => setModalCrear(false)}/>}
      {modalPreguntas && <ModalPreguntas evalId={modalPreguntas} onCerrar={() => { setModalPreguntas(null); cargarEvals() }}/>}
    </div>
  )
}
