import { Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard'
import { Modal, Page, PageHeader } from '../components/ui'
import { useRoot } from '../store/store'
import type { ProjectStatus } from '../store/types'

const GROUPS: { status: ProjectStatus; title: string; empty: string }[] = [
  { status: 'Seeking support', title: 'Looking for resources', empty: 'No projects are looking for support right now.' },
  { status: 'Running', title: 'Running', empty: 'No running projects yet.' },
  { status: 'Closed', title: 'Closed', empty: 'No closed projects.' },
]

export default function MyProjects() {
  const { root, user, createProject, loadSample } = useRoot()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', tagline: '', discipline: '', location: '' })
  const mine = root.projects.filter((p) => p.ownerId === user?.id)

  return (
    <Page>
      <PageHeader
        step="Project"
        title="Your projects"
        desc="Everything you lead, grouped by where it stands. Open a project to develop it, map resources and plan delivery."
        actions={
          <button className="btn-accent" onClick={() => setOpen(true)}>
            <Plus size={16} /> New project
          </button>
        }
      />

      {mine.length === 0 && (
        <div className="card text-center">
          <p className="text-sm text-ink/70">You have no projects yet. Start a blank one or explore a filled-in example.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New project</button>
            <button className="btn-ghost" onClick={() => nav(`/my-projects/${loadSample()}/overview`)}>
              <Sparkles size={16} /> Load sample project
            </button>
          </div>
        </div>
      )}

      {mine.length > 0 &&
        GROUPS.map((g) => {
          const list = mine.filter((p) => p.status === g.status)
          return (
            <section key={g.status} className="mb-8">
              <h2 className="mb-3 text-xl font-bold">
                {g.title} <span className="text-sm font-normal text-ink/50">({list.length})</span>
              </h2>
              {list.length === 0 ? (
                <p className="text-sm text-ink/50">{g.empty}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => <ProjectCard key={p.id} rec={p} to={`/my-projects/${p.id}/overview`} />)}
                </div>
              )}
            </section>
          )
        })}

      {open && (
        <Modal title="New project" onClose={() => setOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!f.title.trim()) return
              const id = createProject(f)
              setOpen(false)
              nav(`/my-projects/${id}/overview`)
            }}
          >
            <div>
              <label className="label">Project title</label>
              <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div>
              <label className="label">One-line pitch</label>
              <input className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Discipline</label>
                <input className="input" value={f.discipline} onChange={(e) => setF({ ...f, discipline: e.target.value })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary w-full">Create project</button>
          </form>
        </Modal>
      )}
    </Page>
  )
}
