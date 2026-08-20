import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata = {
  title: 'Condiciones de Uso',
}

export default function TerminosPage() {
  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <PublicNav />
      <main style={{background:'#F3F6FC',minHeight:'100vh'}}>
        <div className="legal-wrap">
          <h1>Condiciones de Uso</h1>
          <p className="legal-meta">Plataforma: CETIVA Campus · Versión 1.0 · Vigente desde 2026</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>Al acceder, registrarse y utilizar el campus virtual de CETIVA S.A.S., el usuario acepta de manera plena y sin reservas los presentes Términos y Condiciones. Si no está de acuerdo con alguno de los puntos, debe abstenerse de usar la plataforma.</p>

          <h2>2. Naturaleza del Contenido y Descargo de Responsabilidad</h2>
          <p>El contenido alojado en el campus de CETIVA tiene un propósito estrictamente educativo y de formación continua en el área clínica. La información proporcionada en los programas no sustituye el juicio clínico profesional. La aplicación práctica de las técnicas enseñadas es responsabilidad exclusiva del profesional de la salud en su entorno laboral y bajo las normativas de su respectiva institución.</p>

          <h2>3. Propiedad Intelectual y Derechos de Autor</h2>
          <p>Todo el material didáctico, videos, textos, gráficos, currículos y diseños de la plataforma son propiedad exclusiva de <strong>CETIVA S.A.S.</strong> y sus respectivos creadores, protegidos bajo la Ley 23 de 1982 y la Decisión Andina 351 de 1993 sobre derechos de autor.</p>
          <p>Esto incluye de manera expresa y enunciativa todos los derechos sobre la metodología <strong>RAVA (Rational Approach to Vascular Access)</strong>, estrategia de entrenamiento clínico desarrollada por Diego Orlando Ríos Guarín, quien conserva su autoría intelectual.</p>
          <p>Queda estrictamente prohibida la reproducción, distribución, descarga no autorizada, grabación de pantalla, transmisión o comercialización de cualquier contenido del campus sin el consentimiento expreso y por escrito de CETIVA S.A.S.</p>
          <p>El acceso a los programas otorga una licencia de uso personal e intransferible. Compartir credenciales de acceso resultará en la suspensión inmediata de la cuenta.</p>

          <h2>4. Pagos, Suscripciones y Política de Reembolsos</h2>
          <p>El acceso a los módulos de pago se habilitará automáticamente una vez confirmado el pago a través de los canales autorizados por CETIVA S.A.S.</p>
          <p>De conformidad con el Estatuto del Consumidor (Ley 1480 de 2011), se otorgará un reembolso total si el usuario lo solicita dentro de los <strong>5 días hábiles</strong> posteriores a la compra, siempre y cuando no haya visualizado más del <strong>10%</strong> del contenido del programa ni haya emitido el certificado correspondiente. Los pagos realizados mediante plataformas electrónicas se rigen adicionalmente por la normativa de comercio electrónico establecida en la Ley 527 de 1999.</p>

          <h2>5. Protección de Datos Personales</h2>
          <p>El tratamiento de los datos personales de los usuarios se realiza en estricto cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013. CETIVA S.A.S. actúa como responsable del tratamiento y garantiza la confidencialidad, seguridad y uso exclusivamente educativo de la información recopilada. El usuario podrá ejercer sus derechos de acceso, corrección, supresión y revocación del consentimiento escribiendo a <a href="mailto:info@cetivainc.com">info@cetivainc.com</a>.</p>

          <h2>6. Conducta del Usuario y Manejo de Casos Clínicos</h2>
          <p>Los espacios interactivos dentro de la plataforma deben utilizarse con estricto profesionalismo clínico.</p>
          <p>Si el usuario comparte imágenes o relatos de casos clínicos reales con fines educativos, es su responsabilidad y obligación anonimizar todos los datos del paciente en cumplimiento de la Ley 1581 de 2012, la Ley 23 de 1981 (ética médica) y las disposiciones del secreto profesional aplicables a los trabajadores de la salud.</p>

          <h2>7. Legislación Aplicable y Jurisdicción</h2>
          <p>Los presentes Términos y Condiciones se rigen en su totalidad por las leyes de la República de Colombia. Para cualquier controversia derivada de su interpretación o cumplimiento, las partes se someten a la jurisdicción de los jueces y tribunales competentes de Bogotá D.C., renunciando expresamente a cualquier otro fuero que pudiera corresponderles.</p>

          <p style={{marginTop:40,fontSize:14,color:'var(--gray)'}}>Para consultas sobre estos términos: <a href="mailto:info@cetivainc.com">info@cetivainc.com</a></p>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
