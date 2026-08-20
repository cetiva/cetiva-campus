'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Perfil } from '@/types'

export default function HomeSelectorPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p || { id: user.id, nombre: user.email?.split('@')[0] || '', apellidos: '' })
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando…</div></div>

  const esAdmin = perfil?.rol === 'admin'
  const esInstructor = ['admin','instructor'].includes(perfil?.rol || '')
  const nombre = perfil?.nombre || 'profesional'

  const funciones = [
    ...(esAdmin ? [{
      key: 'admin',
      titulo: 'Administración',
      desc: 'Gestión de usuarios, cursos, instructores, perfiles y configuración de la plataforma.',
      href: '/admin/home',
      color: 'var(--navy)',
      bg: 'rgba(36,69,154,.08)',
      ico: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 4v6c0 5.5-3.9 10.7-9 12-5.1-1.3-9-6.5-9-12V6l9-4z"/><path d="M9 12l2 2 4-4"/></svg>,
    }] : []),
    ...(esInstructor ? [{
      key: 'instructor',
      titulo: 'Instructor',
      desc: 'Gestión de cursos, estudiantes, evaluaciones, calificaciones y seguimiento del aprendizaje.',
      href: '/instructor/home',
      color: 'var(--cyan-dark)',
      bg: 'rgba(22,163,196,.08)',
      ico: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    }] : []),
    {
      key: 'estudiante',
      titulo: 'Mi aprendizaje',
      desc: 'Accede a tus cursos, evaluaciones, certificados y progreso de formación.',
      href: '/inicio',
      color: 'var(--purple)',
      bg: 'rgba(144,45,142,.08)',
      ico: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    },
  ]

  return (
    <div className="priv-bg" style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>

      {/* Header simple */}
      <header className="uh">
        <div className="uh-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-color.png" alt="CETIVA" className="uh-logo" style={{cursor:'default'}} />
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:15,fontWeight:600,color:'var(--gray)'}}>{nombre} {perfil?.apellidos}</span>
            <button
              onClick={async () => { await createClient().auth.signOut(); router.push('/login') }}
              style={{fontSize:13,color:'var(--gray)',background:'none',border:'1px solid var(--line)',borderRadius:99,padding:'6px 14px',cursor:'pointer',fontWeight:600}}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        <div style={{width:'100%',maxWidth:800}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="eyebrow" style={{color:'var(--cyan)',fontSize:12,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:12}}>
              CETIVA Campus
            </div>
            <h1 style={{fontSize:'clamp(26px,4vw,38px)',fontWeight:900,color:'var(--navy)',marginBottom:12}}>
              Hola, {nombre}
            </h1>
            <p style={{fontSize:16,color:'var(--gray)'}}>¿Desde qué perfil quieres trabajar hoy?</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:`repeat(${funciones.length},minmax(220px,1fr))`,gap:20,justifyContent:'center'}}>
            {funciones.map(f => (
              <button
                key={f.key}
                onClick={() => router.push(f.href)}
                className="glass-card"
                style={{
                  border:`1px solid ${f.color}30`,
                  textAlign:'center',padding:'36px 24px',cursor:'pointer',
                  transition:'all .2s',display:'flex',flexDirection:'column',alignItems:'center',gap:16
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 16px 40px rgba(0,0,0,.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}
              >
                <div style={{width:64,height:64,borderRadius:18,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',color:f.color}}>
                  {f.ico}
                </div>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:f.color,marginBottom:8}}>{f.titulo}</div>
                  <div style={{fontSize:14,color:'var(--gray)',lineHeight:1.55}}>{f.desc}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:f.color,marginTop:4}}>
                  Entrar →
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
