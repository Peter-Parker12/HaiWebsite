import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRoot } from '../store/store'
import { AuthShell } from './Register'

export default function Login() {
  const { loginUser, demoLogin, demo } = useRoot()
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
    <AuthShell title="Log in" sub="Welcome back.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!email.trim() || !pw) return setErr('Enter your email and password.')
          void run(() => loginUser(email, pw))
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
        New here? <Link to="/register" className="font-semibold underline">Create an account</Link> ·{' '}
        <Link to="/sponsor/login" className="font-semibold underline">Sponsor login</Link>
      </p>
      {demo && (
        <button className="mt-2 block w-full text-center text-sm text-ink/60 underline" disabled={busy} onClick={() => void run(() => demoLogin('user'))}>
          Continue with a demo account
        </button>
      )}
    </AuthShell>
  )
}
