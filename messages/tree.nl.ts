import { deepMergeAll } from "@/lib/deep-merge"
import { nlCore } from "./parts/nl-core"
import { nlHome } from "./parts/nl-home"
import { nlMarketing } from "./parts/nl-marketing"
import { nlAuth } from "./parts/nl-auth"
import { nlPagesA } from "./parts/nl-pagesA"
import { nlVehicleForm } from "./parts/nl-vehicleForm"
import { nlResults } from "./parts/nl-results"
import { nlSale } from "./parts/nl-sale"
import { nlMisc } from "./parts/nl-misc"
import { nlSurface } from "./parts/nl-surface"
import { nlPagesB } from "./parts/nl-pagesB"
import { nlGarage } from "./parts/nl-garage"
import { nlGuestDiagnostic } from "./parts/nl-guestDiagnostic"

export const treeNl = deepMergeAll(
  nlCore as unknown as Record<string, unknown>,
  nlHome as unknown as Record<string, unknown>,
  nlMarketing as unknown as Record<string, unknown>,
  nlAuth as unknown as Record<string, unknown>,
  nlPagesA as unknown as Record<string, unknown>,
  nlVehicleForm as unknown as Record<string, unknown>,
  nlResults as unknown as Record<string, unknown>,
  nlSale as unknown as Record<string, unknown>,
  nlMisc as unknown as Record<string, unknown>,
  nlSurface as unknown as Record<string, unknown>,
  nlPagesB as unknown as Record<string, unknown>,
  nlGarage as unknown as Record<string, unknown>,
  nlGuestDiagnostic as unknown as Record<string, unknown>
)
