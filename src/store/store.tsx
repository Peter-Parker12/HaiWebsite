import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { rootSeed } from './rootSeed'
import type { Notice, Plan, ProjectRecord, Resource, Root, Sponsor, State, Support, User } from './types'

const KEY = 'conceptbridge-demo-v4'
export const CROWD_COMMISSION = 5
export const LICENCE_COMMISSION = 10

export const uid = () => Math.random().toString(36).slice(2, 9)
export const today = () => new Date().toISOString().slice(0, 10)
export const money = (n: number) => `$${n.toLocaleString('en-US')}`

/** Accounts, projects, support requests and notifications come from the server; the rest is browser-only. */
function fresh(): Root {
  return { ...structuredClone(rootSeed), projects: [], supports: [], watchlist: [], notices: [] }
}

function load(): Root {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Root>
      // Server data is re-fetched on start; never trust cached copies of it.
      return { ...fresh(), ...saved, projects: [], supports: [], watchlist: [], notices: [], session: { kind: null, id: '' } }
    }
  } catch {
    /* ignore */
  }
  return fresh()
}

/* ------------------------------------------------------------------ */
/* Root store                                                          */
/* ------------------------------------------------------------------ */

type AuthResult = { kind: 'user' | 'sponsor' | null; account: User | Sponsor | null }
export type SaveStatus = 'saved' | 'saving' | 'error' | 'conflict'

export interface ProjectPatch {
  status?: ProjectRecord['status']
  listed?: boolean
  oneLiner?: string
  discipline?: string
  location?: string
  stage?: string
  tags?: string[]
  types?: string[]
  details?: Record<string, unknown>
}

interface RootCtx {
  root: Root
  setRoot: (fn: (r: Root) => Root) => void
  user: User | null
  sponsor: Sponsor | null
  /** False until the first /auth/me call has finished. */
  authReady: boolean
  /** False until projects have been fetched at least once. */
  dataReady: boolean
  /** True when the server was started with demo accounts. */
  demo: boolean
  loginUser: (email: string, password: string) => Promise<void>
  signUpUser: (u: Omit<User, 'id'> & { password: string }) => Promise<void>
  loginSponsor: (email: string, password: string) => Promise<void>
  signUpSponsor: (s: Omit<Sponsor, 'id'> & { password: string }) => Promise<void>
  demoLogin: (kind: 'user' | 'sponsor') => Promise<void>
  logout: () => Promise<void>
  saveAccount: (patch: Record<string, unknown>) => void
  refresh: () => Promise<void>
  createProject: (p: { title: string; tagline: string; discipline: string; location: string; types: string[] }) => Promise<string>
  loadSample: () => Promise<string>
  patchProject: (id: string, patch: ProjectPatch) => Promise<void>
  sendSupport: (projectId: string, body: { kind: 'interest' | 'in-kind'; resourceId?: string; message: string }) => Promise<void>
  decideSupport: (supportId: string, accept: boolean) => Promise<void>
  toggleWatch: (projectId: string, on: boolean) => Promise<void>
  readNotices: () => Promise<void>
  saveStatus: Record<string, SaveStatus>
  scheduleSave: (projectId: string) => void
}

const RootContext = createContext<RootCtx | null>(null)

const DEMO_USER_EMAIL = 'mai@example.org'
const DEMO_SPONSOR_EMAIL = 'grants@alder.example.org'
const DEMO_PASSWORD = 'demo1234'

function upsert(list: ProjectRecord[], p: ProjectRecord): ProjectRecord[] {
  return list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [root, setRootState] = useState<Root>(load)
  const [authReady, setAuthReady] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [demo, setDemo] = useState(false)
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({})

  const rootRef = useRef(root)
  rootRef.current = root

  // Workspace autosave bookkeeping (per project).
  const timers = useRef(new Map<string, number>())
  const inflight = useRef(new Set<string>())
  const dirty = useRef(new Set<string>())
  const versions = useRef(new Map<string, number>())
  const accountTimer = useRef<number | undefined>(undefined)
  const pendingAccount = useRef<Record<string, unknown>>({})

  useEffect(() => {
    try {
      // Server-owned data is not cached locally.
      const { projects: _p, supports: _s, watchlist: _w, notices: _n, ...rest } = root
      localStorage.setItem(KEY, JSON.stringify(rest))
    } catch {
      /* ignore */
    }
  }, [root])

  const setRoot = useCallback((fn: (r: Root) => Root) => setRootState(fn), [])
  const setStatus = (id: string, s: SaveStatus) => setSaveStatus((m) => ({ ...m, [id]: s }))
  const isPending = (id: string) => timers.current.has(id) || inflight.current.has(id) || dirty.current.has(id)

  /* ---------- auth ---------- */

  const applyAuth = useCallback(
    (res: AuthResult) =>
      setRootState((r) => {
        if (!res.kind || !res.account) return { ...r, session: { kind: null, id: '' } }
        if (res.kind === 'user') {
          const acc = res.account as User
          const users = r.users.some((u) => u.id === acc.id) ? r.users.map((u) => (u.id === acc.id ? acc : u)) : [...r.users, acc]
          return { ...r, users, session: { kind: 'user', id: acc.id } }
        }
        const acc = res.account as Sponsor
        const sponsors = r.sponsors.some((s) => s.id === acc.id) ? r.sponsors.map((s) => (s.id === acc.id ? acc : s)) : [...r.sponsors, acc]
        return { ...r, sponsors, session: { kind: 'sponsor', id: acc.id } }
      }),
    [],
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<AuthResult>('/auth/me').catch(() => ({ kind: null, account: null }) as AuthResult),
      api<{ demo: boolean }>('/config').catch(() => ({ demo: false })),
    ]).then(([me, cfg]) => {
      if (cancelled) return
      applyAuth(me)
      setDemo(cfg.demo)
      setAuthReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [applyAuth])

  /* ---------- server data ---------- */

  const refresh = useCallback(async () => {
    const sess = rootRef.current.session
    const none = { projects: [] as ProjectRecord[] }
    const [pub, mine, sup, wl, notes] = await Promise.all([
      api<{ projects: ProjectRecord[] }>('/projects').catch(() => none),
      sess.kind === 'user' ? api<{ projects: ProjectRecord[] }>('/my/projects').catch(() => none) : Promise.resolve(none),
      sess.kind ? api<{ made: Support[]; inbox: Support[] }>('/supports').catch(() => ({ made: [], inbox: [] })) : Promise.resolve({ made: [] as Support[], inbox: [] as Support[] }),
      sess.kind === 'sponsor' ? api<{ watchlist: { projectId: string }[] }>('/watchlist').catch(() => ({ watchlist: [] })) : Promise.resolve({ watchlist: [] as { projectId: string }[] }),
      sess.kind ? api<{ notifications: Notice[] }>('/notifications').catch(() => ({ notifications: [] })) : Promise.resolve({ notifications: [] as Notice[] }),
    ])

    setRootState((r) => {
      const byId = new Map<string, ProjectRecord>()
      for (const p of pub.projects) byId.set(p.id, p)
      for (const p of mine.projects) byId.set(p.id, p)
      for (const [id, p] of byId) {
        if (isPending(id)) {
          // Keep unsaved local workspace edits; take everything else from the server.
          const local = r.projects.find((x) => x.id === id)
          if (local) byId.set(id, { ...p, ws: local.ws, version: p.version })
        } else if (p.version != null) {
          versions.current.set(id, p.version)
        }
      }
      const supports = new Map<string, Support>()
      for (const s of [...sup.made, ...sup.inbox]) supports.set(s.id, s)
      return {
        ...r,
        projects: [...byId.values()],
        supports: [...supports.values()],
        watchlist: wl.watchlist.map((w) => ({ sponsorId: sess.id, projectId: w.projectId })),
        notices: notes.notifications,
      }
    })
    setDataReady(true)
  }, [])

  useEffect(() => {
    if (!authReady) return
    void refresh()
  }, [authReady, root.session.kind, root.session.id, refresh])

  useEffect(() => {
    if (!authReady) return
    const t = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(t)
  }, [authReady, refresh])

  const mergeProject = useCallback((p: ProjectRecord) => {
    if (p.version != null) versions.current.set(p.id, p.version)
    setRootState((r) => ({ ...r, projects: upsert(r.projects, p) }))
  }, [])

  /* ---------- workspace autosave ---------- */

  const flush = useCallback(async (id: string): Promise<void> => {
    if (inflight.current.has(id)) {
      dirty.current.add(id)
      return
    }
    const rec = rootRef.current.projects.find((p) => p.id === id)
    if (!rec) return
    inflight.current.add(id)
    setStatus(id, 'saving')
    let conflict = false
    try {
      const res = await api<{ version: number }>(`/projects/${id}/workspace`, {
        method: 'PUT',
        body: { version: versions.current.get(id) ?? rec.version ?? 1, ws: rec.ws },
      })
      versions.current.set(id, res.version)
      setStatus(id, 'saved')
    } catch (e) {
      conflict = e instanceof ApiError && e.status === 409
      setStatus(id, conflict ? 'conflict' : 'error')
    } finally {
      inflight.current.delete(id)
      if (dirty.current.delete(id) && !conflict) window.setTimeout(() => void flush(id), 0)
    }
  }, [])

  const scheduleSave = useCallback(
    (id: string) => {
      const prev = timers.current.get(id)
      if (prev) window.clearTimeout(prev)
      setStatus(id, 'saving')
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id)
          void flush(id)
        }, 800),
      )
    },
    [flush],
  )

  /* ---------- derived ---------- */

  const user = root.session.kind === 'user' ? (root.users.find((u) => u.id === root.session.id) ?? null) : null
  const sponsor = root.session.kind === 'sponsor' ? (root.sponsors.find((s) => s.id === root.session.id) ?? null) : null

  const value = useMemo<RootCtx>(
    () => ({
      root,
      setRoot,
      user,
      sponsor,
      authReady,
      dataReady,
      demo,
      loginUser: async (email, password) => applyAuth(await api<AuthResult>('/auth/login', { body: { email, password, kind: 'user' } })),
      signUpUser: async (u) => applyAuth(await api<AuthResult>('/auth/register', { body: u })),
      loginSponsor: async (email, password) => applyAuth(await api<AuthResult>('/auth/login', { body: { email, password, kind: 'sponsor' } })),
      signUpSponsor: async (s) => applyAuth(await api<AuthResult>('/auth/sponsor/register', { body: s })),
      demoLogin: async (kind) =>
        applyAuth(
          await api<AuthResult>('/auth/login', {
            body: { email: kind === 'user' ? DEMO_USER_EMAIL : DEMO_SPONSOR_EMAIL, password: DEMO_PASSWORD, kind },
          }),
        ),
      logout: async () => {
        await api('/auth/logout', { method: 'POST', body: {} }).catch(() => undefined)
        applyAuth({ kind: null, account: null })
      },
      saveAccount: (patch) => {
        pendingAccount.current = { ...pendingAccount.current, ...patch }
        window.clearTimeout(accountTimer.current)
        accountTimer.current = window.setTimeout(() => {
          const body = pendingAccount.current
          pendingAccount.current = {}
          api('/account', { method: 'PATCH', body }).catch(() => undefined)
        }, 600)
      },
      refresh,
      createProject: async (p) => {
        const res = await api<{ project: ProjectRecord }>('/projects', { body: p })
        mergeProject(res.project)
        return res.project.id
      },
      loadSample: async () => {
        const res = await api<{ project: ProjectRecord }>('/projects/sample', { method: 'POST', body: {} })
        mergeProject(res.project)
        return res.project.id
      },
      patchProject: async (id, patch) => {
        const res = await api<{ project: ProjectRecord }>(`/projects/${id}`, { method: 'PATCH', body: patch })
        // Keep any unsaved workspace edits; the listing fields come from the server.
        const local = rootRef.current.projects.find((x) => x.id === id)
        mergeProject(local && isPending(id) ? { ...res.project, ws: local.ws } : res.project)
      },
      sendSupport: async (projectId, body) => {
        await api(`/projects/${projectId}/supports`, { body })
        await refresh()
      },
      decideSupport: async (supportId, accept) => {
        await api(`/supports/${supportId}/decide`, { body: { accept } })
        await refresh()
      },
      toggleWatch: async (projectId, on) => {
        await api(`/watchlist/${projectId}`, { method: on ? 'PUT' : 'DELETE', body: on ? {} : undefined })
        await refresh()
      },
      readNotices: async () => {
        await api('/notifications/read', { method: 'POST', body: {} })
        await refresh()
      },
      saveStatus,
      scheduleSave,
    }),
    [root, setRoot, user, sponsor, authReady, dataReady, demo, applyAuth, refresh, mergeProject, saveStatus, scheduleSave],
  )

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

export function useRoot() {
  const ctx = useContext(RootContext)
  if (!ctx) throw new Error('useRoot outside StoreProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/* Project scope: workspace pages keep using useStore() unchanged      */
/* ------------------------------------------------------------------ */

export function viewOf(root: Root, rec: ProjectRecord, user: User | null): State {
  return {
    ...rec.ws,
    user,
    directory: root.directory,
    consents: root.consents,
    licences: root.licences,
    marketIdeas: root.marketIdeas,
    ideaRequests: root.ideaRequests,
    notices: root.notices,
  }
}

function applyView(root: Root, id: string, v: State): Root {
  return {
    ...root,
    projects: root.projects.map((p) =>
      p.id === id
        ? {
            ...p,
            ws: { project: v.project, resources: v.resources, outreach: v.outreach, plan: v.plan, campaign: v.campaign, proposals: v.proposals, trunk: v.trunk },
          }
        : p,
    ),
    directory: v.directory,
    consents: v.consents,
    licences: v.licences,
    marketIdeas: v.marketIdeas,
    ideaRequests: v.ideaRequests,
  }
}

interface ScopeCtx {
  state: State
  update: (fn: (s: State) => State) => void
  projectId: string
  status: SaveStatus
}

const ScopeContext = createContext<ScopeCtx | null>(null)

export function ProjectScope({ children }: { children: ReactNode }) {
  const { id = '' } = useParams()
  const { root, setRoot, user, dataReady, scheduleSave, saveStatus } = useRoot()
  const rec = root.projects.find((p) => p.id === id)

  const update = useCallback(
    (fn: (s: State) => State) => {
      setRoot((r) => {
        const p = r.projects.find((x) => x.id === id)
        if (!p) return r
        return applyView(r, id, fn(viewOf(r, p, r.users.find((u) => u.id === r.session.id) ?? null)))
      })
      scheduleSave(id)
    },
    [id, setRoot, scheduleSave],
  )

  const value = useMemo(
    () => (rec ? { state: viewOf(root, rec, user), update, projectId: id, status: saveStatus[id] ?? 'saved' } : null),
    [root, rec, user, update, id, saveStatus],
  )

  if (!dataReady) return <div className="py-24 text-center text-sm text-ink/50">Loading…</div>
  // Only the project leader may open the workspace.
  if (!value || !rec || rec.ownerId !== user?.id) return <Navigate to="/my-projects" replace />
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}

export function useStore() {
  const ctx = useContext(ScopeContext)
  if (!ctx) throw new Error('useStore outside ProjectScope')
  return ctx
}

/** Builds paths inside the current project workspace, e.g. p('resources'). */
export function useProjectPath() {
  const { projectId } = useStore()
  return useCallback((sub = 'overview') => `/my-projects/${projectId}/${sub}`, [projectId])
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Prepend a local notification (workspace pages use this; the bell shows server notifications). */
export function notify<T extends { notices: Notice[] }>(s: T, text: string): T {
  return { ...s, notices: [{ id: uid(), text, date: today(), read: false }, ...s.notices] }
}

/** Budget derived from Resource Mapping plus the plan's own lines. */
export function budgetOf(s: { resources: Resource[]; plan: Plan }) {
  const lines = [
    ...s.resources.filter((r) => r.type !== 'Funding').map((r) => ({ label: r.name, amount: r.budget })),
    ...s.plan.extraLines.map((l) => ({ label: l.label, amount: l.amount })),
  ]
  const total = lines.reduce((a, l) => a + l.amount, 0)
  const funded = s.resources.filter((r) => r.type === 'Funding').reduce((a, r) => a + r.funded, 0)
  return { lines, total, funded, gap: Math.max(0, total - funded) }
}
