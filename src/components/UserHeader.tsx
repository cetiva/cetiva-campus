'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Perfil } from '@/types'

interface Props { perfil: Perfil | null }

// Iconos SVG inline
function Svg({ d, size = 15 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}

const ICONS = {
  home:     <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  admin:    <><path d="M12 2l9 4v6c0 5.5-3.9 10.7-9 12-5.1-1.3-9-6.5-9-12V6l9-4z"/></>,
  users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  chart:    <><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></>,
  clip:     <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
  award:    <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
  msg:      <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>,
  shield:   <><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></>,
  logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  chev:     <><polyline points="6 9 12 15 18 9"/></>,
}

type SectionKey = 'admin' | 'instructor' | 'aprendizaje' | null

export default function UserHeader({ perfil }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<SectionKey>(null)
  const ref = useRef<HTMLDivElement>(null)

  const nombre = perfil?.nombre || 'Usuario'
  const iniciales = ((perfil?.nombre?.[0] || '') + (perfil?.apellidos?.[0] || '')).toUpperCase() || 'U'
  const esAdmin = perfil?.rol === 'admin'
  const esInstructor = ['admin','instructor'].includes(perfil?.rol || '')

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSection(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function ir(ruta: string) { setOpen(false); setSection(null); router.push(ruta) }
  function toggleSection(s: SectionKey) { setSection(prev => prev === s ? null : s) }

  async function salir() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <header className="uh">
      <div className="uh-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-color.png" alt="CETIVA" className="uh-logo"
          onClick={() => ir('/home')} style={{ cursor: 'pointer' }} />

        <div className="uh-user" ref={ref}>
          <button className="uh-avatar-btn" onClick={() => { setOpen(v => !v); setSection(null) }}
            aria-expanded={open} aria-haspopup="true">
            <span className="uh-avatar">{iniciales}</span>
            <span className="uh-name">{nombre}</span>
            <Svg d={ICONS.chev} />
          </button>

          {open && (
            <div className="uh-menu" role="menu" style={{width:290}}>
              {/* Cabecera */}
              <div className="uh-menu-head">
                <span className="uh-avatar lg">{iniciales}</span>
                <div>
                  <div className="uh-menu-name">{nombre} {perfil?.apellidos || ''}</div>
                  <div className="uh-menu-sub">{perfil?.profesion || 'CETIVA Campus'}</div>
                </div>
              </div>

              {/* HOME */}
              <div className="uh-menu-group">
                <button role="menuitem" onClick={() => ir('/home')}>
                  <Svg d={ICONS.home}/> Home — Selección de función
                </button>
              </div>

              {/* ADMINISTRACIÓN (desplegable) */}
              {esAdmin && (
                <div className="uh-menu-group">
                  <button
                    role="menuitem"
                    onClick={() => toggleSection('admin')}
                    style={{justifyContent:'space-between'}}
                  >
                    <span style={{display:'flex',alignItems:'center',gap:11}}>
                      <Svg d={ICONS.admin}/> Administración
                    </span>
                    <span style={{transform: section==='admin' ? 'rotate(180deg)' : '', transition:'transform .2s', color:'var(--gray)'}}>
                      <Svg d={ICONS.chev} size={12}/>
                    </span>
                  </button>
                  {section === 'admin' && (
                    <div style={{paddingLeft:28, borderLeft:'2px solid rgba(36,69,154,.15)', marginLeft:12}}>
                      <button role="menuitem" onClick={() => ir('/admin/home')}><Svg d={ICONS.chart}/> Dashboard</button>
                      <button role="menuitem" onClick={() => ir('/admin/usuarios')}><Svg d={ICONS.users}/> Gestión de usuarios</button>
                      <button role="menuitem" onClick={() => ir('/admin')}><Svg d={ICONS.book}/> Gestión de cursos</button>
                      <button role="menuitem" onClick={() => ir('/admin/cursos')}><Svg d={ICONS.clip}/> Módulos y lecciones</button>
                      <button role="menuitem" onClick={() => ir('/admin/perfiles')}><Svg d={ICONS.shield}/> Perfiles</button>
                      <button role="menuitem" onClick={() => ir('/admin/reportes')}><Svg d={ICONS.chart}/> Reportes globales</button>
                    </div>
                  )}
                </div>
              )}

              {/* INSTRUCTOR (desplegable) */}
              {esInstructor && (
                <div className="uh-menu-group">
                  <button
                    role="menuitem"
                    onClick={() => toggleSection('instructor')}
                    style={{justifyContent:'space-between'}}
                  >
                    <span style={{display:'flex',alignItems:'center',gap:11}}>
                      <Svg d={ICONS.book}/> Instructor
                    </span>
                    <span style={{transform: section==='instructor' ? 'rotate(180deg)' : '', transition:'transform .2s', color:'var(--gray)'}}>
                      <Svg d={ICONS.chev} size={12}/>
                    </span>
                  </button>
                  {section === 'instructor' && (
                    <div style={{paddingLeft:28, borderLeft:'2px solid rgba(22,163,196,.2)', marginLeft:12}}>
                      <button role="menuitem" onClick={() => ir('/instructor/home')}><Svg d={ICONS.chart}/> Dashboard</button>
                      <button role="menuitem" onClick={() => ir('/teacher')}><Svg d={ICONS.book}/> Mis cursos</button>
                      <button role="menuitem" onClick={() => ir('/admin/cursos')}><Svg d={ICONS.clip}/> Módulos y lecciones</button>
                      <button role="menuitem" onClick={() => ir('/teacher/evaluaciones')}><Svg d={ICONS.clip}/> Evaluaciones</button>
                      <button role="menuitem" onClick={() => ir('/teacher/estudiantes')}><Svg d={ICONS.users}/> Estudiantes</button>
                      <button role="menuitem" onClick={() => ir('/teacher/reportes')}><Svg d={ICONS.chart}/> Reportes</button>
                    </div>
                  )}
                </div>
              )}

              {/* MI APRENDIZAJE (desplegable) */}
              <div className="uh-menu-group">
                <button
                  role="menuitem"
                  onClick={() => toggleSection('aprendizaje')}
                  style={{justifyContent:'space-between'}}
                >
                  <span style={{display:'flex',alignItems:'center',gap:11}}>
                    <Svg d={ICONS.award}/> Mi aprendizaje
                  </span>
                  <span style={{transform: section==='aprendizaje' ? 'rotate(180deg)' : '', transition:'transform .2s', color:'var(--gray)'}}>
                    <Svg d={ICONS.chev} size={12}/>
                  </span>
                </button>
                {section === 'aprendizaje' && (
                  <div style={{paddingLeft:28, borderLeft:'2px solid rgba(144,45,142,.2)', marginLeft:12}}>
                    <button role="menuitem" onClick={() => ir('/inicio')}><Svg d={ICONS.chart}/> Dashboard</button>
                    <button role="menuitem" onClick={() => ir('/dashboard')}><Svg d={ICONS.book}/> Mis cursos</button>
                    <button role="menuitem" onClick={() => ir('/avance')}><Svg d={ICONS.chart}/> Mi progreso</button>
                    <button role="menuitem" onClick={() => ir('/evaluaciones')}><Svg d={ICONS.clip}/> Evaluaciones</button>
                    <button role="menuitem" onClick={() => ir('/certificados')}><Svg d={ICONS.award}/> Certificados</button>
                    <button role="menuitem" onClick={() => ir('/chat')}><Svg d={ICONS.msg}/> Mensajes</button>
                    <button role="menuitem" onClick={() => ir('/agenda')}><Svg d={ICONS.calendar}/> Mi agenda</button>
                  </div>
                )}
              </div>

              {/* CUENTA */}
              <div className="uh-menu-group">
                <div className="uh-menu-label">Cuenta</div>
                <button role="menuitem" onClick={() => ir('/perfil')}><Svg d={ICONS.user}/> Editar perfil</button>
                <button role="menuitem" onClick={() => ir('/privacidad')}><Svg d={ICONS.shield}/> Privacidad y seguridad</button>
              </div>

              <div className="uh-menu-group">
                <button role="menuitem" onClick={salir}><Svg d={ICONS.logout}/> Cerrar sesión</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
