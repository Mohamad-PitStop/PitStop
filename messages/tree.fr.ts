import { deepMergeAll } from "@/lib/deep-merge"
import { frCore } from "./parts/fr-core"
import { frHome } from "./parts/fr-home"
import { frMarketing } from "./parts/fr-marketing"
import { frAuth } from "./parts/fr-auth"
import { frPagesA } from "./parts/fr-pagesA"
import { frVehicleForm } from "./parts/fr-vehicleForm"
import { frResults } from "./parts/fr-results"
import { frSale } from "./parts/fr-sale"
import { frMisc } from "./parts/fr-misc"
import { frSurface } from "./parts/fr-surface"
import { frPagesB } from "./parts/fr-pagesB"

export const treeFr = deepMergeAll(
  frCore as unknown as Record<string, unknown>,
  frHome as unknown as Record<string, unknown>,
  frMarketing as unknown as Record<string, unknown>,
  frAuth as unknown as Record<string, unknown>,
  frPagesA as unknown as Record<string, unknown>,
  frVehicleForm as unknown as Record<string, unknown>,
  frResults as unknown as Record<string, unknown>,
  frSale as unknown as Record<string, unknown>,
  frMisc as unknown as Record<string, unknown>,
  frSurface as unknown as Record<string, unknown>,
  frPagesB as unknown as Record<string, unknown>
)
