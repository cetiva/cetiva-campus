'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

type Rol = 'estudiante' | 'instructor' | 'admin'

const PERFILES_CONFIG: Record<Rol, {
  label: string; color: string; bg: string
  capacidades: string[]; restricciones: string[]
}> = {
  estudiante: {
    label: 'Estudiante',
    color: 'var(--purple)', bg: 'rgba(144,45,142,.08)',
    capacidades: ['Acceder a cursos inscritos','Ver evaluaciones y resultados','Obtener certificados','Chat con instructor','Agenda personal','Ver mi avance y progreso'],
    restricciones: ['No puede gestionar usuarios','No puede crear cursos','No puede ver datos de otros estudiantes'],
  },
  instructor: {
    label: 'Instructor',
    color: 'var(--cyan-dark)', bg: 'rgba(22,163,196,.08)',
    capacidades: ['Gestionar cursos y contenidos','Crear y calificar evaluaciones','Ver estudiantes y su progreso','Reportes grupales','Chat con estudiantes'],
    restricciones: ['No puede gestionar usuarios','No puede cambiar roles','No puede acceder a configuración del sistema'],
  },
  admin: {
    label: 'Administrador',
    color: 'var(--navy)', bg: 'rgba(36,69,154,.08)',
    capacidades: ['Control total de la plataforma','Gestión de usuarios y roles','Reportes globales','Gestión de todos los cursos','Configuración del sistema'],
    restricciones: [],
  },
}

export default function AdminPerfilesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [rolSel, setRolSel] = useState<Rol>('estudiante')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || p.rol !== 'admin') { router.push('/home'); return }
      const { data: todos } = await supabase.from('profiles').select('rol')
      const c: Record<string, number> = { estudiante:0, instructor:0, admin:0, sin_rol:0 }
      ;(todos||[]).forEach((u: { rol?: string }) => {
        const r = u.rol || 'sin_rol'
        c[r] = (c[r]||0) + 1
      })
      setConteos(c)
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando perfiles…</div></div>

  const cfg = PERFILES_CONFIG[rolSel]

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Administración · Perfiles</div>
          <h1>Gestión de perfiles</h1>
          <p>Administra los roles disponibles en la plataforma.</p>
        </div>

        {/* Conteo por rol */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:28}}>
          {(Object.keys(PERFILES_CONFIG) as Rol[]).map(r => {
            const c = PERFILES_CONFIG[r]
            return (
              <button key={r} onClick={() => setRolSel(r)}
                style={{textAlign:'center',padding:'20px',borderRadius:18,border:`2px solid ${rolSel===r ? c.color : 'var(--line)'}`,
                  background: rolSel===r ? c.bg : '#fff',cursor:'pointer',transition:'all .18s'}}>
                <div style={{fontSize:28,fontWeight:900,color:c.color}}>{conteos[r]||0}</div>
                <div style={{fontWeight:700,color:'var(--navy)',marginTop:4}}>{c.label}</div>
                <div style={{fontSize:12,color:'var(--gray)',marginTop:2}}>usuarios con este rol</div>
              </button>
            )
          })}
        </div>

        {/* Detalle del perfil seleccionado */}
        <div className="glass-card" style={{border:`1px solid ${cfg.color}30`}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <div style={{width:44,height:44,borderRadius:12,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
              {rolSel === 'admin' ? '🛡️' : rolSel === 'instructor' ? '👨‍🏫' : '🎓'}
            </div>
            <div>
              <h2 style={{fontSize:20,fontWeight:800,color:'var(--navy)'}}>{cfg.label}</h2>
              <div style={{fontSize:13,color:'var(--gray)'}}>{conteos[rolSel]||0} usuarios con este perfil</div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>✓ Capacidades</div>
              {cfg.capacidades.map(cap => (
                <div key={cap} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8,fontSize:14,color:'var(--ink)'}}>
                  <span style={{color:'var(--green)',flexShrink:0,marginTop:1}}>✓</span>{cap}
                </div>
              ))}
            </div>
            {cfg.restricciones.length > 0 && (
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'#C0392B',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>✗ Restricciones</div>
                {cfg.restricciones.map(r => (
                  <div key={r} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8,fontSize:14,color:'var(--ink)'}}>
                    <span style={{color:'#C0392B',flexShrink:0,marginTop:1}}>✗</span>{r}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)',display:'flex',gap:10}}>
            <button className="btn btn-cyan btn-sm" onClick={() => router.push('/admin/usuarios')}>
              Ver usuarios con este perfil →
            </button>
          </div>
        </div>

        <div className="glass-card" style={{marginTop:16,background:'rgba(36,69,154,.03)'}}>
          <p style={{fontSize:13,color:'var(--gray)'}}>
            💡 <strong>Para añadir nuevos perfiles:</strong> La arquitectura está preparada. 
            Basta con agregar el nuevo rol al tipo de datos y crear su configuración en esta página.
          </p>
        </div>
      </main>
    </div>
  )
}
