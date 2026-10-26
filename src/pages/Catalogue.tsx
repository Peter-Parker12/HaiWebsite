import { Link } from 'react-router-dom'
import { Chip, Page, PageHeader } from '../components/ui'
import { useRoot } from '../store/store'

export default function Catalogue() {
  const { root, user } = useRoot()
  if (!user) return null

  const rows = root.projects
    .filter((p) => p.ownerId !== user.id)
    .flatMap((p) => {
      const out: { key: string; rec: typeof p; how: string; status: string }[] = []
      const col = p.ws.project.collaborators.find((c) => c.name === user.name && c.role !== 'Owner')
      if (col) out.push({ key: `${p.id}-col`, rec: p, how: `Team member · ${col.role}`, status: p.status })
      for (const s of root.supports.filter((x) => x.projectId === p.id && x.byKind === 'user' && x.byId === user.id)) {
        out.push({
          key: s.id, rec: p,
          how: s.kind === 'in-kind' ? 'In-kind offer' : 'Interest sent',
          status: s.status === 'Accepted' ? 'Supporting' : s.status,
        })
      }
      return out
    })

  return (
    <Page>
      <PageHeader
        step="My Catalogue"
        title="Projects you support or work on"
        desc="Other people's projects where you are on the team or have offered help."
      />
      {rows.length === 0 ? (
        <div className="card text-sm text-ink/70">
          Nothing here yet. <Link to="/" className="underline">Browse projects</Link> and offer your help.
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cloth-200 bg-cloth-100 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Your involvement</th>
                <th className="px-4 py-3">Your status</th>
                <th className="px-4 py-3">Project status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-cloth-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${r.rec.id}`} className="font-semibold hover:underline">{r.rec.ws.project.title}</Link>
                    <div className="text-xs text-ink/50">{r.rec.location} · {r.rec.discipline}</div>
                  </td>
                  <td className="px-4 py-3">{r.how}</td>
                  <td className="px-4 py-3">{r.how.startsWith('Team') ? <Chip tone="Collaborator">Member</Chip> : <Chip>{r.status}</Chip>}</td>
                  <td className="px-4 py-3"><Chip>{r.rec.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  )
}
