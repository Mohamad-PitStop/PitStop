import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const SCRYPT_KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex")
  return `scrypt$${salt}$${derived}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algo, salt, hashHex] = storedHash.split("$")
  if (algo !== "scrypt" || !salt || !hashHex) return false
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN)
  const expected = Buffer.from(hashHex, "hex")
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}
