import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"

/**
 * URL cible pour « entrer » dans le parcours diagnostic (onglets, CTA).
 * Compte sans crédit : `/credits` si achat activé, sinon `/merci?from=diagnostic`.
 */
export function getDiagnosticEntryHref(
  user: { role: string; diagnosticCredits?: number } | null | undefined
): string {
  if (!user) return "/diagnostic"
  const privileged = user.role === "admin" || user.role === "tester"
  if (privileged) return "/diagnostic"
  if ((user.diagnosticCredits ?? 0) > 0) return "/diagnostic"
  return CREDIT_PURCHASES_ENABLED ? "/credits" : "/merci?from=diagnostic"
}
