/**
 * Marques d'exception : le client ne peut pas aller plus loin (diagnostic / vente).
 * Un passage en concession spécialisée est nécessaire, nos garages partenaires ne peuvent pas l'aider.
 */
export const MARQUES_EXCEPTION = [
  "Rolls-Royce",
  "Bugatti",
  "McLaren",
  "Aston Martin",
  "Lotus",
] as const

export function isExceptionBrand(marque: string): boolean {
  const normalized = (marque ?? "").trim()
  if (!normalized) return false
  const lower = normalized.toLowerCase()
  return MARQUES_EXCEPTION.some((b) => b.toLowerCase() === lower)
}

export const MESSAGE_MARQUE_EXCEPTION =
  "Pour cette marque, un passage en concession spécialisée est nécessaire. Nos garages partenaires ne disposent pas des équipements ni des habilitations requises pour intervenir sur ce type de véhicule. Nous vous conseillons de vous rapprocher d’un réseau officiel de la marque."
