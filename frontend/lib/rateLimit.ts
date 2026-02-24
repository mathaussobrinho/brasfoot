const store = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_REQUESTS = 10

export function rateLimitLogin(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }
  if (now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }
  entry.count++
  if (entry.count > MAX_REQUESTS) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: MAX_REQUESTS - entry.count }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export function checkRateLimit(request: Request): { ok: boolean; remaining: number; ip: string } {
  const ip = getClientIp(request)
  const { ok, remaining } = rateLimitLogin(ip)
  return { ok, remaining, ip }
}
