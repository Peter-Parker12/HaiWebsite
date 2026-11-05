import { ArrowLeft } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Chip, Page } from '../components/ui'
import { ProjectScope, useRoot, useStore } from '../store/store'

const TABS = [
  ['overview', 'Overview'],
  ['idea-lab', 'Idea Lab'],
  ['board', 'Board'],
  ['resources', 'Resources'],
  ['discover', 'Matching'],
  ['funding', 'Funding'],
  ['activation', 'Activation'],
] as const

function Inner() {
  const { state, projectId, status } = useStore()
  const { root } = useRoot()
  const rec = root.projects.find((p) => p.id === projectId)

  return (
    <Page>
      <Link to="/my-projects" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:underline">
        <ArrowLeft size={14} /> My projects
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{state.project.title}</h1>
        {rec && <Chip>{rec.status}</Chip>}
        {rec?.listed && <Link to={`/projects/${projectId}`} className="text-sm underline">View public page</Link>}
        <span className="ml-auto text-xs text-ink/50">
          {status === 'saving' ? 'Saving…' : status === 'error' ? 'Could not save — retrying on your next change' : status === 'conflict' ? '' : 'All changes saved'}
        </span>
      </div>
      {status === 'conflict' && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          This project changed somewhere else, so your latest edits were not saved.
          <button className="btn-ghost !py-1" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-cloth-200">
        {TABS.map(([to, label]) => (
          <NavLink
            key={to}
            to={`/my-projects/${projectId}/${to}`}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${isActive ? 'border-terra-500 text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </Page>
  )
}

export default function Workspace() {
  return (
    <ProjectScope>
      <Inner />
    </ProjectScope>
  )
}
