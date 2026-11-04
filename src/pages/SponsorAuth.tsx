import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRoot } from '../store/store'
import type { SponsorType } from '../store/types'
import { AuthShell } from './Register'

const HEAD = {
  headline: 'Find creative projects worth backing.',
  blurb: 'Browse projects that need funding, space, materials or mentoring, and track the ones you support.',
}

export function SponsorLogin() {
  const { loginSponsor, demoLogin, demo } = useRoot()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      nav(from)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sponsor login" sub="For foundations, companies and individuals who support the arts." {...HEAD}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!email.trim() || !pw) return setErr('Enter your email and password.')
          void run(() => loginSponsor(email, pw))
        }}
      >
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/70">
        New sponsor? <Link to="/sponsor/register" className="font-semibold underline">Register</Link> ·{' '}
        <Link to="/login" className="font-semibold underline">Creator login</Link>
      </p>
      {demo && (
        <button className="mt-2 block w-full text-center text-sm text-ink/60 underline" disabled={busy} onClick={() => void run(() => demoLogin('sponsor'))}>
          Continue with a demo sponsor
        </button>
      )}
    </AuthShell>
  )
}

export function SponsorRegister() {
  const { signUpSponsor } = useRoot()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', type: 'Foundation' as SponsorType, focus: '', regions: '', ticket: '', bio: '' })
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)

  return (
    <AuthShell title="Register as a sponsor" sub="Tell creators who you are and what you like to support." {...HEAD}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!f.name.trim()) return setErr('Please enter your name or organisation.')
          if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.')
          if (pw.length < 8) return setErr('Password must be at least 8 characters.')
          setErr('')
          setBusy(true)
          try {
            await signUpSponsor({ name: f.name, email: f.email, type: f.type, focus: list(f.focus), regions: list(f.regions), ticket: f.ticket, bio: f.bio, password: pw })
            nav('/')
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : 'Something went wrong.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <div>
          <label className="label">Name or organisation</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Foundation', 'Company', 'Individual'] as SponsorType[]).map((t) => (
              <button type="button" key={t} onClick={() => setF({ ...f, type: t })} className={`rounded-lg border p-2 text-sm font-medium ${f.type === t ? 'border-indigo2-600 bg-indigo-50' : 'border-cloth-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Areas you support (comma separated)</label>
          <input className="input" placeholder="Textiles, Community arts" value={f.focus} onChange={(e) => setF({ ...f, focus: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Regions</label>
            <input className="input" placeholder="Europe, UK" value={f.regions} onChange={(e) => setF({ ...f, regions: e.target.value })} />
          </div>
          <div>
            <label className="label">Typical support</label>
            <input className="input" placeholder="$2,000 – $10,000" value={f.ticket} onChange={(e) => setF({ ...f, ticket: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">About you</label>
          <textarea className="input h-20" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'Creating account…' : 'Create sponsor account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/70">
        Already registered? <Link to="/sponsor/login" className="font-semibold underline">Log in</Link>
      </p>
    </AuthShell>
  )
}
