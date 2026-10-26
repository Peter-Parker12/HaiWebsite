import { ArrowLeft } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Chip, Page } from '../components/ui'
import { ProjectScope, useRoot, useStore } from '../store/store'

const TABS = [
  ['overview', 'Overview'],
  ['idea-lab', 'Idea Lab'],
  ['resources', 'Resources'],
  ['discover', 'Matching'],
  ['funding', 'Funding & ideas'],
  ['activation', 'Activation'],
  ['archive', 'Idea Trunk'],
] as const

function Inner() {
  const { state, projectId } = useStore()
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
      </div>
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
