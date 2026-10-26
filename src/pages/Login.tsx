import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRoot } from '../store/store'
import { AuthShell } from './Register'

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn-ghost w-full !py-3" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
      </svg>
      Continue with Google
    </button>
  )
}

export default function Login() {
  const { root, loginUser, loginGoogle } = useRoot()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  return (
    <AuthShell title="Log in" sub="Welcome back.">
      <GoogleButton
        onClick={() => {
          loginGoogle()
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
          const u = root.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
          if (!u) return setErr('No account found for that email in this browser. Create one or use the demo account.')
          if (!pw) return setErr('Enter your password.')
          loginUser(u.id)
          nav(from)
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
        <button className="btn-primary w-full !py-3">Log in</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/70">
        New here? <Link to="/register" className="font-semibold underline">Create an account</Link> ·{' '}
        <Link to="/sponsor/login" className="font-semibold underline">Sponsor login</Link>
      </p>
      <button
        className="mt-2 block w-full text-center text-sm text-ink/60 underline"
        onClick={() => {
          loginUser('u1')
          nav(from)
        }}
      >
        Continue with a demo account
      </button>
    </AuthShell>
  )
}
