"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import { SlaBodyFr, SlaBodyEn, SlaBodyNl } from "@/components/legal/sla-bodies"

export function SlaView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody fr={<SlaBodyFr />} en={<SlaBodyEn />} nl={<SlaBodyNl />} />
      </main>
    </div>
  )
}
