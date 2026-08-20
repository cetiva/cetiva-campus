import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function BrandPanel() {
  return (
    <aside className="auth-brand">
      <div className="auth-brand-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Link href="/"><img src="/logo-white.png" alt={BRAND.name} style={{cursor:'pointer'}} /></Link>
      </div>
      <div className="auth-brand-mid">
        <h1>{BRAND.tagline.split(' ').slice(0,-2).join(' ')}<b>{BRAND.tagline.split(' ').slice(-2).join(' ')}</b></h1>
        <p>{BRAND.description}</p>
      </div>
      <div className="auth-brand-bottom" style={{ flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/terminos" style={{ fontSize: 13, color: '#B9C9EC', textDecoration: 'underline' }}>
            Condiciones de uso
          </Link>
          <Link href="/aviso-privacidad" style={{ fontSize: 13, color: '#B9C9EC', textDecoration: 'underline' }}>
            Aviso de privacidad
          </Link>
          <Link href="/preferencias-cookies" style={{ fontSize: 13, color: '#B9C9EC', textDecoration: 'underline' }}>
            Preferencias de cookies
          </Link>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.6, margin: 0 }}>
            © {new Date().getFullYear()} {BRAND.company}<br />
            Todos los derechos reservados.<br />
            <span style={{ color: 'rgba(255,255,255,.2)' }}>{BRAND.name} — {BRAND.tagline}</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
