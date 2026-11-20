import { Search } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { HeroMoss, MossCushion } from '../components/Moss'
import ProjectCard, { NEED_LABEL, openNeeds } from '../components/ProjectCard'
import Reveal, { CountUp } from '../components/Reveal'
import { Loading, Page } from '../components/ui'
import { useRoot } from '../store/store'
import type { ProjectStatus, ResType } from '../store/types'

const STATUS: ('All' | ProjectStatus)[] = ['All', 'Seeking support', 'Running', 'Closed']

const FAQ = [
  ['What is Terrarium?', 'Terrarium is the place where an idea becomes a project. Artists, curators and cultural practitioners list what a project still needs, and sponsors browse and back it.'],
  ['Does AI come up with the ideas?', 'No. People make every creative decision. The platform provides the shared workspace, planning tools and a network of resources.'],
  ['How can a sponsor help a project?', 'Express interest, offer in-kind support such as a venue, materials or mentoring, or keep a project on a watchlist. The creator decides whether to accept.'],
  ['Is this real money?', 'No. This is a demo prototype with no real payments. Funding, pledges and commissions are simulated.'],
]

const HOW = [
  ['1', 'Develop', 'Creators build the concept with their team, then map the skills, venues and funding still missing.'],
  ['2', 'Get discovered', 'Projects that need support are listed here with exactly what is missing, so sponsors can see where they can help.'],
  ['3', 'Make it happen', 'Sponsors offer funds, space, materials or mentoring. Creators accept, plan the work and track progress.'],
]

/** Staggers siblings by 55ms, as the motion rules ask. */
const stagger = (i: number) => ({ ['--i' as string]: i }) as CSSProperties

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
  const { root, user, sponsor, dataReady } = useRoot()
  const f = useFilters()
  const [showFilters, setShowFilters] = useState(false)
  const activeFilters = [f.discipline, f.location, f.stage].filter(Boolean).length + f.needs.length + (f.status !== 'Seeking support' ? 1 : 0)
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
      {/* Hero: a 13:8 band. Copy takes the golden major (61.8%), the art the minor (38.2%) and rests on the lower edge. */}
      <section className="border-b border-cloth-200 bg-cloth-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 pt-16 lg:grid-cols-[61.8fr_38.2fr] lg:items-end lg:pt-24">
          <div className="enter pb-4 lg:pb-24">
            <div className="eyebrow-hero">Independent art, made possible</div>
            <h1 className="display-xl mt-4 max-w-[16ch]">Back the creative projects that need you.</h1>
            <p className="body-lg mt-5 max-w-xl text-ink/70">
              Artists, curators and cultural practitioners bring ideas to life here. Browse the projects looking for venues,
              funding, skills and mentors, and help one get made.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#projects" className="btn-primary">Browse projects</a>
              {!sponsor && <Link to={user ? '/my-projects' : '/register'} className="btn-accent">Start a project</Link>}
              {!user && !sponsor && <Link to="/sponsor/register" className="btn-ghost">I'm a sponsor</Link>}
            </div>
          </div>
          <div className="justify-self-start lg:justify-self-end">
            <HeroMoss className="block h-auto w-48 lg:w-full lg:max-w-md" />
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
          ].map(([n, l], i) => (
            <Reveal key={l as string} i={i}>
              <CountUp value={Number(n)} className="data-lg block" />
              <div className="text-sm leading-5 text-ink/70">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl px-5 py-12">
        <Reveal><h2 className="section-title">Project directory</h2></Reveal>
        <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="space-y-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-ink/70" aria-hidden="true" />
              <input className="input !pl-9" placeholder="Search projects" aria-label="Search projects" value={f.q} onChange={(e) => f.setQ(e.target.value)} />
            </div>
            <button className="btn-ghost w-full lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
              {showFilters ? 'Hide filters' : `Filters${activeFilters ? ` (${activeFilters} active)` : ''}`}
            </button>
            <div className={`space-y-5 ${showFilters ? '' : 'hidden'} lg:block`}>
            <div>
              <div className="label">Status</div>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                {STATUS.map((s) => (
                  <button
                    key={s}
                    onClick={() => f.setStatus(s)}
                    aria-pressed={f.status === s}
                    className={`rounded text-sm transition-colors duration-150 ${
                      f.status === s ? 'font-semibold text-ink underline decoration-terra-500 decoration-2 underline-offset-4' : 'text-ink/70 hover:text-ink'
                    }`}
                  >
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
                    className="accent-indigo2-600"
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
                <label className="label">{label as string}</label>
                <select className="input" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}>
                  <option value="">Any</option>
                  {(opts as string[]).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            </div>
          </aside>

          <div>
            <div className="data-micro mb-3 text-ink/70">{dataReady ? `${results.length} project${results.length === 1 ? '' : 's'} listed` : 'Loading…'}</div>
            {!dataReady ? (
              <Loading />
            ) : results.length === 0 ? (
              <div className="card flex flex-col items-center py-10 text-center">
                <MossCushion state="dormant" width={144} height={55} seed={5} />
                <p className="mt-4 text-sm text-ink/70">No projects match. Try clearing a filter.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((p, i) => (
                  <Reveal key={p.id} i={i % 3} className="h-full">
                    <ProjectCard rec={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-cloth-200 bg-cloth-100">
        <Page wide>
          <Reveal><h2 className="section-title">How it works</h2></Reveal>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {HOW.map(([n, t, d]) => (
              <Reveal key={n} i={Number(n) - 1} className="h-full">
                <div className="card h-full">
                  <div className="wide-md">{n}</div>
                  <div className="card-title mt-3">{t}</div>
                  <p className="mt-2 text-sm leading-5 text-ink/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Page>
      </section>

      <section>
        <Page>
          <Reveal><h2 className="section-title">Frequently asked questions</h2></Reveal>
          <Reveal i={1} className="mt-6">
          <div className="divide-y divide-cloth-200 rounded-lg border border-cloth-200 bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-4">
                <summary className="card-title cursor-pointer list-none rounded">{q}</summary>
                <p className="mt-2 text-sm leading-5 text-ink/70">{a}</p>
              </details>
            ))}
          </div>
          </Reveal>
        </Page>
      </section>
    </>
  )
}
