'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import { BRAND } from '@/lib/brand'
import type { Perfil, Inscripcion } from '@/types'

export default function InicioPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [ultimoCurso, setUltimoCurso] = useState<Inscripcion | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p || { id: user.id, nombre: user.email?.split('@')[0] || '', apellidos: '' })
      const { data: ins } = await supabase
        .from('inscripciones')
        .select('curso_id, ultimo_acceso, inscrito_en, cursos(titulo, descripcion, color, nivel, duracion_horas, slug, thumbnail_url)')
        .eq('usuario_id', user.id)
        .order('ultimo_acceso', { ascending: false, nullsFirst: false })
        .limit(1)
      if (ins && ins.length > 0) setUltimoCurso(ins[0] as unknown as Inscripcion)
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>

  const nombre = perfil?.nombre || 'estudiante'
  const curso = ultimoCurso?.cursos as Record<string, string> | undefined

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Bienvenido</div>
          <h1>Hola, {nombre}</h1>
          <p>¿Qué quieres hacer hoy?</p>
        </div>

        <div className="home-grid">
          {/* Tile 1: Mis cursos — siempre visible */}
          <button className="tile" onClick={() => router.push('/dashboard')}>
            <div className="tile-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>Mis cursos</h3>
            <p>Explora el catálogo e inscríbete en nuevos cursos.</p>
            <span className="tile-cta">Ver catálogo →</span>
          </button>

          {/* Tile 2: App externa (configurable) o Evaluaciones */}
          {BRAND.features.appExterna && BRAND.appExterna.url ? (
            <a className="tile tile-ebapp" href={BRAND.appExterna.url} target="_blank" rel="noopener noreferrer"
              style={{padding:0, overflow:'hidden'}}>
              <img src="/ebapp-banner.png" alt={BRAND.appExterna.nombre}
                style={{width:'100%',height:140,objectFit:'cover',display:'block',flexShrink:0}}/>
              <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',flex:1}}>
                <h3 style={{color:'var(--purple)'}}>{BRAND.appExterna.nombre}</h3>
                <p>Accede a la aplicación complementaria de la plataforma.</p>
                <span className="tile-cta" style={{color:'var(--purple)'}}>{BRAND.appExterna.label}</span>
              </div>
            </a>
          ) : (
            <button className="tile" onClick={() => router.push('/evaluaciones')}>
              <div className="tile-ico" style={{background:'rgba(36,69,154,.08)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h3>Mis evaluaciones</h3>
              <p>Realiza tus exámenes y revisa tus resultados y calificaciones.</p>
              <span className="tile-cta">Ver evaluaciones →</span>
            </button>
          )}

          {/* Tile 3: Continuar curso o comenzar */}
          {curso ? (
            <button className="tile tile-continuar"
              onClick={() => router.push(`/cursos/${curso.slug || ultimoCurso?.curso_id}`)}>
              {curso.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={curso.thumbnail_url} alt={curso.titulo}
                  style={{width:'100%',height:100,objectFit:'cover',borderRadius:12,marginBottom:14,flexShrink:0}}/>
              ) : (
                <div className="tile-badge" style={{background:curso.color||'var(--cyan)',alignSelf:'flex-start'}}>Continuar</div>
              )}
              <h3>{curso.titulo}</h3>
              <p>{curso.descripcion}</p>
              <span className="tile-cta" style={{color:curso.color||'var(--cyan)'}}>Continuar donde lo dejaste →</span>
            </button>
          ) : (
            <button className="tile tile-vacio" onClick={() => router.push('/dashboard')}>
              <div className="tile-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <h3>Aún no has empezado</h3>
              <p>Explora el catálogo y comienza tu primer curso.</p>
              <span className="tile-cta">Explorar el catálogo →</span>
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
