export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return true

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  if (!host) return false

  try {
    const originUrl = new URL(origin)
    return originUrl.host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

