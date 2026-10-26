import { Heart, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, Modal, PageHeader, ProgressBar } from '../components/ui'
import { budgetOf, CROWD_COMMISSION, LICENCE_COMMISSION, money, notify, uid, useStore, useProjectPath } from '../store/store'
import type { MarketIdea, Resource } from '../store/types'

const BACKERS = ['A. Moreau', 'K. Sato', 'R. Obi', 'L. Fischer', 'M. Alvarez', 'J. Kim']
const PLEDGES = [25, 100, 500]

export default function Marketplace() {
  const pp = useProjectPath()
  const { state, update } = useStore()
  const [tab, setTab] = useState<'funding' | 'ideas'>('funding')
  const b = budgetOf(state)
  const c = state.campaign
  const [title, setTitle] = useState(`Fund: ${state.project.title}`)
  const [goal, setGoal] = useState(String(b.gap || 5000))
  const [reqFor, setReqFor] = useState<MarketIdea | null>(null)
  const [message, setMessage] = useState('')

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

  const sendRequest = () => {
    if (!reqFor) return
    update((s) =>
      notify(
        {
          ...s,
          ideaRequests: [
            ...s.ideaRequests,
            { id: uid(), ideaId: reqFor.id, kind: reqFor.mode === 'licensing' ? 'licence' : 'collaboration', message, status: 'Requested' },
          ],
        },
        `${reqFor.mode === 'licensing' ? 'Licence request' : 'Development proposal'} sent for "${reqFor.title}"`,
      ),
    )
    setReqFor(null)
    setMessage('')
  }

  return (
    <>
      <PageHeader
        step="03 · Partnership Matching"
        title="Funding and idea marketplace"
        desc="Raise capital for your project, discover documented ideas from other creators, and license concepts for development. Simulated — no real payments."
        actions={
          <Link to={pp('discover')} className="btn-ghost">
            Resource directory
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        <button className={tab === 'funding' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('funding')}>
          Crowdfunding
        </button>
        <button className={tab === 'ideas' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('ideas')}>
          Discover ideas
        </button>
      </div>

      {tab === 'funding' && (
        <>
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
                  {PLEDGES.map((p) => (
                    <button key={p} className="btn-primary" onClick={() => pledge(p)}>
                      <Heart size={14} /> Pledge {money(p)}
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
      )}

      {tab === 'ideas' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {state.marketIdeas.map((m) => {
              const req = state.ideaRequests.find((r) => r.ideaId === m.id)
              return (
                <div key={m.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{m.title}</h3>
                      <div className="text-xs text-ink/50">by {m.creator} · {m.stage}</div>
                    </div>
                    <Chip tone={m.mode === 'licensing' ? 'Partially funded' : 'Secured'}>
                      {m.mode === 'licensing' ? 'Available for licensing' : 'Open for collaboration'}
                    </Chip>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{m.summary}</p>
                  <div className="mt-2 text-xs text-ink/50">Documents: {m.docs.join(', ')}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {m.mode === 'licensing'
                        ? `Licence fee ${money(m.fee)} + ${LICENCE_COMMISSION}% platform commission on completion`
                        : 'Propose to develop it together'}
                    </span>
                    <button className="btn-primary !py-1" disabled={!!req} onClick={() => setReqFor(m)}>
                      {req ? req.status : m.mode === 'licensing' ? 'Request licence' : 'Propose to develop'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card h-fit">
            <h3 className="text-lg font-semibold">Your requests</h3>
            {state.ideaRequests.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">Proposals and licence requests appear here.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {state.ideaRequests.map((r) => {
                  const m = state.marketIdeas.find((x) => x.id === r.ideaId)
                  return (
                    <li key={r.id} className="rounded-lg border border-cloth-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{m?.title}</span>
                        <Chip>{r.status}</Chip>
                      </div>
                      <div className="text-xs text-ink/50">{r.kind === 'licence' ? 'Licence request' : 'Development proposal'}</div>
                      {r.status === 'Requested' && (
                        <div className="mt-2 flex gap-3">
                          <button
                            className="text-xs text-moss-700 hover:underline"
                            onClick={() =>
                              update((s) =>
                                notify(
                                  { ...s, ideaRequests: s.ideaRequests.map((x) => (x.id === r.id ? { ...x, status: 'Accepted' } : x)) },
                                  `${m?.creator} accepted your ${r.kind === 'licence' ? 'licence request' : 'proposal'} for "${m?.title}"`,
                                ),
                              )
                            }
                          >
                            Simulate: accepted
                          </button>
                          <button
                            className="text-xs text-ink/50 hover:underline"
                            onClick={() =>
                              update((s) => ({ ...s, ideaRequests: s.ideaRequests.map((x) => (x.id === r.id ? { ...x, status: 'Declined' } : x)) }))
                            }
                          >
                            Simulate: declined
                          </button>
                        </div>
                      )}
                      {r.status === 'Accepted' && r.kind === 'licence' && m && (
                        <div className="mt-2 rounded bg-cloth-100 p-2 text-xs">
                          Licence agreed: fee {money(m.fee)}, platform commission {money((m.fee * LICENCE_COMMISSION) / 100)}.
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink/50">
              Want to share your own idea here? Make it public in <Link to={pp('archive')} className="underline">Idea Trunk</Link>.
            </p>
          </div>
        </div>
      )}

      {reqFor && (
        <Modal title={reqFor.mode === 'licensing' ? `Request licence: ${reqFor.title}` : `Propose: ${reqFor.title}`} onClose={() => setReqFor(null)}>
          <div className="space-y-3">
            <textarea
              className="input h-28"
              placeholder="Describe how you would develop or use the concept."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-ink/60">
              Licences cover the documented material ({reqFor.docs.join(', ')}), not the abstract idea itself.
            </p>
            <button className="btn-primary w-full" onClick={sendRequest}>
              Send (simulated)
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
