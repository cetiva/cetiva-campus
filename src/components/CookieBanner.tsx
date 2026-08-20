'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'cetivacampus_cookies'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true)
    } catch {}
  }, [])

  function accept() { save(true, true) }
  function reject() { save(false, false) }
  function save(analiticas: boolean, marketing: boolean) {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ necesarias: true, analiticas, marketing, fecha: new Date().toISOString() })) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Preferencias de cookies">
      <h3>Usamos cookies</h3>
      <p>
        CETIVA Campus utiliza cookies para mejorar tu experiencia. Puedes personalizar tus preferencias.{' '}
        <Link href="/aviso-privacidad">Aviso de privacidad</Link>{' · '}
        <Link href="/preferencias-cookies">Configurar</Link>
      </p>
      <div className="cookie-actions">
        <button className="btn btn-cyan btn-sm" onClick={accept}>Aceptar todas</button>
        <button className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,.8)',borderColor:'rgba(255,255,255,.2)'}} onClick={reject}>Solo necesarias</button>
        <Link href="/preferencias-cookies" className="btn btn-sm" style={{background:'transparent',color:'rgba(255,255,255,.6)',border:'1px solid rgba(255,255,255,.15)'}}>Configurar →</Link>
      </div>
    </div>
  )
}
