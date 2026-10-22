import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { seed } from './seed'
import type { State } from './types'

const KEY = 'conceptbridge-demo-v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* ignore */
  }
  return structuredClone(seed)
}

interface Ctx {
  state: State
  update: (fn: (s: State) => State) => void
  reset: () => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const update = useCallback((fn: (s: State) => State) => setState(fn), [])
  const reset = useCallback(() => setState(structuredClone(seed)), [])

  return <StoreContext.Provider value={{ state, update, reset }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}

export const uid = () => Math.random().toString(36).slice(2, 9)
export const today = () => new Date().toISOString().slice(0, 10)
export const money = (n: number) => `$${n.toLocaleString('en-US')}`

/** Prepend a notification to the state. */
export function notify(s: State, text: string): State {
  return { ...s, notices: [{ id: uid(), text, date: today(), read: false }, ...s.notices] }
}

/** Budget derived from Resource Mapping plus the plan's own lines. */
export function budgetOf(s: State) {
  const lines = [
    ...s.resources.filter((r) => r.type !== 'Funding').map((r) => ({ label: r.name, amount: r.budget })),
    ...s.plan.extraLines.map((l) => ({ label: l.label, amount: l.amount })),
  ]
  const total = lines.reduce((a, l) => a + l.amount, 0)
  const funded = s.resources.filter((r) => r.type === 'Funding').reduce((a, r) => a + r.funded, 0)
  return { lines, total, funded, gap: Math.max(0, total - funded) }
}
