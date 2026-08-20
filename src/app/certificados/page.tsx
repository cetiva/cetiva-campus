'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import type { Perfil, Certificado } from '@/types'

export default function CertificadosPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil|null>(null)
  const [certs, setCerts] = useState<(Certificado & { cursos?: { titulo: string; color: string } })[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)
      const { data: c } = await supabase.from('certificados')
        .select('*, cursos(titulo, color)').eq('usuario_id', user.id).order('emitido_en', { ascending: false })
      setCerts(c || [])
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) return <div className="priv-bg"><div className="dash-loading">Cargando certificados…</div></div>

  return (
    <div className="priv-bg">
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <UserHeader perfil={perfil} />
      <main className="priv-wrap">
        <div className="priv-head">
          <div className="eyebrow">Estudiante</div>
          <h1>Mis certificados</h1>
          <p>{certs.length} certificado{certs.length !== 1 ? 's' : ''} obtenido{certs.length !== 1 ? 's' : ''}.</p>
        </div>
        {certs.length === 0 ? (
          <div className="glass-card" style={{textAlign:'center',padding:'56px 24px'}}>
            <div style={{fontSize:48,marginBottom:16}}>🎓</div>
            <h2 style={{color:'var(--navy)',marginBottom:8}}>Aún no tienes certificados</h2>
            <p style={{color:'var(--gray)',marginBottom:24}}>Completa un curso para obtener tu primer certificado.</p>
            <button className="btn btn-navy" onClick={() => router.push('/dashboard')}>Explorar cursos</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18}}>
            {certs.map(c => {
              const curso = c.cursos as { titulo?: string; color?: string } | undefined
              return (
                <div key={c.id} className="glass-card" style={{borderTop:`4px solid ${curso?.color||'var(--cyan)'}`,overflow:'hidden'}}>
                  <div style={{fontSize:36,marginBottom:12}}>🎓</div>
                  <div style={{fontSize:12,fontWeight:700,color:curso?.color||'var(--cyan)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Certificado</div>
                  <div style={{fontSize:18,fontWeight:800,color:'var(--navy)',marginBottom:8,lineHeight:1.3}}>{curso?.titulo}</div>
                  <div style={{fontSize:13,color:'var(--gray)',marginBottom:16}}>
                    Emitido el {new Date(c.emitido_en).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})}
                  </div>
                  <div style={{background:'rgba(36,69,154,.04)',borderRadius:10,padding:'10px 14px',marginBottom:16}}>
                    <div style={{fontSize:11,color:'var(--gray)',marginBottom:4}}>Código de verificación</div>
                    <div style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'var(--navy)',letterSpacing:'.05em'}}>{c.codigo}</div>
                  </div>
                  <a
                    href={`/verificar/${c.codigo}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{display:'inline-flex',width:'100%',justifyContent:'center'}}
                  >
                    Verificar certificado →
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
