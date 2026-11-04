/** Tiny in-memory fixed-window limiter. Enough for a single-node deployment. */
const hits = new Map<string, { count: number; resetAt: number }>()

export function tooMany(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  h.count += 1
  return h.count > max
}

export function clearHits(key: string) {
  hits.delete(key)
}

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k)
}, 60_000).unref()
