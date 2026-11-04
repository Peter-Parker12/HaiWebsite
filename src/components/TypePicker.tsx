import { MAX_TYPES, PROJECT_TYPES, typeById } from '../store/projectTypes'

/** One primary type, plus an optional secondary type for mixed projects. */
export default function TypePicker({ value, onChange }: { value: string[]; onChange: (types: string[]) => void }) {
  const [primary = '', secondary = ''] = value
  const set = (p: string, s: string) => onChange([p, s].filter(Boolean).slice(0, MAX_TYPES))

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Primary type</label>
        <select className="input" value={primary} onChange={(e) => set(e.target.value, secondary === e.target.value ? '' : secondary)}>
          <option value="">Choose a type</option>
          {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        {primary && <p className="mt-1 text-xs text-ink/50">{typeById(primary)?.description}</p>}
      </div>
      <div>
        <label className="label">Secondary type (optional)</label>
        <select className="input" value={secondary} disabled={!primary} onChange={(e) => set(primary, e.target.value)}>
          <option value="">None</option>
          {PROJECT_TYPES.filter((t) => t.id !== primary && t.id !== 'other').map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
    </div>
  )
}
