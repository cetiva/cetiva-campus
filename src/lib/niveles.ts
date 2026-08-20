/**
 * Fuente única de verdad para niveles de curso y sus colores.
 * Usar esta constante en TODOS los componentes que muestren niveles.
 */
export const NIVELES_CONFIG: Record<string, { color: string; label: string; orden: number }> = {
  novato:     { color: '#54B24C', label: 'Novato',     orden: 1 },
  avanzado:   { color: '#16A3C4', label: 'Avanzado',   orden: 2 },
  competente: { color: '#24459A', label: 'Competente', orden: 3 },
  experto:    { color: '#902D8E', label: 'Experto',     orden: 4 },
}

export const NIVELES_LISTA = Object.entries(NIVELES_CONFIG)
  .sort(([,a],[,b]) => a.orden - b.orden)
  .map(([key, cfg]) => ({ key, ...cfg }))

export function colorNivel(nivel: string): string {
  return NIVELES_CONFIG[nivel?.toLowerCase()]?.color ?? '#61708A'
}

export function labelNivel(nivel: string): string {
  return NIVELES_CONFIG[nivel?.toLowerCase()]?.label ?? nivel
}
