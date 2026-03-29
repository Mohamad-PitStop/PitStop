import { addMinutes, formatISO, isBefore, max, parseISO } from "date-fns"

export type Slot = { start: string; end: string }

export function buildSlotsForDay({
  dayStartIso,
  dayEndIso,
  slotMinutes = 30,
}: {
  dayStartIso: string
  dayEndIso: string
  slotMinutes?: number
}): Slot[] {
  const start = parseISO(dayStartIso)
  const end = parseISO(dayEndIso)
  if (!isBefore(start, end)) return []

  const out: Slot[] = []
  let cur = start
  while (isBefore(addMinutes(cur, slotMinutes), end) || addMinutes(cur, slotMinutes).getTime() === end.getTime()) {
    const next = addMinutes(cur, slotMinutes)
    out.push({ start: formatISO(cur), end: formatISO(next) })
    cur = next
  }
  return out
}

export function subtractBusy(slots: Slot[], busy: { start: string; end: string }[]): Slot[] {
  const busyRanges = busy
    .map((b) => ({ start: parseISO(b.start), end: parseISO(b.end) }))
    .filter((b) => isBefore(b.start, b.end))

  return slots.filter((s) => {
    const sStart = parseISO(s.start)
    const sEnd = parseISO(s.end)
    return !busyRanges.some((b) => {
      // overlap if max(starts) < min(ends)
      const overlapStart = max([sStart, b.start])
      const overlapEnd = sEnd < b.end ? sEnd : b.end
      return overlapStart < overlapEnd
    })
  })
}

