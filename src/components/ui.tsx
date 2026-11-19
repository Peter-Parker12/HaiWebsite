import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Status chips: a pastel fill with its 800-weight text, paired with the state's own word.
 * Moss (green) is used only for needs that have been met: Secured, Accepted, Done, Supporting.
 */
const TONES: Record<string, string> = {
  // project
  'Seeking support': 'bg-orange-100 text-orange-800',
  Running: 'bg-blue-100 text-blue-800',
  Closed: 'bg-gray-200 text-gray-600',
  Supporting: 'bg-moss-100 text-moss-700',
  // resource and outreach
  Missing: 'bg-red-100 text-red-700',
  Contacted: 'bg-amber-100 text-amber-800',
  Requested: 'bg-amber-100 text-amber-800',
  'Partially funded': 'bg-orange-100 text-orange-800',
  Secured: 'bg-moss-100 text-moss-700',
  Accepted: 'bg-moss-100 text-moss-700',
  Unavailable: 'bg-gray-200 text-gray-600',
  Declined: 'bg-gray-200 text-gray-600',
  Saved: 'bg-indigo-100 text-indigo-800',
  // task
  'To do': 'bg-gray-100 text-gray-700',
  'In progress': 'bg-blue-100 text-blue-800',
  Done: 'bg-moss-100 text-moss-700',
  // visibility and tier
  public: 'bg-sky-100 text-sky-800',
  verified: 'bg-emerald-100 text-emerald-800',
  private: 'bg-purple-100 text-purple-800',
  collaborators: 'bg-amber-100 text-amber-800',
  // role
  Owner: 'bg-indigo2-600 text-white',
  Editor: 'bg-indigo-100 text-indigo-800',
  Collaborator: 'bg-cloth-200 text-ink',
  Viewer: 'bg-gray-100 text-gray-600',
}

export function Chip({ children, tone }: { children: ReactNode; tone?: string }) {
  const key = tone ?? String(children)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-4 transition-colors duration-150 ${
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
        <div className="eyebrow">{step}</div>
        <h1 className="page-title mt-1">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-ink/70">{desc}</p>
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
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-cloth-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="heading">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink transition-colors duration-150 hover:bg-cloth-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** A hairline track with a fill. Money is terra-500; use moss-500 only for met needs. */
export function ProgressBar({ value, max, tone = 'bg-moss-500' }: { value: number; max: number; tone?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cloth-200" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={`h-full origin-left animate-extend ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-5 py-8 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>{children}</div>
}

export function Loading() {
  return <div className="py-24 text-center text-sm text-ink/70">Loading…</div>
}
