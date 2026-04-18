"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/locale-context"

const FLASH_COOKIE = "pitstop_signup_cancelled"

/**
 * Lit le cookie flash posé par /api/auth/cancel-signup, affiche un toast
 * expliquant à l'utilisateur que son inscription a été annulée, puis efface
 * le cookie pour éviter un re-déclenchement au prochain render.
 */
export function SignupCancelledToast() {
  const { t } = useTranslation()

  useEffect(() => {
    if (typeof document === "undefined") return
    const has = document.cookie.split(";").some((c) => c.trim().startsWith(`${FLASH_COOKIE}=`))
    if (!has) return
    toast.warning(t("complete.cancelledToast"), { duration: 8000 })
    document.cookie = `${FLASH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  }, [t])

  return null
}
