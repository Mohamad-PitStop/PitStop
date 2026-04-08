"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import {
  ConfidentialiteBodyFr,
  ConfidentialiteBodyEn,
  ConfidentialiteBodyNl,
} from "@/components/legal/confidentialite-bodies"

export function ConfidentialiteView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody
          fr={<ConfidentialiteBodyFr />}
          en={<ConfidentialiteBodyEn />}
          nl={<ConfidentialiteBodyNl />}
        />
      </main>
    </div>
  )
}
