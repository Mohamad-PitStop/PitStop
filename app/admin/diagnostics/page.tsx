import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminPinGate } from "@/components/admin-pin-gate"
import { isAdminConfigured } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default function AdminDiagnosticsPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-md mx-auto">
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle>Admin non configuré</CardTitle>
                <CardDescription>
                  Définissez <code className="bg-muted px-1 rounded">ADMIN_PIN</code> (4 chiffres) dans <code className="bg-muted px-1 rounded">.env.local</code> pour protéger cette page.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Accueil
              </Link>
            </div>
            <AdminPinGate />
          </div>
        </div>
      </main>
    </div>
  )
}
