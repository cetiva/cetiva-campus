'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Curso, Modulo, Leccion, RecursoLeccion } from '@/types'

// ─── Detectores de URL ───────────────────────────────────
function vimeoId(url?: string) {
  if (!url) return null
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

function youtubeId(url?: string) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// ─── Reproductores por tipo ──────────────────────────────
function PlayerVideo({ url }: { url?: string }) {
  const vId = vimeoId(url)
  const yId = youtubeId(url)

  if (vId) return (
    <div className="cr-vimeo-wrap">
      <iframe src={`https://player.vimeo.com/video/${vId}?color=00C4CC&title=0&byline=0&portrait=0&badge=0`}
        frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Video"/>
    </div>
  )
  if (yId) return (
    <div className="cr-vimeo-wrap">
      <iframe src={`https://www.youtube.com/embed/${yId}?rel=0`}
        frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video"/>
    </div>
  )
  return <div className="cr-no-video"><p>URL de video no reconocida</p></div>
}

function PlayerPDF({ url }: { url?: string }) {
  if (!url) return <div className="cr-no-video"><p>Sin PDF disponible</p></div>
  // Intentar embed directo, funciona con Google Drive y PDFs directos
  const embedUrl = url.includes('drive.google.com') && !url.includes('/preview')
    ? url.replace('/view', '/preview')
    : url
  return (
    <div className="cr-vimeo-wrap" style={{paddingTop:'75%'}}>
      <iframe src={embedUrl} frameBorder="0" title="PDF" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
    </div>
  )
}

function PlayerPresentacion({ url }: { url?: string }) {
  if (!url) return <div className="cr-no-video"><p>Sin presentación disponible</p></div>
  const embedUrl = url.includes('docs.google.com') && !url.includes('/embed')
    ? url.replace('/pub', '/embed').replace('/edit', '/embed')
    : url
  return (
    <div className="cr-vimeo-wrap" style={{paddingTop:'56.25%'}}>
      <iframe src={embedUrl} frameBorder="0" allowFullScreen title="Presentación"
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
    </div>
  )
}

function PlayerAudio({ url }: { url?: string }) {
  if (!url) return <div className="cr-no-video"><p>Sin audio disponible</p></div>
  if (url.includes('soundcloud.com')) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2316A3C4&auto_play=false`
    return (
      <div style={{borderRadius:18,overflow:'hidden',background:'#f2f2f2'}}>
        <iframe width="100%" height="166" scrolling="no" frameBorder="no" src={embedUrl} title="Audio"/>
      </div>
    )
  }
  return (
    <div style={{padding:'32px',borderRadius:18,background:'rgba(36,69,154,.04)',border:'1px solid var(--line)',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🎧</div>
      <audio controls src={url} style={{width:'100%',maxWidth:500}}>
        Tu navegador no soporta el reproductor de audio.
      </audio>
    </div>
  )
}

function PlayerTexto({ contenido }: { contenido?: string }) {
  return (
    <div style={{background:'#fff',borderRadius:18,padding:'32px 40px',border:'1px solid var(--line)',
      fontSize:16,lineHeight:1.8,color:'var(--ink)',maxWidth:'100%',overflowY:'auto',minHeight:300,
      fontFamily:'var(--font)',whiteSpace:'pre-wrap'}}>
      {contenido || 'Sin contenido disponible.'}
    </div>
  )
}

function PlayerEnlace({ url }: { url?: string }) {
  if (!url) return <div className="cr-no-video"><p>Sin enlace disponible</p></div>
  return (
    <div style={{padding:'48px 32px',borderRadius:18,background:'rgba(36,69,154,.04)',border:'2px dashed var(--line)',textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🔗</div>
      <p style={{color:'var(--gray)',marginBottom:20,fontSize:15}}>Este recurso abre en una página externa.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-cyan">
        Abrir recurso externo ↗
      </a>
    </div>
  )
}

function ReproductorLeccion({ leccion }: { leccion: Leccion }) {
  switch (leccion.tipo) {
    case 'video':        return <PlayerVideo url={leccion.contenido}/>
    case 'pdf':          return <PlayerPDF url={leccion.contenido}/>
    case 'presentacion': return <PlayerPresentacion url={leccion.contenido}/>
    case 'audio':        return <PlayerAudio url={leccion.contenido}/>
    case 'texto':        return <PlayerTexto contenido={leccion.contenido}/>
    case 'enlace':       return <PlayerEnlace url={leccion.contenido}/>
    default:             return <div className="cr-no-video"><p>Tipo de contenido no soportado</p></div>
  }
}

// ─── Iconos ──────────────────────────────────────────────
const Ico = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  chev:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  up:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  back:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  next:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
}

const TIPO_LABEL: Record<string, string> = {
  video:'🎬 Video', pdf:'📄 PDF', presentacion:'📊 Presentación',
  texto:'📝 Lectura', audio:'🎧 Audio', enlace:'🔗 Enlace externo', scorm:'📦 SCORM'
}

export default function CursoPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [curso, setCurso] = useState<Curso|null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [leccionActual, setLeccionActual] = useState<Leccion|null>(null)
  const [completadas, setCompletadas] = useState<Set<string>>(new Set())
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [marcando, setMarcando] = useState(false)

  const todasLecciones = modulos.flatMap(m => m.lecciones || [])
  const idxActual = todasLecciones.findIndex(l => l.id === leccionActual?.id)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setPerfil(p)
    const { data: c } = await supabase.from('cursos').select('*').eq('slug', slug).single()
    if (!c) { router.push('/dashboard'); return }
    setCurso(c)
    const { data: ins } = await supabase.from('inscripciones').select('*').eq('usuario_id', user.id).eq('curso_id', c.id).maybeSingle()
    if (!ins) { router.push('/dashboard'); return }
    const { data: mods } = await supabase.from('modulos')
      .select('*, lecciones(*, recursos_leccion(*))')
      .eq('curso_id', c.id).order('orden')
    const modsOrdenados = (mods || [])
      .map((m: Modulo & {lecciones: (Leccion & {recursos_leccion?: RecursoLeccion[]})[]}) => ({
        ...m,
        lecciones: (m.lecciones || [])
          .map((l: Leccion & {recursos_leccion?: RecursoLeccion[]}) => ({...l, recursos: l.recursos_leccion || []}))
          .sort((a: Leccion, b: Leccion) => a.orden - b.orden)
      }))
      .sort((a: Modulo, b: Modulo) => a.orden - b.orden)
    setModulos(modsOrdenados as Modulo[])
    if (modsOrdenados.length > 0) setAbiertos(new Set([modsOrdenados[0].id]))
    const { data: prog } = await supabase.from('progreso').select('leccion_id').eq('usuario_id', user.id)
    const ids: Set<string> = new Set((prog || []).map((p: { leccion_id: string }) => p.leccion_id))
    setCompletadas(ids)
    const todas = modsOrdenados.flatMap((m: Modulo & {lecciones: Leccion[]}) => m.lecciones || [])
    const primera = todas.find((l: Leccion) => !ids.has(l.id)) || todas[0]
    if (primera) setLeccionActual(primera)
    await supabase.from('inscripciones').update({ ultimo_acceso: new Date().toISOString() }).eq('usuario_id', user.id).eq('curso_id', c.id)
    setCargando(false)
  }, [slug, router])

  useEffect(() => { cargar() }, [cargar])

  async function marcarCompletada() {
    if (!leccionActual || marcando) return
    setMarcando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (completadas.has(leccionActual.id)) {
      await supabase.from('progreso').delete().eq('usuario_id', user.id).eq('leccion_id', leccionActual.id)
      setCompletadas(s => { const n = new Set(s); n.delete(leccionActual.id); return n })
    } else {
      await supabase.from('progreso').upsert({ usuario_id: user.id, leccion_id: leccionActual.id, completado: true })
      setCompletadas(s => new Set(s).add(leccionActual.id))
      const siguiente = todasLecciones[idxActual + 1]
      if (siguiente) setTimeout(() => {
        setLeccionActual(siguiente)
        const mod = modulos.find(m => m.lecciones?.some(l => l.id === siguiente.id))
        if (mod) setAbiertos(s => new Set(s).add(mod.id))
      }, 600)
    }
    setMarcando(false)
  }

  function seleccionar(lec: Leccion) {
    setLeccionActual(lec)
    document.querySelector('.cr-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleModulo(id: string) {
    setAbiertos(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando curso…</div></div>
  if (!curso) return null

  const pct = todasLecciones.length > 0 ? Math.round((completadas.size / todasLecciones.length) * 100) : 0
  const estaCompleta = completadas.has(leccionActual?.id || '')

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="cr-layout">
        {/* Sidebar */}
        <aside className="cr-sidebar">
          <div className="cr-sidebar-hd">
            <button className="cr-back" onClick={() => router.push('/dashboard')}>{Ico.back} Mis cursos</button>
            <h2 className="cr-curso-titulo" style={{borderColor:curso.color}}>{curso.titulo}</h2>
            <div className="cr-progreso">
              <div className="cr-progreso-info"><span>{completadas.size} de {todasLecciones.length} lecciones</span><strong style={{color:curso.color}}>{pct}%</strong></div>
              <div className="cr-progreso-bar"><div className="cr-progreso-fill" style={{width:`${pct}%`,background:curso.color}}/></div>
            </div>
          </div>
          <nav className="cr-nav">
            {modulos.map((mod, mi) => (
              <div key={mod.id} className="cr-modulo">
                <button className={`cr-mod-btn${abiertos.has(mod.id)?' open':''}`} onClick={() => toggleModulo(mod.id)}>
                  <span className="cr-mod-num">M{mi+1}</span>
                  <span className="cr-mod-titulo">{mod.titulo}</span>
                  <span className="cr-mod-chevron">{abiertos.has(mod.id) ? Ico.up : Ico.chev}</span>
                </button>
                {abiertos.has(mod.id) && (
                  <ul className="cr-lecciones">
                    {(mod.lecciones||[]).map((lec: Leccion) => {
                      const activa = leccionActual?.id === lec.id
                      const completa = completadas.has(lec.id)
                      return (
                        <li key={lec.id}>
                          <button className={`cr-lec-btn${activa?' activa':''}${completa?' completa':''}`}
                            onClick={() => seleccionar(lec)}
                            style={activa?{borderLeftColor:curso.color}:{}}>
                            <span className={`cr-lec-ico${completa?' done':''}`} style={completa?{background:curso.color}:{}}>
                              {completa ? Ico.check : Ico.play}
                            </span>
                            <span className="cr-lec-titulo">{lec.titulo}</span>
                            {lec.duracion_min > 0 && <span className="cr-lec-dur">{lec.duracion_min}′</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Player */}
        <section className="cr-player">
          {leccionActual ? (
            <>
              {/* Reproductor según tipo */}
              <ReproductorLeccion leccion={leccionActual}/>

              <div className="cr-lec-info">
                <div className="cr-lec-info-top">
                  <div>
                    <div className="cr-lec-eyebrow" style={{color:curso.color}}>
                      {TIPO_LABEL[leccionActual.tipo] || leccionActual.tipo}
                    </div>
                    <h1 className="cr-lec-nombre">{leccionActual.titulo}</h1>
                    {leccionActual.descripcion && (
                      <p style={{fontSize:14,color:'var(--gray)',marginTop:6,lineHeight:1.6}}>{leccionActual.descripcion}</p>
                    )}
                  </div>
                  <button
                    className={`cr-btn-completar${estaCompleta?' hecho':''}`}
                    style={estaCompleta?{background:curso.color,borderColor:curso.color}:{}}
                    onClick={marcarCompletada} disabled={marcando}>
                    {Ico.check}{estaCompleta?'Completada':'Marcar como completada'}
                  </button>
                </div>

                {/* Recursos adjuntos */}
                {(leccionActual.recursos?.length || 0) > 0 && (
                  <div style={{marginTop:16,marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--gray)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>
                      📎 Recursos de esta lección
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {leccionActual.recursos?.map(r => (
                        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                          style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',
                            borderRadius:99,border:'1px solid var(--line)',background:'#fff',
                            fontSize:13,fontWeight:600,color:'var(--navy)',textDecoration:'none',
                            transition:'all .15s'}}
                          onMouseEnter={e => {(e.currentTarget as HTMLElement).style.borderColor='var(--cyan)';(e.currentTarget as HTMLElement).style.color='var(--cyan)'}}
                          onMouseLeave={e => {(e.currentTarget as HTMLElement).style.borderColor='var(--line)';(e.currentTarget as HTMLElement).style.color='var(--navy)'}}>
                          📎 {r.titulo}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cr-nav-lec">
                  <button className="cr-nav-btn" disabled={idxActual<=0} onClick={() => seleccionar(todasLecciones[idxActual-1])}>{Ico.back} Anterior</button>
                  <span className="cr-nav-contador">{idxActual+1} / {todasLecciones.length}</span>
                  <button className="cr-nav-btn" disabled={idxActual>=todasLecciones.length-1} onClick={() => seleccionar(todasLecciones[idxActual+1])}>Siguiente {Ico.next}</button>
                </div>
              </div>
            </>
          ) : (
            <div className="cr-vacio"><p>Selecciona una lección para comenzar.</p></div>
          )}
        </section>
      </main>
    </div>
  )
}
