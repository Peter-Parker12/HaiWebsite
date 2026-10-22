import { Download, Link2, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip, PageHeader, ProgressBar } from '../components/ui'
import { budgetOf, money, notify, uid, useStore } from '../store/store'
import type { State, Task, TaskStatus } from '../store/types'

const START = new Date('2026-11-02')
const dateAt = (week: number) => {
  const d = new Date(START)
  d.setDate(d.getDate() + week * 7)
  return d.toISOString().slice(0, 10)
}
const COLS: TaskStatus[] = ['To do', 'In progress', 'Done']
const TOTAL_WEEKS = 24

const PHASE_TASKS: Record<string, string[]> = {
  p1: ['Audit local textile waste sources', 'Collect and catalogue offcuts'],
  p2: ['Confirm artist commissions', 'Produce the Gather, Transform and Reuse zones'],
  p3: ['Confirm exhibition venue', 'Sign partner agreements'],
  p4: ['Install the three zones'],
  p5: ['Run community repair workshops', 'Host open studio days'],
  p6: ['Document the process', 'Write the impact report'],
}

function generate(s: State): State {
  const owners = s.project.collaborators.filter((c) => c.role !== 'Viewer').map((c) => c.name)
  let i = 0
  const tasks: Task[] = []
  for (const p of s.plan.phases) {
    for (const title of PHASE_TASKS[p.id] ?? []) {
      tasks.push({ id: uid(), phaseId: p.id, title, owner: owners[i++ % owners.length], due: dateAt(p.startWeek + p.weeks), status: 'To do' })
    }
  }
  // Gaps from Resource Mapping become tasks automatically.
  for (const r of s.resources) {
    if (r.status === 'Secured') continue
    const p = s.plan.phases.find((x) => x.id === 'p3')!
    tasks.push({
      id: uid(),
      phaseId: p.id,
      title: `Secure: ${r.name}`,
      owner: owners[i++ % owners.length],
      due: dateAt(p.startWeek + p.weeks),
      status: r.status === 'Contacted' ? 'In progress' : 'To do',
    })
  }
  const firstLine = s.project.concept.split('\n').filter(Boolean)[0] ?? ''
  return notify(
    {
      ...s,
      plan: {
        ...s.plan,
        generated: true,
        tasks,
        objectives: `Deliver a three-zone installation and community programme. ${firstLine}`,
        audience: 'Local communities, schools and textile/fashion practitioners; art-going public.',
        outcomes: `${s.project.mood.length} reference directions realised, 3 installation zones, 6+ public workshops and an impact report.`,
      },
    },
    'Project plan generated from Idea Lab and Resource Mapping',
  )
}

export default function Activation() {
  const { state, update } = useStore()
  const { plan, project } = state
  const b = budgetOf(state)
  const done = plan.tasks.filter((t) => t.status === 'Done').length
  const patchPlan = (p: Partial<typeof plan>) => update((s) => ({ ...s, plan: { ...s.plan, ...p } }))
  const setTask = (id: string, p: Partial<Task>) => patchPlan({ tasks: plan.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) })

  const exportBrief = () => {
    const md = [
      `# ${project.title}`,
      '',
      `## Concept\n${project.concept}`,
      `## Objectives\n${plan.objectives}`,
      `## Target audience\n${plan.audience}`,
      `## Expected outcomes\n${plan.outcomes}`,
      '## Resources',
      ...state.resources.map((r) => `- ${r.name} — ${r.status}`),
      '## Tasks',
      ...plan.tasks.map((t) => `- [${t.status === 'Done' ? 'x' : ' '}] ${t.title} (${t.owner}, due ${t.due})`),
      `## Budget\nTotal ${money(b.total)} · Funded ${money(b.funded)} · Gap ${money(b.gap)}`,
    ].join('\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    a.download = 'project-brief.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader
        step="04 · Project Activation"
        title="Turn concepts into projects"
        desc="Build a project brief, tasks, timeline and budget from what the team has already entered."
        actions={
          <>
            <button className="btn-accent" onClick={() => update(generate)}>
              <Wand2 size={16} /> {plan.generated ? 'Regenerate plan' : 'Generate plan'}
            </button>
            {plan.generated && (
              <button className="btn-ghost" onClick={exportBrief}>
                <Download size={16} /> Export brief
              </button>
            )}
          </>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <Link2 size={16} className="text-indigo2-600" />
        <span>Concept from <Link to="/idea-lab" className="underline">Idea Lab</Link> ({project.directionAgreed ? 'direction agreed' : 'not yet agreed'})</span>
        <span>{state.resources.filter((r) => r.status !== 'Secured').length} open resources from <Link to="/resources" className="underline">Resource Mapping</Link></span>
        <span>{state.outreach.length} outreach items from <Link to="/discover" className="underline">Discover</Link></span>
      </div>

      {!plan.generated ? (
        <div className="card text-center text-sm text-ink/60">
          Press <strong>Generate plan</strong> to create the brief, tasks and timeline from the project data.
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="text-lg font-semibold">Project brief</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {(['objectives', 'audience', 'outcomes'] as const).map((k) => (
                <div key={k}>
                  <label className="label">{k === 'audience' ? 'Target audience' : k === 'outcomes' ? 'Expected outcomes' : 'Objectives'}</label>
                  <textarea className="input h-32" value={plan[k]} onChange={(e) => patchPlan({ [k]: e.target.value } as Partial<typeof plan>)} />
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <span className="text-xs text-ink/50">24 weeks from {dateAt(0)}</span>
            </div>
            <div className="mt-3 space-y-2">
              {plan.phases.map((p) => {
                const pt = plan.tasks.filter((t) => t.phaseId === p.id)
                const d = pt.filter((t) => t.status === 'Done').length
                return (
                  <div key={p.id} className="grid grid-cols-[10rem_1fr] items-center gap-3 text-xs sm:grid-cols-[16rem_1fr]">
                    <span className="truncate">{p.name}</span>
                    <div className="relative h-6 rounded bg-cloth-100">
                      <div
                        className="absolute top-0 flex h-6 items-center rounded bg-indigo2-500 px-2 text-white"
                        style={{ left: `${(p.startWeek / TOTAL_WEEKS) * 100}%`, width: `${(p.weeks / TOTAL_WEEKS) * 100}%` }}
                      >
                        {pt.length > 0 && `${d}/${pt.length}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <span className="text-xs text-ink/50">{done}/{plan.tasks.length} done</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {COLS.map((col) => (
                <div key={col} className="rounded-lg bg-cloth-50 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{col}</div>
                  <div className="space-y-2">
                    {plan.tasks.filter((t) => t.status === col).map((t) => (
                      <div key={t.id} className="rounded-lg border border-cloth-200 bg-white p-3 text-sm">
                        <div className="font-medium">{t.title}</div>
                        <div className="mt-1 text-xs text-ink/50">
                          {plan.phases.find((p) => p.id === t.phaseId)?.name}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <select className="input !py-1 text-xs" value={t.owner} onChange={(e) => setTask(t.id, { owner: e.target.value })}>
                            {project.collaborators.filter((c) => c.role !== 'Viewer').map((c) => <option key={c.id}>{c.name}</option>)}
                          </select>
                          <input type="date" className="input !py-1 text-xs" value={t.due} onChange={(e) => setTask(t.id, { due: e.target.value })} />
                        </div>
                        <select className="input mt-2 !py-1 text-xs" value={t.status} onChange={(e) => setTask(t.id, { status: e.target.value as TaskStatus })}>
                          {COLS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-4">
            <h2 className="text-lg font-semibold">Budget and funding gap</h2>
            <div className="mt-3 grid gap-6 md:grid-cols-2">
              <table className="w-full text-sm">
                <tbody>
                  {b.lines.map((l, i) => (
                    <tr key={i} className="border-b border-cloth-100">
                      <td className="py-2">{l.label}</td>
                      <td className="py-2 text-right">{money(l.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2">Total</td>
                    <td className="py-2 text-right">{money(b.total)}</td>
                  </tr>
                </tbody>
              </table>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Funded {money(b.funded)}</span>
                  <span className="font-semibold text-terra-600">Gap {money(b.gap)}</span>
                </div>
                <ProgressBar value={b.funded} max={b.total} tone="bg-moss-500" />
                <p className="mt-3 text-xs text-ink/60">
                  Costs come from Resource Mapping; funding comes from grants matched in Discover. Secure a grant there and this gap closes.
                </p>
                <Chip tone={b.gap === 0 ? 'Secured' : 'Partially funded'}>{b.gap === 0 ? 'Fully funded' : 'Funding gap open'}</Chip>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
