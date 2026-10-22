import { Bell, Compass, FolderArchive, Handshake, LayoutDashboard, Lightbulb, ListChecks, Rocket, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store/store'

const GROUPS = [
  { label: null, items: [{ to: '/dashboard', icon: LayoutDashboard, text: 'My Dashboard' }] },
  {
    label: 'Develop',
    items: [
      { to: '/idea-lab', icon: Lightbulb, text: '01 Idea Lab' },
      { to: '/resources', icon: ListChecks, text: '02 Resource Mapping' },
    ],
  },
  { label: 'Discover', items: [{ to: '/discover', icon: Handshake, text: '03 Discover & Match' }] },
  { label: 'Activate', items: [{ to: '/activation', icon: Rocket, text: '04 Project Activation' }] },
  { label: 'Preserve', items: [{ to: '/trunk', icon: FolderArchive, text: '05 Idea Trunk' }] },
]

export default function Layout() {
  const { state, update, reset } = useStore()
  const [open, setOpen] = useState(false)
  const unread = state.notices.filter((n) => !n.read).length

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-cloth-200 bg-white md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
            <Compass className="text-terra-500" size={22} /> ConceptBridge
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-4 md:overflow-visible md:pb-0">
          {GROUPS.map((g, i) => (
            <div key={i} className="flex gap-1 md:block">
              {g.label && (
                <div className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-ink/40 md:block">
                  {g.label}
                </div>
              )}
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                      isActive ? 'bg-indigo2-600 text-white' : 'text-ink/80 hover:bg-cloth-100'
                    }`
                  }
                >
                  <it.icon size={16} /> {it.text}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="relative flex items-center justify-between gap-3 border-b border-cloth-200 bg-white/70 px-5 py-3 backdrop-blur">
          <div className="min-w-0 truncate text-sm text-ink/60">
            Sample project · <span className="font-medium text-ink">{state.project.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                if (confirm('Reset the demo to its original sample data?')) reset()
              }}
            >
              <RotateCcw size={14} /> Reset demo
            </button>
            <button className="btn-ghost relative" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-terra-500 px-1.5 text-[10px] text-white">
                  {unread}
                </span>
              )}
            </button>
          </div>
          {open && (
            <div className="absolute right-5 top-14 z-40 w-80 rounded-xl border border-cloth-200 bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Notifications</div>
                <button
                  className="text-xs text-indigo2-600 hover:underline"
                  onClick={() => update((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }))}
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {state.notices.map((n) => (
                  <li key={n.id} className={`rounded-lg p-2 text-sm ${n.read ? 'text-ink/60' : 'bg-cloth-100'}`}>
                    {n.text}
                    <div className="text-xs text-ink/40">{n.date}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
