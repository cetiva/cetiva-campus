'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

const ROLES_PLATAFORMA = [
  { key: 'estudiante', label: 'Estudiante',  desc: 'Acceso a cursos, evaluaciones y certificados.', color: 'var(--purple)', bg: 'rgba(144,45,142,.08)' },
  { key: 'instructor', label: 'Instructor',  desc: 'Gestión de cursos, estudiantes y evaluaciones.', color: 'var(--cyan-dark)', bg: 'rgba(22,163,196,.08)' },
  { key: 'admin',      label: 'Administrador', desc: 'Control total de la plataforma y usuarios.', color: 'var(--navy)', bg: 'rgba(36,69,154,.08)' },
]

export default function AdminHomePage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [stats, setStats] = useState({ usuarios:0, cursos:0, instructores:0, estudiantes:0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || p.rol !== 'admin') { router.push('/home'); return }
      const [u, c, inst, est] = await Promise.all([
        supabase.from('profiles').select('*',{count:'exact',head:true}),
        supabase.from('cursos').select('*',{count:'exact',head:true}).eq('publicado',true),
        supabase.from('profiles').select('*',{count:'exact',head:true}).eq('rol','instructor'),
        supabase.from('profiles').select('*',{count:'exact',head:true}).eq('rol','estudiante'),
      ])
      setStats({ usuarios:u.count||0, cursos:c.count||0, instructores:inst.count||0, estudiantes:est.count||0 })
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando panel admin…</div></div>

  const cards = [
    { titulo:'Gestión de usuarios', desc:`${stats.usuarios} usuarios registrados`, color:'var(--cyan)', bg:'rgba(22,163,196,.08)', href:'/admin/usuarios', ico:'👥' },
    { titulo:'Gestión de cursos', desc:`${stats.cursos} cursos publicados`, color:'var(--navy)', bg:'rgba(36,69,154,.08)', href:'/admin', ico:'📚' },
    { titulo:'Reportes globales', desc:'Métricas de la plataforma', color:'var(--green)', bg:'rgba(84,178,76,.08)', href:'/admin/reportes', ico:'📊' },
    { titulo:'Perfiles', desc:'Administrar roles disponibles', color:'var(--purple)', bg:'rgba(144,45,142,.08)', href:'/admin/perfiles', ico:'🎭', badge:'Nuevo' },
  ]

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Administración</div>
          <h1>Panel de administración</h1>
          <p>Control y gestión global de CETIVA Campus.</p>
        </div>

        {/* Stats rápidos */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
          {[
            {l:'Usuarios totales', v:stats.usuarios, c:'var(--cyan)'},
            {l:'Estudiantes', v:stats.estudiantes, c:'var(--purple)'},
            {l:'Instructores', v:stats.instructores, c:'var(--cyan-dark)'},
            {l:'Cursos activos', v:stats.cursos, c:'var(--navy)'},
          ].map(s => (
            <div key={s.l} className="glass-card" style={{textAlign:'center',padding:'18px 12px'}}>
              <div style={{fontSize:30,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:12,color:'var(--gray)',marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Cards de capacidades */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:18,marginBottom:28}}>
          {cards.map(c => (
            <button key={c.titulo} onClick={() => router.push(c.href)}
              className="glass-card"
              style={{textAlign:'left',border:`1px solid ${c.color}25`,cursor:'pointer',display:'flex',gap:16,alignItems:'flex-start',padding:'22px'}}>
              <div style={{width:48,height:48,borderRadius:14,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                {c.ico}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontWeight:800,color:'var(--navy)',fontSize:15}}>{c.titulo}</span>
                  {c.badge && <span style={{fontSize:10,fontWeight:700,background:c.color,color:'#fff',padding:'2px 8px',borderRadius:99}}>{c.badge}</span>}
                </div>
                <div style={{fontSize:13,color:'var(--gray)'}}>{c.desc}</div>
              </div>
              <span style={{color:c.color,fontSize:18,flexShrink:0}}>→</span>
            </button>
          ))}
        </div>

        {/* Sección Perfiles */}
        <div className="glass-card">
          <h2 style={{fontSize:17,fontWeight:800,color:'var(--navy)',marginBottom:4}}>Perfiles de la plataforma</h2>
          <p style={{fontSize:14,color:'var(--gray)',marginBottom:16}}>Roles disponibles y sus capacidades.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {ROLES_PLATAFORMA.map(r => (
              <div key={r.key} style={{padding:'16px',borderRadius:14,background:r.bg,border:`1px solid ${r.color}20`}}>
                <div style={{fontWeight:800,color:r.color,marginBottom:4}}>{r.label}</div>
                <div style={{fontSize:13,color:'var(--gray)'}}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
