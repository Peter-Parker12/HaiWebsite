import { Link } from 'react-router-dom'
import { Chip, PageHeader, ProgressBar } from '../components/ui'
import { budgetOf, money, useStore } from '../store/store'

export default function Dashboard() {
  const { state } = useStore()
  const { project, resources, outreach, plan, trunk } = state
  const secured = resources.filter((r) => r.status === 'Secured').length
  const missing = resources.filter((r) => r.status === 'Missing').length
  const done = plan.tasks.filter((t) => t.status === 'Done').length
  const b = budgetOf(state)

  const steps = [
    { label: 'Develop', done: project.directionAgreed, to: '/idea-lab', text: project.directionAgreed ? 'Direction agreed' : 'Agree project direction' },
    { label: 'Discover', done: missing === 0, to: '/resources', text: `${missing} resource gap${missing === 1 ? '' : 's'} open` },
    { label: 'Activate', done: plan.generated, to: '/activation', text: plan.generated ? `${done}/${plan.tasks.length} tasks done` : 'Generate project plan' },
    { label: 'Preserve', done: trunk.length > 1, to: '/trunk', text: `${trunk.length} concept${trunk.length === 1 ? '' : 's'} in Trunk` },
  ]

  return (
    <>
      <PageHeader step="My Dashboard" title="Welcome back, Mai" desc="Your projects, tasks and notifications in one place." />

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="text-sm text-ink/60">{project.tagline}</p>
          </div>
          <div className="flex -space-x-2">
            {project.collaborators.map((c) => (
              <div
                key={c.id}
                title={`${c.name} · ${c.role}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo2-600 text-xs text-white"
              >
                {c.name.split(' ').map((p) => p[0]).join('')}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {steps.map((s) => (
            <Link key={s.label} to={s.to} className="rounded-lg border border-cloth-200 p-3 hover:border-terra-400">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">{s.label}</span>
                <Chip tone={s.done ? 'Done' : 'In progress'}>{s.done ? 'Done' : 'In progress'}</Chip>
              </div>
              <div className="mt-2 text-sm">{s.text}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Resources secured</div>
          <div className="mt-1 text-3xl font-semibold">{secured}/{resources.length}</div>
          <ProgressBar value={secured} max={resources.length} />
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Funding gap</div>
          <div className="mt-1 text-3xl font-semibold">{money(b.gap)}</div>
          <ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" />
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Outreach</div>
          <div className="mt-1 text-3xl font-semibold">{outreach.length}</div>
          <div className="text-sm text-ink/60">
            {outreach.filter((o) => o.status === 'Requested').length} awaiting response
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold">Upcoming tasks</h3>
          {plan.tasks.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">
              No tasks yet. <Link to="/activation" className="text-indigo2-600 underline">Generate a project plan</Link>.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {plan.tasks.filter((t) => t.status !== 'Done').slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.title}</span>
                  <Chip>{t.status}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <ul className="mt-3 space-y-2">
            {state.notices.slice(0, 6).map((n) => (
              <li key={n.id} className="text-sm">
                {n.text} <span className="text-xs text-ink/40">{n.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
