"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/locale-context"

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
  const { t } = useTranslation()
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
        throw new Error((body && body.error) || t("home.partnerForm.errSend"))
      }

      setForm(initialForm)
      setStatus({
        type: "success",
        text: t("home.partnerForm.successBanner"),
      })
      toast.success(t("home.partnerForm.toastSuccessTitle"), {
        description: t("home.partnerForm.toastSuccessDesc"),
      })
    } catch (err) {
      const text = err instanceof Error ? err.message : t("home.partnerForm.errGeneric")
      setStatus({ type: "error", text })
      toast.error(t("home.partnerForm.toastErrorTitle"), { description: text })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="garageName" className="text-sm text-foreground">
            {t("home.partnerForm.labelGarageName")}
          </label>
          <Input
            id="garageName"
            value={form.garageName}
            onChange={onChange("garageName")}
            placeholder={t("home.partnerForm.phGarageName")}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contactName" className="text-sm text-foreground">
            {t("home.partnerForm.labelContactName")}
          </label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={onChange("contactName")}
            placeholder={t("home.partnerForm.phContactName")}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-foreground">
            {t("home.partnerForm.labelEmail")}
          </label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={onChange("email")}
            placeholder={t("home.partnerForm.phEmail")}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm text-foreground">
            {t("home.partnerForm.labelPhone")}
          </label>
          <Input
            id="phone"
            value={form.phone}
            onChange={onChange("phone")}
            placeholder={t("home.partnerForm.phPhone")}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm text-foreground">
            {t("home.partnerForm.labelCity")}
          </label>
          <Input
            id="city"
            value={form.city}
            onChange={onChange("city")}
            placeholder={t("home.partnerForm.phCity")}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="services" className="text-sm text-foreground">
            {t("home.partnerForm.labelServices")}
          </label>
          <Input
            id="services"
            value={form.services}
            onChange={onChange("services")}
            placeholder={t("home.partnerForm.phServices")}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm text-foreground">
          {t("home.partnerForm.labelMessage")}
        </label>
        <Textarea
          id="message"
          value={form.message}
          onChange={onChange("message")}
          placeholder={t("home.partnerForm.phMessage")}
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
        {isSubmitting ? t("home.partnerForm.submitting") : t("home.partnerForm.submit")}
      </Button>
    </form>
  )
}
