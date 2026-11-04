export class ApiError extends Error {
  status: number
  data: unknown
  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.status = status
    this.data = data
  }
}

/** JSON helper for the backend. Cookies are same-origin, so no extra config is needed. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
    headers: opts.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    credentials: 'same-origin',
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`
    throw new ApiError(msg, res.status, data)
  }
  return data as T
}
