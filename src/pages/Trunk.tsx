import { Eye, Globe, Lock, Plus, Users } from 'lucide-react'
import { Chip, PageHeader } from '../components/ui'
import { notify, today, uid, useStore } from '../store/store'
import type { TrunkItem, TrunkMode, Visibility } from '../store/types'

const VIS: { value: Visibility; label: string; icon: typeof Lock; hint: string }[] = [
  { value: 'private', label: 'Private', icon: Lock, hint: 'Only you' },
  { value: 'collaborators', label: 'Collaborators', icon: Users, hint: 'People on the project' },
  { value: 'public', label: 'Public', icon: Globe, hint: 'Discoverable by anyone' },
]

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
        creator: 'Mai Tran',
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
                      <button className="btn-primary w-full" onClick={() => patch(t.id, (x) => x, 'Licence terms recorded')}>
                        Record agreement terms
                      </button>
                    </div>
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                      An abstract idea on its own is generally not protected by copyright. Protection can apply to the specific
                      expression — text, images and design documents. Licences here cover those documents and agreed uses; the
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
