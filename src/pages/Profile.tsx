import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Chip, Page, PageHeader } from '../components/ui'
import { uid, useRoot } from '../store/store'
import type { User } from '../store/types'

export default function Profile() {
  const { setRoot, user } = useRoot()
  const [pf, setPf] = useState({ title: '', url: '' })
  if (!user) return null
  const patch = (p: Partial<User>) => setRoot((r) => ({ ...r, users: r.users.map((u) => (u.id === user.id ? { ...u, ...p } : u)) }))

  return (
    <Page>
      <PageHeader step="Account" title="Your profile" desc="Collaborators and sponsors see this when you invite them or send requests." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo2-600 text-lg font-bold text-white">
              {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-ink/60">{user.email}</div>
            </div>
            <Chip tone="Editor">{user.role}</Chip>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={user.name} onChange={(e) => patch({ name: e.target.value })} />
            </div>
            <div>
              <label className="label">Discipline</label>
              <input className="input" value={user.discipline} onChange={(e) => patch({ discipline: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={user.location} onChange={(e) => patch({ location: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={user.role} onChange={(e) => patch({ role: e.target.value as User['role'] })}>
                <option>Artist</option>
                <option>Curator</option>
                <option>Cultural practitioner</option>
                <option>Organisation representative</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Bio</label>
            <textarea className="input h-24" value={user.bio} onChange={(e) => patch({ bio: e.target.value })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.goals.map((g) => <Chip key={g} tone="Collaborator">{g}</Chip>)}
          </div>
        </div>

        <div className="card h-fit">
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <ul className="mt-3 space-y-2">
            {user.portfolio.length === 0 && <li className="text-sm text-ink/60">No work added yet.</li>}
            {user.portfolio.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-cloth-200 p-3 text-sm">
                <a href={p.url || '#'} target="_blank" rel="noreferrer" className="underline">{p.title}</a>
                <button aria-label="Remove" onClick={() => patch({ portfolio: user.portfolio.filter((x) => x.id !== p.id) })}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!pf.title.trim()) return
              patch({ portfolio: [...user.portfolio, { id: uid(), ...pf }] })
              setPf({ title: '', url: '' })
            }}
          >
            <input className="input" placeholder="Title" value={pf.title} onChange={(e) => setPf({ ...pf, title: e.target.value })} />
            <input className="input" placeholder="Link" value={pf.url} onChange={(e) => setPf({ ...pf, url: e.target.value })} />
            <button className="btn-primary w-full"><Plus size={14} /> Add work</button>
          </form>
        </div>
      </div>
    </Page>
  )
}
