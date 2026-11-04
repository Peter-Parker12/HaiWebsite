import { ArrowLeft, Bookmark, BookmarkCheck, Flag, HandHeart, MessageSquare, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { NEED_LABEL } from '../components/ProjectCard'
import { Chip, Modal, Page, ProgressBar } from '../components/ui'
import { fieldsFor, typeById, type FieldDef } from '../store/projectTypes'
import { api } from '../api'
import { budgetOf, money, useRoot } from '../store/store'
import type { ProjectRecord } from '../store/types'

function show(fld: FieldDef, v: unknown): string {
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'number') return `${v.toLocaleString('en-US')}${fld.unit ? ` ${fld.unit}` : ''}`
  return String(v)
}

export default function ProjectDetail() {
  const { id } = useParams()
  const loc = useLocation()
  const { root, user, sponsor, dataReady, sendSupport, toggleWatch, refresh } = useRoot()
  const fromRoot = root.projects.find((p) => p.id === id)
  const [fetched, setFetched] = useState<ProjectRecord | null>(null)
  const rec = fromRoot ?? fetched ?? undefined
  const [modal, setModal] = useState<null | 'interest' | 'in-kind'>(null)
  const [message, setMessage] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [mod, setMod] = useState<null | 'report' | 'remove'>(null)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [note, setNote] = useState('')
  const isStaff = !!user?.staffRole

  // Removed projects are not in the public list; owners and staff can still open them.
  useEffect(() => {
    if (!dataReady || !id || fromRoot) return
    api<{ project: ProjectRecord }>(`/projects/${id}`).then((r) => setFetched(r.project)).catch(() => setFetched(null))
  }, [dataReady, id, fromRoot])

  if (!dataReady) {
    return <Page><p className="text-sm text-ink/50">Loading…</p></Page>
  }
  if (!rec) {
    return (
      <Page>
        <Link to="/" className="text-sm underline">← Back to projects</Link>
        <p className="mt-4">This project was not found.</p>
      </Page>
    )
  }

  const ws = rec.ws
  const b = budgetOf(ws)
  const isOwner = user?.id === rec.ownerId
  const byKind = sponsor ? 'sponsor' : 'user'
  const byId = sponsor?.id ?? user?.id ?? ''
  const mine = root.supports.filter((s) => s.projectId === rec.id && s.byKind === byKind && s.byId === byId)
  const watching = !!sponsor && root.watchlist.some((w) => w.sponsorId === sponsor.id && w.projectId === rec.id)
  const open = ws.resources.filter((r) => r.status !== 'Secured')
  const concept = ws.project.concept.split('\n').filter(Boolean)
  const detailFields = fieldsFor(rec.types).filter((fld) => rec.details[fld.key] !== undefined && rec.details[fld.key] !== '')

  const moderate = async () => {
    setErr('')
    setBusy(true)
    try {
      if (mod === 'report') {
        await api(`/projects/${rec.id}/report`, { body: { reason, details } })
        setNote('Thank you. Staff will review this project.')
      } else {
        await api(`/staff/projects/${rec.id}/remove`, { body: { reason: details } })
        setNote('Project removed.')
        setFetched(null)
        await refresh()
      }
      setMod(null)
      setReason('')
      setDetails('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const restore = async () => {
    try {
      await api(`/staff/projects/${rec.id}/restore`, { method: 'POST', body: {} })
      setNote('Project restored. The owner can list it again.')
      setFetched(null)
      await refresh()
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  const send = async () => {
    if (!modal) return
    setErr('')
    setBusy(true)
    try {
      await sendSupport(rec.id, { kind: modal, message, resourceId: modal === 'in-kind' ? resourceId : undefined })
      setModal(null)
      setMessage('')
      setResourceId('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:underline">
        <ArrowLeft size={14} /> All projects
      </Link>

      {rec.removed && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <span>
            <ShieldAlert size={16} className="mr-1 inline" /> This project was removed by moderators.
            {rec.removedReason && <> Reason: {rec.removedReason}</>}
          </span>
          {isStaff && <button className="btn-ghost !py-1" onClick={() => void restore()}>Restore project</button>}
        </div>
      )}
      {note && <p className="mt-3 text-sm text-moss-700">{note}</p>}

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{rec.status}</Chip>
              {rec.types.map((t) => (
                <span key={t} className="rounded bg-cloth-100 px-2 py-0.5 text-xs font-semibold text-terra-600">{typeById(t)?.label ?? t}</span>
              ))}
              <span className="text-sm text-ink/60">{rec.discipline} · {rec.location} · {rec.stage}</span>
            </div>
            <h1 className="mt-2 text-4xl font-extrabold">{ws.project.title}</h1>
            <p className="mt-2 text-lg text-ink/70">{rec.oneLiner}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {rec.tags.map((t) => <span key={t} className="rounded bg-cloth-100 px-2 py-0.5 text-xs">{t}</span>)}
            </div>
          </div>

          <section className="card">
            <h2 className="text-xl font-bold">About the project</h2>
            {concept.map((c, i) => <p key={i} className="mt-2 text-sm text-ink/80">{c}</p>)}
            {ws.project.mood.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ws.project.mood.map((m) => (
                  <div key={m.id} className="overflow-hidden rounded-lg border border-cloth-200">
                    <div className="h-14" style={{ background: m.color }} />
                    <div className="p-2 text-xs font-medium">{m.title}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {detailFields.length > 0 && (
            <section className="card">
              <h2 className="text-xl font-bold">Project details</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {detailFields.map((fld) => (
                  <div key={fld.key} className={fld.kind === 'longtext' ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">{fld.label}</dt>
                    <dd className="mt-0.5 text-sm text-ink/80">{show(fld, rec.details[fld.key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="card">
            <h2 className="text-xl font-bold">What the project needs</h2>
            <ul className="mt-3 divide-y divide-cloth-100">
              {ws.resources.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-xs text-ink/50">{NEED_LABEL[r.type]}</span>
                  </span>
                  <Chip>{r.status}</Chip>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="text-xl font-bold">Team</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ws.project.collaborators.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-cloth-200 p-3 text-sm">
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-xs text-ink/50">{c.discipline}</span>
                  </span>
                  <Chip tone={c.role}>{c.role}</Chip>
                </li>
              ))}
            </ul>
          </section>

          {rec.updates.length > 0 && (
            <section className="card">
              <h2 className="text-xl font-bold">Updates</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {rec.updates.map((u, i) => (
                  <li key={i}><span className="text-ink/40">{u.date}</span> · {u.text}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Funding</div>
            <div className="mt-1 text-3xl font-extrabold">{money(b.funded)}</div>
            <div className="text-sm text-ink/60">of {money(b.total)} needed</div>
            <div className="mt-2"><ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" /></div>
            <div className="mt-3 text-xs text-ink/50">
              Led by {rec.ownerName}. {open.length} open need{open.length === 1 ? '' : 's'}.
            </div>
          </div>

          <div className="card">
            <div className="text-lg font-bold">Support this project</div>
            {isOwner ? (
              <Link to={`/my-projects/${rec.id}/overview`} className="btn-primary mt-3 w-full">Open workspace</Link>
            ) : rec.removed ? (
              <p className="mt-2 text-sm text-ink/60">This project is not available.</p>
            ) : rec.status === 'Closed' ? (
              <p className="mt-2 text-sm text-ink/60">This project is closed.</p>
            ) : !user && !sponsor ? (
              <div className="mt-3 space-y-2">
                <Link to="/login" state={{ from: loc.pathname }} className="btn-primary w-full">Log in to help</Link>
                <Link to="/sponsor/login" state={{ from: loc.pathname }} className="btn-ghost w-full">Sponsor login</Link>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button className="btn-primary w-full" onClick={() => setModal('interest')}>
                  <MessageSquare size={16} /> Express interest
                </button>
                <button className="btn-accent w-full" onClick={() => setModal('in-kind')} disabled={open.length === 0}>
                  <HandHeart size={16} /> Offer in-kind support
                </button>
                {sponsor && (
                  <button className="btn-ghost w-full" onClick={() => void toggleWatch(rec.id, !watching)}>
                    {watching ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {watching ? 'On your watchlist' : 'Save to watchlist'}
                  </button>
                )}
              </div>
            )}
            {mine.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-cloth-200 pt-3 text-sm">
                {mine.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>{m.kind === 'in-kind' ? 'In-kind offer' : 'Interest sent'}</span>
                    <Chip tone={m.status === 'Accepted' ? 'Supporting' : m.status}>{m.status === 'Accepted' ? 'Supporting' : m.status}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {!rec.removed && !isOwner && (user || sponsor) && (
            <button className="flex items-center gap-1 text-xs text-ink/50 underline" onClick={() => { setErr(''); setMod('report') }}>
              <Flag size={12} /> Report this project
            </button>
          )}
          {isStaff && !rec.removed && (
            <div className="card border-red-200">
              <div className="text-sm font-bold text-red-800">Moderation</div>
              <button className="btn-ghost mt-2 w-full !border-red-300 !text-red-800" onClick={() => { setErr(''); setDetails(''); setMod('remove') }}>
                <ShieldAlert size={16} /> Remove this project
              </button>
            </div>
          )}
        </aside>
      </div>

      {mod && (
        <Modal title={mod === 'report' ? 'Report this project' : 'Remove this project'} onClose={() => setMod(null)}>
          <div className="space-y-3">
            {mod === 'report' && (
              <div>
                <label className="label">What is wrong?</label>
                <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Choose a reason</option>
                  {['Spam or scam', 'Offensive or harmful', 'Copyright or stolen work', 'Misleading information', 'Other'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">{mod === 'report' ? 'Details (optional)' : 'Reason shown to the project owner'}</label>
              <textarea className="input h-24" value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button
              className={mod === 'remove' ? 'btn-accent w-full' : 'btn-primary w-full'}
              disabled={busy || (mod === 'report' ? !reason : details.trim().length < 5)}
              onClick={() => void moderate()}
            >
              {mod === 'report' ? 'Send report' : 'Remove project'}
            </button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal === 'in-kind' ? 'Offer in-kind support' : 'Express interest'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {modal === 'in-kind' && (
              <div>
                <label className="label">Which need can you help with?</label>
                <select className="input" value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                  <option value="">Choose a need</option>
                  {open.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Message to the creator</label>
              <textarea className="input h-28" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Introduce yourself and what you can offer." />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full" disabled={busy || !message.trim() || (modal === 'in-kind' && !resourceId)} onClick={() => void send()}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </Modal>
      )}
    </Page>
  )
}
