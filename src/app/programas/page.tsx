import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export default function Page() {
  const titles: Record<string,string> = {
    cursos: 'Catálogo de cursos', programas: 'Programas académicos',
    eventos: 'Eventos académicos', nosotros: 'Sobre CETIVA Campus', contacto: 'Contacto'
  }
  const page = 'programas'
  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <PublicNav />
      <main style={{background:'#F3F6FC',minHeight:'100vh'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 28px'}}>
          <h1 style={{fontSize:40,fontWeight:900,color:'var(--navy)',marginBottom:16}}>{titles[page]}</h1>
          <p style={{color:'var(--gray)',fontSize:17}}>Esta sección estará disponible próximamente. Regístrate para ser notificado.</p>
          <div style={{marginTop:32}}>
            <a href="/registro" className="btn btn-cyan">Registrarse →</a>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
