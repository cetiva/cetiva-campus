import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata = {
  title: 'Aviso de Privacidad',
}

export default function AvisoPrivacidadPage() {
  return (
    <>
      <div className="rule"><span className="a"/><span className="b"/><span className="c"/><span className="d"/></div>
      <PublicNav />
      <main style={{background:'#F3F6FC',minHeight:'100vh'}}>
        <div className="legal-wrap">
          <h1>Aviso de Privacidad</h1>
          <p className="legal-meta">Plataforma: CETIVA Campus · Clientes y Usuarios · Versión 1.0 · Vigente desde 2026</p>

          <p>El presente Aviso de Privacidad se establece en cumplimiento de la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales, el Decreto Reglamentario 1377 de 2013 y las instrucciones de la Superintendencia de Industria y Comercio (SIC), con el fin de informar a los usuarios las prácticas de CETIVA S.A.S. en relación con el tratamiento de sus datos personales en el campus virtual.</p>
          <p>Para CETIVA S.A.S. es prioritario proteger y salvaguardar los datos personales de sus usuarios, estudiantes y profesionales de la salud vinculados a sus programas educativos, así como garantizar el ejercicio pleno de sus derechos como titulares.</p>

          <h2>Responsable del Tratamiento</h2>
          <p>
            <strong>CETIVA S.A.S.</strong> (Centro de Excelencia en Terapia Infusional y Acceso Vascular)<br/>
            Bogotá D.C., Colombia<br/>
            Contacto: <a href="mailto:info@cetivainc.com">info@cetivainc.com</a>
          </p>

          <h2>Datos Personales Recopilados</h2>
          <p>Los datos personales que recopilamos para el uso del campus virtual y nuestros servicios incluyen:</p>
          <ul>
            <li><strong>Datos generales:</strong> nombre completo, número de documento de identidad (CC, CE o pasaporte), domicilio, teléfono fijo y/o móvil, dirección de correo electrónico, y credenciales profesionales (registro profesional, institución de trabajo).</li>
            <li><strong>Datos financieros:</strong> información de referencia para la gestión de pagos de los programas educativos a través de los canales autorizados por CETIVA S.A.S.</li>
            <li><strong>Datos sensibles:</strong> en el marco de actividades prácticas o reporte de eventos adversos durante las capacitaciones, podrá requerirse información general de salud o datos del profesional de la salud involucrado, los cuales serán tratados con las medidas de seguridad reforzadas exigidas por la Ley 1581 de 2012.</li>
          </ul>

          <h2>Finalidades Principales del Tratamiento</h2>
          <ul>
            <li>Identificación y contacto con el usuario.</li>
            <li>Creación y gestión de la cuenta en el campus virtual.</li>
            <li>Control de acceso a los programas.</li>
            <li>Registro de progreso en los módulos educativos.</li>
            <li>Emisión de certificados de aprobación.</li>
            <li>Gestión de pagos y facturación electrónica conforme a la normativa de la DIAN.</li>
            <li>Cumplimiento de obligaciones legales ante autoridades competentes.</li>
          </ul>

          <h2>Finalidades Secundarias</h2>
          <p>De manera adicional, con su autorización expresa, utilizaremos su información para: responder consultas sobre nuestros programas, enviar comunicaciones sobre nuevas ofertas educativas y prospección comercial.</p>
          <p>Si no desea que sus datos sean tratados para estas finalidades secundarias, comuníquelo a: <a href="mailto:info@cetivainc.com">info@cetivainc.com</a></p>

          <h2>Transferencia de Datos Personales</h2>
          <p>CETIVA S.A.S. no transferirá datos personales a terceros sin autorización previa del titular, salvo en los casos previstos en el artículo 10 de la Ley 1581 de 2012 (obligaciones legales, orden judicial o autoridad administrativa competente). El uso de infraestructura tecnológica en la nube implica el procesamiento de datos por proveedores de servicios que actúan como encargados del tratamiento, bajo acuerdos de confidencialidad y seguridad.</p>

          <h2>Derechos del Titular</h2>
          <p>De conformidad con la Ley 1581 de 2012, el titular de los datos tiene derecho a:</p>
          <ul>
            <li>Conocer, actualizar y rectificar sus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso dado a sus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la normativa vigente.</li>
            <li>Revocar la autorización y solicitar la supresión de sus datos, salvo que exista deber legal de conservarlos.</li>
          </ul>
          <p>Para ejercer estos derechos, envíe su solicitud a <a href="mailto:info@cetivainc.com">info@cetivainc.com</a> indicando: nombre completo, número de documento, medio de contacto, y descripción clara del derecho a ejercer. CETIVA S.A.S. dará respuesta en un plazo máximo de 10 días hábiles para consultas y 15 días hábiles para reclamos, conforme al artículo 14 de la Ley 1581 de 2012.</p>

          <h2>Uso de Cookies y Herramientas de Análisis</h2>
          <p>El campus virtual utiliza cookies y herramientas de análisis para mejorar la experiencia del usuario y entender la interacción con el contenido educativo. El usuario puede gestionar sus preferencias de cookies desde la configuración de su navegador o en la página de <a href="/preferencias-cookies">preferencias de cookies</a>.</p>

          <h2>Vigencia y Modificaciones</h2>
          <p>El presente Aviso de Privacidad rige a partir de su fecha de publicación. CETIVA S.A.S. se reserva el derecho de modificarlo en cualquier momento, notificando los cambios a través del campus virtual con al menos 10 días hábiles de anticipación.</p>

          <p style={{marginTop:40,fontSize:14,color:'var(--gray)'}}>Para consultas sobre el tratamiento de sus datos personales: <a href="mailto:info@cetivainc.com">info@cetivainc.com</a></p>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
