'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Curso } from '@/types'
import { NIVELES_LISTA, colorNivel } from '@/lib/niveles'

const NIVELES = NIVELES_LISTA.map(n => n.key)
const COLORES = NIVELES_LISTA.map(n => n.color)

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

const Ico = {
  plus:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  edit:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  eye:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  x:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  img:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-hd">
          <h2>{titulo}</h2>
          <button className="adm-modal-close" onClick={onClose}>{Ico.x}</button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  )
}

function Toast({ msg, tipo, onDone }: { msg: string; tipo: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{position:'fixed',bottom:28,right:28,zIndex:200,background:tipo==='err'?'#C0392B':'#2d7a27',color:'#fff',padding:'14px 22px',borderRadius:12,fontWeight:700,fontSize:15,boxShadow:'0 8px 28px rgba(0,0,0,.25)'}}>
      {msg}
    </div>
  )
}

type CursoForm = {
  titulo:string; descripcion:string; nivel:string; color:string
  duracion_horas:string; es_gratis:boolean; precio:string; publicado:boolean
}

function FormCurso({ inicial, onGuardar, onCerrar, guardando }:
  { inicial: Curso|null; onGuardar: (d: Partial<Curso>, file: File|null) => void; onCerrar: () => void; guardando: boolean }) {
  const [f, setF] = useState<CursoForm>({
    titulo: inicial?.titulo||'', descripcion: inicial?.descripcion||'',
    nivel: inicial?.nivel||NIVELES[0], color: inicial?.color||COLORES[0],
    duracion_horas: String(inicial?.duracion_horas||''), es_gratis: inicial?.es_gratis??true,
    precio: String(inicial?.precio||''), publicado: inicial?.publicado??false,
  })
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState<string|null>(inicial?.thumbnail_url||null)

  function set(k: keyof CursoForm, v: string|boolean) { setF(x => ({ ...x, [k]: v })) }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // SEGURIDAD: Validar tipo MIME real y tamaño
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG, WebP o GIF.')
      e.target.value = ''
      return
    }
    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) {
      alert(`La imagen no puede superar ${maxMB}MB.`)
      e.target.value = ''
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onGuardar({
      titulo:f.titulo.trim(), descripcion:f.descripcion.trim(),
      nivel:f.nivel, color:f.color, duracion_horas:Number(f.duracion_horas)||0,
      es_gratis:f.es_gratis, precio:Number(f.precio)||0, publicado:f.publicado,
      slug: inicial?.slug || slugify(f.titulo),
    }, imageFile)}} noValidate>

      {/* Imagen de portada */}
      <div style={{marginBottom:20}}>
        <label style={{display:'block',fontSize:14,fontWeight:700,marginBottom:8,color:'var(--ink)'}}>
          Imagen de portada
        </label>
        <div style={{
          border:'2px dashed var(--line)',borderRadius:14,overflow:'hidden',
          background:'rgba(36,69,154,.03)',cursor:'pointer',position:'relative'
        }}>
          {imagePreview ? (
            <div style={{position:'relative'}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Portada" style={{width:'100%',height:160,objectFit:'cover',display:'block'}}/>
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.6)',color:'#fff',border:0,borderRadius:99,width:28,height:28,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
                ✕
              </button>
            </div>
          ) : (
            <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:120,cursor:'pointer',gap:8}}>
              <span style={{color:'var(--gray)',width:32,height:32}}>{Ico.img}</span>
              <span style={{fontSize:14,color:'var(--gray)',fontWeight:600}}>Clic para subir imagen de portada</span>
              <span style={{fontSize:12,color:'var(--gray)'}}>JPG, PNG o WebP · Recomendado: 800×450px</span>
              <input type="file" accept="image/*" onChange={handleImage} style={{display:'none'}}/>
            </label>
          )}
          {!imagePreview && <input type="file" accept="image/*" onChange={handleImage} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}/>}
        </div>
      </div>

      <div className="field"><label>Título del curso</label><input required value={f.titulo} onChange={e => set('titulo',e.target.value)}/></div>
      <div className="field"><label>Descripción</label><textarea value={f.descripcion} onChange={e => set('descripcion',e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:14,border:'1px solid var(--glass-brd)',fontFamily:'inherit',fontSize:15,resize:'vertical',minHeight:90}}/></div>

      <div className="grid2">
        <div className="field"><label>Nivel</label>
          <select value={f.nivel} onChange={e => {
            const nivel = e.target.value
            const colorAuto = colorNivel(nivel)
            setF(x => ({ ...x, nivel, color: colorAuto }))
          }}>
            {NIVELES_LISTA.map(n => (
              <option key={n.key} value={n.key}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="field"><label>Duración (horas)</label><input type="number" min="0" value={f.duracion_horas} onChange={e => set('duracion_horas',e.target.value)}/></div>
      </div>

      <div style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:14,fontWeight:700,marginBottom:8,color:'var(--ink)'}}>
          Color del curso{' '}
          <span style={{fontSize:12,fontWeight:400,color:'var(--gray)'}}>— se asigna automáticamente según el nivel</span>
        </label>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:f.color,border:'3px solid var(--navy)',flexShrink:0}}/>
          <span style={{fontSize:13,color:'var(--gray)',fontFamily:'monospace'}}>{f.color}</span>
          <div className="adm-color-row" style={{marginBottom:0}}>
            {COLORES.map(c => <button key={c} type="button" className={`adm-color-btn${f.color===c?' sel':''}`} style={{background:c}} onClick={() => set('color',c)}/>)}
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="field"><label>Tipo de acceso</label>
          <select value={f.es_gratis?'gratis':'pago'} onChange={e => set('es_gratis',e.target.value==='gratis')}>
            <option value="gratis">Gratuito</option>
            <option value="pago">De pago</option>
          </select>
        </div>
        {!f.es_gratis && <div className="field"><label>Precio (COP)</label><input type="number" min="0" value={f.precio} onChange={e => set('precio',e.target.value)}/></div>}
      </div>

      <div style={{display:'flex',gap:12,marginTop:8}}>
        <button className="btn btn-cyan" type="submit" disabled={guardando}>{guardando?'Guardando…':inicial?'Guardar cambios':'Crear curso'}</button>
        <button className="btn btn-ghost" type="button" onClick={onCerrar}>Cancelar</button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState(false)
  const [modal, setModal] = useState<null|'nuevo'|Curso>(null)

  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<[string,string]|null>(null)

  const msg = useCallback((t: [string,string]) => setToast(t), [])

  const recargar = useCallback(async () => {
    const { data } = await createClient().from('cursos').select('*').order('orden')
    setCursos(data || [])
  }, [])

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin'].includes(p?.rol || '')) { setCargando(false); return }
      setAcceso(true)
      await recargar()
      setCargando(false)
    }
    cargar()
  }, [router, recargar])

  async function guardarCurso(datos: Partial<Curso>, imageFile: File|null) {
    setGuardando(true)
    const supabase = createClient()

    // Subir imagen si hay una nueva
    let thumbnail_url = (modal !== 'nuevo' && typeof modal !== 'string' ? modal?.thumbnail_url : null) || null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `curso-${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portadas')
        .upload(filename, imageFile, { upsert: true, contentType: imageFile.type })
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('portadas').getPublicUrl(filename)
        thumbnail_url = publicUrl
      }
    }

    const payload = { ...datos, thumbnail_url }

    if (modal === 'nuevo') {
      const { error } = await supabase.from('cursos').insert(payload)
      msg(error ? [error.message,'err'] : ['Curso creado correctamente','ok'])
    } else if (modal && typeof modal !== 'string') {
      const { error } = await supabase.from('cursos').update(payload).eq('id', modal.id)
      msg(error ? [error.message,'err'] : ['Curso actualizado correctamente','ok'])
    }

    setGuardando(false); setModal(null); recargar()
  }

  async function togglePublicado(c: Curso) {
    await createClient().from('cursos').update({ publicado: !c.publicado }).eq('id', c.id)
    msg([c.publicado?'Curso despublicado':'Curso publicado','ok']); recargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este curso? Esta acción no se puede deshacer.')) return
    const { error } = await createClient().from('cursos').delete().eq('id', id)
    msg(error ? [error.message,'err'] : ['Curso eliminado','ok']); recargar()
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Verificando acceso…</div></div>

  if (!acceso) return (
    <div className="priv-bg">
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="glass-card" style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:48,marginBottom:16}}>🔒</div>
          <h2 style={{color:'var(--navy)',marginBottom:8}}>Acceso restringido</h2>
          <p style={{color:'var(--gray)',marginBottom:24}}>Esta sección es exclusiva para administradores.</p>
          <button className="btn btn-navy" onClick={() => router.push('/inicio')}>Volver al inicio</button>
        </div>
      </main>
    </div>
  )

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Administración</div>
          <h1>Panel de cursos</h1>
          <p>Gestiona el catálogo de formación de CETIVA Campus.</p>
        </div>

        <div className="adm-toolbar">
          <span className="adm-count">{cursos.length} curso{cursos.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-cyan" onClick={() => setModal('nuevo')}>{Ico.plus} Nuevo curso</button>
        </div>

        {cursos.length === 0 ? (
          <div className="glass-card adm-empty">
            <p style={{color:'var(--gray)'}}>No hay cursos todavía. Crea el primero.</p>
          </div>
        ) : (
          <div className="adm-curso-list">
            {cursos.map(c => (
              <div key={c.id} className="glass-card adm-curso-row" style={{padding:0,overflow:'hidden'}}>
                {/* Thumbnail */}
                {c.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt={c.titulo} style={{width:100,height:'100%',minHeight:90,objectFit:'cover',flexShrink:0}}/>
                ) : (
                  <div style={{width:100,minHeight:90,background:c.color,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.5)',fontSize:28}}>📚</div>
                )}
                <div className="adm-curso-spine" style={{background:c.color}}/>
                <div className="adm-curso-info">
                  <div className="adm-curso-top">
                    <span className="adm-nivel" style={{color:c.color}}>{c.nivel}</span>
                    <span className={`adm-pub-badge${c.publicado?' pub':' draft'}`}>{c.publicado?'Publicado':'Borrador'}</span>
                  </div>
                  <div className="adm-curso-titulo">{c.titulo}</div>
                  <div className="adm-curso-desc">{c.descripcion}</div>
                  <div className="adm-curso-meta">
                    <span>{c.duracion_horas}h</span>·
                    <span>{c.es_gratis?'Gratis':`$${Number(c.precio).toLocaleString('es-CO')}`}</span>
                  </div>
                </div>
                <div className="adm-curso-acc">
                  <button className="adm-acc-btn accent" title="Editar" onClick={() => setModal(c)}>{Ico.edit}</button>
                  <button className="adm-acc-btn" title={c.publicado?'Despublicar':'Publicar'} onClick={() => togglePublicado(c)}>{Ico.eye}</button>
                  <button className="adm-acc-btn danger" title="Eliminar" onClick={() => eliminar(c.id)}>{Ico.trash}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <Modal titulo={modal==='nuevo'?'Nuevo curso':'Editar curso'} onClose={() => setModal(null)}>
          <FormCurso inicial={modal!=='nuevo'?modal as Curso:null} onGuardar={guardarCurso} onCerrar={() => setModal(null)} guardando={guardando}/>
        </Modal>
      )}

      {toast && <Toast msg={toast[0]} tipo={toast[1]} onDone={() => setToast(null)}/>}
    </div>
  )
}
