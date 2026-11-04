/**
 * Project type templates. Pure data and functions with no imports, so the browser forms
 * and the server validation can share one definition.
 *
 * Rules (agreed with the product owner):
 *  - A project has one primary type and at most one secondary type (MAX_TYPES = 2).
 *  - Mandatory fields = core fields + the mandatory fields of each selected type (duplicate keys asked once).
 *  - Mandatory fields only gate "Listed on Home"; drafts can stay incomplete.
 *  - Start/end dates are optional.
 *  - Type-specific details are visible to everyone who opens a project; cards show the core summary only.
 */

export const MAX_TYPES = 2

export type FieldKind = 'text' | 'longtext' | 'number' | 'choice' | 'list'

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  options?: string[]
  unit?: string
  hint?: string
  /** A required long-text field can instead be satisfied by an uploaded document. */
  orDocument?: boolean
}

export type ProjectTypeId =
  | 'installation'
  | 'exhibition'
  | 'performance'
  | 'festival'
  | 'film'
  | 'public'
  | 'residency'
  | 'publication'
  | 'other'

export interface TypeDef {
  id: ProjectTypeId
  label: string
  description: string
  /** Labels for the Idea Lab sections, which differ by type. */
  referenceBoard: string
  storyboard: string
  /** Minimum number of uploaded artwork images needed to list (0 = none). */
  minArtworkImages?: number
  fields: FieldDef[]
}

export const STAGES = ['Concept', 'Planning', 'Documented', 'Delivery', 'Completed'] as const

const f = (key: string, label: string, kind: FieldKind, required: boolean, extra: Partial<FieldDef> = {}): FieldDef => ({
  key, label, kind, required, ...extra,
})

const accessibility = f('accessibilityNotes', 'Accessibility notes', 'longtext', false)

export const PROJECT_TYPES: TypeDef[] = [
  {
    id: 'installation',
    label: 'Installation / visual art',
    description: 'Sculpture, installation, painting or other visual work.',
    referenceBoard: 'Mood board',
    storyboard: 'Visitor journey',
    minArtworkImages: 1,
    fields: [
      f('dimensions', 'Dimensions', 'text', true, { hint: 'e.g. 6 m × 4 m × 3 m' }),
      f('materials', 'Materials', 'list', true),
      f('siteRequirements', 'Site requirements', 'longtext', true),
      f('installDays', 'Installation time', 'number', true, { unit: 'days' }),
      f('insurance', 'Insurance needs', 'text', false),
      accessibility,
    ],
  },
  {
    id: 'exhibition',
    label: 'Exhibition (curated)',
    description: 'A curated show of one or several artists.',
    referenceBoard: 'Curatorial references',
    storyboard: 'Visitor journey',
    fields: [
      f('curatorialStatement', 'Curatorial statement', 'longtext', true),
      f('runDates', 'Run dates', 'text', true, { hint: 'e.g. 4 Jul – 30 Aug 2027' }),
      f('venueRequirement', 'Venue requirement', 'text', true, { hint: 'Size or type of space' }),
      f('artistCount', 'Number of artists', 'number', true),
      f('loansInsurance', 'Loans and insurance', 'text', false),
      accessibility,
    ],
  },
  {
    id: 'performance',
    label: 'Performance / live event',
    description: 'Theatre, dance, music or other live work.',
    referenceBoard: 'Sound and visual references',
    storyboard: 'Run of show',
    fields: [
      f('durationMinutes', 'Duration', 'number', true, { unit: 'minutes' }),
      f('castCrew', 'Cast and crew size', 'number', true),
      f('audienceCapacity', 'Audience capacity', 'number', true),
      f('techNeeds', 'Technical needs', 'longtext', true),
      f('rehearsalPlan', 'Rehearsal plan', 'longtext', false),
      accessibility,
    ],
  },
  {
    id: 'festival',
    label: 'Festival',
    description: 'A multi-day programme of events.',
    referenceBoard: 'Programme references',
    storyboard: 'Run of show',
    fields: [
      f('editionDates', 'Edition dates', 'text', true),
      f('expectedAttendance', 'Expected attendance', 'number', true),
      f('programmeOutline', 'Programme outline', 'longtext', true),
      f('accessPlan', 'Access plan summary', 'longtext', true),
      f('permits', 'Permits and licences', 'text', false),
      f('pastEditions', 'Past editions', 'text', false),
    ],
  },
  {
    id: 'film',
    label: 'Film / media',
    description: 'Film, video, animation or digital media.',
    referenceBoard: 'Look-book',
    storyboard: 'Storyboard',
    fields: [
      f('runtimeMinutes', 'Runtime', 'number', true, { unit: 'minutes' }),
      f('format', 'Format', 'choice', true, { options: ['Short', 'Documentary', 'Feature', 'Series', 'Animation', 'Installation film', 'Other'] }),
      f('productionStage', 'Production stage', 'choice', true, { options: ['Development', 'Pre-production', 'Shoot', 'Post-production', 'Distribution'] }),
      f('treatment', 'Treatment', 'longtext', true, { orDocument: true, hint: 'Write it here or upload a PDF' }),
      f('rightsStatus', 'Rights status', 'choice', true, { options: ['Original work', 'Rights cleared', 'Rights in progress', 'Adaptation'] }),
      f('sampleLinks', 'Sample footage links', 'list', false),
    ],
  },
  {
    id: 'public',
    label: 'Public / community art',
    description: 'Participatory or site-specific work with a community.',
    referenceBoard: 'Site references',
    storyboard: 'Participation plan',
    fields: [
      f('site', 'Site', 'text', true),
      f('permissionStatus', 'Permission status', 'choice', true, { options: ['Not started', 'In discussion', 'Granted'] }),
      f('communityPartners', 'Community partners', 'list', true),
      f('expectedParticipants', 'Expected participants', 'number', true),
      f('safeguarding', 'Safety and consent plan', 'longtext', false),
      accessibility,
    ],
  },
  {
    id: 'residency',
    label: 'Residency / education programme',
    description: 'A residency, course or learning programme.',
    referenceBoard: 'Programme references',
    storyboard: 'Session plan',
    fields: [
      f('lengthWeeks', 'Length', 'number', true, { unit: 'weeks' }),
      f('cohortSize', 'Cohort size', 'number', true),
      f('outcomes', 'Intended outcomes', 'longtext', true),
      f('participantCriteria', 'Participant criteria', 'longtext', true),
      f('mentors', 'Mentors and tutors', 'list', false),
    ],
  },
  {
    id: 'publication',
    label: 'Publication / research',
    description: 'A book, journal, archive or research project.',
    referenceBoard: 'Reference library',
    storyboard: 'Structure',
    fields: [
      f('pubFormat', 'Format', 'choice', true, { options: ['Book', 'Journal', 'Zine', 'Catalogue', 'Digital', 'Archive', 'Other'] }),
      f('pubLength', 'Length', 'text', true, { hint: 'Pages or words' }),
      f('language', 'Language', 'text', true),
      f('rightsHolder', 'Rights holder', 'text', true),
      f('distribution', 'Distribution plan', 'longtext', false),
    ],
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Anything that does not fit the types above.',
    referenceBoard: 'Mood board',
    storyboard: 'Storyboard',
    fields: [],
  },
]

export const typeById = (id: string): TypeDef | undefined => PROJECT_TYPES.find((t) => t.id === id)

/** Fields to show for a set of types: duplicates collapse, and required wins over optional. */
export function fieldsFor(types: string[]): FieldDef[] {
  const out = new Map<string, FieldDef>()
  for (const id of types.slice(0, MAX_TYPES)) {
    for (const fld of typeById(id)?.fields ?? []) {
      const prev = out.get(fld.key)
      if (!prev || (fld.required && !prev.required)) out.set(fld.key, fld)
    }
  }
  return [...out.values()]
}

/** What the project page needs before it can go on Home. Everything except dates. */
export interface ListingInput {
  title: string
  oneLiner: string
  story: string
  types: string[]
  discipline: string
  location: string
  stage: string
  needsCount: number
  coverImages: number
  artworkImages: number
  documents: number
  details: Record<string, unknown>
}

export interface Missing {
  key: string
  label: string
}

const filled = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? !Number.isNaN(v) : typeof v === 'string' ? v.trim().length > 0 : v != null

/** Returns what is still missing; an empty list means the project may be listed. */
export function missingForListing(p: ListingInput, opts: { requireMedia?: boolean } = {}): Missing[] {
  const requireMedia = opts.requireMedia ?? true
  const m: Missing[] = []
  const need = (ok: boolean, key: string, label: string) => {
    if (!ok) m.push({ key, label })
  }
  need(p.title.trim().length > 0, 'title', 'Title')
  need(p.oneLiner.trim().length > 0 && p.oneLiner.trim().length <= 140, 'oneLiner', 'One-line pitch (up to 140 characters)')
  need(p.story.trim().length >= 300, 'story', 'Story (at least 300 characters)')
  need(p.types.length >= 1 && p.types.length <= MAX_TYPES, 'types', 'Project type (one primary, at most one secondary)')
  need(p.discipline.trim().length > 0, 'discipline', 'Discipline')
  need(p.location.trim().length > 0, 'location', 'Location')
  need((STAGES as readonly string[]).includes(p.stage), 'stage', 'Stage')
  if (requireMedia) need(p.coverImages >= 1, 'cover', 'Cover image')
  need(p.needsCount >= 1, 'needs', 'At least one resource need')

  const minArt = Math.max(0, ...p.types.slice(0, MAX_TYPES).map((id) => typeById(id)?.minArtworkImages ?? 0))
  if (requireMedia && minArt > 0) need(p.artworkImages >= minArt, 'artworkImages', `At least ${minArt} artwork image${minArt > 1 ? 's' : ''}`)

  for (const fld of fieldsFor(p.types)) {
    if (!fld.required) continue
    const ok = filled(p.details[fld.key]) || (fld.orDocument === true && p.documents > 0)
    need(ok, fld.key, fld.label)
  }
  return m
}
