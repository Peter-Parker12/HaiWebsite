import { X } from 'lucide-react'
import type { ReactNode } from 'react'

const TONES: Record<string, string> = {
  // resource / outreach / task statuses
  Missing: 'bg-red-100 text-red-700',
  Contacted: 'bg-amber-100 text-amber-800',
  Requested: 'bg-amber-100 text-amber-800',
  Secured: 'bg-moss-100 text-moss-700',
  Accepted: 'bg-moss-100 text-moss-700',
  Done: 'bg-moss-100 text-moss-700',
  'Partially funded': 'bg-orange-100 text-orange-800',
  'In progress': 'bg-blue-100 text-blue-800',
  Saved: 'bg-indigo-100 text-indigo-800',
  Unavailable: 'bg-gray-200 text-gray-600',
  Declined: 'bg-gray-200 text-gray-600',
  'To do': 'bg-gray-100 text-gray-700',
  // tiers & visibility
  public: 'bg-sky-100 text-sky-800',
  verified: 'bg-emerald-100 text-emerald-800',
  private: 'bg-purple-100 text-purple-800',
  collaborators: 'bg-amber-100 text-amber-800',
  // roles
  Owner: 'bg-indigo2-600 text-white',
  Editor: 'bg-indigo-100 text-indigo-800',
  Collaborator: 'bg-cloth-200 text-ink',
  Viewer: 'bg-gray-100 text-gray-600',
}

export function Chip({ children, tone }: { children: ReactNode; tone?: string }) {
  const key = tone ?? String(children)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        TONES[key] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {children}
    </span>
  )
}

export function PageHeader({
  step,
  title,
  desc,
  actions,
}: {
  step: string
  title: string
  desc: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-terra-500">{step}</div>
        <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/70">{desc}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-cloth-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ProgressBar({ value, max, tone = 'bg-moss-500' }: { value: number; max: number; tone?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cloth-200">
      <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
