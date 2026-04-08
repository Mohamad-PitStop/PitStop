import { deepMergeAll } from "@/lib/deep-merge"
import { enCore } from "./parts/en-core"
import { enHome } from "./parts/en-home"
import { enMarketing } from "./parts/en-marketing"
import { enAuth } from "./parts/en-auth"
import { enPagesA } from "./parts/en-pagesA"
import { enVehicleForm } from "./parts/en-vehicleForm"
import { enResults } from "./parts/en-results"
import { enSale } from "./parts/en-sale"
import { enMisc } from "./parts/en-misc"
import { enSurface } from "./parts/en-surface"
import { enPagesB } from "./parts/en-pagesB"

export const treeEn = deepMergeAll(
  enCore as unknown as Record<string, unknown>,
  enHome as unknown as Record<string, unknown>,
  enMarketing as unknown as Record<string, unknown>,
  enAuth as unknown as Record<string, unknown>,
  enPagesA as unknown as Record<string, unknown>,
  enVehicleForm as unknown as Record<string, unknown>,
  enResults as unknown as Record<string, unknown>,
  enSale as unknown as Record<string, unknown>,
  enMisc as unknown as Record<string, unknown>,
  enSurface as unknown as Record<string, unknown>,
  enPagesB as unknown as Record<string, unknown>
)
