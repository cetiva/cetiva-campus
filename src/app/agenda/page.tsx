'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, EventoAgenda } from '@/types'

type Tipo = 'estudio' | 'examen' | 'clase' | 'recordatorio'
const tipoColor: Record<Tipo, string> = {
  estudio: 'var(--cyan)', examen: 'var(--orange)',
  clase: 'var(--purple)', recordatorio: 'var(--green)'
}
const tipoLabel: Record<Tipo, string> = {
  estudio: 'Estudio', examen: 'Examen',
  clase: 'Clase', recordatorio: 'Recordatorio'
}

export default function AgendaPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState({ titulo: '', fecha: '', hora: '', tipo: 'estudio' as Tipo })
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)

      const { data: ev, error: evError } = await supabase
        .from('agenda')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha', { ascending: true })

      if (evError) {
        // Tabla puede no existir aún — mostrar vacío sin crashear
        if (process.env.NODE_ENV === 'development') console.error('agenda:', evError.message)
        setError('La agenda no está disponible aún. Ejecuta la migración SQL en Supabase.')
        setEventos([])
      } else {
        setEventos(ev || [])
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(e)
      setError('No pudimos cargar la agenda. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevo.titulo.trim() || !nuevo.fecha) return
    setGuardando(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('agenda').insert({
        usuario_id: user.id,
        titulo: nuevo.titulo.trim().slice(0, 200),
        fecha: nuevo.fecha,
        hora: nuevo.hora || null,
        tipo: nuevo.tipo,
        completado: false,
      }).select().single()
      if (!error && data) {
        setEventos(ev => [...ev, data as EventoAgenda].sort((a, b) => a.fecha.localeCompare(b.fecha)))
        setNuevo({ titulo: '', fecha: '', hora: '', tipo: 'estudio' })
      }
    } finally {
      setGuardando(false)
    }
  }

  async function alternar(ev: EventoAgenda) {
    const supabase = createClient()
    await supabase.from('agenda').update({ completado: !ev.completado }).eq('id', ev.id)
    setEventos(lista => lista.map(x => x.id === ev.id ? { ...x, completado: !x.completado } : x))
  }

  async function borrar(id: string) {
    const supabase = createClient()
    await supabase.from('agenda').delete().eq('id', id)
    setEventos(lista => lista.filter(x => x.id !== id))
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando tu agenda…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Actividad</div>
          <h1>Mi agenda</h1>
          <p>Organiza tus sesiones de estudio, clases y recordatorios.</p>
        </div>

        {error ? (
          <div className="glass-card">
            <div className="msg msg-error" style={{marginBottom:0}}>{error}</div>
          </div>
        ) : (
          <>
            <div className="glass-card" style={{marginBottom:20}}>
              <h3 style={{color:'var(--navy)',marginBottom:16,fontSize:17}}>Nuevo evento</h3>
              <form onSubmit={agregar} className="ag-form">
                <input
                  className="ag-inp ag-titulo"
                  placeholder="¿Qué vas a hacer?"
                  value={nuevo.titulo}
                  onChange={e => setNuevo({ ...nuevo, titulo: e.target.value })}
                  required
                />
                <input
                  className="ag-inp"
                  type="date"
                  value={nuevo.fecha}
                  onChange={e => setNuevo({ ...nuevo, fecha: e.target.value })}
                  required
                />
                <input
                  className="ag-inp"
                  type="time"
                  value={nuevo.hora}
                  onChange={e => setNuevo({ ...nuevo, hora: e.target.value })}
                />
                <select
                  className="ag-inp"
                  value={nuevo.tipo}
                  onChange={e => setNuevo({ ...nuevo, tipo: e.target.value as Tipo })}
                >
                  <option value="estudio">Estudio</option>
                  <option value="examen">Examen</option>
                  <option value="clase">Clase</option>
                  <option value="recordatorio">Recordatorio</option>
                </select>
                <button className="btn btn-cyan" type="submit" disabled={guardando}>
                  {guardando ? '…' : 'Añadir'}
                </button>
              </form>
            </div>

            <div className="glass-card">
              <h3 style={{color:'var(--navy)',marginBottom:16,fontSize:17}}>Próximos eventos</h3>
              {eventos.length === 0 ? (
                <p style={{color:'var(--gray)'}}>No tienes eventos. Añade el primero arriba.</p>
              ) : (
                <div className="ag-list">
                  {eventos.map(ev => (
                    <div key={ev.id} className={`ag-item${ev.completado ? ' done' : ''}`}>
                      <button className="ag-check" onClick={() => alternar(ev)}>
                        {ev.completado ? '✓' : ''}
                      </button>
                      <div className="ag-info">
                        <span className="ag-item-titulo">{ev.titulo}</span>
                        <span className="ag-item-fecha">
                          {new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                          {ev.hora ? ` · ${ev.hora.slice(0, 5)}` : ''}
                        </span>
                      </div>
                      <span
                        className="ag-tag"
                        style={{
                          background: (tipoColor[ev.tipo as Tipo] || 'var(--cyan)') + '22',
                          color: tipoColor[ev.tipo as Tipo] || 'var(--cyan)'
                        }}
                      >
                        {tipoLabel[ev.tipo as Tipo] || ev.tipo}
                      </span>
                      <button className="ag-del" onClick={() => borrar(ev.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
