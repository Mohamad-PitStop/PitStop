"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import { PolitiqueIaBodyFr, PolitiqueIaBodyEn, PolitiqueIaBodyNl } from "@/components/legal/politique-ia-bodies"

export function PolitiqueIaView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody fr={<PolitiqueIaBodyFr />} en={<PolitiqueIaBodyEn />} nl={<PolitiqueIaBodyNl />} />
      </main>
    </div>
  )
}
