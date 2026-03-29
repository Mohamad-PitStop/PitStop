"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { AdminPinGate } from "@/components/admin-pin-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookingCheckout } from "@/components/booking-checkout"

type BookingType = "obd-scan" | "rendez-vous" | "lavage-auto"

function AdminTestBookingContent() {
  const [bookingType, setBookingType] = useState<BookingType>("rendez-vous")
  const [showBooking, setShowBooking] = useState(false)

  const typeLabels: Record<BookingType, string> = {
    "rendez-vous": "Rendez-vous générique",
    "obd-scan": "Scan OBD",
    "lavage-auto": "Lavage auto",
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-2xl px-4 space-y-8">
          <Card className="border-primary/40 bg-card">
            <CardHeader>
              <CardTitle>Test réservation & paiement</CardTitle>
              <CardDescription>
                Teste l'interface de réservation et de paiement sans faire le diagnostic complet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showBooking ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="booking-type" className="text-sm font-medium text-foreground">
                      Type de rendez-vous
                    </label>
                    <Select value={bookingType} onValueChange={(v) => setBookingType(v as BookingType)}>
                      <SelectTrigger id="booking-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rendez-vous">{typeLabels["rendez-vous"]}</SelectItem>
                        <SelectItem value="obd-scan">{typeLabels["obd-scan"]}</SelectItem>
                        <SelectItem value="lavage-auto">{typeLabels["lavage-auto"]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Testera : <strong>{typeLabels[bookingType]}</strong>
                  </p>

                  <Button
                    onClick={() => setShowBooking(true)}
                    className="w-full"
                  >
                    Démarrer le test
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{typeLabels[bookingType]}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBooking(false)}
                    >
                      ← Changer
                    </Button>
                  </div>
                  <BookingCheckout type={bookingType} noCard={false} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
              ← Retour panel admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TestBookingPage() {
  const [authenticated, setAuthenticated] = useState(false)

  if (authenticated) {
    return <AdminTestBookingContent />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-14">
        <div className="container mx-auto max-w-md px-4">
          <AdminPinGate onAuthenticated={() => setAuthenticated(true)} />
        </div>
      </main>
    </div>
  )
}
