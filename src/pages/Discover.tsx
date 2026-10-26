import { BadgeCheck, Bookmark, Lock, Send, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chip, Modal, PageHeader } from '../components/ui'
import { money, notify, today, uid, useStore, useProjectPath } from '../store/store'
import type { Entry, EntryKind, OutStatus, Resource, State } from '../store/types'

const MONEY_KINDS: EntryKind[] = ['Funding', 'Donor', 'Sponsor']
const KIND_TABS: { k: 'All' | EntryKind; label: string }[] = [
  { k: 'All', label: 'All' },
  { k: 'Person', label: 'People' },
  { k: 'Organisation', label: 'Organisations' },
  { k: 'Funding', label: 'Funding & open calls' },
  { k: 'Donor', label: 'Donors & philanthropists' },
  { k: 'Sponsor', label: 'Sponsors' },
  { k: 'Mentor', label: 'Mentors' },
]

const TIER_LABEL = { public: 'Public directory', verified: 'Verified partner', private: 'Private network' } as const

function setOutreach(s: State, entryId: string, status: OutStatus, resourceId?: string, message?: string): State {
  const existing = s.outreach.find((o) => o.entryId === entryId)
  if (existing) {
    return {
      ...s,
      outreach: s.outreach.map((o) =>
        o.id === existing.id ? { ...o, status, resourceId: resourceId ?? o.resourceId, message: message ?? o.message } : o,
      ),
    }
  }
  return { ...s, outreach: [...s.outreach, { id: uid(), entryId, status, resourceId, message, date: today() }] }
}

export default function Discover() {
  const pp = useProjectPath()
  const { state, update } = useStore()
  const [params, setParams] = useSearchParams()
  const resourceId = params.get('resource') ?? ''
  const focus = state.resources.find((r) => r.id === resourceId)

  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'All' | EntryKind>('All')
  const [discipline, setDiscipline] = useState('')
  const [location, setLocation] = useState('')
  const [stage, setStage] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [proposalFor, setProposalFor] = useState<Entry | null>(null)
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('')

  const dir = state.directory
  const uniq = (f: (e: Entry) => string) => [...new Set(dir.map(f))].sort()

  const results = useMemo(
    () =>
      dir.filter((e) => {
        if (focus && e.resourceType !== focus.type) return false
        if (kind !== 'All' && e.kind !== kind) return false
        if (discipline && e.discipline !== discipline) return false
        if (location && e.location !== location) return false
        if (stage && e.stage !== stage) return false
        if (maxBudget && !MONEY_KINDS.includes(e.kind) && e.amount > Number(maxBudget)) return false
        if (q && !`${e.name} ${e.expertise} ${e.about}`.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [dir, focus, kind, discipline, location, stage, maxBudget, q],
  )

  const open = dir.find((e) => e.id === openId) ?? null
  const statusOf = (id: string) => state.outreach.find((o) => o.entryId === id)?.status
  const unlocked = (e: Entry) => e.tier !== 'private' || state.consents.includes(e.id)

  const respond = (entryId: string, accept: boolean) =>
    update((s) => {
      const o = s.outreach.find((x) => x.entryId === entryId)
      const e = s.directory.find((x) => x.id === entryId)
      if (!o || !e) return s
      let next = setOutreach(s, entryId, accept ? 'Accepted' : 'Declined')
      if (o.resourceId) {
        next = {
          ...next,
          resources: next.resources.map((r): Resource => {
            if (r.id !== o.resourceId) return r
            if (!accept) return r.status === 'Contacted' ? { ...r, status: 'Missing' } : r
            if (r.type === 'Funding') {
              const funded = r.funded + e.amount
              return { ...r, funded, status: funded >= r.budget ? 'Secured' : 'Partially funded' }
            }
            return { ...r, status: 'Secured' }
          }),
        }
      }
      return notify(next, accept ? `${e.name} accepted — resource updated to Secured` : `${e.name} declined your request`)
    })

  return (
    <>
      <PageHeader
        step="03 · Partnership Matching"
        title="Connect projects with resources"
        desc="Search people, organisations and funding. Public listings, verified partners and a private network are clearly separated."
      />

      {focus && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-terra-400 bg-orange-50 px-4 py-3 text-sm">
          <span>
            Matching for missing resource: <strong>{focus.name}</strong> ({focus.type})
          </span>
          <button className="btn-ghost !py-1" onClick={() => setParams({})}>
            <X size={14} /> Clear
          </button>
        </div>
      )}

      <div className="card">
        <div className="grid gap-3 md:grid-cols-6">
          <input className="input md:col-span-2" placeholder="Search name, expertise…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Any discipline</option>
            {uniq((e) => e.discipline).map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Any location</option>
            {uniq((e) => e.location).map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">Any stage</option>
            {uniq((e) => e.stage).map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className="input" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)}>
            <option value="">Any budget</option>
            <option value="2000">Up to $2,000</option>
            <option value="4000">Up to $4,000</option>
            <option value="6000">Up to $6,000</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {KIND_TABS.map(({ k, label }) => (
            <button key={k} onClick={() => setKind(k)} className={kind === k ? 'btn-primary !py-1' : 'btn-ghost !py-1'}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {results.length === 0 && <div className="card text-sm text-ink/60">No matches. Try removing a filter.</div>}
          {results.map((e) => {
            const st = statusOf(e.id)
            return (
              <div key={e.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <button className="text-left text-lg font-semibold hover:text-indigo2-600" onClick={() => setOpenId(e.id)}>
                      {e.tier === 'private' && !unlocked(e) ? (
                        <span className="inline-flex items-center gap-1"><Lock size={14} /> {e.name}</span>
                      ) : (
                        e.name
                      )}
                    </button>
                    <div className="text-xs text-ink/50">
                      {e.kind} · {e.location} · {e.discipline}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Chip tone={e.tier}>{e.tier === 'verified' && <BadgeCheck size={12} className="mr-1" />}{TIER_LABEL[e.tier]}</Chip>
                    {st && <Chip>{st}</Chip>}
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink/70">{e.expertise}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {e.amount > 0 ? (MONEY_KINDS.includes(e.kind) ? `Up to ${money(e.amount)}` : `~${money(e.amount)}`) : 'Introductions'}
                  </span>
                  <div className="flex gap-2">
                    <button className="btn-ghost !py-1" disabled={!!st} onClick={() => update((s) => setOutreach(s, e.id, 'Saved', resourceId || undefined))}>
                      <Bookmark size={14} /> {st ? 'Saved' : 'Save'}
                    </button>
                    <button className="btn-primary !py-1" disabled={st === 'Requested' || st === 'Accepted'} onClick={() => { setProposalFor(e); setTarget(resourceId) }}>
                      <Send size={14} /> Send proposal
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card h-fit">
          <h2 className="text-lg font-semibold">Outreach tracker</h2>
          {state.outreach.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Saved profiles and proposals will appear here.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {state.outreach.map((o) => {
                const e = dir.find((d) => d.id === o.entryId)
                const r = state.resources.find((x) => x.id === o.resourceId)
                return (
                  <li key={o.id} className="rounded-lg border border-cloth-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e?.name}</span>
                      <Chip>{o.status}</Chip>
                    </div>
                    {r && <div className="text-xs text-ink/50">For: {r.name}</div>}
                    {o.status === 'Requested' && (
                      <div className="mt-2 flex gap-2">
                        <button className="text-xs text-moss-700 hover:underline" onClick={() => respond(o.entryId, true)}>Simulate: accepted</button>
                        <button className="text-xs text-ink/50 hover:underline" onClick={() => respond(o.entryId, false)}>Simulate: declined</button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <Link to={pp('resources')} className="mt-3 inline-block text-xs text-indigo2-600 underline">View resource gaps</Link>
        </div>
      </div>

      {open && (
        <Modal title={unlocked(open) ? open.name : 'Private profile'} onClose={() => setOpenId(null)}>
          <div className="mb-3 flex gap-2">
            <Chip tone={open.tier}>{TIER_LABEL[open.tier]}</Chip>
            <Chip tone="Collaborator">{open.kind}</Chip>
          </div>
          {unlocked(open) ? (
            <div className="space-y-2 text-sm">
              <p>{open.about}</p>
              <p><strong>Expertise:</strong> {open.expertise}</p>
              <p><strong>Location:</strong> {open.location}</p>
              {open.regions && <p><strong>Operating regions:</strong> {open.regions.join(', ')}</p>}
              {open.interests && <p><strong>Areas of interest:</strong> {open.interests.join(', ')}</p>}
              {open.collabTypes && <p><strong>Open to:</strong> {open.collabTypes.join(', ')}</p>}
              {open.contact && <p><strong>Contact:</strong> {open.contact}</p>}
            </div>
          ) : (
            <div className="rounded-lg bg-purple-50 p-4 text-sm">
              <Lock size={16} className="mb-2" />
              This contact is part of a private relationship network. Details are shared only with the person's consent.
              <button
                className="btn-primary mt-3 w-full"
                onClick={() => update((s) => notify({ ...s, consents: [...s.consents, open.id] }, `Access granted to ${open.name} (simulated consent)`))}
              >
                Request access
              </button>
            </div>
          )}
        </Modal>
      )}

      {proposalFor && (
        <Modal title={`Proposal to ${proposalFor.name}`} onClose={() => setProposalFor(null)}>
          <form
            className="space-y-3"
            onSubmit={(ev) => {
              ev.preventDefault()
              update((s) => {
                let next = setOutreach(s, proposalFor.id, 'Requested', target || undefined, message)
                if (target) {
                  next = { ...next, resources: next.resources.map((r): Resource => (r.id === target && r.status === 'Missing' ? { ...r, status: 'Contacted' } : r)) }
                }
                return notify(next, `Proposal sent to ${proposalFor.name}`)
              })
              setProposalFor(null)
              setMessage('')
            }}
          >
            <div>
              <label className="label">Which resource is this for?</label>
              <select className="input" value={target} onChange={(ev) => setTarget(ev.target.value)}>
                <option value="">General collaboration</option>
                {state.resources.filter((r) => r.status !== 'Secured').map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input h-28" value={message} onChange={(ev) => setMessage(ev.target.value)} placeholder="Introduce the project and what you'd like to explore together." />
            </div>
            <button className="btn-primary w-full">Send proposal (simulated)</button>
          </form>
        </Modal>
      )}
    </>
  )
}
