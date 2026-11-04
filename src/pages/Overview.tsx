import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import TypePicker from '../components/TypePicker'
import { Chip, ProgressBar } from '../components/ui'
import { ApiError } from '../api'
import { fieldsFor, missingForListing, STAGES, type FieldDef, type Missing } from '../store/projectTypes'
import { budgetOf, money, useProjectPath, useRoot, useStore } from '../store/store'
import type { ProjectStatus } from '../store/types'

const STATUSES: ProjectStatus[] = ['Seeking support', 'Running', 'Closed']

function FieldInput({ fld, value, onChange }: { fld: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const label = (
    <label className="label">
      {fld.label}
      {fld.unit ? ` (${fld.unit})` : ''}
      {fld.required && <span className="text-terra-500"> *</span>}
    </label>
  )
  const str = value === undefined || value === null ? '' : String(value)
  switch (fld.kind) {
    case 'longtext':
      return (
        <div className="sm:col-span-2">
          {label}
          <textarea className="input h-24" value={str} onChange={(e) => onChange(e.target.value)} />
          {fld.hint && <p className="mt-1 text-xs text-ink/50">{fld.hint}</p>}
        </div>
      )
    case 'number':
      return (
        <div>
          {label}
          <input className="input" type="number" min={0} value={str} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
      )
    case 'choice':
      return (
        <div>
          {label}
          <select className="input" value={str} onChange={(e) => onChange(e.target.value || undefined)}>
            <option value="">Choose…</option>
            {fld.options?.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      )
    case 'list':
      return (
        <div className="sm:col-span-2">
          {label}
          <input
            className="input"
            placeholder="Separate items with commas"
            value={Array.isArray(value) ? value.join(', ') : str}
            onChange={(e) => onChange(e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
          />
        </div>
      )
    default:
      return (
        <div>
          {label}
          <input className="input" value={str} onChange={(e) => onChange(e.target.value)} />
          {fld.hint && <p className="mt-1 text-xs text-ink/50">{fld.hint}</p>}
        </div>
      )
  }
}

export default function Overview() {
  const { state, projectId } = useStore()
  const pp = useProjectPath()
  const { root, patchProject, decideSupport } = useRoot()
  const rec = root.projects.find((p) => p.id === projectId)

  const [draft, setDraft] = useState(() => ({
    oneLiner: rec?.oneLiner ?? '',
    discipline: rec?.discipline ?? '',
    location: rec?.location ?? '',
    stage: rec?.stage ?? 'Concept',
    tags: (rec?.tags ?? []).join(', '),
    types: rec?.types ?? [],
    details: rec?.details ?? ({} as Record<string, unknown>),
  }))
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [serverMissing, setServerMissing] = useState<Missing[]>([])
  const [busy, setBusy] = useState(false)
  if (!rec) return null

  const { project, resources, plan } = state
  const b = budgetOf(state)
  const secured = resources.filter((r) => r.status === 'Secured').length
  const missingResources = resources.filter((r) => r.status === 'Missing').length
  const done = plan.tasks.filter((t) => t.status === 'Done').length

  const patch = { ...draft, tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean) }
  const missing = missingForListing(
    {
      title: project.title,
      oneLiner: draft.oneLiner,
      story: project.concept,
      types: draft.types,
      discipline: draft.discipline,
      location: draft.location,
      stage: draft.stage,
      needsCount: resources.filter((r) => r.status !== 'Secured').length,
      coverImages: 0,
      artworkImages: 0,
      documents: 0,
      details: draft.details,
    },
    { requireMedia: false },
  )

  const run = async (fn: () => Promise<void>, ok: string) => {
    setErr('')
    setMsg('')
    setServerMissing([])
    setBusy(true)
    try {
      await fn()
      setMsg(ok)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
      if (e instanceof ApiError && Array.isArray((e.data as { missing?: Missing[] } | null)?.missing)) {
        setServerMissing((e.data as { missing: Missing[] }).missing)
      }
    } finally {
      setBusy(false)
    }
  }

  const inbox = root.supports.filter((s) => s.projectId === projectId && !(s.byKind === 'user' && s.byId === rec.ownerId))
  const steps = [
    { label: 'Develop', done: project.directionAgreed, to: pp('idea-lab'), text: project.directionAgreed ? 'Direction agreed' : 'Agree project direction' },
    { label: 'Discover', done: missingResources === 0, to: pp('resources'), text: `${missingResources} resource gap${missingResources === 1 ? '' : 's'} open` },
    { label: 'Activate', done: plan.generated, to: pp('activation'), text: plan.generated ? `${done}/${plan.tasks.length} tasks done` : 'Generate project plan' },
  ]
  const fields = fieldsFor(draft.types)

  return (
    <div className="space-y-4">
      {rec.removed && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          This project was removed by moderators and is hidden from Home.
          {rec.removedReason && <> Reason: {rec.removedReason}</>} You can still edit your workspace. Contact the team if you think this was a mistake.
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold">Public listing</h2>
          <p className="text-sm text-ink/60">This is what sponsors see on Home and on your project page.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TypePicker value={draft.types} onChange={(types) => setDraft({ ...draft, types })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">One-line pitch <span className="text-terra-500">*</span></label>
              <input className="input" maxLength={140} value={draft.oneLiner} onChange={(e) => setDraft({ ...draft, oneLiner: e.target.value })} />
              <p className="mt-1 text-xs text-ink/50">{draft.oneLiner.length}/140</p>
            </div>
            <div>
              <label className="label">Discipline <span className="text-terra-500">*</span></label>
              <input className="input" value={draft.discipline} onChange={(e) => setDraft({ ...draft, discipline: e.target.value })} />
            </div>
            <div>
              <label className="label">Location <span className="text-terra-500">*</span></label>
              <input className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Stage <span className="text-terra-500">*</span></label>
              <select className="input" value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" placeholder="Comma separated" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
            </div>
          </div>

          {fields.length > 0 && (
            <>
              <h3 className="mt-6 text-base font-bold">Details for this type of project</h3>
              <p className="text-xs text-ink/50">Shown to everyone on the project page. * is needed before you can list the project.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {fields.map((fld) => (
                  <FieldInput
                    key={fld.key}
                    fld={fld}
                    value={draft.details[fld.key]}
                    onChange={(v) => setDraft({ ...draft, details: { ...draft.details, [fld.key]: v } })}
                  />
                ))}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="btn-primary"
              disabled={busy || draft.types.length === 0}
              onClick={() => void run(() => patchProject(projectId, { ...patch, tags: patch.tags }), 'Saved.')}
            >
              Save listing details
            </button>
            {msg && <span className="text-sm text-moss-700">{msg}</span>}
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          {serverMissing.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-sm text-red-600">
              {serverMissing.map((m) => <li key={m.key}>{m.label}</li>)}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-bold">Status and visibility</h2>
            <label className="label mt-3">Status</label>
            <select
              className="input"
              value={rec.status}
              disabled={busy}
              onChange={(e) => void run(() => patchProject(projectId, { status: e.target.value as ProjectStatus }), 'Status updated.')}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <div className="mt-4 rounded-lg bg-cloth-100 p-3 text-sm">
              <div className="flex items-center justify-between font-semibold">
                <span>Listed on Home</span>
                <Chip tone={rec.listed ? 'Done' : 'To do'}>{rec.listed ? 'Listed' : 'Not listed'}</Chip>
              </div>
              {missing.length === 0 ? (
                <p className="mt-2 text-xs text-moss-700">Everything needed is filled in.</p>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-ink/60">Still needed to list ({missing.length}):</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-ink/70">
                    {missing.map((m) => <li key={m.key}>{m.label}</li>)}
                  </ul>
                  <p className="mt-2 text-xs text-ink/50">
                    The story is the concept text in <Link to={pp('idea-lab')} className="underline">Idea Lab</Link>.
                  </p>
                </div>
              )}
              <button
                className={`mt-3 w-full ${rec.listed ? 'btn-ghost' : 'btn-accent'}`}
                disabled={busy || rec.removed || (!rec.listed && missing.length > 0)}
                onClick={() => void run(() => patchProject(projectId, { ...patch, listed: !rec.listed }), rec.listed ? 'Removed from Home.' : 'Your project is now listed.')}
              >
                {rec.listed ? 'Remove from Home' : 'List on Home'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="text-xs uppercase tracking-wide text-ink/50">Resources secured</div>
            <div className="mt-1 text-3xl font-extrabold">{secured}/{resources.length}</div>
            <ProgressBar value={secured} max={resources.length} />
          </div>
          <div className="card">
            <div className="text-xs uppercase tracking-wide text-ink/50">Funding gap</div>
            <div className="mt-1 text-3xl font-extrabold">{money(b.gap)}</div>
            <ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Support requests</h2>
        {inbox.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No requests yet. Once your project is listed, sponsors can reach out here.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inbox.map((s) => {
              const res = resources.find((r) => r.id === s.resourceId)
              return (
                <li key={s.id} className="rounded-lg border border-cloth-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">{s.byName ?? 'Supporter'}</span>
                      <span className="ml-2 text-xs text-ink/50">
                        {s.byKind === 'sponsor' ? 'Sponsor' : 'Creator'} · {s.kind === 'in-kind' ? `in-kind${res ? `: ${res.name}` : ''}` : 'interest'} · {s.date}
                      </span>
                    </div>
                    <Chip tone={s.status === 'Accepted' ? 'Supporting' : s.status}>{s.status === 'Accepted' ? 'Supporting' : s.status}</Chip>
                  </div>
                  <p className="mt-1 text-ink/70">{s.message}</p>
                  {s.status === 'Requested' && (
                    <div className="mt-2 flex gap-2">
                      <button className="btn-primary !py-1" disabled={busy} onClick={() => void run(() => decideSupport(s.id, true), 'Request accepted.')}><Check size={14} /> Accept</button>
                      <button className="btn-ghost !py-1" disabled={busy} onClick={() => void run(() => decideSupport(s.id, false), 'Request declined.')}><X size={14} /> Decline</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <Link key={s.label} to={s.to} className="card hover:border-terra-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">{s.label}</span>
              <Chip tone={s.done ? 'Done' : 'In progress'}>{s.done ? 'Done' : 'In progress'}</Chip>
            </div>
            <div className="mt-2 text-sm">{s.text}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
