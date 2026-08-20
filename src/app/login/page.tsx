'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BrandPanel from '@/components/BrandPanel'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Delay progresivo para dificultar brute force (Supabase también tiene rate limit nativo)
        await new Promise(r => setTimeout(r, 1000))
        setError('Correo o contraseña incorrectos. Verifica tus datos.')
        setLoading(false)
        return
      }
      router.push('/home')
      router.refresh()
    } catch {
      setError('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')
      setLoading(false)
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
            <h2>Inicia sesión</h2>
            <p className="sub">Accede a tu formación en acceso vascular.</p>

            {error && <div className="msg msg-error">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
              </div>
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="auth-forgot">
                <a href="/recuperar">¿Olvidaste tu contraseña?</a>
              </div>
              <button className="btn btn-cyan btn-block" type="submit" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="auth-alt">¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
            <div className="auth-foot">CETIVA Campus · Formación clínica en acceso vascular</div>
          </div>
        </section>
      </main>
    </>
  )
}
