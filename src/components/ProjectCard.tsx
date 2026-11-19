import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { typeById } from '../store/projectTypes'
import { budgetOf, money } from '../store/store'
import type { ProjectRecord } from '../store/types'
import { MossCushion } from './Moss'
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

/**
 * A terrarium is a glass frame around a small living world, and so is this card: a white pane with a
 * hairline edge holding one project. Funding stays terra-500 (money). A small moss cushion appears in the
 * corner only when every need is secured.
 */
export default function ProjectCard({ rec, to }: { rec: ProjectRecord; to?: string }) {
  const needs = openNeeds(rec)
  const b = budgetOf(rec.ws)
  const allSecured = rec.ws.resources.length > 0 && needs.length === 0

  return (
    <Link
      to={to ?? `/projects/${rec.id}`}
      className="card relative flex h-full flex-col overflow-hidden transition duration-150 ease-standard hover:border-terra-400 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="card-title">{rec.ws.project.title}</h3>
        <Chip>{rec.status}</Chip>
      </div>
      <div className="caption mt-1 text-ink/70">
        by {rec.ownerName ?? 'Unknown'} · <MapPin size={11} className="inline" aria-hidden="true" /> {rec.location}
      </div>
      {rec.types.length > 0 && (
        <div className="caption mt-1 font-medium text-terra-600">
          {typeById(rec.types[0])?.label ?? rec.types[0]}
          {rec.types.length > 1 && ` +${rec.types.length - 1}`}
        </div>
      )}
      <p className="mt-2 flex-1 text-sm leading-5 text-ink/70">{rec.oneLiner}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {rec.tags.map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      {rec.status === 'Seeking support' && needs.length > 0 && (
        <div className="caption mt-3 text-ink/70">
          Needs: {needs.slice(0, 3).map((n) => n.name).join(', ')}
          {needs.length > 3 && ` +${needs.length - 3} more`}
        </div>
      )}
      {b.total > 0 && (
        <div className="mt-3">
          <ProgressBar value={b.funded} max={b.total} tone="bg-terra-500" />
          <div className="data-micro mt-1 text-ink/70">{money(b.funded)} of {money(b.total)} funded</div>
        </div>
      )}
      {allSecured && <MossCushion state="secured" width={55} height={21} seed={3} className="absolute bottom-0 right-3" />}
    </Link>
  )
}
