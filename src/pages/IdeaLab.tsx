import { ArrowDown, ArrowRight, ArrowUp, History, Plus, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chip, Modal, PageHeader } from '../components/ui'
import { notify, today, uid, useStore, useProjectPath } from '../store/store'
import type { Role } from '../store/types'

const COLORS = ['#3b4a8c', '#c4663d', '#5d7a49', '#d3bc93', '#7a4a6b', '#2f7a7a']

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export default function IdeaLab() {
  const pp = useProjectPath()
  const { state, update } = useStore()
  const { project } = state
  const nav = useNavigate()
  const [invite, setInvite] = useState(false)
  const [inv, setInv] = useState({ name: '', discipline: '', role: 'Collaborator' as Role })
  const [moodDraft, setMoodDraft] = useState({ title: '', note: '' })
  const [frameDraft, setFrameDraft] = useState('')
  const [comment, setComment] = useState('')
  const [asDecision, setAsDecision] = useState(false)

  const patch = (p: Partial<typeof project>) => update((s) => ({ ...s, project: { ...s.project, ...p } }))

  return (
    <>
      <PageHeader
        step="01 · Idea Lab"
        title="Develop the idea together"
        desc="A shared workspace for concepts, references and decisions. People decide the direction; the platform records how the idea evolved."
        actions={
          <button
            className="btn-accent"
            onClick={() => {
              update((s) => notify({ ...s, project: { ...s.project, directionAgreed: true } }, 'Project direction agreed — ready for Resource Mapping'))
              nav(pp('resources'))
            }}
          >
            Agree direction <ArrowRight size={16} />
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Concept statement</h2>
            <button
              className="btn-ghost"
              onClick={() =>
                patch({
                  versions: [
                    ...project.versions,
                    { id: uid(), label: `v${project.versions.length + 1} — saved ${today()}`, date: today(), concept: project.concept },
                  ],
                })
              }
            >
              <History size={14} /> Save version
            </button>
          </div>
          <textarea
            className="input mt-3 h-52"
            value={project.concept}
            onChange={(e) => patch({ concept: e.target.value, directionAgreed: false })}
          />
          <p className="mt-2 text-xs text-ink/50">Editing the concept resets "direction agreed" so the team re-confirms.</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Collaborators</h2>
            <button className="btn-ghost" onClick={() => setInvite(true)}>
              <UserPlus size={14} /> Invite
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {project.collaborators.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-ink/50">{c.discipline}</div>
                </div>
                <Chip tone={c.role}>{c.role}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="text-lg font-semibold">Mood board</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {project.mood.map((m, i) => (
            <div key={m.id} className="overflow-hidden rounded-lg border border-cloth-200">
              <div className="h-24" style={{ background: m.color }} />
              <div className="p-3">
                <div className="text-sm font-medium">{m.title}</div>
                <div className="text-xs text-ink/60">{m.note}</div>
                <div className="mt-2 flex gap-1">
                  <button className="btn-ghost !px-2 !py-1" aria-label="Move earlier" onClick={() => patch({ mood: move(project.mood, i, -1) })}>
                    <ArrowUp size={12} className="-rotate-90" />
                  </button>
                  <button className="btn-ghost !px-2 !py-1" aria-label="Move later" onClick={() => patch({ mood: move(project.mood, i, 1) })}>
                    <ArrowDown size={12} className="-rotate-90" />
                  </button>
                  <button className="btn-ghost !px-2 !py-1" aria-label="Remove" onClick={() => patch({ mood: project.mood.filter((x) => x.id !== m.id) })}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!moodDraft.title.trim()) return
            patch({
              mood: [...project.mood, { id: uid(), title: moodDraft.title, note: moodDraft.note, color: COLORS[project.mood.length % COLORS.length] }],
            })
            setMoodDraft({ title: '', note: '' })
          }}
        >
          <input className="input !w-48" placeholder="Reference title" value={moodDraft.title} onChange={(e) => setMoodDraft({ ...moodDraft, title: e.target.value })} />
          <input className="input !w-64" placeholder="Note" value={moodDraft.note} onChange={(e) => setMoodDraft({ ...moodDraft, note: e.target.value })} />
          <button className="btn-primary">
            <Plus size={14} /> Add reference
          </button>
        </form>
      </div>

      <div className="card mt-4">
        <h2 className="text-lg font-semibold">Storyboard</h2>
        <ol className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {project.frames.map((f, i) => (
            <li key={f.id} className="w-56 shrink-0 rounded-lg border border-cloth-200 bg-cloth-50 p-3">
              <div className="text-xs font-semibold text-terra-500">Frame {i + 1}</div>
              <p className="mt-1 text-sm">{f.caption}</p>
              <div className="mt-2 flex gap-1">
                <button className="btn-ghost !px-2 !py-1" aria-label="Move earlier" onClick={() => patch({ frames: move(project.frames, i, -1) })}>
                  <ArrowUp size={12} className="-rotate-90" />
                </button>
                <button className="btn-ghost !px-2 !py-1" aria-label="Move later" onClick={() => patch({ frames: move(project.frames, i, 1) })}>
                  <ArrowDown size={12} className="-rotate-90" />
                </button>
                <button className="btn-ghost !px-2 !py-1" aria-label="Remove" onClick={() => patch({ frames: project.frames.filter((x) => x.id !== f.id) })}>
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!frameDraft.trim()) return
            patch({ frames: [...project.frames, { id: uid(), caption: frameDraft }] })
            setFrameDraft('')
          }}
        >
          <input className="input" placeholder="Describe the next frame" value={frameDraft} onChange={(e) => setFrameDraft(e.target.value)} />
          <button className="btn-primary">
            <Plus size={14} /> Add frame
          </button>
        </form>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Discussion and decisions</h2>
          <ul className="mt-3 space-y-3">
            {project.comments.map((c) => (
              <li key={c.id} className={`rounded-lg p-3 text-sm ${c.decision ? 'border border-moss-500 bg-moss-100' : 'bg-cloth-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.author}</span>
                  {c.decision && <Chip tone="Secured">Decision</Chip>}
                </div>
                <p className="mt-1">{c.text}</p>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!comment.trim()) return
              patch({ comments: [...project.comments, { id: uid(), author: state.user?.name ?? 'Me', text: comment, decision: asDecision }] })
              setComment('')
              setAsDecision(false)
            }}
          >
            <textarea className="input h-20" placeholder="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={asDecision} onChange={(e) => setAsDecision(e.target.checked)} /> Record as decision
              </label>
              <button className="btn-primary">Post</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Version history</h2>
          <ul className="mt-3 space-y-3">
            {[...project.versions].reverse().map((v) => (
              <li key={v.id} className="rounded-lg border border-cloth-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{v.label}</span>
                  <span className="text-xs text-ink/50">{v.date}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-ink/60">{v.concept}</p>
                <button className="mt-2 text-xs text-indigo2-600 hover:underline" onClick={() => patch({ concept: v.concept, directionAgreed: false })}>
                  Restore this version
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {invite && (
        <Modal title="Invite a collaborator" onClose={() => setInvite(false)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!inv.name.trim()) return
              update((s) =>
                notify(
                  { ...s, project: { ...s.project, collaborators: [...s.project.collaborators, { id: uid(), name: inv.name, role: inv.role, discipline: inv.discipline || 'Collaborator' }] } },
                  `Invitation sent to ${inv.name} as ${inv.role}`,
                ),
              )
              setInv({ name: '', discipline: '', role: 'Collaborator' })
              setInvite(false)
            }}
          >
            <div>
              <label className="label">Name</label>
              <input className="input" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Discipline</label>
              <input className="input" value={inv.discipline} onChange={(e) => setInv({ ...inv, discipline: e.target.value })} />
            </div>
            <div>
              <label className="label">Permission</label>
              <select className="input" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as Role })}>
                <option>Editor</option>
                <option>Collaborator</option>
                <option>Viewer</option>
              </select>
            </div>
            <button className="btn-primary w-full">Send invitation</button>
          </form>
        </Modal>
      )}
    </>
  )
}
