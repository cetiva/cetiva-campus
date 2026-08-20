'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Intento, Evaluacion } from '@/types'

export default function TeacherReportesPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [evals, setEvals] = useState<Evaluacion[]>([])
  const [evalSel, setEvalSel] = useState<string>('')
  const [intentos, setIntentos] = useState<(Intento & { profiles?: { nombre: string; apellidos: string } })[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoIntentos, setCargandoIntentos] = useState(false)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      if (!p || !['admin','instructor'].includes(p?.rol||'')) { router.push('/inicio'); return }
      const { data: ev } = await supabase.from('evaluaciones').select('*').order('created_at', { ascending: false })
      setEvals(ev || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  useEffect(() => {
    if (!evalSel) { setIntentos([]); return }
    setCargandoIntentos(true)
    createClient().from('intentos')
      .select('*, profiles(nombre, apellidos)')
      .eq('evaluacion_id', evalSel)
      .neq('estado', 'en_progreso')
      .order('enviado_en', { ascending: false })
      .then((res: { data: unknown[] | null }) => { setIntentos((res.data || []) as (Intento & { profiles?: { nombre: string; apellidos: string } })[]); setCargandoIntentos(false) })
  }, [evalSel])

  const aprobados = intentos.filter(i => i.aprobado).length
  const promedio = intentos.length > 0 ? (intentos.reduce((s,i) => s + (i.porcentaje||0), 0) / intentos.length).toFixed(1) : '—'

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando reportes…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Instructor</div>
          <h1>Reportes de evaluaciones</h1>
          <p>Resultados individuales y grupales por evaluación.</p>
        </div>

        <div className="glass-card" style={{marginBottom:20}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Seleccionar evaluación</label>
            <select value={evalSel} onChange={e => setEvalSel(e.target.value)}>
              <option value="">— Elige una evaluación —</option>
              {evals.map(ev => <option key={ev.id} value={ev.id}>{ev.titulo}</option>)}
            </select>
          </div>
        </div>

        {evalSel && (
          <>
            <div className="teacher-grid" style={{marginBottom:20}}>
              {[
                {label:'Total intentos', val: intentos.length, color:'var(--cyan)'},
                {label:'Aprobados', val: aprobados, color:'var(--green)'},
                {label:'No aprobados', val: intentos.length - aprobados, color:'#C0392B'},
                {label:'Promedio', val: `${promedio}%`, color:'var(--navy)'},
              ].map(s => (
                <div className="teacher-card" key={s.label}>
                  <h3>{s.label}</h3>
                  <div className="val" style={{color:s.color}}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Intento #</th>
                    <th>Puntaje</th>
                    <th>Resultado</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoIntentos ? (
                    <tr><td colSpan={6} style={{textAlign:'center',color:'var(--gray)'}}>Cargando…</td></tr>
                  ) : intentos.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:'center',color:'var(--gray)'}}>Sin intentos registrados</td></tr>
                  ) : intentos.map(int => {
                    const perfInt = int.profiles as { nombre?: string; apellidos?: string } | undefined
                    return (
                      <tr key={int.id}>
                        <td style={{fontWeight:700}}>{perfInt?.nombre} {perfInt?.apellidos}</td>
                        <td>#{int.numero_intento}</td>
                        <td>{int.puntaje?.toFixed(1)} / {int.puntaje_maximo?.toFixed(1)}</td>
                        <td style={{fontWeight:700,color: int.aprobado ? 'var(--green)' : int.aprobado === false ? '#C0392B' : 'var(--gray)'}}>
                          {int.aprobado === true ? `✓ ${int.porcentaje?.toFixed(0)}%` : int.aprobado === false ? `✗ ${int.porcentaje?.toFixed(0)}%` : `${int.porcentaje?.toFixed(0)}% (pendiente)`}
                        </td>
                        <td style={{color:'var(--gray)'}}>{int.enviado_en ? new Date(int.enviado_en).toLocaleDateString('es-CO') : '—'}</td>
                        <td><span className={`badge ${int.estado==='calificado' ? (int.aprobado?'badge-green':'badge-orange') : 'badge-gray'}`}>{int.estado}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pendientes de calificación manual */}
            {intentos.some(i => i.estado === 'enviado') && (
              <div className="glass-card" style={{marginTop:20,background:'rgba(241,159,44,.06)',border:'1px solid rgba(241,159,44,.3)'}}>
                <h3 style={{color:'var(--navy)',marginBottom:8,fontSize:16}}>⚠️ Pendientes de calificación manual</h3>
                <p style={{color:'var(--gray)',fontSize:14}}>Hay {intentos.filter(i=>i.estado==='enviado').length} intento(s) con preguntas abiertas que requieren calificación manual.</p>
              </div>
            )}
          </>
        )}

        {!evalSel && (
          <div className="glass-card" style={{textAlign:'center',padding:'48px',color:'var(--gray)'}}>
            <div style={{fontSize:36,marginBottom:12}}>📊</div>
            <p>Selecciona una evaluación para ver el reporte.</p>
          </div>
        )}
      </main>
    </div>
  )
}
