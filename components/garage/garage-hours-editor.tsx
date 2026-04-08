"use client"

import { useTranslation } from "@/lib/i18n/locale-context"
import type { BusinessHours, BusinessHoursDay } from "@/lib/garage-db"

type DayKey = keyof BusinessHours

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const HOURS_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  HOURS_OPTIONS.push(`${String(h).padStart(2, "0")}:00`)
  HOURS_OPTIONS.push(`${String(h).padStart(2, "0")}:30`)
}

type Props = {
  value: BusinessHours
  onChange: (value: BusinessHours) => void
}

export function GarageHoursEditor({ value, onChange }: Props) {
  const { t } = useTranslation()

  function setDay(day: DayKey, ranges: BusinessHoursDay) {
    onChange({ ...value, [day]: ranges })
  }

  function toggleDay(day: DayKey) {
    if (value[day].length > 0) {
      setDay(day, [])
    } else {
      setDay(day, [{ start: "09:00", end: "17:00" }])
    }
  }

  function setRange(day: DayKey, index: number, field: "start" | "end", val: string) {
    const ranges = [...value[day]]
    ranges[index] = { ...ranges[index], [field]: val }
    setDay(day, ranges)
  }

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const ranges = value[day]
        const isOpen = ranges.length > 0

        return (
          <div key={day} className="flex items-center gap-3">
            <label className="flex w-24 shrink-0 items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={() => toggleDay(day)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {t(`garage.days.${day}`)}
            </label>

            {isOpen ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("garage.registration.hoursFrom")}</span>
                <select
                  value={ranges[0]?.start ?? "09:00"}
                  onChange={(e) => setRange(day, 0, "start", e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {HOURS_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">{t("garage.registration.hoursTo")}</span>
                <select
                  value={ranges[0]?.end ?? "17:00"}
                  onChange={(e) => setRange(day, 0, "end", e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {HOURS_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t("garage.registration.hoursClosed")}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
