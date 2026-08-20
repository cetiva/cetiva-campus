'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

interface EstudianteRow {
  usuario_id: string
  inscrito_en: string
  completado: boolean
  cursos: { titulo: string; color: string } | null
  profiles: { nombre: string; apellidos: string; profesion: string | null } | null
  progreso_count?: number
  ultimo_intento?: { porcentaje: number; aprobado: boolean } | null
}

export default function TeacherEstudiantesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol||'')) { router.push('/inicio'); return }
      const { data: ins } = await supabase.from('inscripciones')
        .select('usuario_id, inscrito_en, completado, cursos(titulo, color), profiles(nombre, apellidos, profesion)')
        .order('inscrito_en', { ascending: false })
      setEstudiantes(ins as EstudianteRow[] || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  const filtrados = estudiantes.filter(e => {
    const nombre = `${e.profiles?.nombre} ${e.profiles?.apellidos}`.toLowerCase()
    return nombre.includes(filtro.toLowerCase())
  })

  // Stats
  const totalInscritos = estudiantes.length
  const completados = estudiantes.filter(e => e.completado).length
  const tasaComplecion = totalInscritos > 0 ? Math.round((completados/totalInscritos)*100) : 0

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando estudiantes…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Instructor</div>
          <h1>Estudiantes</h1>
          <p>Progreso e inscripciones de tus estudiantes.</p>
        </div>

        <div className="teacher-grid" style={{marginBottom:24}}>
          {[
            {label:'Total inscritos', val: totalInscritos, color:'var(--cyan)'},
            {label:'Completaron', val: completados, color:'var(--green)'},
            {label:'Tasa de compleción', val: `${tasaComplecion}%`, color:'var(--navy)'},
            {label:'En progreso', val: totalInscritos - completados, color:'var(--orange)'},
          ].map(s => (
            <div className="teacher-card" key={s.label}>
              <h3>{s.label}</h3>
              <div className="val" style={{color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{marginBottom:16}}>
          <input
            value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar estudiante…"
            style={{width:'100%',padding:'11px 16px',borderRadius:12,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:15}}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Profesión</th>
                <th>Curso</th>
                <th>Inscrito</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',color:'var(--gray)'}}>Sin resultados</td></tr>
              ) : filtrados.map((e, i) => (
                <tr key={i}>
                  <td style={{fontWeight:700}}>{e.profiles?.nombre} {e.profiles?.apellidos}</td>
                  <td style={{color:'var(--gray)'}}>{e.profiles?.profesion || '—'}</td>
                  <td>
                    <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                      <span style={{width:10,height:10,borderRadius:'50%',background:(e.cursos as {color?:string})?.color||'var(--gray)',flexShrink:0}}/>
                      {(e.cursos as {titulo?:string})?.titulo || '—'}
                    </span>
                  </td>
                  <td style={{color:'var(--gray)'}}>{new Date(e.inscrito_en).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span className={`badge ${e.completado ? 'badge-green' : 'badge-cyan'}`}>
                      {e.completado ? 'Completado' : 'En progreso'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
