import { ArrowRight, Compass, FolderArchive, Handshake, Lightbulb, ListChecks, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'

const STEPS = [
  { icon: Lightbulb, n: '01', name: 'Idea Lab', head: 'Develop the idea together', text: 'A shared creative workspace for concepts, mood boards, references and decisions.', to: '/idea-lab', bg: 'bg-pastel-sun' },
  { icon: ListChecks, n: '02', name: 'Resource Mapping', head: 'Identify what is missing', text: 'Skills, budget, venues, partners and expertise — gaps made visible.', to: '/resources', bg: 'bg-pastel-pink' },
  { icon: Handshake, n: '03', name: 'Partnership Matching', head: 'Connect projects with resources', text: 'Find partners, funding and collaborators, then send a proposal.', to: '/discover', bg: 'bg-pastel-lilac' },
  { icon: Rocket, n: '04', name: 'Project Activation', head: 'Turn concepts into projects', text: 'Timeline, tasks, budget and an implementation plan built from what you already entered.', to: '/activation', bg: 'bg-pastel-sky' },
  { icon: FolderArchive, n: '05', name: 'Idea Trunk', head: 'Preserve ideas for later', text: 'Archive, revisit, share and license documented concepts.', to: '/trunk', bg: 'bg-pastel-mint' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-cloth-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <Compass className="text-indigo2-500" size={24} /> ConceptBridge
          </div>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/discover" className="hidden hover:underline sm:inline">Discover</Link>
            <Link to="/dashboard" className="btn-primary">Open demo</Link>
          </nav>
        </div>
      </header>

      <section className="bg-pastel-mint">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="text-sm font-bold uppercase tracking-widest text-indigo2-700">
            For artists, curators and cultural practitioners
          </div>
          <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
            Bring creative ideas to life.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-ink/80">
            Independent ideas stall because collaborators, resources and project support are scattered. ConceptBridge
            brings them together — with people making every creative decision. No AI brainstorming for you: a shared
            space, planning tools and a network of resources.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/idea-lab" className="btn-primary !px-6 !py-3 !text-base">
              Explore the sample project <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn-ghost !px-6 !py-3 !text-base">
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-extrabold md:text-4xl">From concept to project in five steps</h2>
        <p className="mt-2 text-ink/70">
          One sample project, "Reimagining Textile Waste Through Art", runs through every step with shared data.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Link key={s.n} to={s.to} className={`${s.bg} group rounded-lg p-6 transition hover:-translate-y-1`}>
              <div className="flex items-center justify-between">
                <s.icon size={26} />
                <span className="text-sm font-bold text-ink/50">{s.n}</span>
              </div>
              <div className="mt-6 text-xs font-bold uppercase tracking-widest text-ink/60">{s.name}</div>
              <div className="mt-1 text-2xl font-extrabold leading-snug">{s.head}</div>
              <p className="mt-2 text-sm text-ink/70">{s.text}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                Try it <ArrowRight size={14} />
              </div>
            </Link>
          ))}
          <div className="rounded-lg border-2 border-ink p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-ink/60">Good to know</div>
            <p className="mt-3 text-lg font-bold leading-snug">
              Idea Trunk isn't only the last step. Save an unfinished idea any time, return to develop it, or reopen it to
              find collaborators.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">Free to start. Premium when you grow.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Collaboration tools', 'Workspaces, mood boards, versions and project plans for artists and teams.'],
              ['Premium matching', 'Deeper resource matching and verified partner profiles for projects.'],
              ['Institutional plans', 'Museums, galleries, festivals and foundations publish programmes and find projects.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-white/20 p-6">
                <div className="text-xl font-bold text-indigo2-500">{t}</div>
                <p className="mt-2 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-white/50">Demo only — no payments are processed.</p>
        </div>
      </section>
    </div>
  )
}
