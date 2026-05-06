import type { Metadata } from "next"

/**
 * Le site sert FR/EN/NL via cookie sur la même URL canonique.
 * Hreflang répété sur chaque page renforce le signal multilingue auprès de Google.
 */
export function localizedAlternates(path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: path,
    languages: {
      "fr-BE": path,
      en: path,
      "nl-BE": path,
      "x-default": path,
    },
  }
}
