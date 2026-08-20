'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

export default function InstructorHomePage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [stats, setStats] = useState({ cursos:0, estudiantes:0, evaluaciones:0, pendientes:0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol||'')) { router.push('/home'); return }
      const [c, ins, ev, pend] = await Promise.all([
        supabase.from('cursos').select('*',{count:'exact',head:true}).eq('publicado',true),
        supabase.from('inscripciones').select('*',{count:'exact',head:true}),
        supabase.from('evaluaciones').select('*',{count:'exact',head:true}),
        supabase.from('intentos').select('*',{count:'exact',head:true}).eq('estado','enviado'),
      ])
      setStats({ cursos:c.count||0, estudiantes:ins.count||0, evaluaciones:ev.count||0, pendientes:pend.count||0 })
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando panel instructor…</div></div>

  const cards = [
    { titulo:'Gestión de cursos', desc:`${stats.cursos} cursos publicados. Crear, editar y gestionar contenido.`, color:'var(--cyan-dark)', bg:'rgba(22,163,196,.08)', href:'/teacher', ico:'📚' },
    { titulo:'Evaluaciones', desc:`${stats.evaluaciones} evaluaciones · ${stats.pendientes} pendientes de calificar`, color:'var(--navy)', bg:'rgba(36,69,154,.08)', href:'/teacher/evaluaciones', ico:'📝', badge: stats.pendientes > 0 ? `${stats.pendientes} pendientes` : undefined },
    { titulo:'Mis estudiantes', desc:`${stats.estudiantes} inscripciones activas en la plataforma.`, color:'var(--green)', bg:'rgba(84,178,76,.08)', href:'/teacher/estudiantes', ico:'👥' },
    { titulo:'Reportes', desc:'Progreso grupal, tasas de aprobación y estadísticas.', color:'var(--purple)', bg:'rgba(144,45,142,.08)', href:'/teacher/reportes', ico:'📊' },
    { titulo:'Mensajes', desc:'Chat con estudiantes en tiempo real.', color:'var(--orange)', bg:'rgba(241,159,44,.08)', href:'/chat', ico:'💬' },
    { titulo:'Mi agenda', desc:'Organiza sesiones, clases y recordatorios.', color:'var(--navy)', bg:'rgba(36,69,154,.06)', href:'/agenda', ico:'📅' },
  ]

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Instructor</div>
          <h1>Panel del instructor</h1>
          <p>Gestiona tus cursos, estudiantes y evaluaciones.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
          {[
            {l:'Cursos activos', v:stats.cursos, c:'var(--cyan-dark)'},
            {l:'Estudiantes', v:stats.estudiantes, c:'var(--green)'},
            {l:'Evaluaciones', v:stats.evaluaciones, c:'var(--navy)'},
            {l:'Por calificar', v:stats.pendientes, c: stats.pendientes > 0 ? '#C0392B' : 'var(--gray)'},
          ].map(s => (
            <div key={s.l} className="glass-card" style={{textAlign:'center',padding:'18px 12px'}}>
              <div style={{fontSize:30,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:12,color:'var(--gray)',marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {cards.map(c => (
            <button key={c.titulo} onClick={() => router.push(c.href)}
              className="glass-card"
              style={{textAlign:'left',border:`1px solid ${c.color}25`,cursor:'pointer',display:'flex',gap:14,alignItems:'flex-start',padding:'20px'}}>
              <div style={{width:44,height:44,borderRadius:12,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                {c.ico}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontWeight:800,color:'var(--navy)',fontSize:15}}>{c.titulo}</span>
                  {c.badge && <span style={{fontSize:10,fontWeight:700,background:'#C0392B',color:'#fff',padding:'2px 8px',borderRadius:99}}>{c.badge}</span>}
                </div>
                <div style={{fontSize:13,color:'var(--gray)',lineHeight:1.5}}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
