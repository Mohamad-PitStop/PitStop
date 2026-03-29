import { timingSafeEqual } from "crypto"

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PIN)
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN
  if (!expected) return false
  if (typeof pin !== "string" || pin.length < 6 || pin.length > 32) return false
  try {
    const a = Buffer.from(pin, "utf8")
    const b = Buffer.from(expected, "utf8")
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
