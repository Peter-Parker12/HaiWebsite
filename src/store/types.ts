export type Role = 'Owner' | 'Editor' | 'Collaborator' | 'Viewer'

export interface Collaborator {
  id: string
  name: string
  role: Role
  discipline: string
}

export interface MoodItem {
  id: string
  title: string
  note: string
  color: string
}

export interface Frame {
  id: string
  caption: string
}

export interface Comment {
  id: string
  author: string
  text: string
  decision: boolean
}

export interface Version {
  id: string
  label: string
  date: string
  concept: string
}

export interface Project {
  title: string
  tagline: string
  concept: string
  collaborators: Collaborator[]
  mood: MoodItem[]
  frames: Frame[]
  comments: Comment[]
  versions: Version[]
  directionAgreed: boolean
}

export type ResType = 'Skill' | 'Venue' | 'Funding' | 'Expertise'
export type ResStatus = 'Missing' | 'Contacted' | 'Secured' | 'Partially funded' | 'Unavailable'

export interface Resource {
  id: string
  name: string
  type: ResType
  status: ResStatus
  /** Estimated cost; for Funding resources, the target amount to raise. */
  budget: number
  /** Funding resources only: amount raised so far. */
  funded: number
}

export type Tier = 'public' | 'verified' | 'private'

export interface Entry {
  id: string
  name: string
  kind: 'Person' | 'Organisation' | 'Funding'
  tier: Tier
  resourceType: ResType
  discipline: string
  location: string
  stage: string
  expertise: string
  about: string
  /** Typical cost for people/venues, or grant size for funding. */
  amount: number
  contact?: string
}

export type OutStatus = 'Saved' | 'Requested' | 'Accepted' | 'Declined'

export interface Outreach {
  id: string
  entryId: string
  resourceId?: string
  status: OutStatus
  message?: string
  date: string
}

export type TaskStatus = 'To do' | 'In progress' | 'Done'

export interface Phase {
  id: string
  name: string
  startWeek: number
  weeks: number
}

export interface Task {
  id: string
  phaseId: string
  title: string
  owner: string
  due: string
  status: TaskStatus
}

export interface BudgetLine {
  id: string
  label: string
  amount: number
}

export interface Plan {
  generated: boolean
  objectives: string
  audience: string
  outcomes: string
  phases: Phase[]
  tasks: Task[]
  extraLines: BudgetLine[]
}

export type Visibility = 'private' | 'collaborators' | 'public'
export type TrunkMode = 'none' | 'collaboration' | 'licensing'

export interface Licence {
  use: string
  territory: string
  term: string
  attribution: string
}

export interface TrunkItem {
  id: string
  title: string
  summary: string
  stage: string
  visibility: Visibility
  mode: TrunkMode
  licence: Licence
  creator: string
  contributors: string[]
  history: { date: string; text: string }[]
}

export interface Notice {
  id: string
  text: string
  date: string
  read: boolean
}

export interface State {
  project: Project
  resources: Resource[]
  directory: Entry[]
  outreach: Outreach[]
  /** Private entries the user has been granted access to (consent simulated). */
  consents: string[]
  plan: Plan
  trunk: TrunkItem[]
  notices: Notice[]
}
