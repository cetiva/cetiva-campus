'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function VerificarPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const [estado, setEstado] = useState<'cargando'|'valido'|'invalido'>('cargando')
  const [cert, setCert] = useState<{titulo?:string;nombre?:string;apellidos?:string;emitido_en?:string}|null>(null)

  useEffect(() => {
    async function verificar() {
      const supabase = createClient()
      const { data } = await supabase
        .from('certificados')
        .select('*, cursos(titulo), profiles(nombre, apellidos)')
        .eq('codigo', codigo)
        .single()

      if (!data) { setEstado('invalido'); return }
      setCert({
        titulo: (data.cursos as {titulo?:string})?.titulo,
        nombre: (data.profiles as {nombre?:string})?.nombre,
        apellidos: (data.profiles as {apellidos?:string})?.apellidos,
        emitido_en: data.emitido_en,
      })
      setEstado('valido')
    }
    verificar()
  }, [codigo])

  return (
    <div className="verify-wrap">
      <div className="verify-card">
        {estado === 'cargando' && <><div className="verify-ico">⏳</div><h1>Verificando…</h1></>}
        {estado === 'valido' && (
          <>
            <div className="verify-ico">✅</div>
            <h1>Certificado válido</h1>
            <p>Este certificado ha sido emitido por CETIVA Campus y es auténtico.</p>
            <div className="verify-detail">
              <div className="row"><span>Estudiante</span><span>{cert?.nombre} {cert?.apellidos}</span></div>
              <div className="row"><span>Curso</span><span>{cert?.titulo}</span></div>
              <div className="row"><span>Código</span><span style={{fontFamily:'monospace'}}>{codigo}</span></div>
              <div className="row"><span>Emitido</span><span>{cert?.emitido_en ? new Date(cert.emitido_en).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'}) : '—'}</span></div>
            </div>
            <Link href="/" className="btn btn-navy" style={{marginTop:8}}>Ir a CETIVA Campus →</Link>
          </>
        )}
        {estado === 'invalido' && (
          <>
            <div className="verify-ico">❌</div>
            <h1>Certificado no encontrado</h1>
            <p>El código <strong style={{fontFamily:'monospace'}}>{codigo}</strong> no corresponde a ningún certificado válido en CETIVA Campus.</p>
            <Link href="/" className="btn btn-ghost" style={{marginTop:16}}>Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  )
}
