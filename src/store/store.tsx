import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { emptyWorkspace, rootSeed } from './rootSeed'
import { demoUser } from './seed'
import type { Notice, ProjectRecord, Resource, Plan, Root, Sponsor, State, User } from './types'

const KEY = 'conceptbridge-demo-v3'
export const CROWD_COMMISSION = 5
export const LICENCE_COMMISSION = 10

export const uid = () => Math.random().toString(36).slice(2, 9)
export const today = () => new Date().toISOString().slice(0, 10)
export const money = (n: number) => `$${n.toLocaleString('en-US')}`

function load(): Root {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...structuredClone(rootSeed), ...(JSON.parse(raw) as Partial<Root>) }
  } catch {
    /* ignore */
  }
  return structuredClone(rootSeed)
}

/* ------------------------------------------------------------------ */
/* Root store: accounts, sessions, all projects                        */
/* ------------------------------------------------------------------ */

interface RootCtx {
  root: Root
  setRoot: (fn: (r: Root) => Root) => void
  reset: () => void
  user: User | null
  sponsor: Sponsor | null
  loginUser: (id: string) => void
  loginGoogle: () => void
  signUpUser: (u: Omit<User, 'id'>) => void
  loginSponsor: (id: string) => void
  signUpSponsor: (s: Omit<Sponsor, 'id'>) => void
  logout: () => void
  createProject: (p: { title: string; tagline: string; discipline: string; location: string }) => string
  loadSample: () => string
}

const RootContext = createContext<RootCtx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [root, setRootState] = useState<Root>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(root))
    } catch {
      /* ignore */
    }
  }, [root])

  const setRoot = useCallback((fn: (r: Root) => Root) => setRootState(fn), [])
  // Reset restores seed data but keeps who is signed in (if they still exist).
  const reset = useCallback(
    () =>
      setRootState((r) => {
        const fresh = structuredClone(rootSeed)
        const keepUsers = r.users.filter((u) => !fresh.users.some((f) => f.id === u.id))
        const keepSponsors = r.sponsors.filter((s) => !fresh.sponsors.some((f) => f.id === s.id))
        return { ...fresh, users: [...fresh.users, ...keepUsers], sponsors: [...fresh.sponsors, ...keepSponsors], session: r.session }
      }),
    [],
  )

  const user = root.session.kind === 'user' ? (root.users.find((u) => u.id === root.session.id) ?? null) : null
  const sponsor = root.session.kind === 'sponsor' ? (root.sponsors.find((s) => s.id === root.session.id) ?? null) : null

  const value = useMemo<RootCtx>(
    () => ({
      root,
      setRoot,
      reset,
      user,
      sponsor,
      loginUser: (id) => setRoot((r) => ({ ...r, session: { kind: 'user', id } })),
      loginGoogle: () =>
        setRoot((r) => {
          const email = 'alex.rivera@gmail.com'
          const existing = r.users.find((u) => u.email === email)
          if (existing) return { ...r, session: { kind: 'user', id: existing.id } }
          const u: User = {
            id: uid(), name: 'Alex Rivera', email, role: 'Artist', discipline: '', location: '', bio: '',
            goals: [], portfolio: [],
          }
          return { ...r, users: [...r.users, u], session: { kind: 'user', id: u.id } }
        }),
      signUpUser: (u) =>
        setRoot((r) => {
          const nu: User = { ...u, id: uid() }
          return { ...r, users: [...r.users, nu], session: { kind: 'user', id: nu.id } }
        }),
      loginSponsor: (id) => setRoot((r) => ({ ...r, session: { kind: 'sponsor', id } })),
      signUpSponsor: (s) =>
        setRoot((r) => {
          const ns: Sponsor = { ...s, id: uid() }
          return { ...r, sponsors: [...r.sponsors, ns], session: { kind: 'sponsor', id: ns.id } }
        }),
      logout: () => setRoot((r) => ({ ...r, session: { kind: null, id: '' } })),
      createProject: ({ title, tagline, discipline, location }) => {
        const id = uid()
        setRoot((r) => {
          const owner = r.users.find((u) => u.id === r.session.id)
          if (!owner) return r
          const rec: ProjectRecord = {
            id, ownerId: owner.id, status: 'Seeking support', listed: false, oneLiner: tagline, discipline, location,
            stage: 'Concept', tags: [], updates: [],
            ws: emptyWorkspace({ title, tagline, concept: tagline, owner: { name: owner.name, discipline: owner.discipline } }),
          }
          return { ...r, projects: [rec, ...r.projects] }
        })
        return id
      },
      loadSample: () => {
        const id = uid()
        setRoot((r) => {
          const owner = r.users.find((u) => u.id === r.session.id)
          const src = rootSeed.projects[0]
          if (!owner) return r
          const ws = JSON.parse(JSON.stringify(src.ws).split(demoUser.name).join(owner.name)) as ProjectRecord['ws']
          return { ...r, projects: [{ ...structuredClone(src), id, ownerId: owner.id, ws }, ...r.projects] }
        })
        return id
      },
    }),
    [root, setRoot, reset, user, sponsor],
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
    notices: v.notices,
  }
}

interface ScopeCtx {
  state: State
  update: (fn: (s: State) => State) => void
  projectId: string
}

const ScopeContext = createContext<ScopeCtx | null>(null)

export function ProjectScope({ children }: { children: ReactNode }) {
  const { id = '' } = useParams()
  const { root, setRoot, user } = useRoot()
  const rec = root.projects.find((p) => p.id === id)

  const update = useCallback(
    (fn: (s: State) => State) =>
      setRoot((r) => {
        const p = r.projects.find((x) => x.id === id)
        if (!p) return r
        return applyView(r, id, fn(viewOf(r, p, r.users.find((u) => u.id === r.session.id) ?? null)))
      }),
    [id, setRoot],
  )

  const value = useMemo(() => (rec ? { state: viewOf(root, rec, user), update, projectId: id } : null), [root, rec, user, update, id])

  // Only the owner may open a project's workspace.
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

/** Prepend a notification. */
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
