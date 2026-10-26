import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { budgetOf, money, useRoot } from '../store/store'
import type { ProjectRecord } from '../store/types'
import { Chip, ProgressBar } from './ui'

export const NEED_LABEL = {
  Funding: 'Funding',
  Venue: 'Venue / space',
  Skill: 'Skills / people',
  Expertise: 'Expertise / mentoring',
} as const

export function openNeeds(rec: ProjectRecord) {
  return rec.ws.resources.filter((r) => r.status !== 'Secured')
}

export default function ProjectCard({ rec, to }: { rec: ProjectRecord; to?: string }) {
  const { root } = useRoot()
  const owner = root.users.find((u) => u.id === rec.ownerId)
  const needs = openNeeds(rec)
  const b = budgetOf(rec.ws)

  return (
    <Link to={to ?? `/projects/${rec.id}`} className="card flex flex-col transition hover:border-terra-400 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-snug">{rec.ws.project.title}</h3>
        <Chip>{rec.status}</Chip>
      </div>
      <div className="mt-1 text-xs text-ink/50">
        by {owner?.name ?? 'Unknown'} · <MapPin size={11} className="inline" /> {rec.location}
      </div>
      <p className="mt-2 flex-1 text-sm text-ink/70">{rec.oneLiner}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {rec.tags.map((t) => (
          <span key={t} className="rounded bg-cloth-100 px-2 py-0.5 text-xs text-ink/70">{t}</span>
        ))}
      </div>
      {rec.status === 'Seeking support' && needs.length > 0 && (
        <div className="mt-3 text-xs text-ink/60">
          Needs: {needs.slice(0, 3).map((n) => n.name).join(', ')}
          {needs.length > 3 && ` +${needs.length - 3} more`}
        </div>
      )}
      {b.total > 0 && (
        <div className="mt-3">
          <ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" />
          <div className="mt-1 text-xs text-ink/50">{money(b.funded)} of {money(b.total)} funded</div>
        </div>
      )}
    </Link>
  )
}
