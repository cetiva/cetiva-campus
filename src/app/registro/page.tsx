'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { emailValido, validarPassword, limpiarTexto } from '@/lib/validacion'
import BrandPanel from '@/components/BrandPanel'
import Link from 'next/link'

type Form = { nombre:string; apellidos:string; profesion:string; institucion:string; ciudad:string; telefono:string; email:string; password:string }

export default function RegistroPage() {
  const [form, setForm] = useState<Form>({ nombre:'',apellidos:'',profesion:'',institucion:'',ciudad:'',telefono:'',email:'',password:'' })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k: keyof Form, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setOk('')
    if (!aceptaTerminos) { setError('Debes aceptar las Condiciones de uso y el Aviso de Privacidad para continuar.'); return }
    if (!emailValido(form.email)) { setError('Introduce un correo electrónico válido.'); return }
    const pwError = validarPassword(form.password)
    if (pwError) { setError(pwError); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nombre: limpiarTexto(form.nombre, 80),
            apellidos: limpiarTexto(form.apellidos, 80),
            profesion: limpiarTexto(form.profesion, 80),
            institucion: limpiarTexto(form.institucion, 200),
            ciudad: limpiarTexto(form.ciudad, 100),
            telefono: limpiarTexto(form.telefono, 30),
            acepta_terminos: true,
            acepta_terminos_fecha: new Date().toISOString(),
          },
        },
      })
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setError('Ya existe una cuenta con este correo. Intenta iniciar sesión.')
        } else if (error.message.includes('password')) {
          setError('La contraseña no cumple los requisitos. Usa mínimo 8 caracteres con mayúscula, minúscula y número.')
        } else {
          setError('No pudimos completar el registro: ' + error.message)
        }
        setLoading(false)
        return
      }
      // Sin confirmación de correo — redirigir directo al login
      if (data?.user) {
        setOk('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.')
      } else {
        setOk('¡Cuenta creada! Ya puedes iniciar sesión.')
      }
      setLoading(false)
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
            <h2>Crea tu cuenta</h2>
            <p className="sub">Únete a la formación en acceso vascular.</p>
            {error && <div className="msg msg-error">{error}</div>}
            {ok && (
              <div>
                <div className="msg msg-ok">{ok}</div>
                <a href="/login" className="btn btn-cyan btn-block" style={{marginTop:16,display:'block',textAlign:'center'}}>
                  Ir a iniciar sesión →
                </a>
              </div>
            )}
            {!ok && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid2">
                  <div className="field"><label>Nombre</label><input required value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
                  <div className="field"><label>Apellidos</label><input required value={form.apellidos} onChange={e => set('apellidos', e.target.value)} /></div>
                </div>
                <div className="grid2">
                  <div className="field"><label>Profesión</label><input value={form.profesion} onChange={e => set('profesion', e.target.value)} placeholder="Enfermero/a, Médico/a…" /></div>
                  <div className="field"><label>Ciudad</label><input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} /></div>
                </div>
                <div className="field"><label>Institución</label><input value={form.institucion} onChange={e => set('institucion', e.target.value)} placeholder="Hospital / IPS" /></div>
                <div className="field"><label>Teléfono</label><input value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
                <div className="field"><label>Correo electrónico</label><input type="email" autoComplete="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" /></div>
                <div className="field"><label>Contraseña</label><input type="password" autoComplete="new-password" required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mín. 8: mayúscula, minúscula y número" /></div>

                <div className="legal-check">
                  <input
                    type="checkbox"
                    id="acepta-terminos"
                    checked={aceptaTerminos}
                    onChange={e => setAceptaTerminos(e.target.checked)}
                    required
                  />
                  <label htmlFor="acepta-terminos">
                    Al crear tu cuenta, aceptas las{' '}
                    <Link href="/terminos" target="_blank" rel="noopener">Condiciones de uso</Link>{' '}
                    de CETIVA Campus y reconoces que has leído y comprendido el{' '}
                    <Link href="/aviso-privacidad" target="_blank" rel="noopener">Aviso de Privacidad</Link>.
                  </label>
                </div>

                <button
                  className="btn btn-cyan btn-block"
                  type="submit"
                  disabled={loading || !aceptaTerminos}
                >
                  {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
              </form>
            )}
            <p className="auth-alt">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
          </div>
        </section>
      </main>
    </>
  )
}
