"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type FormState = {
  garageName: string
  contactName: string
  email: string
  phone: string
  city: string
  services: string
  message: string
}

const initialForm: FormState = {
  garageName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  services: "",
  message: "",
}

export function PartnerContactForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<null | { type: "success" | "error"; text: string }>(null)

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/partner-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error((body && body.error) || "Impossible d'envoyer la demande.")
      }

      setForm(initialForm)
      setStatus({
        type: "success",
        text: "Votre demande partenaire a bien été envoyée. Notre équipe reviendra vers vous rapidement.",
      })
      toast.success("Demande envoyée !", {
        description: "Notre équipe reviendra vers vous rapidement.",
      })
    } catch (err) {
      const text = err instanceof Error ? err.message : "Une erreur est survenue."
      setStatus({ type: "error", text })
      toast.error("Erreur d'envoi", { description: text })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="garageName" className="text-sm text-foreground">
            Nom du garage
          </label>
          <Input
            id="garageName"
            value={form.garageName}
            onChange={onChange("garageName")}
            placeholder="Ex : Garage Dupont"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contactName" className="text-sm text-foreground">
            Personne de contact
          </label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={onChange("contactName")}
            placeholder="Ex : Marc Dupont"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-foreground">
            Email professionnel
          </label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={onChange("email")}
            placeholder="contact@votregarage.be"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm text-foreground">
            Telephone
          </label>
          <Input
            id="phone"
            value={form.phone}
            onChange={onChange("phone")}
            placeholder="+32 ..."
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm text-foreground">
            Ville
          </label>
          <Input
            id="city"
            value={form.city}
            onChange={onChange("city")}
            placeholder="Ex : Braine l'alleud"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="services" className="text-sm text-foreground">
            Services principaux
          </label>
          <Input
            id="services"
            value={form.services}
            onChange={onChange("services")}
            placeholder="Ex : mecanique, carrosserie, pneus"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm text-foreground">
          Message
        </label>
        <Textarea
          id="message"
          value={form.message}
          onChange={onChange("message")}
          placeholder="Parlez-nous de votre garage, vos disponibilites et pourquoi vous souhaitez rejoindre le reseau PitStop."
          className="min-h-28"
          required
        />
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === "success" ? "text-green-400" : "text-red-400"}`}
          role="status"
          aria-live="polite"
        >
          {status.text}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande partenaire"}
      </Button>
    </form>
  )
}
