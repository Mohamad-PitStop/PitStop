export const GARAGE_SPECIALTIES = [
  "carrosserie",
  "mecanique_generale",
  "entretien_basique",
  "entretien_complet",
  "electronique_auto",
  "climatisation",
  "pneumatiques",
  "freinage",
  "diagnostic_electronique",
  "geometrie_parallelisme",
  "embrayage_transmission",
  "echappement",
  "vitrage",
  "peinture",
  "suspension",
  "direction",
  "electricite_auto",
  "revision_controle_technique",
] as const

export type GarageSpecialty = (typeof GARAGE_SPECIALTIES)[number]

/** Clé i18n pour chaque spécialité : garage.specialties.<code> */
export function specialtyI18nKey(code: GarageSpecialty): string {
  return `garage.specialties.${code}`
}
