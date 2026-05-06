import type { MetadataRoute } from "next"
import { listApprovedGarages } from "@/lib/garage-db"

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitstop-diagnostic.live").replace(/\/$/, "")

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
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

  let garagePages: MetadataRoute.Sitemap = []
  try {
    const garages = await listApprovedGarages()
    garagePages = garages.map((g) => ({
      url: `${BASE}/garages/${g.id}`,
      lastModified: g.approvedAt ? new Date(g.approvedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // Si la DB est indisponible au build, on renvoie au moins les pages statiques.
  }

  return [...staticPages, ...garagePages]
}
