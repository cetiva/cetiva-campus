export function emailValido(email: string): boolean {
  if (typeof email !== 'string') return false
  const e = email.trim()
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
}

export function validarPassword(pw: string): string | null {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (pw.length > 72) return 'La contraseña no puede superar 72 caracteres.'
  return null
}

export function limpiarTexto(v: string, max = 200): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
