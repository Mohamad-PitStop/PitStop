"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const SLOTS = ["Matin (8h–12h)", "Après-midi (12h–17h)", "Soir (17h–19h)"]

export function RendezVousForm({ isObd }: { isObd: boolean }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [availability, setAvailability] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    phone?: string
    postalCode?: string
    availability?: string
  }>({})

  const validatePhone = (value: string) => {
    if (!value.trim()) return "Le téléphone est obligatoire."
    const pattern = /^[+\d./\s()-]+$/
    if (!pattern.test(value)) {
      return "Le numéro de téléphone ne doit contenir que des chiffres, espaces, +, /, . ou parenthèses."
    }
    const digits = value.replace(/\D/g, "")
    if (digits.length < 8) {
      return "Le numéro de téléphone semble incomplet."
    }
    return undefined
  }

  const validatePostalCode = (value: string) => {
    if (!value.trim()) return "Le code postal est obligatoire."
    const pattern = /^[A-Za-z]{0,3}\s*\d{3,5}$|^\d{3,5}$/
    if (!pattern.test(value.trim())) {
      return "Merci d'indiquer un code postal valide (chiffres, éventuellement avec préfixe national)."
    }
    return undefined
  }

  const toggleSlot = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const errors: typeof fieldErrors = {}
    if (!name.trim()) {
      errors.name = "Le nom et prénom sont obligatoires."
    }
    const phoneError = validatePhone(phone)
    if (phoneError) errors.phone = phoneError
    const postalError = validatePostalCode(postalCode)
    if (postalError) errors.postalCode = postalError
    if (availability.length === 0) {
      errors.availability = "Merci de sélectionner au moins un créneau."
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setMessage("Merci de corriger les informations indiquées en rouge avant d'envoyer votre demande.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isObd ? "obd-scan" : "standard",
          name,
          phone,
          postalCode,
          availability: availability.join(", "),
        })
      })

      if (!res.ok) {
        throw new Error("Request failed")
      }

      setMessage("Votre demande a bien été envoyée aux garages partenaires. L'un d'eux vous contactera pour confirmer la prise de rendez-vous.")
      toast.success("Demande envoyée !", {
        description: "Un garage partenaire vous contactera pour confirmer le rendez-vous.",
      })
      setName("")
      setPhone("")
      setPostalCode("")
      setAvailability([])
    } catch (error) {
      console.error("Erreur rendez-vous:", error)
      setMessage("Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.")
      toast.error("Erreur d'envoi", { description: "Veuillez réessayer." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">
          {isObd ? "Planifier un scan OBD" : "Planifier un rendez-vous"}
        </CardTitle>
        <CardDescription>
          Vous préférez être recontacté par un garage partenaire au lieu de contacter directement ADI‑Cars ? Renseignez vos coordonnées et proposez un créneau précis pour déposer votre véhicule. Un garage partenaire recevra votre demande par e-mail puis vous recontactera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom et prénom</label>
              <Input
                placeholder="Ex: Dupont Martin"
                value={name}
                onChange={e => setName(e.target.value)}
                className={fieldErrors.name ? "border-destructive focus:ring-destructive/20" : ""}
              />
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Téléphone</label>
              <Input
                placeholder="Ex: +32 4xx xx xx xx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={fieldErrors.phone ? "border-destructive focus:ring-destructive/20" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Code postal</label>
            <Input
              placeholder="Ex: 1000"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              className={fieldErrors.postalCode ? "border-destructive focus:ring-destructive/20" : ""}
            />
            {fieldErrors.postalCode && (
              <p className="text-sm text-destructive">{fieldErrors.postalCode}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Disponibilités pour déposer le véhicule
            </label>
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map((slot) => {
                      const key = `${day} : ${slot}`
                      const selected = availability.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSlot(key)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                            selected
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.availability && (
              <p className="text-sm text-destructive">{fieldErrors.availability}</p>
            )}
            {availability.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {availability.length} créneau{availability.length > 1 ? "x" : ""} sélectionné{availability.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
