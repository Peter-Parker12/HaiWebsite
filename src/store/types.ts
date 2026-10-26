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
export type EntryKind = 'Person' | 'Organisation' | 'Funding' | 'Donor' | 'Sponsor' | 'Mentor'

export interface Entry {
  id: string
  name: string
  kind: EntryKind
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
  /** Verified profiles: operating regions, areas of interest, collaboration types they consider. */
  regions?: string[]
  interests?: string[]
  collabTypes?: string[]
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

export interface Campaign {
  title: string
  goal: number
  pledged: number
  commissionPct: number
  backers: { name: string; amount: number }[]
}

export interface Proposal {
  id: string
  trunkId: string
  from: string
  message: string
  kind: 'collaboration' | 'licence'
  status: 'Pending' | 'Accepted' | 'Declined'
}

export interface LicenceDeal {
  id: string
  trunkId: string
  licensee: string
  docs: string[]
  fee: number
  commissionPct: number
  date: string
}

export interface MarketIdea {
  id: string
  title: string
  summary: string
  creator: string
  stage: string
  mode: 'collaboration' | 'licensing'
  fee: number
  docs: string[]
}

export interface IdeaRequest {
  id: string
  ideaId: string
  kind: 'collaboration' | 'licence'
  message: string
  status: 'Requested' | 'Accepted' | 'Declined'
}

export interface Notice {
  id: string
  text: string
  date: string
  read: boolean
}

export type UserRole = 'Artist' | 'Curator' | 'Cultural practitioner' | 'Organisation representative'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  discipline: string
  location: string
  bio: string
  goals: string[]
  portfolio: { id: string; title: string; url: string }[]
}

/** Everything that belongs to a single project. */
export interface Workspace {
  project: Project
  resources: Resource[]
  outreach: Outreach[]
  plan: Plan
  campaign: Campaign | null
  proposals: Proposal[]
  trunk: TrunkItem[]
}

/** What the workspace pages see: the active project plus shared data. */
export interface State extends Workspace {
  user: User | null
  directory: Entry[]
  /** Private entries the user has been granted access to (consent simulated). */
  consents: string[]
  licences: LicenceDeal[]
  marketIdeas: MarketIdea[]
  ideaRequests: IdeaRequest[]
  notices: Notice[]
}

export type ProjectStatus = 'Seeking support' | 'Running' | 'Closed'

export interface ProjectRecord {
  id: string
  ownerId: string
  status: ProjectStatus
  /** Shown on the public Home directory. */
  listed: boolean
  oneLiner: string
  discipline: string
  location: string
  stage: string
  tags: string[]
  updates: { date: string; text: string }[]
  ws: Workspace
}

export type SponsorType = 'Foundation' | 'Company' | 'Individual'

export interface Sponsor {
  id: string
  name: string
  email: string
  type: SponsorType
  focus: string[]
  regions: string[]
  ticket: string
  bio: string
}

export interface Support {
  id: string
  projectId: string
  byKind: 'user' | 'sponsor'
  byId: string
  kind: 'interest' | 'in-kind'
  resourceId?: string
  message: string
  status: 'Requested' | 'Accepted' | 'Declined'
  date: string
}

export interface Session {
  kind: 'user' | 'sponsor' | null
  id: string
}

/** The whole persisted app state. */
export interface Root {
  users: User[]
  sponsors: Sponsor[]
  session: Session
  projects: ProjectRecord[]
  supports: Support[]
  watchlist: { sponsorId: string; projectId: string }[]
  directory: Entry[]
  consents: string[]
  licences: LicenceDeal[]
  marketIdeas: MarketIdea[]
  ideaRequests: IdeaRequest[]
  notices: Notice[]
}
