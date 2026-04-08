"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import { CgpBodyFr, CgpBodyEn, CgpBodyNl } from "@/components/legal/cgp-bodies"

export function CgpView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody fr={<CgpBodyFr />} en={<CgpBodyEn />} nl={<CgpBodyNl />} />
      </main>
    </div>
  )
}
