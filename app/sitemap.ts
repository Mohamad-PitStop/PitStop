import type { MetadataRoute } from "next"

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${BASE}/`,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/diagnostic`,                    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/vente`,                         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/garages`,                       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/inscription`,                   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/connexion`,                     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/inscription-garage`,            lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/mentions-legales`,              lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/confidentialite`,               lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/conditions-generales-vente`,    lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/politique-ia`,                  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/cgp-garages`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/sla`,                           lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ]
}
