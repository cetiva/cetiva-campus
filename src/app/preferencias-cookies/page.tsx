'use client'
import { useState, useEffect } from 'react'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

const COOKIE_KEY = 'cetivacampus_cookies'

export default function PreferenciasCookiesPage() {
  const [prefs, setPrefs] = useState({ necesarias: true, analiticas: false, marketing: false })
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_KEY)
      if (raw) setPrefs(JSON.parse(raw))
    } catch {}
  }, [])

  function guardar(p = prefs) {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({...p, fecha: new Date().toISOString()})) } catch {}
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  const cats = [
    { key: 'necesarias' as const, label: 'Cookies necesarias', desc: 'Indispensables para el funcionamiento básico: sesión, autenticación y seguridad. No pueden desactivarse.', required: true },
    { key: 'analiticas' as const, label: 'Cookies analíticas', desc: 'Nos ayudan a entender cómo los usuarios interactúan con CETIVA Campus para mejorar la experiencia.', required: false },
    { key: 'marketing' as const, label: 'Cookies de marketing', desc: 'Permiten mostrarte comunicaciones relevantes sobre nuevos cursos y programas de CETIVA.', required: false },
  ]

  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <PublicNav />
      <main style={{background:'#F3F6FC',minHeight:'100vh'}}>
        <div className="legal-wrap">
          <h1>Preferencias de cookies</h1>
          <p className="legal-meta">Controla qué cookies usa CETIVA Campus. Puedes cambiar estas preferencias en cualquier momento.</p>

          {guardado && <div className="msg msg-ok">✓ Tus preferencias han sido guardadas.</div>}

          <div style={{display:'flex',flexDirection:'column',gap:16,marginBottom:32}}>
            {cats.map(c => (
              <div key={c.key} className="glass-card" style={{display:'flex',alignItems:'flex-start',gap:20}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <strong style={{color:'var(--navy)',fontSize:16}}>{c.label}</strong>
                    {c.required && <span style={{fontSize:11,fontWeight:700,background:'rgba(36,69,154,.1)',color:'var(--navy)',padding:'2px 8px',borderRadius:99}}>Siempre activas</span>}
                  </div>
                  <p style={{fontSize:14,color:'var(--gray)',lineHeight:1.6,margin:0}}>{c.desc}</p>
                </div>
                <div style={{flexShrink:0,paddingTop:4}}>
                  <button
                    className={`toggle${prefs[c.key]?' on':''}`}
                    onClick={() => { if (!c.required) setPrefs(p => ({...p,[c.key]:!p[c.key]})) }}
                    disabled={c.required}
                    aria-label={c.label}
                  >
                    <span className="toggle-dot"/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <button className="btn btn-cyan" onClick={() => guardar()}>Guardar preferencias</button>
            <button className="btn btn-ghost" onClick={() => { const all={necesarias:true,analiticas:true,marketing:true}; setPrefs(all); guardar(all) }}>Aceptar todas</button>
            <button className="btn btn-ghost" onClick={() => { const min={necesarias:true,analiticas:false,marketing:false}; setPrefs(min); guardar(min) }}>Solo necesarias</button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
