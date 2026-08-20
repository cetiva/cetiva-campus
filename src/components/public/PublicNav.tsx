'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function PublicNav() {
  const path = usePathname()
  const links = [
    { href: '/cursos',    label: 'Cursos' },
    { href: '/programas', label: 'Programas' },
    { href: '/eventos',   label: 'Eventos' },
    { href: '/nosotros',  label: 'Nosotros' },
  ]

  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-color.png" alt={BRAND.name} className="pub-nav-logo" />
        </Link>
        <div className="pub-nav-links">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>{l.label}</Link>
          ))}
        </div>
        <div className="pub-nav-cta">
          <Link href="/login" className="btn btn-cyan btn-sm">Iniciar sesión</Link>
        </div>
      </div>
    </nav>
  )
}
