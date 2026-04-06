import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getUserFromAuthCookie } from "@/lib/auth-session"
import { CREDIT_PURCHASES_ENABLED } from "@/lib/feature-flags"

/**
 * À appeler en tête de `app/diagnostic/page.tsx` : empêche d’afficher le formulaire
 * si l’utilisateur n’a pas le droit d’y accéder (0 crédit en phase test → /merci, etc.).
 */
export async function ensureDiagnosticPageAccess(): Promise<void> {
  const h = await headers()
  const user = await getUserFromAuthCookie(h.get("cookie"))

  if (!user) {
    redirect(`/connexion?callbackUrl=${encodeURIComponent("/diagnostic")}&reason=diagnostic`)
  }

  const privileged = user.role === "admin" || user.role === "tester"
  if (privileged) return

  if (user.diagnosticCredits > 0) return

  if (CREDIT_PURCHASES_ENABLED) {
    redirect("/credits")
  }
  redirect("/merci?from=diagnostic")
}
