import { Heart, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, ProgressBar } from '../components/ui'
import { budgetOf, CROWD_COMMISSION, money, notify, uid, useProjectPath, useStore } from '../store/store'
import type { Resource } from '../store/types'

const BACKERS = ['A. Moreau', 'K. Sato', 'R. Obi', 'L. Fischer', 'M. Alvarez', 'J. Kim']
const PLEDGES = [25, 100, 500]

export default function Marketplace() {
  const pp = useProjectPath()
  const { state, update } = useStore()
  const b = budgetOf(state)
  const c = state.campaign
  const [title, setTitle] = useState(`Fund: ${state.project.title}`)
  const [goal, setGoal] = useState(String(b.gap || 5000))

  const pledge = (amount: number) =>
    update((s) => {
      if (!s.campaign) return s
      const name = BACKERS[s.campaign.backers.length % BACKERS.length]
      const net = amount * (1 - s.campaign.commissionPct / 100)
      let applied = false
      const resources = s.resources.map((r): Resource => {
        if (applied || r.type !== 'Funding') return r
        applied = true
        const funded = r.funded + net
        return { ...r, funded, status: funded >= r.budget ? 'Secured' : 'Partially funded' }
      })
      return notify(
        {
          ...s,
          resources,
          campaign: { ...s.campaign, pledged: s.campaign.pledged + amount, backers: [{ name, amount }, ...s.campaign.backers] },
        },
        `${name} pledged ${money(amount)} to your campaign`,
      )
    })

  return (
    <>
      <PageHeader
        step="Funding"
        title="Crowdfunding"
        desc="Raise capital for this project. Simulated — no real payments."
      />

      {!c ? (
        <div className="card max-w-xl">
          <h2 className="text-lg font-semibold">Launch a campaign</h2>
          <p className="mt-1 text-sm text-ink/60">
            The suggested goal is the current funding gap from Resource Mapping ({money(b.gap)}). The platform keeps{' '}
            {CROWD_COMMISSION}% of contributions.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Campaign title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Goal ($)</label>
              <input className="input" type="number" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <button
              className="btn-accent"
              onClick={() =>
                update((s) =>
                  notify(
                    { ...s, campaign: { title, goal: Number(goal) || 0, pledged: 0, commissionPct: CROWD_COMMISSION, backers: [] } },
                    'Crowdfunding campaign launched',
                  ),
                )
              }
            >
              <Megaphone size={16} /> Launch campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold">{c.title}</h2>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-bold">{money(c.pledged)}</div>
              <div className="text-sm text-ink/60">of {money(c.goal)} goal</div>
            </div>
            <div className="mt-2">
              <ProgressBar value={c.pledged} max={c.goal} />
            </div>
            <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink/50">Simulate a pledge</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLEDGES.map((amt) => (
                <button key={amt} className="btn-primary" onClick={() => pledge(amt)}>
                  <Heart size={14} /> Pledge {money(amt)}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-cloth-100 p-3 text-sm">
              Platform commission ({c.commissionPct}%): <strong>{money(Math.round((c.pledged * c.commissionPct) / 100))}</strong> · Net to
              project: <strong>{money(Math.round((c.pledged * (100 - c.commissionPct)) / 100))}</strong>
            </div>
            <p className="mt-3 text-xs text-ink/60">
              Net pledges are added to "Production funding" in <Link to={pp('resources')} className="underline">Resource Mapping</Link>, so the
              funding gap in <Link to={pp('activation')} className="underline">Project Activation</Link> shrinks.
            </p>
          </div>
          <div className="card h-fit">
            <h3 className="text-lg font-semibold">Backers ({c.backers.length})</h3>
            {c.backers.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">No pledges yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {c.backers.map((bk, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{bk.name}</span>
                    <span className="font-medium">{money(bk.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
