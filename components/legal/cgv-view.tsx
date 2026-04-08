"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import { CgvBodyFr, CgvBodyEn, CgvBodyNl } from "@/components/legal/cgv-bodies"

export function CgvView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody fr={<CgvBodyFr />} en={<CgvBodyEn />} nl={<CgvBodyNl />} />
      </main>
    </div>
  )
}
