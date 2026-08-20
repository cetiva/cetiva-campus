'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import BrandPanel from '@/components/BrandPanel'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/callback',
      })
      if (error) { setError('No pudimos enviar el correo. Verifica la dirección.'); setLoading(false); return }
      setOk(true); setLoading(false)
    } catch {
      setError('No pudimos conectar. Inténtalo de nuevo.'); setLoading(false)
    }
  }

  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <main className="auth-wrap">
        <BrandPanel />
        <section className="auth-form-side">
          <div className="auth-card">
            <div className="logo-mobile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-color.png" alt="CETIVA" />
            </div>
            <h2>Recupera tu acceso</h2>
            <p className="sub">Te enviaremos un enlace para restablecer tu contraseña.</p>
            {error && <div className="msg msg-error">{error}</div>}
            {ok ? (
              <div className="msg msg-ok">Si el correo existe, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja.</div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
                </div>
                <button className="btn btn-cyan btn-block" type="submit" disabled={loading}>
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
            )}
            <p className="auth-alt"><a href="/login">← Volver a iniciar sesión</a></p>
          </div>
        </section>
      </main>
    </>
  )
}
