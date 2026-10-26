import { Check, Eye, Globe, Lock, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Chip, PageHeader } from '../components/ui'
import { LICENCE_COMMISSION, money, notify, today, uid, useStore } from '../store/store'
import type { TrunkItem, TrunkMode, Visibility } from '../store/types'

const VIS: { value: Visibility; label: string; icon: typeof Lock; hint: string }[] = [
  { value: 'private', label: 'Private', icon: Lock, hint: 'Only you' },
  { value: 'collaborators', label: 'Collaborators', icon: Users, hint: 'People on the project' },
  { value: 'public', label: 'Public', icon: Globe, hint: 'Discoverable by anyone' },
]

const DOCS = ['Concept', 'Proposal', 'Storyboard', 'Design documents']

function LicenceGrant({ item }: { item: TrunkItem }) {
  const { state, update } = useStore()
  const [licensee, setLicensee] = useState('')
  const [docs, setDocs] = useState<string[]>(['Concept'])
  const [fee, setFee] = useState('1000')
  const accepted = state.proposals.filter((p) => p.trunkId === item.id && p.status === 'Accepted')
  const deals = state.licences.filter((l) => l.trunkId === item.id)

  return (
    <div className="mt-3 space-y-2">
      <input className="input" list={`lic-${item.id}`} placeholder="Licensee (accepted proposers suggested)" value={licensee} onChange={(e) => setLicensee(e.target.value)} />
      <datalist id={`lic-${item.id}`}>
        {accepted.map((p) => <option key={p.id} value={p.from} />)}
      </datalist>
      <div className="flex flex-wrap gap-3 text-sm">
        {DOCS.map((d) => (
          <label key={d} className="flex items-center gap-1">
            <input type="checkbox" checked={docs.includes(d)} onChange={(e) => setDocs(e.target.checked ? [...docs, d] : docs.filter((x) => x !== d))} />
            {d}
          </label>
        ))}
      </div>
      <input className="input" type="number" placeholder="Licence fee ($)" value={fee} onChange={(e) => setFee(e.target.value)} />
      <button
        className="btn-primary w-full"
        disabled={!licensee.trim() || docs.length === 0}
        onClick={() =>
          update((s) => {
            const amount = Number(fee) || 0
            const next = {
              ...s,
              licences: [...s.licences, { id: uid(), trunkId: item.id, licensee, docs, fee: amount, commissionPct: LICENCE_COMMISSION, date: today() }],
              trunk: s.trunk.map((t) =>
                t.id === item.id
                  ? { ...t, history: [...t.history, { date: today(), text: `Licence finalised with ${licensee} for ${docs.join(', ')} — fee ${money(amount)}, platform commission ${money((amount * LICENCE_COMMISSION) / 100)}` }] }
                  : t,
              ),
            }
            return notify(next, `Licence finalised with ${licensee}`)
          })
        }
      >
        Finalise licence agreement
      </button>
      {deals.map((d) => (
        <div key={d.id} className="rounded-lg bg-moss-100 p-3 text-xs">
          <strong>{d.licensee}</strong> licensed: {d.docs.join(', ')}. Fee {money(d.fee)} · platform commission ({d.commissionPct}%){' '}
          {money((d.fee * d.commissionPct) / 100)} · you receive {money(d.fee - (d.fee * d.commissionPct) / 100)}.
        </div>
      ))}
    </div>
  )
}

function Stepper({ item }: { item: TrunkItem }) {
  const { state } = useStore()
  const props = state.proposals.filter((p) => p.trunkId === item.id)
  const pending = props.filter((p) => p.status === 'Pending').length
  const deals = state.licences.filter((l) => l.trunkId === item.id).length
  const steps = [
    { label: 'Made public', done: item.visibility === 'public' && item.mode !== 'none' },
    { label: pending ? `${pending} proposal${pending > 1 ? 's' : ''} to review` : 'Proposals reviewed', done: props.length > 0 && pending === 0 },
    { label: 'Licence granted', done: deals > 0 },
    { label: 'Commission collected', done: deals > 0 },
  ]
  return (
    <ol className="mt-4 grid gap-2 sm:grid-cols-4">
      {steps.map((st, i) => (
        <li key={i} className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${st.done ? 'border-moss-500 bg-moss-100' : 'border-cloth-200'}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold">
            {st.done ? <Check size={12} /> : i + 1}
          </span>
          {st.label}
        </li>
      ))}
    </ol>
  )
}

function Proposals({ item }: { item: TrunkItem }) {
  const { state, update } = useStore()
  const props = state.proposals.filter((p) => p.trunkId === item.id)
  if (props.length === 0) return null
  const decide = (id: string, status: 'Accepted' | 'Declined') =>
    update((s) => {
      const p = s.proposals.find((x) => x.id === id)
      if (!p) return s
      const next = {
        ...s,
        proposals: s.proposals.map((x) => (x.id === id ? { ...x, status } : x)),
        trunk: s.trunk.map((t) =>
          t.id === item.id
            ? {
                ...t,
                contributors: status === 'Accepted' && p.kind === 'collaboration' ? [...t.contributors, p.from] : t.contributors,
                history: [...t.history, { date: today(), text: `Proposal from ${p.from} ${status.toLowerCase()}` }],
              }
            : t,
        ),
      }
      return notify(next, `Proposal from ${p.from} ${status.toLowerCase()}`)
    })
  return (
    <>
      <div className="label mt-4">Proposals received</div>
      <ul className="space-y-2">
        {props.map((p) => (
          <li key={p.id} className="rounded-lg border border-cloth-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.from}</span>
              <Chip tone={p.status === 'Pending' ? 'Requested' : p.status}>{p.status}</Chip>
            </div>
            <div className="text-xs text-ink/50">{p.kind === 'licence' ? 'Wants to license' : 'Wants to co-develop'}</div>
            <p className="mt-1 text-ink/70">{p.message}</p>
            {p.status === 'Pending' && (
              <div className="mt-2 flex gap-3">
                <button className="text-xs text-moss-700 hover:underline" onClick={() => decide(p.id, 'Accepted')}>Accept</button>
                <button className="text-xs text-ink/50 hover:underline" onClick={() => decide(p.id, 'Declined')}>Decline</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

export default function Trunk() {
  const { state, update } = useStore()

  const patch = (id: string, fn: (t: TrunkItem) => TrunkItem, log?: string) =>
    update((s) => {
      const next = {
        ...s,
        trunk: s.trunk.map((t) => {
          if (t.id !== id) return t
          const n = fn(t)
          return log ? { ...n, history: [...n.history, { date: today(), text: log }] } : n
        }),
      }
      return log ? notify(next, log) : next
    })

  const saveCurrent = () =>
    update((s) => {
      const item: TrunkItem = {
        id: uid(),
        title: s.project.title,
        summary: s.project.concept.split('\n').filter(Boolean)[0] ?? '',
        stage: s.plan.generated ? 'Planned' : 'Concept',
        visibility: 'private',
        mode: 'none',
        licence: { use: '', territory: '', term: '', attribution: '' },
        creator: s.user?.name ?? 'Me',
        contributors: s.project.collaborators.map((c) => c.name),
        history: [{ date: today(), text: 'Saved to Idea Trunk from Idea Lab (private)' }],
      }
      return notify({ ...s, trunk: [item, ...s.trunk] }, `"${item.title}" saved to Idea Trunk`)
    })

  const setMode = (t: TrunkItem, mode: TrunkMode) => {
    const label = mode === 'collaboration' ? 'Open for collaboration' : mode === 'licensing' ? 'Available for licensing' : 'Not offered'
    patch(t.id, (x) => ({ ...x, mode, visibility: mode !== 'none' && x.visibility === 'private' ? 'public' : x.visibility }), `Mode set to: ${label}`)
  }

  return (
    <>
      <PageHeader
        step="05 · Idea Trunk"
        title="Preserve ideas for future collaboration"
        desc="Save concepts at any stage, choose who can see them, and decide whether to invite collaborators or license the documentation."
        actions={
          <button className="btn-accent" onClick={saveCurrent}>
            <Plus size={16} /> Save current concept
          </button>
        }
      />

      <div className="space-y-4">
        {state.trunk.map((t) => (
          <div key={t.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold">{t.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-ink/70">{t.summary}</p>
              </div>
              <div className="flex gap-2">
                <Chip tone="Saved">{t.stage}</Chip>
                <Chip tone={t.visibility}>{t.visibility}</Chip>
                {t.mode !== 'none' && <Chip tone="Secured">{t.mode === 'collaboration' ? 'Open for collaboration' : 'Available for licensing'}</Chip>}
              </div>
            </div>

            <Stepper item={t} />

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <div className="label">Visibility</div>
                <div className="grid gap-2">
                  {VIS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => patch(t.id, (x) => ({ ...x, visibility: v.value, mode: v.value === 'private' ? 'none' : x.mode }), `Visibility changed to ${v.label}`)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm ${t.visibility === v.value ? 'border-indigo2-600 bg-indigo-50' : 'border-cloth-200'}`}
                    >
                      <v.icon size={16} />
                      <span>
                        <span className="font-medium">{v.label}</span>
                        <span className="block text-xs text-ink/50">{v.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="label mt-4">How others can engage</div>
                <div className="grid gap-2">
                  {([
                    ['none', 'Not offered', 'Archive only'],
                    ['collaboration', 'Open for collaboration', 'Invite others to propose further development'],
                    ['licensing', 'Available for licensing', 'Others may use documented material under agreed terms'],
                  ] as [TrunkMode, string, string][]).map(([m, label, hint]) => (
                    <button
                      key={m}
                      disabled={t.visibility === 'private' && m !== 'none'}
                      onClick={() => setMode(t, m)}
                      className={`rounded-lg border p-3 text-left text-sm disabled:opacity-40 ${t.mode === m ? 'border-terra-500 bg-orange-50' : 'border-cloth-200'}`}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="block text-xs text-ink/50">{hint}</span>
                    </button>
                  ))}
                </div>
                {t.visibility === 'private' && <p className="mt-2 text-xs text-ink/50">Change visibility to share or license.</p>}
              </div>

              <div>
                {t.mode === 'licensing' ? (
                  <>
                    <div className="label">Licence terms</div>
                    <div className="space-y-2">
                      {(['use', 'territory', 'term', 'attribution'] as const).map((k) => (
                        <input
                          key={k}
                          className="input"
                          placeholder={{ use: 'Permitted use (e.g. exhibit, adapt, publish)', territory: 'Territory', term: 'Term (e.g. 2 years)', attribution: 'Attribution wording' }[k]}
                          value={t.licence[k]}
                          onChange={(e) => patch(t.id, (x) => ({ ...x, licence: { ...x.licence, [k]: e.target.value } }))}
                        />
                      ))}
                      <button className="btn-ghost w-full" onClick={() => patch(t.id, (x) => x, 'Licence terms recorded')}>
                        Record agreement terms
                      </button>
                    </div>
                    <div className="label mt-4">Grant licence</div>
                    <LicenceGrant item={t} />
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                      According to the World Intellectual Property Organization (WIPO), an idea itself is generally not protected by
                      copyright; its specific form of expression — text, images, storyboards and design documents — can be. Licences here cover those documents and agreed uses; the
                      platform does not own or sell exclusive rights to ideas.
                    </p>
                  </>
                ) : (
                  <p className="rounded-lg bg-cloth-50 p-3 text-sm text-ink/60">
                    {t.mode === 'collaboration'
                      ? 'Others can discover this concept and propose how to develop it with you.'
                      : 'Choose "Available for licensing" to set usage terms for the documented concept.'}
                  </p>
                )}

                <Proposals item={t} />

                <div className="label mt-4">Attribution</div>
                <p className="text-sm">Creator: <strong>{t.creator}</strong></p>
                <p className="text-sm text-ink/60">Contributors: {t.contributors.join(', ')}</p>

                <div className="label mt-4 flex items-center gap-1"><Eye size={12} /> Agreement history</div>
                <ul className="space-y-1 text-xs">
                  {t.history.map((h, i) => (
                    <li key={i}><span className="text-ink/40">{h.date}</span> · {h.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
