import { marketingSteps } from "@/lib/marketing-content"

/** Grille responsive : 1 colonne sur très petit écran, 3 colonnes alignées dès sm */
export function MarketingSteps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 md:gap-10 max-w-4xl mx-auto w-full">
      {marketingSteps.map((step) => (
        <div key={step.number} className="flex flex-col items-center text-center px-1">
          <div
            className="h-14 w-14 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold"
            aria-hidden
          >
            {step.number}
          </div>
          <p className="mt-4 text-foreground font-medium text-sm sm:text-base leading-snug max-w-[260px] mx-auto">
            {step.text}
          </p>
        </div>
      ))}
    </div>
  )
}
