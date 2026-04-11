/**
 * URL cible pour « entrer » dans le parcours diagnostic (onglets, CTA).
 * Tous les utilisateurs ont accès à /diagnostic, quel que soit leur solde de crédits.
 */
export function getDiagnosticEntryHref(
  user: { role: string; diagnosticCredits?: number } | null | undefined
): string {
  return "/diagnostic"
}
