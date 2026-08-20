'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

export default function AdminReportesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [stats, setStats] = useState({ usuarios:0, cursos:0, inscripciones:0, completados:0, evaluaciones:0, intentos:0, aprobados:0, mensajes:0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || p.rol !== 'admin') { router.push('/inicio'); return }
      const [u,c,ins,ev,int,msg] = await Promise.all([
        supabase.from('profiles').select('*',{count:'exact',head:true}),
        supabase.from('cursos').select('*',{count:'exact',head:true}).eq('publicado',true),
        supabase.from('inscripciones').select('*',{count:'exact',head:true}),
        supabase.from('evaluaciones').select('*',{count:'exact',head:true}),
        supabase.from('intentos').select('*',{count:'exact',head:true}).eq('estado','calificado'),
        supabase.from('mensajes').select('*',{count:'exact',head:true}),
      ])
      const { count: completados } = await supabase.from('inscripciones').select('*',{count:'exact',head:true}).eq('completado',true)
      const { count: aprobados } = await supabase.from('intentos').select('*',{count:'exact',head:true}).eq('aprobado',true)
      setStats({
        usuarios: u.count||0, cursos: c.count||0,
        inscripciones: ins.count||0, completados: completados||0,
        evaluaciones: ev.count||0, intentos: int.count||0,
        aprobados: aprobados||0, mensajes: msg.count||0,
      })
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando reportes…</div></div>

  const kpis = [
    {label:'Usuarios registrados', val: stats.usuarios, color:'var(--cyan)', sub:'total en la plataforma'},
    {label:'Cursos publicados', val: stats.cursos, color:'var(--navy)', sub:'activos y visibles'},
    {label:'Inscripciones', val: stats.inscripciones, color:'var(--purple)', sub:'total históricas'},
    {label:'Cursos completados', val: stats.completados, color:'var(--green)', sub:`${stats.inscripciones>0?Math.round(stats.completados/stats.inscripciones*100):0}% tasa de compleción`},
    {label:'Evaluaciones creadas', val: stats.evaluaciones, color:'var(--orange)', sub:'publicadas'},
    {label:'Intentos calificados', val: stats.intentos, color:'var(--cyan)', sub:'evaluaciones enviadas'},
    {label:'Aprobados', val: stats.aprobados, color:'var(--green)', sub:`${stats.intentos>0?Math.round(stats.aprobados/stats.intentos*100):0}% tasa de aprobación`},
    {label:'Mensajes enviados', val: stats.mensajes, color:'var(--navy)', sub:'en todos los chats'},
  ]

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Administración</div>
          <h1>Reportes globales</h1>
          <p>Métricas generales de la plataforma CETIVA Campus.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
          {kpis.map(k => (
            <div className="glass-card" key={k.label} style={{textAlign:'center',padding:'28px 20px'}}>
              <div style={{fontSize:42,fontWeight:900,color:k.color,lineHeight:1,marginBottom:8}}>{k.val.toLocaleString()}</div>
              <div style={{fontWeight:700,color:'var(--navy)',fontSize:15,marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:12,color:'var(--gray)'}}>{k.sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
