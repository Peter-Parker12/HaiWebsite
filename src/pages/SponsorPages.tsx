import { Link } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard'
import { Chip, Page, PageHeader } from '../components/ui'
import { useRoot } from '../store/store'
import type { Sponsor, SponsorType } from '../store/types'

export function SponsorInvestments() {
  const { root, sponsor } = useRoot()
  if (!sponsor) return null
  const mine = root.supports.filter((s) => s.byKind === 'sponsor' && s.byId === sponsor.id)
  const accepted = mine.filter((s) => s.status === 'Accepted')
  const other = mine.filter((s) => s.status !== 'Accepted')
  const groups = [
    ['Running', accepted.filter((s) => root.projects.find((p) => p.id === s.projectId)?.status !== 'Closed')],
    ['Closed', accepted.filter((s) => root.projects.find((p) => p.id === s.projectId)?.status === 'Closed')],
  ] as const

  return (
    <Page>
      <PageHeader step="My investments" title="Projects you support" desc="Projects whose creators accepted your support, and requests still waiting for an answer." />

      {accepted.length === 0 && <div className="card mb-6 text-sm text-ink/70">No accepted support yet. <Link to="/" className="underline">Browse projects</Link>.</div>}

      {groups.map(([label, list]) =>
        list.length === 0 ? null : (
          <section key={label} className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{label === 'Running' ? 'Active' : 'Completed'} <span className="text-sm font-normal text-ink/50">({list.length})</span></h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((s) => {
                const rec = root.projects.find((p) => p.id === s.projectId)!
                const res = rec.ws.resources.find((r) => r.id === s.resourceId)
                return (
                  <div key={s.id}>
                    <ProjectCard rec={rec} />
                    <div className="mt-1 px-1 text-xs text-ink/60">
                      <Chip tone="Supporting">Supporting</Chip> {s.kind === 'in-kind' ? `In-kind${res ? `: ${res.name}` : ''}` : 'Interest accepted'} · since {s.date}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ),
      )}

      {other.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Requests</h2>
          <div className="card divide-y divide-cloth-100 !p-0">
            {other.map((s) => {
              const rec = root.projects.find((p) => p.id === s.projectId)
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div>
                    <Link to={`/projects/${s.projectId}`} className="font-semibold hover:underline">{rec?.ws.project.title}</Link>
                    <div className="text-xs text-ink/50">{s.kind === 'in-kind' ? 'In-kind offer' : 'Interest'} · {s.date}</div>
                  </div>
                  <Chip>{s.status}</Chip>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </Page>
  )
}

export function SponsorWatchlist() {
  const { root, setRoot, sponsor } = useRoot()
  if (!sponsor) return null
  const recs = root.watchlist
    .filter((w) => w.sponsorId === sponsor.id)
    .map((w) => root.projects.find((p) => p.id === w.projectId))
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <Page>
      <PageHeader step="Watchlist" title="Projects you are watching" desc="Saved projects to revisit before you decide." />
      {recs.length === 0 ? (
        <div className="card text-sm text-ink/70">Nothing saved yet. Open a project and choose "Save to watchlist".</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recs.map((p) => (
            <div key={p.id}>
              <ProjectCard rec={p} />
              <button
                className="mt-1 px-1 text-xs text-ink/60 underline"
                onClick={() => setRoot((r) => ({ ...r, watchlist: r.watchlist.filter((w) => !(w.sponsorId === sponsor.id && w.projectId === p.id)) }))}
              >
                Remove from watchlist
              </button>
            </div>
          ))}
        </div>
      )}
    </Page>
  )
}

export function SponsorAccount() {
  const { setRoot, sponsor } = useRoot()
  if (!sponsor) return null
  const patch = (p: Partial<Sponsor>) => setRoot((r) => ({ ...r, sponsors: r.sponsors.map((s) => (s.id === sponsor.id ? { ...s, ...p } : s)) }))
  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)

  return (
    <Page>
      <PageHeader step="Account" title="Sponsor profile" desc="Creators see this when you reach out to their project." />
      <div className="card max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name or organisation</label>
            <input className="input" value={sponsor.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={sponsor.type} onChange={(e) => patch({ type: e.target.value as SponsorType })}>
              <option>Foundation</option>
              <option>Company</option>
              <option>Individual</option>
            </select>
          </div>
          <div>
            <label className="label">Areas you support</label>
            <input className="input" defaultValue={sponsor.focus.join(', ')} onBlur={(e) => patch({ focus: list(e.target.value) })} />
          </div>
          <div>
            <label className="label">Regions</label>
            <input className="input" defaultValue={sponsor.regions.join(', ')} onBlur={(e) => patch({ regions: list(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Typical support</label>
            <input className="input" value={sponsor.ticket} onChange={(e) => patch({ ticket: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">About</label>
            <textarea className="input h-24" value={sponsor.bio} onChange={(e) => patch({ bio: e.target.value })} />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/50">Signed in as {sponsor.email}</p>
      </div>
    </Page>
  )
}
