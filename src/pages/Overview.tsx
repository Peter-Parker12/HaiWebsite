import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip, ProgressBar } from '../components/ui'
import { budgetOf, money, notify, today, useProjectPath, useRoot, useStore } from '../store/store'
import type { ProjectStatus } from '../store/types'

const STATUSES: ProjectStatus[] = ['Seeking support', 'Running', 'Closed']

export default function Overview() {
  const { state, projectId } = useStore()
  const pp = useProjectPath()
  const { root, setRoot } = useRoot()
  const rec = root.projects.find((p) => p.id === projectId)
  if (!rec) return null

  const { project, resources, plan } = state
  const b = budgetOf(state)
  const secured = resources.filter((r) => r.status === 'Secured').length
  const missing = resources.filter((r) => r.status === 'Missing').length
  const done = plan.tasks.filter((t) => t.status === 'Done').length
  const patch = (p: Partial<typeof rec>) =>
    setRoot((r) => ({ ...r, projects: r.projects.map((x) => (x.id === projectId ? { ...x, ...p } : x)) }))

  const inbox = root.supports.filter((s) => s.projectId === projectId)
  const who = (s: (typeof inbox)[number]) =>
    s.byKind === 'sponsor' ? root.sponsors.find((x) => x.id === s.byId)?.name : root.users.find((x) => x.id === s.byId)?.name

  const decide = (id: string, accept: boolean) =>
    setRoot((r) => {
      const s = r.supports.find((x) => x.id === id)
      if (!s) return r
      const name = (s.byKind === 'sponsor' ? r.sponsors.find((x) => x.id === s.byId)?.name : r.users.find((x) => x.id === s.byId)?.name) ?? 'Supporter'
      const next = {
        ...r,
        supports: r.supports.map((x) => (x.id === id ? { ...x, status: accept ? ('Accepted' as const) : ('Declined' as const) } : x)),
        projects: r.projects.map((p) => {
          if (p.id !== projectId) return p
          const resources = p.ws.resources.map((res) => (accept && s.kind === 'in-kind' && res.id === s.resourceId ? { ...res, status: 'Secured' as const } : res))
          const updates = accept ? [{ date: today(), text: `${name} is now supporting the project.` }, ...p.updates] : p.updates
          return { ...p, updates, ws: { ...p.ws, resources } }
        }),
      }
      return notify(next, accept ? `${name} is now supporting "${project.title}"` : `Request from ${name} declined`)
    })

  const steps = [
    { label: 'Develop', done: project.directionAgreed, to: pp('idea-lab'), text: project.directionAgreed ? 'Direction agreed' : 'Agree project direction' },
    { label: 'Discover', done: missing === 0, to: pp('resources'), text: `${missing} resource gap${missing === 1 ? '' : 's'} open` },
    { label: 'Activate', done: plan.generated, to: pp('activation'), text: plan.generated ? `${done}/${plan.tasks.length} tasks done` : 'Generate project plan' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold">Public listing</h2>
          <p className="text-sm text-ink/60">This is what sponsors see on the Home directory.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Status</label>
              <select className="input" value={rec.status} onChange={(e) => patch({ status: e.target.value as ProjectStatus })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={rec.listed} onChange={(e) => patch({ listed: e.target.checked })} />
                Listed on Home
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="label">One-line pitch</label>
              <input className="input" value={rec.oneLiner} onChange={(e) => patch({ oneLiner: e.target.value })} />
            </div>
            <div>
              <label className="label">Discipline</label>
              <input className="input" value={rec.discipline} onChange={(e) => patch({ discipline: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={rec.location} onChange={(e) => patch({ location: e.target.value })} />
            </div>
            <div>
              <label className="label">Stage</label>
              <input className="input" value={rec.stage} onChange={(e) => patch({ stage: e.target.value })} />
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                className="input"
                defaultValue={rec.tags.join(', ')}
                onBlur={(e) => patch({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="text-xs uppercase tracking-wide text-ink/50">Resources secured</div>
            <div className="mt-1 text-3xl font-extrabold">{secured}/{resources.length}</div>
            <ProgressBar value={secured} max={resources.length} />
          </div>
          <div className="card">
            <div className="text-xs uppercase tracking-wide text-ink/50">Funding gap</div>
            <div className="mt-1 text-3xl font-extrabold">{money(b.gap)}</div>
            <ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Support requests</h2>
        {inbox.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No requests yet. Once your project is listed, sponsors can reach out here.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inbox.map((s) => {
              const res = resources.find((r) => r.id === s.resourceId)
              return (
                <li key={s.id} className="rounded-lg border border-cloth-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">{who(s)}</span>
                      <span className="ml-2 text-xs text-ink/50">
                        {s.byKind === 'sponsor' ? 'Sponsor' : 'Creator'} · {s.kind === 'in-kind' ? `in-kind${res ? `: ${res.name}` : ''}` : 'interest'} · {s.date}
                      </span>
                    </div>
                    <Chip tone={s.status === 'Accepted' ? 'Supporting' : s.status}>{s.status === 'Accepted' ? 'Supporting' : s.status}</Chip>
                  </div>
                  <p className="mt-1 text-ink/70">{s.message}</p>
                  {s.status === 'Requested' && (
                    <div className="mt-2 flex gap-2">
                      <button className="btn-primary !py-1" onClick={() => decide(s.id, true)}><Check size={14} /> Accept</button>
                      <button className="btn-ghost !py-1" onClick={() => decide(s.id, false)}><X size={14} /> Decline</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <Link key={s.label} to={s.to} className="card hover:border-terra-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">{s.label}</span>
              <Chip tone={s.done ? 'Done' : 'In progress'}>{s.done ? 'Done' : 'In progress'}</Chip>
            </div>
            <div className="mt-2 text-sm">{s.text}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
