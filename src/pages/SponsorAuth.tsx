import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRoot } from '../store/store'
import type { SponsorType } from '../store/types'
import { GoogleButton } from './Login'
import { AuthShell } from './Register'

const HEAD = {
  headline: 'Find creative projects worth backing.',
  blurb: 'Browse projects that need funding, space, materials or mentoring, and track the ones you support.',
}

export function SponsorLogin() {
  const { root, loginSponsor, signUpSponsor } = useRoot()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  return (
    <AuthShell title="Sponsor login" sub="For foundations, companies and individuals who support the arts." {...HEAD}>
      <GoogleButton
        onClick={() => {
          const s = root.sponsors.find((x) => x.email === 'sponsor@gmail.com')
          if (s) loginSponsor(s.id)
          else signUpSponsor({ name: 'Google Sponsor', email: 'sponsor@gmail.com', type: 'Individual', focus: [], regions: [], ticket: '', bio: '' })
          nav(from)
        }}
      />
      <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-cloth-200" /> or log in with email <span className="h-px flex-1 bg-cloth-200" />
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const s = root.sponsors.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
          if (!s) return setErr('No sponsor account found for that email. Register or use the demo sponsor.')
          if (!pw) return setErr('Enter your password.')
          loginSponsor(s.id)
          nav(from)
        }}
      >
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full !py-3">Log in</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/70">
        New sponsor? <Link to="/sponsor/register" className="font-semibold underline">Register</Link> ·{' '}
        <Link to="/login" className="font-semibold underline">Creator login</Link>
      </p>
      <button
        className="mt-2 block w-full text-center text-sm text-ink/60 underline"
        onClick={() => {
          loginSponsor('s1')
          nav(from)
        }}
      >
        Continue with a demo sponsor
      </button>
    </AuthShell>
  )
}

export function SponsorRegister() {
  const { signUpSponsor } = useRoot()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', type: 'Foundation' as SponsorType, focus: '', regions: '', ticket: '', bio: '' })
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)

  return (
    <AuthShell title="Register as a sponsor" sub="Tell creators who you are and what you like to support." {...HEAD}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.name.trim()) return setErr('Please enter your name or organisation.')
          if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.')
          if (pw.length < 8) return setErr('Password must be at least 8 characters.')
          signUpSponsor({ name: f.name, email: f.email, type: f.type, focus: list(f.focus), regions: list(f.regions), ticket: f.ticket, bio: f.bio })
          nav('/')
        }}
      >
        <div>
          <label className="label">Name or organisation</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
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
        <button className="btn-primary w-full !py-3">Create sponsor account</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/70">
        Already registered? <Link to="/sponsor/login" className="font-semibold underline">Log in</Link>
      </p>
    </AuthShell>
  )
}
