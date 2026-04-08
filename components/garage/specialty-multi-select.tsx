"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GARAGE_SPECIALTIES, type GarageSpecialty } from "@/lib/garage-specialties"
import { useTranslation } from "@/lib/i18n/locale-context"

type Props = {
  value: GarageSpecialty[]
  onChange: (value: GarageSpecialty[]) => void
}

export function SpecialtyMultiSelect({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function toggle(specialty: GarageSpecialty) {
    if (value.includes(specialty)) {
      onChange(value.filter((s) => s !== specialty))
    } else {
      onChange([...value, specialty])
    }
  }

  function remove(specialty: GarageSpecialty) {
    onChange(value.filter((s) => s !== specialty))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={value.length === 0 ? "text-muted-foreground" : "text-foreground"}>
          {value.length === 0
            ? t("garage.registration.specialtiesPlaceholder")
            : `${value.length} sélectionnée(s)`}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {t(`garage.specialties.${s}`)}
              <button type="button" onClick={() => remove(s)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {GARAGE_SPECIALTIES.map((specialty) => {
            const selected = value.includes(specialty)
            return (
              <button
                key={specialty}
                type="button"
                onClick={() => toggle(specialty)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </div>
                {t(`garage.specialties.${specialty}`)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
