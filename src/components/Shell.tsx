import { Bell, Compass, LogOut, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useRoot } from '../store/store'

type NavItem = { to: string; text: string; end?: boolean }

function Navbar() {
  const { root, setRoot, user, sponsor, logout, reset } = useRoot()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const kind = user ? 'user' : sponsor ? 'sponsor' : null

  const items: NavItem[] =
    kind === 'user'
      ? [
          { to: '/', text: 'Home', end: true },
          { to: '/my-projects', text: 'Project' },
          { to: '/catalogue', text: 'My Catalogue' },
          { to: '/account', text: 'Account' },
        ]
      : kind === 'sponsor'
        ? [
            { to: '/', text: 'Browse projects', end: true },
            { to: '/sponsor/investments', text: 'My investments' },
            { to: '/sponsor/watchlist', text: 'Watchlist' },
            { to: '/sponsor/account', text: 'Account' },
          ]
        : [
            { to: '/', text: 'Home', end: true },
          ]

  const unread = root.notices.filter((n) => !n.read).length
  const name = (user?.name ?? sponsor?.name ?? '').split(' ')[0]

  return (
    <header className="sticky top-0 z-30 border-b border-cloth-200 bg-cloth-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Compass className="text-terra-500" size={24} /> ConceptBridge
          {kind === 'sponsor' && <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Sponsor</span>}
        </Link>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${isActive ? 'bg-ink text-white' : 'text-ink/70 hover:bg-cloth-100'}`
              }
            >
              {it.text}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {kind === null ? (
            <>
              <Link to="/sponsor/login" className="hidden text-sm font-semibold hover:underline sm:inline">For sponsors</Link>
              <Link to="/login" className="btn-ghost !py-1.5">Log in</Link>
              <Link to="/register" className="btn-primary !py-1.5">Register</Link>
            </>
          ) : (
            <>
              <button className="btn-ghost !px-2 !py-1.5" title="Reset demo data" onClick={() => confirm('Reset all demo data to the original sample data?') && reset()}>
                <RotateCcw size={14} />
              </button>
              <div className="relative">
                <button className="btn-ghost relative !px-2 !py-1.5" aria-label="Notifications" onClick={() => setOpen((o) => !o)}>
                  <Bell size={16} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-terra-500 px-1.5 text-[10px] text-white">{unread}</span>}
                </button>
                {open && (
                  <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-cloth-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">Notifications</div>
                      <button className="text-xs text-indigo2-600 hover:underline" onClick={() => setRoot((r) => ({ ...r, notices: r.notices.map((n) => ({ ...n, read: true })) }))}>
                        Mark all read
                      </button>
                    </div>
                    <ul className="max-h-72 space-y-2 overflow-y-auto">
                      {root.notices.slice(0, 15).map((n) => (
                        <li key={n.id} className={`rounded-lg p-2 text-sm ${n.read ? 'text-ink/60' : 'bg-cloth-100'}`}>
                          {n.text}
                          <div className="text-xs text-ink/40">{n.date}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <span className="hidden text-sm font-semibold sm:inline">{name}</span>
              <button
                className="btn-ghost !px-2 !py-1.5"
                aria-label="Log out"
                onClick={() => {
                  logout()
                  nav('/')
                }}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-cloth-200 py-8 text-center text-xs text-ink/50">
        ConceptBridge · demo prototype · no real payments
      </footer>
    </div>
  )
}

export function RequireUser() {
  const { user } = useRoot()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

export function RequireSponsor() {
  const { sponsor } = useRoot()
  const loc = useLocation()
  if (!sponsor) return <Navigate to="/sponsor/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}
