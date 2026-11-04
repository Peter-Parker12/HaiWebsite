import { ShieldAlert, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Chip, Modal, Page, PageHeader } from '../components/ui'
import { typeById } from '../store/projectTypes'
import { useRoot } from '../store/store'

interface Row {
  id: string
  title: string
  types: string[]
  status: string
  listed: boolean
  removed: boolean
  removedReason: string
  ownerName: string
  ownerEmail: string
  updated: string
  openReports: number
}
interface Report { id: string; projectId: string; title: string; reason: string; details: string; date: string; reporter: string }
interface LogRow { id: string; actor: string; action: string; projectId: string; title: string; reason: string; at: string }
interface Member { id: string; name: string; email: string; role: 'admin' | 'ops' }

type Tab = 'projects' | 'reports' | 'log' | 'team'

export default function Moderation() {
  const { user, refresh } = useRoot()
  const isAdmin = user?.staffRole === 'admin'
  const [tab, setTab] = useState<Tab>('projects')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'listed' | 'removed' | 'reported'>('all')
  const [rows, setRows] = useState<Row[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [log, setLog] = useState<LogRow[]>([])
  const [team, setTeam] = useState<Member[]>([])
  const [opsEmail, setOpsEmail] = useState('')
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      if (tab === 'projects') setRows((await api<{ projects: Row[] }>(`/staff/projects?q=${encodeURIComponent(q)}&filter=${filter}`)).projects)
      if (tab === 'reports') setReports((await api<{ reports: Report[] }>('/staff/reports')).reports)
      if (tab === 'log') setLog((await api<{ log: LogRow[] }>('/staff/log')).log)
      if (tab === 'team' && isAdmin) setTeam((await api<{ team: Member[] }>('/staff/team')).team)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }, [tab, q, filter, isAdmin])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), q ? 250 : 0)
    return () => window.clearTimeout(t)
  }, [load, q])

  const act = async (fn: () => Promise<unknown>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      await Promise.all([load(), refresh()])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const remove = () =>
    act(async () => {
      if (!target) return
      await api(`/staff/projects/${target.id}/remove`, { body: { reason } })
      setTarget(null)
      setReason('')
    })

  return (
    <Page wide>
      <PageHeader step="Staff" title="Moderation" desc="Review published projects and remove anything inappropriate. Removed projects are hidden from Home and the owner is told why." />

      <div className="mb-4 flex flex-wrap gap-2">
        {([['projects', 'Projects'], ['reports', 'Reports'], ['log', 'Activity log'], ...(isAdmin ? [['team', 'Team']] : [])] as [Tab, string][]).map(([k, label]) => (
          <button key={k} className={tab === k ? 'btn-primary !py-1.5' : 'btn-ghost !py-1.5'} onClick={() => { setErr(''); setTab(k) }}>{label}</button>
        ))}
      </div>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      {tab === 'projects' && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="input !w-72" placeholder="Search title, owner or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input !w-48" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">All projects</option>
              <option value="listed">Listed on Home</option>
              <option value="reported">Has open reports</option>
              <option value="removed">Removed</option>
            </select>
          </div>
          <div className="card overflow-x-auto !p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-cloth-200 bg-cloth-100 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No projects match.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-cloth-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${r.id}`} className="font-semibold hover:underline">{r.title}</Link>
                      <div className="text-xs text-ink/50">{r.types.map((t) => typeById(t)?.label ?? t).join(' + ')}</div>
                    </td>
                    <td className="px-4 py-3">{r.ownerName}<div className="text-xs text-ink/50">{r.ownerEmail}</div></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.removed ? <Chip tone="Declined">Removed</Chip> : r.listed ? <Chip tone="Done">Listed</Chip> : <Chip tone="To do">Draft</Chip>}
                        {r.openReports > 0 && <Chip tone="Missing">{r.openReports} report{r.openReports > 1 ? 's' : ''}</Chip>}
                      </div>
                      {r.removed && r.removedReason && <div className="mt-1 max-w-xs text-xs text-ink/50">{r.removedReason}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{r.updated}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {r.removed ? (
                          <button className="btn-ghost !py-1" disabled={busy} onClick={() => void act(() => api(`/staff/projects/${r.id}/restore`, { body: {} }))}>Restore</button>
                        ) : (
                          <button className="btn-ghost !border-red-300 !py-1 !text-red-800" onClick={() => { setErr(''); setReason(''); setTarget({ id: r.id, title: r.title }) }}>
                            <ShieldAlert size={14} /> Remove
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn-ghost !py-1"
                            title="Delete permanently"
                            disabled={busy}
                            onClick={() => confirm(`Permanently delete "${r.title}"? This cannot be undone.`) && void act(() => api(`/staff/projects/${r.id}`, { method: 'DELETE' }))}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <div className="card text-sm text-ink/60">No open reports.</div>}
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link to={`/projects/${r.projectId}`} className="text-lg font-bold hover:underline">{r.title}</Link>
                  <div className="text-xs text-ink/50">Reported by {r.reporter} · {r.date}</div>
                </div>
                <Chip tone="Missing">{r.reason}</Chip>
              </div>
              {r.details && <p className="mt-2 text-sm text-ink/70">{r.details}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-accent !py-1" onClick={() => { setErr(''); setReason(''); setTarget({ id: r.projectId, title: r.title }) }}>Remove project</button>
                <button className="btn-ghost !py-1" disabled={busy} onClick={() => void act(() => api(`/staff/reports/${r.id}/dismiss`, { body: {} }))}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <tbody>
              {log.length === 0 && <tr><td className="px-4 py-6 text-center text-ink/50">Nothing yet.</td></tr>}
              {log.map((l) => (
                <tr key={l.id} className="border-b border-cloth-100 last:border-0">
                  <td className="px-4 py-3 text-ink/50">{l.at}</td>
                  <td className="px-4 py-3"><strong>{l.actor}</strong> {l.action} <span className="font-medium">{l.title}</span>{l.reason && <span className="text-ink/60"> — {l.reason}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'team' && isAdmin && (
        <div className="max-w-2xl space-y-4">
          <div className="card">
            <h2 className="text-lg font-bold">Moderation team</h2>
            <ul className="mt-3 divide-y divide-cloth-100">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{m.name} <span className="text-xs text-ink/50">{m.email}</span></span>
                  <span className="flex items-center gap-2">
                    <Chip tone={m.role === 'admin' ? 'Owner' : 'Editor'}>{m.role === 'admin' ? 'Admin' : 'Ops'}</Chip>
                    {m.role === 'ops' && <button className="text-xs underline" onClick={() => void act(() => api(`/staff/team/${m.id}`, { method: 'DELETE' }))}>Remove</button>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <form
            className="card flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!opsEmail.trim()) return
              void act(async () => {
                await api('/staff/team', { body: { email: opsEmail } })
                setOpsEmail('')
              })
            }}
          >
            <input className="input" type="email" placeholder="Email of an existing creator account" value={opsEmail} onChange={(e) => setOpsEmail(e.target.value)} />
            <button className="btn-primary" disabled={busy}>Add to ops</button>
          </form>
        </div>
      )}

      {target && (
        <Modal title={`Remove "${target.title}"`} onClose={() => setTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-ink/70">The project is hidden from Home immediately and the owner is notified with your reason. You can restore it later.</p>
            <textarea className="input h-24" placeholder="Reason shown to the owner" value={reason} onChange={(e) => setReason(e.target.value)} />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-accent w-full" disabled={busy || reason.trim().length < 5} onClick={() => void remove()}>Remove project</button>
          </div>
        </Modal>
      )}
    </Page>
  )
}
