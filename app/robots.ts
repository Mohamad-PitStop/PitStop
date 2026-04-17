import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/garage/",
          "/profil",
          "/credits",
          "/mes-diagnostics",
          "/resultat",
          "/rendez-vous/",
          "/merci",
          "/mot-de-passe-oublie",
          "/reinitialiser-mot-de-passe",
          "/verifier-email",
          "/evaluer/",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
