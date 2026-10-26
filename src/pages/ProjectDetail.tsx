import { ArrowLeft, Bookmark, BookmarkCheck, HandHeart, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { NEED_LABEL } from '../components/ProjectCard'
import { Chip, Modal, Page, ProgressBar } from '../components/ui'
import { budgetOf, money, notify, today, uid, useRoot } from '../store/store'

export default function ProjectDetail() {
  const { id } = useParams()
  const loc = useLocation()
  const { root, setRoot, user, sponsor } = useRoot()
  const rec = root.projects.find((p) => p.id === id)
  const [modal, setModal] = useState<null | 'interest' | 'in-kind'>(null)
  const [message, setMessage] = useState('')
  const [resourceId, setResourceId] = useState('')

  if (!rec || (!rec.listed && rec.ownerId !== user?.id)) {
    return (
      <Page>
        <Link to="/" className="text-sm underline">← Back to projects</Link>
        <p className="mt-4">This project was not found.</p>
      </Page>
    )
  }

  const ws = rec.ws
  const owner = root.users.find((u) => u.id === rec.ownerId)
  const b = budgetOf(ws)
  const isOwner = user?.id === rec.ownerId
  const byKind = sponsor ? 'sponsor' : 'user'
  const byId = sponsor?.id ?? user?.id ?? ''
  const mine = root.supports.filter((s) => s.projectId === rec.id && s.byKind === byKind && s.byId === byId)
  const watching = !!sponsor && root.watchlist.some((w) => w.sponsorId === sponsor.id && w.projectId === rec.id)
  const open = ws.resources.filter((r) => r.status !== 'Secured')
  const concept = ws.project.concept.split('\n').filter(Boolean)
  const actorName = sponsor?.name ?? user?.name ?? ''

  const send = () => {
    if (!modal) return
    setRoot((r) =>
      notify(
        {
          ...r,
          supports: [
            ...r.supports,
            {
              id: uid(), projectId: rec.id, byKind, byId, kind: modal, message,
              resourceId: modal === 'in-kind' ? resourceId || undefined : undefined,
              status: 'Requested', date: today(),
            },
          ],
        },
        `${actorName} ${modal === 'in-kind' ? 'offered in-kind support to' : 'expressed interest in'} "${ws.project.title}"`,
      ),
    )
    setModal(null)
    setMessage('')
    setResourceId('')
  }

  const toggleWatch = () =>
    setRoot((r) =>
      sponsor
        ? {
            ...r,
            watchlist: watching
              ? r.watchlist.filter((w) => !(w.sponsorId === sponsor.id && w.projectId === rec.id))
              : [...r.watchlist, { sponsorId: sponsor.id, projectId: rec.id }],
          }
        : r,
    )

  return (
    <Page>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:underline">
        <ArrowLeft size={14} /> All projects
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{rec.status}</Chip>
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
              Led by {owner?.name}. {open.length} open need{open.length === 1 ? '' : 's'}.
            </div>
          </div>

          <div className="card">
            <div className="text-lg font-bold">Support this project</div>
            {isOwner ? (
              <Link to={`/my-projects/${rec.id}/overview`} className="btn-primary mt-3 w-full">Open workspace</Link>
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
                  <button className="btn-ghost w-full" onClick={toggleWatch}>
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
        </aside>
      </div>

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
            <button className="btn-primary w-full" disabled={!message.trim() || (modal === 'in-kind' && !resourceId)} onClick={send}>
              Send (simulated)
            </button>
          </div>
        </Modal>
      )}
    </Page>
  )
}
