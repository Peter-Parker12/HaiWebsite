import { ArrowLeft, ArrowRight, Check, Compass, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { uid, useRoot } from '../store/store'
import type { User, UserRole } from '../store/types'

const ROLES: UserRole[] = ['Artist', 'Curator', 'Cultural practitioner', 'Organisation representative']
const GOALS = ['Develop ideas', 'Find resources', 'Raise funds', 'License or share ideas', 'Offer my expertise']
const STEPS = ['Account', 'About you', 'Portfolio']

export function AuthShell({
  title,
  sub,
  children,
  headline = 'From a creative idea to a project that can happen.',
  blurb = 'Develop ideas together, find the resources you are missing, and turn concepts into real projects.',
}: {
  title: string
  sub: string
  children: ReactNode
  headline?: string
  blurb?: string
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-cloth-100 p-10 md:flex">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Compass className="text-terra-500" size={24} /> ConceptBridge
        </Link>
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">{headline}</h2>
          <p className="mt-4 max-w-md text-ink/70">{blurb}</p>
        </div>
        <p className="text-xs text-ink/50">Demo only — accounts are stored in your browser, nothing is sent anywhere.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-extrabold md:hidden">
            <Compass className="text-terra-500" size={22} /> ConceptBridge
          </Link>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  const { signUpUser, loginUser, loginGoogle } = useRoot()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [pw, setPw] = useState('')
  const [agree, setAgree] = useState(false)
  const [u, setU] = useState<Omit<User, 'id' | 'portfolio'>>({
    name: '', email: '', role: 'Artist', discipline: '', location: '', bio: '', goals: [],
  })
  const [portfolio, setPortfolio] = useState<User['portfolio']>([])
  const [pf, setPf] = useState({ title: '', url: '' })

  const set = <K extends keyof typeof u>(k: K, v: (typeof u)[K]) => setU({ ...u, [k]: v } as typeof u)

  const next = () => {
    setErr('')
    if (step === 0) {
      if (!u.name.trim()) return setErr('Please enter your name.')
      if (!/^\S+@\S+\.\S+$/.test(u.email)) return setErr('Please enter a valid email address.')
      if (pw.length < 8) return setErr('Password must be at least 8 characters.')
      if (!agree) return setErr('Please accept the terms to continue.')
    }
    if (step === 1 && !u.discipline.trim()) return setErr('Tell us your discipline or field.')
    setStep(step + 1)
  }

  if (done) {
    return (
      <AuthShell title={`Welcome, ${u.name.split(' ')[0]}`} sub="Your account is ready.">
        <div className="rounded-lg bg-moss-100 p-4 text-sm">
          <Check className="mb-2 text-moss-700" size={20} />
          Create your first project to start developing the idea, mapping resources and finding sponsors. You can also load a
          filled-in sample project from the Project page.
        </div>
        <button className="btn-primary mt-5 w-full !py-3" onClick={() => nav('/my-projects')}>
          Create your first project <ArrowRight size={16} />
        </button>
        <Link to="/" className="mt-3 block text-center text-sm underline">Browse projects</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" sub="Free to start. Takes about a minute.">
      {step === 0 && (
        <>
          <button
            type="button"
            className="btn-ghost w-full !py-3"
            onClick={() => {
              loginGoogle()
              nav('/')
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7a14.500 14.500 0 010-9.400l-7.900-6.100a24 24 0 000 21.600l7.900-6.100z" />
              <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
            </svg>
            Continue with Google
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-cloth-200" /> or sign up with email <span className="h-px flex-1 bg-cloth-200" />
          </div>
        </>
      )}
      <ol className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 border-t-4 pt-2 text-xs font-semibold ${i <= step ? 'border-terra-500' : 'border-cloth-200 text-ink/40'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (step < 2) return next()
          signUpUser({ ...u, portfolio })
          setDone(true)
        }}
      >
        {step === 0 && (
          <>
            <div>
              <label className="label">Full name</label>
              <input className="input" value={u.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={u.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
              <p className="mt-1 text-xs text-ink/50">Demo only: the password is not stored.</p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              I agree to the terms and understand that I keep ownership of my work and can choose who sees it.
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => set('role', r)}
                    className={`rounded-lg border p-3 text-left text-sm font-medium ${u.role === r ? 'border-indigo2-600 bg-indigo-50' : 'border-cloth-200'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Discipline</label>
                <input className="input" placeholder="e.g. Textile art" value={u.discipline} onChange={(e) => set('discipline', e.target.value)} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="City or region" value={u.location} onChange={(e) => set('location', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Short bio</label>
              <textarea className="input h-20" value={u.bio} onChange={(e) => set('bio', e.target.value)} />
            </div>
            <div>
              <label className="label">What do you want to do first?</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const on = u.goals.includes(g)
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => set('goals', on ? u.goals.filter((x) => x !== g) : [...u.goals, g])}
                      className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-terra-500 bg-orange-50' : 'border-cloth-300'}`}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-ink/70">Add links to past work. You can skip this and add it later from your profile.</p>
            <ul className="space-y-2">
              {portfolio.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-cloth-200 p-3 text-sm">
                  <span>{p.title}</span>
                  <button type="button" aria-label="Remove" onClick={() => setPortfolio(portfolio.filter((x) => x.id !== p.id))}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input className="input" placeholder="Title" value={pf.title} onChange={(e) => setPf({ ...pf, title: e.target.value })} />
              <input className="input" placeholder="Link" value={pf.url} onChange={(e) => setPf({ ...pf, url: e.target.value })} />
              <button
                type="button"
                className="btn-ghost"
                aria-label="Add"
                onClick={() => {
                  if (!pf.title.trim()) return
                  setPortfolio([...portfolio, { id: uid(), ...pf }])
                  setPf({ title: '', url: '' })
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </>
        )}

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button className="btn-primary flex-1 !py-3">{step < 2 ? 'Continue' : 'Create account'}</button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-ink/70">
        Already have an account? <Link to="/login" className="font-semibold underline">Log in</Link>
      </p>
      <button
        className="mt-2 block w-full text-center text-sm text-ink/60 underline"
        onClick={() => {
          loginUser('u1')
          nav('/')
        }}
      >
        Skip and explore with a demo account
      </button>
    </AuthShell>
  )
}
