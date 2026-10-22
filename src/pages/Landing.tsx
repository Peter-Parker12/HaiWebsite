import { ArrowRight, Compass, FolderArchive, Handshake, Lightbulb, ListChecks, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'

const STEPS = [
  { icon: Lightbulb, n: '01', name: 'Idea Lab', head: 'Develop the idea together', text: 'A shared creative workspace for concepts, mood boards, references and decisions.', to: '/idea-lab' },
  { icon: ListChecks, n: '02', name: 'Resource Mapping', head: 'Identify what is missing', text: 'Skills, budget, venues, partners and expertise — gaps made visible.', to: '/resources' },
  { icon: Handshake, n: '03', name: 'Partnership Matching', head: 'Connect projects with resources', text: 'Find partners, funding and collaborators, then send a proposal.', to: '/discover' },
  { icon: Rocket, n: '04', name: 'Project Activation', head: 'Turn concepts into projects', text: 'Timeline, tasks, budget and an implementation plan built from what you already entered.', to: '/activation' },
  { icon: FolderArchive, n: '05', name: 'Idea Trunk', head: 'Preserve ideas for later', text: 'Archive, revisit, share and license documented concepts.', to: '/trunk' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-cloth-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <Compass className="text-terra-500" size={22} /> ConceptBridge
        </div>
        <Link to="/dashboard" className="btn-primary">
          Open demo
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-terra-500">
            For artists, curators and cultural practitioners
          </div>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">
            From a creative idea to a project that can actually happen.
          </h1>
          <p className="mt-5 text-lg text-ink/70">
            Independent ideas stall because collaborators, resources and project support are scattered. ConceptBridge
            brings them into one place — with people making every creative decision. No AI brainstorming for you, just a
            shared space, planning tools and a network of resources.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/idea-lab" className="btn-accent">
              Explore the sample project <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="btn-ghost">
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-cloth-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <p className="mt-1 text-sm text-ink/60">
            One sample project, "Reimagining Textile Waste Through Art", runs through every step with shared data.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s) => (
              <Link key={s.n} to={s.to} className="card group transition hover:border-terra-400">
                <s.icon className="text-indigo2-600" size={22} />
                <div className="mt-3 text-xs font-semibold tracking-widest text-ink/40">{s.n}</div>
                <div className="text-sm font-semibold uppercase tracking-wide">{s.name}</div>
                <div className="mt-2 font-display text-lg leading-snug">{s.head}</div>
                <p className="mt-2 text-sm text-ink/60">{s.text}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink/60">
            Idea Trunk is not only the last step: save an unfinished idea at any time, return to develop it, or reopen it
            to find collaborators.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-semibold">Free and premium</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="font-semibold">Collaboration tools</div>
            <p className="mt-1 text-sm text-ink/60">Workspaces, mood boards, versions and project plans for artists and teams.</p>
          </div>
          <div className="card">
            <div className="font-semibold">Premium matching</div>
            <p className="mt-1 text-sm text-ink/60">Deeper resource matching and verified partner profiles for projects.</p>
          </div>
          <div className="card">
            <div className="font-semibold">Institutional plans</div>
            <p className="mt-1 text-sm text-ink/60">Museums, galleries, festivals and foundations publish programmes and find projects.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/50">Demo only — no payments are processed.</p>
      </section>
    </div>
  )
}
