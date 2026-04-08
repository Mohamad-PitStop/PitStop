/** Libellés / textes d’économie : clés i18n `creditsPage.pkgLabel_*` et `creditsPage.pkgSaving_*`. */
export const CREDIT_PACKAGES = [
  {
    id: "1" as const,
    credits: 1,
    amountCents: 599,
    priceLabel: "5,99 €",
    originalPrice: null as string | null,
    badge: null as string | null,
    highlight: false,
  },
  {
    id: "3" as const,
    credits: 3,
    amountCents: 1599,
    priceLabel: "15,99 €",
    originalPrice: "18,00 €",
    badge: "–12 %",
    highlight: false,
  },
  {
    id: "6" as const,
    credits: 6,
    amountCents: 2899,
    priceLabel: "28,99 €",
    originalPrice: "36,00 €",
    badge: "–20 %",
    highlight: true,
  },
  {
    id: "10" as const,
    credits: 10,
    amountCents: 4199,
    priceLabel: "41,99 €",
    originalPrice: "60,00 €",
    badge: "–30 %",
    highlight: false,
  },
] as const

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]["id"]
