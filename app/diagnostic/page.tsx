import { DiagnosticPageContent } from "@/components/diagnostic-page-content"
import { ensureDiagnosticPageAccess } from "@/lib/diagnostic-page-guard"

export default async function DiagnosticPage() {
  await ensureDiagnosticPageAccess()
  return <DiagnosticPageContent />
}
