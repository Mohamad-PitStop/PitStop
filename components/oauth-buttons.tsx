"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/locale-context"

type Props = {
  /** Destination interne après authentification (sécurisée côté callback). */
  callbackUrl?: string | null
  /** "login" ou "signup" — uniquement à titre indicatif, aucun comportement serveur différent. */
  mode?: "login" | "signup"
}

function buildHref(provider: "google" | "facebook", callbackUrl: string | null | undefined, mode: "login" | "signup") {
  const params = new URLSearchParams()
  if (callbackUrl) params.set("callbackUrl", callbackUrl)
  params.set("mode", mode)
  const qs = params.toString()
  return `/api/auth/oauth/${provider}/start${qs ? `?${qs}` : ""}`
}

export function OAuthButtons({ callbackUrl, mode = "login" }: Props) {
  const { t } = useTranslation()
  const label = mode === "signup" ? t("auth.oauthSignupWith") : t("auth.oauthContinueWith")

  return (
    <div className="space-y-2">
      <Button
        asChild
        type="button"
        variant="outline"
        className="w-full bg-white text-[#3c4043] hover:bg-gray-50 border-border/60"
      >
        <a href={buildHref("google", callbackUrl, mode)}>
          <GoogleLogo className="h-4 w-4 mr-2" aria-hidden />
          {label.replace("{{provider}}", "Google")}
        </a>
      </Button>
      <Button
        asChild
        type="button"
        className="w-full bg-[#1877F2] text-white hover:bg-[#166FE5] border-0"
      >
        <a href={buildHref("facebook", callbackUrl, mode)}>
          <FacebookLogo className="h-4 w-4 mr-2" aria-hidden />
          {label.replace("{{provider}}", "Facebook")}
        </a>
      </Button>
    </div>
  )
}

export function OAuthDivider() {
  const { t } = useTranslation()
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{t("auth.oauthDivider")}</span>
      </div>
    </div>
  )
}

function GoogleLogo({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...rest}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

function FacebookLogo({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

/**
 * Message d'erreur à afficher au-dessus du formulaire si `?oauth_error=` est présent.
 * Retourne null si pas d'erreur.
 */
export function useOAuthErrorMessage(code: string | null): string | null {
  const { t } = useTranslation()
  if (!code) return null
  switch (code) {
    case "access_denied":
      return t("auth.oauthAccessDenied")
    case "email_conflict_unverified":
      return t("auth.oauthEmailConflict")
    case "missing_email":
      return t("auth.oauthMissingEmail")
    case "not_configured":
      return t("auth.oauthNotConfigured")
    case "invalid_state":
    case "missing_params":
    case "exchange_failed":
    default:
      return t("auth.oauthGenericError")
  }
}
