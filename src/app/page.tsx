import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { BRAND } from '@/lib/brand'

// ── Configura estas áreas desde brand.ts o edítalas aquí ──
const areas = [
  { title: 'Formación especializada',   desc: 'Cursos diseñados por expertos activos en la industria, con contenido actualizado y aplicación práctica inmediata.' },
  { title: 'Evaluaciones y certificación', desc: 'Evalúa tu aprendizaje y obtén certificados verificables, reconocidos por instituciones y empleadores.' },
  { title: 'Aprendizaje a tu ritmo',    desc: 'Accede al contenido cuando quieras: videos, PDFs, presentaciones, audios y lecturas en un solo lugar.' },
  { title: 'Seguimiento del progreso',  desc: 'Visualiza tu avance, revisa resultados y gestiona tu agenda de estudio de forma sencilla.' },
  { title: 'Comunidad académica',       desc: 'Interactúa con instructores y compañeros a través del chat integrado en tiempo real.' },
  { title: 'Formación institucional',   desc: 'Soluciones para empresas e instituciones que requieren formación estructurada para sus equipos.' },
]

const porQueNosotros = [
  { n: '01', t: 'Instructores activos en la industria', d: 'Todos nuestros docentes ejercen activamente en sus campos profesionales.' },
  { n: '02', t: 'Contenido basado en evidencia',        d: 'Material didáctico actualizado, riguroso y aplicable a la práctica real.' },
  { n: '03', t: 'Certificación verificable',            d: 'Certificados con código único verificable por cualquier institución.' },
  { n: '04', t: 'Plataforma segura y accesible',       d: 'Tecnología de última generación, disponible en cualquier dispositivo.' },
]

export default function HomePage() {
  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <PublicNav />

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1>{BRAND.home.heroTitle.split(' ').slice(0,-2).join(' ')} <span>{BRAND.home.heroTitle.split(' ').slice(-2).join(' ')}</span></h1>
            <p className="hero-sub">{BRAND.home.heroSubtitle}</p>
            <div className="hero-ctas">
              <Link href="/registro" className="btn btn-cyan">{BRAND.home.ctaPrimary}</Link>
              <Link href="/cursos" className="btn btn-ghost" style={{color:'#fff',borderColor:'rgba(255,255,255,.3)'}}>
                {BRAND.home.ctaSecondary}
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-label">Aprendizaje flexible</div>
              <div className="hero-card-title">Video · PDF · Presentaciones · Audio</div>
              <div className="hero-card-sub">Todo el contenido en un solo lugar, accesible desde cualquier dispositivo</div>
            </div>
            <div className="hero-card">
              <div className="hero-card-label">Evaluaciones inteligentes</div>
              <div className="hero-card-title">Calificación automática y reportes detallados</div>
              <div className="hero-card-sub">Selección única, múltiple, V/F y preguntas abiertas</div>
            </div>
            <div className="hero-card">
              <div className="hero-card-label">Certificación</div>
              <div className="hero-card-title">Certificados verificables internacionalmente</div>
              <div className="hero-card-sub">Código único verificable por cualquier institución</div>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas */}
      <section className="section section-bg-gray">
        <div className="section-inner">
          <div className="section-head">
            <p className="section-eyebrow">Especialidades</p>
            <h2 className="section-title">¿Qué encontrarás en {BRAND.name}?</h2>
            <p className="section-sub">Una plataforma completa diseñada para el aprendizaje profesional moderno.</p>
          </div>
          <div className="areas-grid">
            {areas.map(a => (
              <div className="area-card" key={a.title}>
                <div className="area-title">{a.title}</div>
                <div className="area-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué nosotros */}
      <section className="section">
        <div className="section-inner">
          <div className="why-grid">
            <div>
              <p className="section-eyebrow">Nuestra diferencia</p>
              <h2 className="section-title">Educación que impacta la práctica real</h2>
              <p className="why-sub">{BRAND.name} es un ecosistema académico diseñado por y para profesionales, con el rigor que la práctica exige.</p>
            </div>
            <div className="why-items">
              {porQueNosotros.map(i => (
                <div key={i.n} className="why-item">
                  <span className="why-num">{i.n}</span>
                  <div>
                    <div className="why-title">{i.t}</div>
                    <div className="why-desc">{i.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <p className="section-eyebrow" style={{color:'var(--cyan)'}}>Comienza hoy</p>
          <h2 className="cta-title">Da el siguiente paso en tu carrera</h2>
          <p className="cta-sub">Regístrate gratis y accede a contenido introductorio de inmediato. Sin compromiso.</p>
          <div className="hero-ctas" style={{justifyContent:'center'}}>
            <Link href="/registro" className="btn btn-cyan">{BRAND.home.ctaPrimary}</Link>
            <Link href="/cursos" className="btn btn-ghost" style={{color:'#fff',borderColor:'rgba(255,255,255,.3)'}}>
              {BRAND.home.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
