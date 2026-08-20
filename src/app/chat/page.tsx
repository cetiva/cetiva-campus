'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil } from '@/types'

interface ConvItem {
  id: string; asunto?: string; updated_at: string
  ultimo_mensaje?: { contenido: string; remitente_id: string }
  participantes: Array<{ usuario_id: string; profiles?: { nombre: string; apellidos: string } }>
}

export default function ChatPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [convs, setConvs] = useState<ConvItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      const { data: parts } = await supabase.from('participantes_conv')
        .select('conversacion_id').eq('usuario_id', user.id)
      const ids = (parts || []).map((p: { conversacion_id: string }) => p.conversacion_id)
      if (ids.length > 0) {
        const { data: cs } = await supabase.from('conversaciones')
          .select('*, participantes_conv(usuario_id, profiles(nombre, apellidos))')
          .in('id', ids).order('updated_at', { ascending: false })
        setConvs(cs || [])
      }
      setCargando(false)
    }
    cargar()
  }, [router])

  async function nuevaConversacion() {
    const asunto = prompt('Asunto del mensaje:')
    if (!asunto?.trim()) return
    const supabase = createClient()
    const { data: conv } = await supabase.from('conversaciones').insert({ asunto: asunto.trim() }).select().single()
    if (conv) {
      await supabase.from('participantes_conv').insert({ conversacion_id: conv.id, usuario_id: userId })
      router.push(`/chat/${conv.id}`)
    }
  }

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando mensajes…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Comunicación</div>
          <h1>Mensajes</h1>
          <p>Chat en tiempo real con tus docentes.</p>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
          <button className="btn btn-cyan" onClick={nuevaConversacion}>+ Nueva conversación</button>
        </div>
        {convs.length === 0 ? (
          <div className="glass-card" style={{textAlign:'center',padding:'48px 24px',color:'var(--gray)'}}>
            <div style={{fontSize:40,marginBottom:12}}>💬</div>
            <p>No tienes conversaciones aún.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {convs.map(c => {
              const otros = c.participantes?.filter(p => p.usuario_id !== userId) || []
              const nombre = otros[0]?.profiles ? `${otros[0].profiles.nombre} ${otros[0].profiles.apellidos}` : 'Conversación'
              return (
                <button key={c.id} className="glass-card" style={{textAlign:'left',display:'flex',gap:14,alignItems:'center',cursor:'pointer',border:0,width:'100%'}}
                  onClick={() => router.push(`/chat/${c.id}`)}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(180deg,#1CB6DA,#16A3C4)',color:'#fff',fontWeight:800,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {nombre[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:'var(--navy)',marginBottom:2}}>{c.asunto || nombre}</div>
                    <div style={{fontSize:13,color:'var(--gray)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {c.ultimo_mensaje?.contenido || 'Sin mensajes aún'}
                    </div>
                  </div>
                  <div style={{fontSize:12,color:'var(--gray)',flexShrink:0}}>
                    {new Date(c.updated_at).toLocaleDateString('es-CO',{day:'numeric',month:'short'})}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
