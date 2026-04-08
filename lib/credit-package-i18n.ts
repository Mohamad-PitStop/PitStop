import type { CreditPackageId } from "@/lib/credit-packages"

/** Libellé affiché pour un pack (FR / EN / NL via `creditsPage.pkgLabel_*`). */
export function creditPackageLabel(t: (key: string) => string, id: CreditPackageId): string {
  return t(`creditsPage.pkgLabel_${id}`)
}

/** Ligne « économie » sous le prix ; null pour le pack 1 crédit. */
export function creditPackageSaving(
  t: (key: string) => string,
  id: CreditPackageId
): string | null {
  if (id === "1") return null
  return t(`creditsPage.pkgSaving_${id}`)
}
