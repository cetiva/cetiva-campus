'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Mensaje } from '@/types'

export default function ChatConversacionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [userId, setUserId] = useState('')
  const [asunto, setAsunto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      const { data: conv } = await supabase.from('conversaciones').select('*').eq('id', id).single()
      if (conv) setAsunto(conv.asunto || 'Conversación')
      const { data: msgs } = await supabase.from('mensajes')
        .select('*, profiles(nombre, apellidos)')
        .eq('conversacion_id', id).order('created_at', { ascending: true })
      setMensajes(msgs || [])
      setCargando(false)
      setTimeout(scrollDown, 100)

      // Realtime — channel guardado en variable local para cleanup correcto
      channel = supabase.channel(`chat-${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${id}` },
          async (payload: { new: Record<string, unknown> }) => {
            const { data: msgConPerfil } = await supabase.from('mensajes')
              .select('*, profiles(nombre, apellidos)').eq('id', payload.new.id as string).single()
            if (msgConPerfil) {
              setMensajes(prev => [...prev, msgConPerfil as Mensaje])
              setTimeout(scrollDown, 50)
            }
          })
        .subscribe()
    }

    cargar()

    // Cleanup correcto: el return del useEffect SÍ ejecuta esto al desmontar
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [id, router, scrollDown])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const supabase = createClient()
    await supabase.from('mensajes').insert({
      conversacion_id: id, remitente_id: userId, contenido: texto.trim()
    })
    setTexto('')
    setEnviando(false)
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando chat…</div></div>

  return (
    <div className="priv-bg" style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />

      {/* Header chat */}
      <div style={{background:'rgba(255,255,255,.96)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--line)',padding:'14px 24px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={() => router.push('/chat')} style={{background:'none',border:0,color:'var(--gray)',fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontWeight:800,color:'var(--navy)',fontSize:16}}>{asunto}</div>
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px',maxWidth:780,width:'100%',margin:'0 auto'}}>
        {mensajes.length === 0 && (
          <div style={{textAlign:'center',color:'var(--gray)',marginTop:60}}>
            <div style={{fontSize:36,marginBottom:12}}>💬</div>
            <p>Sé el primero en escribir.</p>
          </div>
        )}
        {mensajes.map(m => {
          const esMio = m.remitente_id === userId
          const perfMsg = m.perfil as { nombre?: string; apellidos?: string } | undefined
          const nombre = perfMsg ? `${perfMsg.nombre} ${perfMsg.apellidos}` : 'Usuario'
          return (
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems: esMio ? 'flex-end' : 'flex-start',marginBottom:14}}>
              {!esMio && <div style={{fontSize:12,color:'var(--gray)',marginBottom:4,marginLeft:8}}>{nombre}</div>}
              <div style={{maxWidth:'72%',padding:'12px 16px',borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: esMio ? 'linear-gradient(180deg,#1CB6DA,#16A3C4)' : '#fff',
                color: esMio ? '#fff' : 'var(--ink)',
                boxShadow:'0 2px 8px rgba(0,0,0,.08)',fontSize:15,lineHeight:1.5}}>
                {m.contenido}
              </div>
              <div style={{fontSize:11,color:'var(--gray)',marginTop:3,marginLeft:8,marginRight:8}}>
                {new Date(m.created_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{background:'rgba(255,255,255,.96)',backdropFilter:'blur(12px)',borderTop:'1px solid var(--line)',padding:'14px 24px'}}>
        <form onSubmit={enviar} style={{display:'flex',gap:10,maxWidth:780,margin:'0 auto'}}>
          <input
            value={texto} onChange={e => setTexto(e.target.value)}
            placeholder="Escribe un mensaje…"
            style={{flex:1,padding:'13px 18px',borderRadius:99,border:'1px solid var(--line)',fontFamily:'inherit',fontSize:15,background:'rgba(255,255,255,.9)'}}
            disabled={enviando}
          />
          <button className="btn btn-cyan" type="submit" disabled={!texto.trim() || enviando} style={{borderRadius:99,padding:'12px 22px'}}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
