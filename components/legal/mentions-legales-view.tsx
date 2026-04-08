"use client"

import { Navbar } from "@/components/navbar"
import { LocaleSwitchBody } from "@/components/legal/locale-switch-body"
import { MentionsBodyFr, MentionsBodyEn, MentionsBodyNl } from "@/components/legal/mentions-bodies"

export function MentionsLegalesView() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <LocaleSwitchBody fr={<MentionsBodyFr />} en={<MentionsBodyEn />} nl={<MentionsBodyNl />} />
      </main>
    </div>
  )
}
