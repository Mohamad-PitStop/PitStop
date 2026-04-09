import { headers } from "next/headers"
import { DiagnosticPageContent } from "@/components/diagnostic-page-content"
import { ensureDiagnosticPageAccess } from "@/lib/diagnostic-page-guard"
import { getUserFromAuthCookie } from "@/lib/auth-session"

export default async function DiagnosticPage() {
  await ensureDiagnosticPageAccess()
  const cookieHeader = (await headers()).get("cookie")
  const user = await getUserFromAuthCookie(cookieHeader)
  /** Session valide + droit diagnostic (déjà vérifié par ensureDiagnosticPageAccess) : pas de modale connexion / invité. */
  return <DiagnosticPageContent skipGuestGate={Boolean(user)} />
}
