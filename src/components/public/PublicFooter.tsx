import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-inner">
        <div className="pub-footer-grid">
          <div className="pub-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt={BRAND.name} />
            <p>{BRAND.description}</p>
          </div>
          <div className="pub-footer-col">
            <h4>Academia</h4>
            <Link href="/cursos">Cursos</Link>
            <Link href="/programas">Programas</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/nosotros">Nosotros</Link>
          </div>
          <div className="pub-footer-col">
            <h4>Soporte</h4>
            <Link href="/contacto">Contacto</Link>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/registro">Registrarse</Link>
          </div>
          <div className="pub-footer-col">
            <h4>Legal</h4>
            <Link href="/terminos">Condiciones de uso</Link>
            <Link href="/aviso-privacidad">Aviso de privacidad</Link>
            <Link href="/preferencias-cookies">Preferencias de cookies</Link>
          </div>
        </div>
        <div className="pub-footer-bottom">
          <p>© {new Date().getFullYear()} {BRAND.company}. Todos los derechos reservados.</p>
          <p>{BRAND.name} — {BRAND.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
