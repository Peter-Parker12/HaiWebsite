import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip, PageHeader } from '../components/ui'
import { budgetOf, money, useStore, useProjectPath } from '../store/store'
import type { ResStatus } from '../store/types'

const STATUSES: ResStatus[] = ['Missing', 'Contacted', 'Secured', 'Partially funded', 'Unavailable']

export default function Resources() {
  const pp = useProjectPath()
  const { state, update } = useStore()
  const { resources, outreach, directory } = state
  const b = budgetOf(state)
  const gaps = resources.filter((r) => r.status === 'Missing' || r.status === 'Partially funded').length

  return (
    <>
      <PageHeader
        step="02 · Resource Mapping"
        title="Identify what's missing"
        desc="Skills, budget, venues, partners and expertise needed to move from concept to implementation."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Open gaps</div>
          <div className="mt-1 text-3xl font-semibold">{gaps}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Estimated budget</div>
          <div className="mt-1 text-3xl font-semibold">{money(b.total)}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-ink/50">Funding gap</div>
          <div className="mt-1 text-3xl font-semibold text-terra-600">{money(b.gap)}</div>
        </div>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cloth-200 bg-cloth-50 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Estimate</th>
              <th className="px-4 py-3">Matched via outreach</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const linked = outreach.filter((o) => o.resourceId === r.id)
              return (
                <tr key={r.id} className="border-b border-cloth-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-ink/60">{r.type}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-full border-0 bg-transparent text-xs font-medium"
                      value={r.status}
                      onChange={(e) =>
                        update((s) => ({ ...s, resources: s.resources.map((x) => (x.id === r.id ? { ...x, status: e.target.value as ResStatus } : x)) }))
                      }
                      aria-label={`Status for ${r.name}`}
                    >
                      {STATUSES.map((st) => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Chip>{r.status}</Chip>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.type === 'Funding' ? `${money(r.funded)} of ${money(r.budget)}` : money(r.budget)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/60">
                    {linked.length === 0
                      ? '—'
                      : linked.map((o) => (
                          <div key={o.id}>
                            {directory.find((d) => d.id === o.entryId)?.name} · <Chip>{o.status}</Chip>
                          </div>
                        ))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== 'Secured' && (
                      <Link to={`${pp('discover')}?resource=${r.id}`} className="btn-ghost">
                        <Search size={14} /> Find match
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink/50">
        This list feeds Discover & Match and the budget in Project Activation — nothing needs to be re-entered.
      </p>
    </>
  )
}
