'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import { NIVELES_LISTA, colorNivel } from '@/lib/niveles'
import type { Perfil, Curso, Modulo, Leccion, RecursoLeccion } from '@/types'
import { Suspense } from 'react'

// ─── Helpers ────────────────────────────────────────────────
const TIPOS_LECCION = [
  { key: 'video',        label: 'Video',          ico: '🎬', desc: 'URL de Vimeo o YouTube' },
  { key: 'pdf',          label: 'PDF',            ico: '📄', desc: 'URL de archivo PDF' },
  { key: 'presentacion', label: 'Presentación',   ico: '📊', desc: 'Google Slides, Canva, PowerPoint online' },
  { key: 'texto',        label: 'Texto/Lectura',  ico: '📝', desc: 'Contenido de texto enriquecido' },
  { key: 'audio',        label: 'Audio/Podcast',  ico: '🎧', desc: 'URL de audio o podcast' },
  { key: 'enlace',       label: 'Enlace externo', ico: '🔗', desc: 'Recurso web externo' },
]

const TIPOS_RECURSO = [
  { key: 'pdf',          label: 'PDF',         ico: '📄' },
  { key: 'enlace',       label: 'Enlace',       ico: '🔗' },
  { key: 'presentacion', label: 'Presentación', ico: '📊' },
  { key: 'archivo',      label: 'Archivo',      ico: '📁' },
  { key: 'imagen',       label: 'Imagen',       ico: '🖼️' },
]

function tipoIco(tipo: string) {
  return TIPOS_LECCION.find(t => t.key === tipo)?.ico || '📄'
}

// ─── Modal wrapper ────────────────────────────────────────
function Modal({ titulo, onClose, wide, children }: {
  titulo: string; onClose: () => void; wide?: boolean; children: React.ReactNode
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{maxWidth: wide ? 780 : 580}}>
        <div className="adm-modal-hd">
          <h2>{titulo}</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  )
}

// ─── Editor de Lección ────────────────────────────────────
function EditorLeccion({ leccion, moduloId, orden, onGuardar, onCerrar }: {
  leccion: Leccion | null
  moduloId: string
  orden: number
  onGuardar: () => void
  onCerrar: () => void
}) {
  const [f, setF] = useState({
    titulo: leccion?.titulo || '',
    tipo: leccion?.tipo || 'video',
    contenido: leccion?.contenido || '',
    descripcion: leccion?.descripcion || '',
    duracion_min: String(leccion?.duracion_min || 0),
    es_obligatoria: leccion?.es_obligatoria ?? true,
    es_preview: leccion?.es_preview ?? false,
  })
  const [recursos, setRecursos] = useState<RecursoLeccion[]>(leccion?.recursos || [])
  const [nuevoRecurso, setNuevoRecurso] = useState({ tipo: 'pdf', titulo: '', url: '', descripcion: '' })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [tabActiva, setTabActiva] = useState<'contenido' | 'recursos'>('contenido')

  async function cargarRecursos(leccionId: string) {
    const { data } = await createClient().from('recursos_leccion').select('*').eq('leccion_id', leccionId).order('orden')
    setRecursos(data || [])
  }

  useEffect(() => {
    if (leccion?.id) cargarRecursos(leccion.id)
  }, [leccion?.id])

  async function guardar() {
    if (!f.titulo.trim()) { setMsg('El título es obligatorio.'); return }
    setGuardando(true)
    const supabase = createClient()
    const payload = {
      modulo_id: moduloId,
      titulo: f.titulo.trim(),
      tipo: f.tipo,
      contenido: f.contenido.trim() || null,
      descripcion: f.descripcion.trim() || null,
      duracion_min: Number(f.duracion_min) || 0,
      es_obligatoria: f.es_obligatoria,
      es_preview: f.es_preview,
      orden: leccion?.orden ?? orden,
    }
    if (leccion?.id) {
      await supabase.from('lecciones').update(payload).eq('id', leccion.id)
    } else {
      await supabase.from('lecciones').insert(payload)
    }
    setGuardando(false)
    onGuardar()
  }

  async function agregarRecurso() {
    if (!nuevoRecurso.titulo.trim() || !nuevoRecurso.url.trim()) return
    if (!leccion?.id) { setMsg('Guarda la lección primero antes de añadir recursos.'); return }
    const supabase = createClient()
    await supabase.from('recursos_leccion').insert({
      leccion_id: leccion.id,
      tipo: nuevoRecurso.tipo,
      titulo: nuevoRecurso.titulo.trim(),
      url: nuevoRecurso.url.trim(),
      descripcion: nuevoRecurso.descripcion.trim() || null,
      orden: recursos.length,
    })
    setNuevoRecurso({ tipo: 'pdf', titulo: '', url: '', descripcion: '' })
    cargarRecursos(leccion.id)
  }

  async function eliminarRecurso(id: string) {
    await createClient().from('recursos_leccion').delete().eq('id', id)
    if (leccion?.id) cargarRecursos(leccion.id)
  }

  const tipoActual = TIPOS_LECCION.find(t => t.key === f.tipo)

  const placeholderContenido: Record<string, string> = {
    video: 'https://vimeo.com/123456789  ó  https://www.youtube.com/watch?v=xxxxx',
    pdf: 'https://drive.google.com/file/d/xxx/preview  ó  URL directa del PDF',
    presentacion: 'https://docs.google.com/presentation/d/xxx/embed  ó  Canva/Slides URL',
    texto: 'Escribe aquí el contenido de la lectura...',
    audio: 'https://soundcloud.com/...  ó  URL directa del audio',
    enlace: 'https://www.ejemplo.com/recurso',
  }

  return (
    <div>
      {msg && <div className="msg msg-error">{msg}</div>}

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {(['contenido','recursos'] as const).map(t => (
          <button key={t} onClick={() => setTabActiva(t)}
            style={{padding:'8px 18px',borderRadius:99,border:'1px solid var(--line)',fontWeight:700,fontSize:14,
              background: tabActiva===t ? 'var(--navy)' : '#fff',
              color: tabActiva===t ? '#fff' : 'var(--gray)', cursor:'pointer'}}>
            {t === 'contenido' ? '📝 Contenido' : `📎 Recursos adjuntos (${recursos.length})`}
          </button>
        ))}
      </div>

      {tabActiva === 'contenido' && (
        <>
          <div className="field">
            <label>Título de la lección</label>
            <input required value={f.titulo} onChange={e => setF({...f,titulo:e.target.value})} placeholder="Ej: Anatomía del acceso vascular central"/>
          </div>

          <div className="field">
            <label>Descripción (opcional)</label>
            <textarea value={f.descripcion} onChange={e => setF({...f,descripcion:e.target.value})}
              placeholder="Describe brevemente qué aprenderá el estudiante en esta lección..."
              style={{width:'100%',padding:'10px 14px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:14,minHeight:70,resize:'vertical'}}/>
          </div>

          <div className="field">
            <label>Tipo de contenido</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:4}}>
              {TIPOS_LECCION.map(t => (
                <button key={t.key} type="button"
                  onClick={() => setF({...f, tipo:t.key as Leccion['tipo']})}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 8px',
                    borderRadius:12,border:`2px solid ${f.tipo===t.key ? 'var(--cyan)' : 'var(--line)'}`,
                    background: f.tipo===t.key ? 'rgba(22,163,196,.08)' : '#fff',cursor:'pointer',transition:'all .15s'}}>
                  <span style={{fontSize:22}}>{t.ico}</span>
                  <span style={{fontSize:12,fontWeight:700,color: f.tipo===t.key ? 'var(--cyan-dark)' : 'var(--gray)'}}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL o contenido según tipo */}
          <div className="field">
            <label>{tipoActual?.ico} {tipoActual?.label} — {tipoActual?.desc}</label>
            {f.tipo === 'texto' ? (
              <textarea
                value={f.contenido} onChange={e => setF({...f,contenido:e.target.value})}
                placeholder={placeholderContenido[f.tipo]}
                style={{width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:14,minHeight:160,resize:'vertical'}}/>
            ) : (
              <input value={f.contenido} onChange={e => setF({...f,contenido:e.target.value})}
                placeholder={placeholderContenido[f.tipo] || 'URL del contenido'}/>
            )}
            {/* Preview rápido para videos */}
            {f.tipo === 'video' && f.contenido && (
              <div style={{marginTop:8,padding:'8px 12px',borderRadius:10,background:'rgba(22,163,196,.06)',border:'1px solid rgba(22,163,196,.2)',fontSize:13,color:'var(--cyan-dark)'}}>
                ✓ URL de video detectada — se mostrará en el reproductor integrado
              </div>
            )}
          </div>

          <div className="grid2">
            <div className="field">
              <label>Duración (minutos)</label>
              <input type="number" min="0" value={f.duracion_min}
                onChange={e => setF({...f,duracion_min:e.target.value})} placeholder="0"/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,paddingTop:24}}>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14,fontWeight:600}}>
                <input type="checkbox" checked={f.es_obligatoria} onChange={e => setF({...f,es_obligatoria:e.target.checked})}
                  style={{width:16,height:16,accentColor:'var(--cyan)'}}/>
                Lección obligatoria
              </label>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14,fontWeight:600}}>
                <input type="checkbox" checked={f.es_preview} onChange={e => setF({...f,es_preview:e.target.checked})}
                  style={{width:16,height:16,accentColor:'var(--cyan)'}}/>
                Vista previa gratuita
              </label>
            </div>
          </div>
        </>
      )}

      {tabActiva === 'recursos' && (
        <div>
          <p style={{fontSize:13,color:'var(--gray)',marginBottom:16}}>
            Agrega materiales de apoyo: PDFs, presentaciones, enlaces, archivos adicionales.
            {!leccion?.id && <strong style={{color:'var(--orange)'}}> Guarda la lección primero para poder añadir recursos.</strong>}
          </p>

          {/* Recursos existentes */}
          {recursos.length > 0 && (
            <div style={{marginBottom:20,display:'flex',flexDirection:'column',gap:8}}>
              {recursos.map(r => (
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:'rgba(36,69,154,.04)',border:'1px solid var(--line)'}}>
                  <span style={{fontSize:20}}>{TIPOS_RECURSO.find(t=>t.key===r.tipo)?.ico || '📎'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'var(--navy)'}}>{r.titulo}</div>
                    <div style={{fontSize:12,color:'var(--gray)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.url}</div>
                  </div>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:12,color:'var(--cyan)',fontWeight:600,flexShrink:0}}>Ver →</a>
                  <button onClick={() => eliminarRecurso(r.id)}
                    style={{background:'none',border:0,color:'#C0392B',cursor:'pointer',fontSize:16,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar recurso */}
          <div style={{padding:'16px',borderRadius:14,border:'2px dashed var(--line)',background:'rgba(36,69,154,.02)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--gray)',marginBottom:12}}>+ Agregar recurso</div>
            <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
              {TIPOS_RECURSO.map(t => (
                <button key={t.key} onClick={() => setNuevoRecurso({...nuevoRecurso,tipo:t.key})}
                  style={{padding:'6px 12px',borderRadius:99,border:`1px solid ${nuevoRecurso.tipo===t.key?'var(--cyan)':'var(--line)'}`,
                    background: nuevoRecurso.tipo===t.key?'rgba(22,163,196,.1)':'#fff',fontSize:13,fontWeight:600,
                    color:nuevoRecurso.tipo===t.key?'var(--cyan-dark)':'var(--gray)',cursor:'pointer'}}>
                  {t.ico} {t.label}
                </button>
              ))}
            </div>
            <div className="field" style={{marginBottom:8}}>
              <input value={nuevoRecurso.titulo} onChange={e => setNuevoRecurso({...nuevoRecurso,titulo:e.target.value})}
                placeholder="Título del recurso (ej: Guía de inserción PICC)" style={{fontSize:14}}/>
            </div>
            <div className="field" style={{marginBottom:8}}>
              <input value={nuevoRecurso.url} onChange={e => setNuevoRecurso({...nuevoRecurso,url:e.target.value})}
                placeholder="URL del recurso" style={{fontSize:14}}/>
            </div>
            <div className="field" style={{marginBottom:12}}>
              <input value={nuevoRecurso.descripcion} onChange={e => setNuevoRecurso({...nuevoRecurso,descripcion:e.target.value})}
                placeholder="Descripción breve (opcional)" style={{fontSize:14}}/>
            </div>
            <button className="btn btn-cyan btn-sm" onClick={agregarRecurso}
              disabled={!nuevoRecurso.titulo.trim()||!nuevoRecurso.url.trim()||!leccion?.id}>
              Agregar recurso
            </button>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:10,marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)'}}>
        <button className="btn btn-cyan" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : leccion ? 'Guardar cambios' : 'Crear lección'}
        </button>
        <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Editor de Módulo ─────────────────────────────────────
function EditorModulo({ modulo, cursoId, orden, onGuardar, onCerrar }: {
  modulo: Modulo | null; cursoId: string; orden: number
  onGuardar: () => void; onCerrar: () => void
}) {
  const [titulo, setTitulo] = useState(modulo?.titulo || '')
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!titulo.trim()) return
    setGuardando(true)
    const supabase = createClient()
    if (modulo?.id) {
      await supabase.from('modulos').update({ titulo: titulo.trim() }).eq('id', modulo.id)
    } else {
      await supabase.from('modulos').insert({ curso_id: cursoId, titulo: titulo.trim(), orden })
    }
    setGuardando(false)
    onGuardar()
  }

  return (
    <div>
      <div className="field">
        <label>Título del módulo</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Ej: Módulo 1 — Fundamentos del acceso vascular" required autoFocus/>
      </div>
      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button className="btn btn-cyan" onClick={guardar} disabled={guardando||!titulo.trim()}>
          {guardando?'Guardando…':modulo?'Guardar':'Crear módulo'}
        </button>
        <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Panel principal de gestión del curso ────────────────
function GestorCurso({ cursoId }: { cursoId: string }) {
  const [curso, setCurso] = useState<Curso|null>(null)
  const [modulos, setModulos] = useState<(Modulo & {lecciones: Leccion[]})[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalModulo, setModalModulo] = useState<Modulo|null|'nuevo'>(null)
  const [modalLeccion, setModalLeccion] = useState<{leccion: Leccion|null; moduloId: string; orden: number}|null>(null)
  const [toast, setToast] = useState('')

  const msg = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2500) }

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: c } = await supabase.from('cursos').select('*').eq('id', cursoId).single()
    setCurso(c)
    const { data: mods } = await supabase.from('modulos')
      .select('*, lecciones(*, recursos_leccion(*))')
      .eq('curso_id', cursoId).order('orden')
    const ordenados = (mods || []).map((m: Modulo & {lecciones: (Leccion & {recursos_leccion?: RecursoLeccion[]})[]}) => ({
      ...m,
      lecciones: (m.lecciones || [])
        .map((l: Leccion & {recursos_leccion?: RecursoLeccion[]}) => ({...l, recursos: l.recursos_leccion || []}))
        .sort((a: Leccion, b: Leccion) => a.orden - b.orden)
    })).sort((a: Modulo, b: Modulo) => a.orden - b.orden)
    setModulos(ordenados as (Modulo & {lecciones: Leccion[]})[])
    setCargando(false)
  }, [cursoId])

  useEffect(() => { cargar() }, [cargar])

  async function eliminarModulo(id: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return
    await createClient().from('modulos').delete().eq('id', id)
    msg('Módulo eliminado'); cargar()
  }

  async function eliminarLeccion(id: string) {
    if (!confirm('¿Eliminar esta lección?')) return
    await createClient().from('lecciones').delete().eq('id', id)
    msg('Lección eliminada'); cargar()
  }

  async function moverModulo(id: string, dir: -1|1) {
    const idx = modulos.findIndex(m => m.id === id)
    if (idx + dir < 0 || idx + dir >= modulos.length) return
    const supabase = createClient()
    const a = modulos[idx], b = modulos[idx + dir]
    await supabase.from('modulos').update({ orden: b.orden }).eq('id', a.id)
    await supabase.from('modulos').update({ orden: a.orden }).eq('id', b.id)
    cargar()
  }

  async function moverLeccion(modId: string, lecId: string, dir: -1|1) {
    const mod = modulos.find(m => m.id === modId)
    if (!mod) return
    const lecs = mod.lecciones
    const idx = lecs.findIndex((l: Leccion) => l.id === lecId)
    if (idx + dir < 0 || idx + dir >= lecs.length) return
    const supabase = createClient()
    const a = lecs[idx], b = lecs[idx + dir]
    await supabase.from('lecciones').update({ orden: b.orden }).eq('id', a.id)
    await supabase.from('lecciones').update({ orden: a.orden }).eq('id', b.id)
    cargar()
  }

  if (cargando) return <div style={{padding:32,textAlign:'center',color:'var(--gray)'}}>Cargando estructura del curso…</div>
  if (!curso) return null

  const totalLecciones = modulos.reduce((s, m) => s + m.lecciones.length, 0)
  const duracionTotal = modulos.reduce((s, m) => s + m.lecciones.reduce((ss: number, l: Leccion) => ss + (l.duracion_min||0), 0), 0)

  return (
    <div>
      {/* Header del curso */}
      <div className="glass-card" style={{marginBottom:20,borderLeft:`4px solid ${colorNivel(curso.nivel)}`}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          {curso.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={curso.thumbnail_url} alt={curso.titulo} style={{width:80,height:50,objectFit:'cover',borderRadius:8,flexShrink:0}}/>
          )}
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:colorNivel(curso.nivel),textTransform:'uppercase',letterSpacing:'.1em',marginBottom:2}}>{curso.nivel}</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--navy)'}}>{curso.titulo}</div>
            <div style={{fontSize:13,color:'var(--gray)',marginTop:2}}>
              {modulos.length} módulo{modulos.length!==1?'s':''} · {totalLecciones} lección{totalLecciones!==1?'es':''} · {duracionTotal} min total
            </div>
          </div>
          <span className={`adm-pub-badge ${curso.publicado?'pub':'draft'}`}>{curso.publicado?'Publicado':'Borrador'}</span>
        </div>
      </div>

      {/* Botón nuevo módulo */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{fontSize:16,fontWeight:800,color:'var(--navy)'}}>Estructura del curso</h2>
        <button className="btn btn-cyan btn-sm" onClick={() => setModalModulo('nuevo')}>+ Nuevo módulo</button>
      </div>

      {/* Lista de módulos */}
      {modulos.length === 0 ? (
        <div style={{textAlign:'center',padding:'48px 24px',color:'var(--gray)',border:'2px dashed var(--line)',borderRadius:18}}>
          <div style={{fontSize:40,marginBottom:12}}>📦</div>
          <p style={{marginBottom:16}}>Este curso no tiene módulos aún.</p>
          <button className="btn btn-navy btn-sm" onClick={() => setModalModulo('nuevo')}>Crear primer módulo</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {modulos.map((mod, mi) => (
            <div key={mod.id} style={{borderRadius:18,border:'1px solid var(--line)',overflow:'hidden',background:'#fff',boxShadow:'var(--glass-shadow)'}}>
              {/* Header módulo */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'rgba(36,69,154,.04)',borderBottom:'1px solid var(--line)'}}>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  <button onClick={() => moverModulo(mod.id,-1)} disabled={mi===0}
                    style={{background:'none',border:0,cursor:'pointer',color:mi===0?'var(--line)':'var(--gray)',fontSize:12,padding:'0 2px',lineHeight:1}}>▲</button>
                  <button onClick={() => moverModulo(mod.id,1)} disabled={mi===modulos.length-1}
                    style={{background:'none',border:0,cursor:'pointer',color:mi===modulos.length-1?'var(--line)':'var(--gray)',fontSize:12,padding:'0 2px',lineHeight:1}}>▼</button>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:'var(--gray)',minWidth:20}}>M{mi+1}</span>
                <span style={{flex:1,fontWeight:800,color:'var(--navy)',fontSize:15}}>{mod.titulo}</span>
                <span style={{fontSize:12,color:'var(--gray)'}}>{mod.lecciones.length} lec.</span>
                <button className="adm-acc-btn accent" onClick={() => setModalModulo(mod)} title="Editar módulo" style={{width:30,height:30}}>✏️</button>
                <button className="adm-acc-btn danger" onClick={() => eliminarModulo(mod.id)} title="Eliminar módulo" style={{width:30,height:30}}>🗑</button>
              </div>

              {/* Lecciones del módulo */}
              <div style={{padding:'8px 0'}}>
                {mod.lecciones.map((lec: Leccion, li: number) => (
                  <div key={lec.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',borderBottom:'1px solid rgba(220,227,237,.4)'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:1}}>
                      <button onClick={() => moverLeccion(mod.id,lec.id,-1)} disabled={li===0}
                        style={{background:'none',border:0,cursor:'pointer',color:li===0?'var(--line)':'var(--gray)',fontSize:11,padding:'0 2px',lineHeight:1}}>▲</button>
                      <button onClick={() => moverLeccion(mod.id,lec.id,1)} disabled={li===mod.lecciones.length-1}
                        style={{background:'none',border:0,cursor:'pointer',color:li===mod.lecciones.length-1?'var(--line)':'var(--gray)',fontSize:11,padding:'0 2px',lineHeight:1}}>▼</button>
                    </div>
                    <span style={{fontSize:11,color:'var(--gray)',minWidth:24}}>{mi+1}.{li+1}</span>
                    <span style={{fontSize:18}}>{tipoIco(lec.tipo)}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,color:'var(--ink)',fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lec.titulo}</div>
                      <div style={{display:'flex',gap:8,marginTop:2}}>
                        <span style={{fontSize:11,background:'rgba(22,163,196,.1)',color:'var(--cyan-dark)',padding:'1px 8px',borderRadius:99,fontWeight:600}}>
                          {TIPOS_LECCION.find(t=>t.key===lec.tipo)?.label}
                        </span>
                        {lec.duracion_min > 0 && <span style={{fontSize:11,color:'var(--gray)'}}>{lec.duracion_min} min</span>}
                        {lec.es_preview && <span style={{fontSize:11,background:'rgba(84,178,76,.1)',color:'var(--green)',padding:'1px 8px',borderRadius:99,fontWeight:600}}>Preview</span>}
                        {(lec.recursos?.length || 0) > 0 && (
                          <span style={{fontSize:11,background:'rgba(144,45,142,.1)',color:'var(--purple)',padding:'1px 8px',borderRadius:99,fontWeight:600}}>
                            📎 {lec.recursos?.length} recurso{(lec.recursos?.length||0)!==1?'s':''}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="adm-acc-btn accent" onClick={() => setModalLeccion({leccion:lec,moduloId:mod.id,orden:li})} title="Editar" style={{width:30,height:30}}>✏️</button>
                    <button className="adm-acc-btn danger" onClick={() => eliminarLeccion(lec.id)} title="Eliminar" style={{width:30,height:30}}>🗑</button>
                  </div>
                ))}

                {/* Botón añadir lección */}
                <button
                  onClick={() => setModalLeccion({leccion:null,moduloId:mod.id,orden:mod.lecciones.length})}
                  style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 18px',background:'transparent',border:0,cursor:'pointer',color:'var(--cyan-dark)',fontWeight:600,fontSize:13,transition:'background .15s'}}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(22,163,196,.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
                >
                  <span style={{fontSize:16}}>+</span> Añadir lección a este módulo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {modalModulo && (
        <Modal titulo={modalModulo==='nuevo'?'Nuevo módulo':'Editar módulo'} onClose={() => setModalModulo(null)}>
          <EditorModulo
            modulo={modalModulo==='nuevo'?null:modalModulo as Modulo}
            cursoId={cursoId}
            orden={modulos.length}
            onGuardar={() => { setModalModulo(null); msg(modalModulo==='nuevo'?'Módulo creado':'Módulo actualizado'); cargar() }}
            onCerrar={() => setModalModulo(null)}
          />
        </Modal>
      )}

      {modalLeccion && (
        <Modal titulo={modalLeccion.leccion?'Editar lección':'Nueva lección'} onClose={() => setModalLeccion(null)} wide>
          <EditorLeccion
            leccion={modalLeccion.leccion}
            moduloId={modalLeccion.moduloId}
            orden={modalLeccion.orden}
            onGuardar={() => { setModalLeccion(null); msg('Lección guardada'); cargar() }}
            onCerrar={() => setModalLeccion(null)}
          />
        </Modal>
      )}

      {toast && (
        <div style={{position:'fixed',bottom:28,right:28,zIndex:200,background:'#2d7a27',color:'#fff',padding:'14px 22px',borderRadius:12,fontWeight:700,fontSize:15,boxShadow:'0 8px 28px rgba(0,0,0,.25)'}}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────
function AdminCursosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cursoId = searchParams.get('curso')
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol||'')) { router.push('/home'); return }
      const { data: c } = await supabase.from('cursos').select('*').order('orden')
      setCursos(c || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap" style={{maxWidth:1100}}>

        {cursoId ? (
          <>
            <div style={{marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
              <button onClick={() => router.push('/admin/cursos')}
                style={{background:'none',border:0,color:'var(--gray)',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
                ← Volver a cursos
              </button>
            </div>
            <div className="priv-head">
              <div className="eyebrow">Administración · Cursos</div>
              <h1>Editor de contenido</h1>
              <p>Gestiona módulos, lecciones y recursos del curso.</p>
            </div>
            <GestorCurso cursoId={cursoId} />
          </>
        ) : (
          <>
            <div className="priv-head">
              <div className="eyebrow">Administración</div>
              <h1>Gestión de cursos</h1>
              <p>Selecciona un curso para editar su contenido.</p>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
              <button className="btn btn-navy btn-sm" onClick={() => router.push('/admin?nuevo=1')}>
                + Crear nuevo curso
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {cursos.map(c => (
                <button key={c.id}
                  onClick={() => router.push(`/admin/cursos?curso=${c.id}`)}
                  className="glass-card"
                  style={{display:'flex',alignItems:'center',gap:16,textAlign:'left',cursor:'pointer',border:0,padding:0,overflow:'hidden'}}>
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt={c.titulo} style={{width:90,height:60,objectFit:'cover',flexShrink:0}}/>
                  ) : (
                    <div style={{width:90,height:60,background:colorNivel(c.nivel),flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>📚</div>
                  )}
                  <div style={{width:5,height:60,background:colorNivel(c.nivel),flexShrink:0}}/>
                  <div style={{flex:1,padding:'0 8px'}}>
                    <div style={{fontSize:11,fontWeight:700,color:colorNivel(c.nivel),textTransform:'uppercase',letterSpacing:'.1em'}}>{c.nivel}</div>
                    <div style={{fontSize:16,fontWeight:800,color:'var(--navy)'}}>{c.titulo}</div>
                    <div style={{fontSize:13,color:'var(--gray)'}}>{c.duracion_horas}h · {c.es_gratis?'Gratis':`$${Number(c.precio).toLocaleString('es-CO')}`}</div>
                  </div>
                  <div style={{padding:'0 20px',display:'flex',alignItems:'center',gap:8}}>
                    <span className={`adm-pub-badge ${c.publicado?'pub':'draft'}`}>{c.publicado?'Publicado':'Borrador'}</span>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--cyan)'}}>Editar contenido →</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function AdminCursosPage() {
  return (
    <Suspense fallback={<div className="priv-bg"><div className="dash-loading">Cargando…</div></div>}>
      <AdminCursosContent />
    </Suspense>
  )
}
