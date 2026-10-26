import { ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProjectCard, { NEED_LABEL, openNeeds } from '../components/ProjectCard'
import { Page } from '../components/ui'
import { useRoot } from '../store/store'
import type { ProjectStatus, ResType } from '../store/types'

const STATUS: ('All' | ProjectStatus)[] = ['All', 'Seeking support', 'Running', 'Closed']

const FAQ = [
  ['What is ConceptBridge?', 'A platform where artists, curators and cultural practitioners develop ideas together, find the resources they are missing, and turn concepts into projects. Sponsors browse projects that need help.'],
  ['Does AI come up with the ideas?', 'No. People make every creative decision. The platform provides the shared workspace, planning tools and a network of resources.'],
  ['How can a sponsor help a project?', 'Express interest, offer in-kind support such as a venue, materials or mentoring, or keep a project on a watchlist. The creator decides whether to accept.'],
  ['Who owns an idea I share?', 'You do. An idea on its own is generally not protected by copyright, but its documented form can be. Licensing covers documents and agreed uses only.'],
  ['Is this real money?', 'No. This is a demo prototype. Funding, pledges and commissions are simulated.'],
]

function useFilters() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | ProjectStatus>('Seeking support')
  const [discipline, setDiscipline] = useState('')
  const [location, setLocation] = useState('')
  const [stage, setStage] = useState('')
  const [needs, setNeeds] = useState<ResType[]>([])
  return { q, setQ, status, setStatus, discipline, setDiscipline, location, setLocation, stage, setStage, needs, setNeeds }
}

export default function Home() {
  const { root, user, sponsor } = useRoot()
  const f = useFilters()
  const listed = root.projects.filter((p) => p.listed)
  const uniq = (fn: (p: (typeof listed)[number]) => string) => [...new Set(listed.map(fn))].sort()

  const results = useMemo(
    () =>
      listed.filter((p) => {
        if (f.status !== 'All' && p.status !== f.status) return false
        if (f.discipline && p.discipline !== f.discipline) return false
        if (f.location && p.location !== f.location) return false
        if (f.stage && p.stage !== f.stage) return false
        if (f.needs.length && !openNeeds(p).some((r) => f.needs.includes(r.type))) return false
        if (f.q && !`${p.ws.project.title} ${p.oneLiner} ${p.tags.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false
        return true
      }),
    [listed, f.status, f.discipline, f.location, f.stage, f.needs, f.q],
  )

  const secured = root.projects.reduce((a, p) => a + p.ws.resources.filter((r) => r.status === 'Secured').length, 0)

  return (
    <>
      <section className="border-b border-cloth-200 bg-cloth-100">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="text-sm font-bold uppercase tracking-widest text-terra-500">Independent art, made possible</div>
          <h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-[1.05] md:text-6xl">
            Back the creative projects that need you.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink/70">
            Artists, curators and cultural practitioners bring ideas to life here. Browse the projects looking for venues,
            funding, skills and mentors — and help one get made.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className="btn-primary !px-6 !py-3 !text-base">
              Browse projects <ArrowRight size={18} />
            </a>
            {!user && !sponsor && (
              <>
                <Link to="/register" className="btn-accent !px-6 !py-3 !text-base">Start a project</Link>
                <Link to="/sponsor/register" className="btn-ghost !px-6 !py-3 !text-base">I'm a sponsor</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-cloth-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-6 md:grid-cols-4">
          {[
            [listed.length, 'projects listed'],
            [listed.filter((p) => p.status === 'Seeking support').length, 'seeking support'],
            [root.sponsors.length, 'sponsors'],
            [secured, 'resources secured'],
          ].map(([n, l]) => (
            <div key={l as string}>
              <div className="text-3xl font-extrabold">{n}</div>
              <div className="text-sm text-ink/60">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="text-3xl font-extrabold">Project directory</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="space-y-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-ink/40" />
              <input className="input !pl-9" placeholder="Search projects" value={f.q} onChange={(e) => f.setQ(e.target.value)} />
            </div>
            <div>
              <div className="label">Status</div>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                {STATUS.map((s) => (
                  <button key={s} onClick={() => f.setStatus(s)} className={`text-sm ${f.status === s ? 'font-bold underline' : 'text-ink/70'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="label">Support needed</div>
              {(Object.keys(NEED_LABEL) as ResType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 py-0.5 text-sm">
                  <input
                    type="checkbox"
                    checked={f.needs.includes(t)}
                    onChange={(e) => f.setNeeds(e.target.checked ? [...f.needs, t] : f.needs.filter((x) => x !== t))}
                  />
                  {NEED_LABEL[t]}
                </label>
              ))}
            </div>
            {[
              ['Discipline', f.discipline, f.setDiscipline, uniq((p) => p.discipline)],
              ['Location', f.location, f.setLocation, uniq((p) => p.location)],
              ['Stage', f.stage, f.setStage, uniq((p) => p.stage)],
            ].map(([label, val, set, opts]) => (
              <div key={label as string}>
                <div className="label">{label as string}</div>
                <select className="input" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}>
                  <option value="">Any</option>
                  {(opts as string[]).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </aside>

          <div>
            <div className="mb-3 text-sm text-ink/60">{results.length} project{results.length === 1 ? '' : 's'}</div>
            {results.length === 0 ? (
              <div className="card text-sm text-ink/60">No projects match. Try clearing a filter.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => <ProjectCard key={p.id} rec={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-cloth-200 bg-cloth-100">
        <Page wide>
          <h2 className="text-3xl font-extrabold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['1. Develop', 'Creators build the concept with their team, then map the skills, venues and funding still missing.'],
              ['2. Get discovered', 'Projects that need support are listed here with exactly what is missing, so sponsors can see where they can help.'],
              ['3. Make it happen', 'Sponsors offer funds, space, materials or mentoring. Creators accept, plan the work and track progress.'],
            ].map(([t, d]) => (
              <div key={t} className="card">
                <div className="text-lg font-bold">{t}</div>
                <p className="mt-2 text-sm text-ink/70">{d}</p>
              </div>
            ))}
          </div>
        </Page>
      </section>

      <section>
        <Page>
          <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-cloth-200 rounded-lg border border-cloth-200 bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-4">
                <summary className="cursor-pointer list-none text-base font-semibold">{q}</summary>
                <p className="mt-2 text-sm text-ink/70">{a}</p>
              </details>
            ))}
          </div>
        </Page>
      </section>
    </>
  )
}
