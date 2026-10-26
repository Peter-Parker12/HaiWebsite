import { demoUser, seed } from './seed'
import type {
  Collaborator,
  ProjectRecord,
  ProjectStatus,
  ResStatus,
  ResType,
  Resource,
  Root,
  Sponsor,
  Task,
  TaskStatus,
  User,
  Workspace,
} from './types'

type ResSpec = [name: string, type: ResType, status: ResStatus, budget: number, funded?: number]

/** Build a fresh workspace; used by the seed and by "New project". */
export function emptyWorkspace(opts: {
  title: string
  tagline: string
  concept: string
  owner: { name: string; discipline: string }
  resources?: ResSpec[]
  team?: Collaborator[]
}): Workspace {
  const specs: ResSpec[] = opts.resources ?? [['Production funding', 'Funding', 'Missing', 5000, 0]]
  const resources: Resource[] = specs.map(
    ([name, type, status, budget, funded = 0], i) => ({ id: `r${i + 1}`, name, type, status, budget, funded }),
  )
  return {
    project: {
      title: opts.title,
      tagline: opts.tagline,
      concept: opts.concept,
      directionAgreed: false,
      collaborators: [{ id: 'c1', name: opts.owner.name, role: 'Owner', discipline: opts.owner.discipline }, ...(opts.team ?? [])],
      mood: [],
      frames: [],
      comments: [],
      versions: [],
    },
    resources,
    outreach: [],
    plan: { ...structuredClone(seed.plan), generated: false, tasks: [], objectives: '', audience: '', outcomes: '' },
    campaign: null,
    proposals: [],
    trunk: [],
  }
}

function withTasks(ws: Workspace, statuses: TaskStatus[]): Workspace {
  const owner = ws.project.collaborators[0].name
  const tasks: Task[] = statuses.map((status, i) => {
    const phase = ws.plan.phases[Math.min(i, ws.plan.phases.length - 1)]
    return { id: `t${i}`, phaseId: phase.id, title: `${phase.name} — step ${i + 1}`, owner, due: '2026-12-01', status }
  })
  return { ...ws, plan: { ...ws.plan, generated: true, tasks, objectives: ws.project.tagline, audience: 'Local communities and arts audiences.', outcomes: 'Delivered project and documentation.' } }
}

function users(): User[] {
  const mk = (id: string, name: string, role: User['role'], discipline: string, location: string, bio: string): User => ({
    id, name, email: `${name.split(' ')[0].toLowerCase()}@example.org`, role, discipline, location, bio, goals: [], portfolio: [],
  })
  return [
    demoUser,
    mk('u2', 'Aiko Tanaka', 'Artist', 'Textile art', 'Manchester', 'Weaver working with reclaimed fibre.'),
    mk('u3', 'Daniel Okoye', 'Cultural practitioner', 'Community education', 'Bristol', 'Runs community studios.'),
    mk('u4', 'Priya Nair', 'Curator', 'Curation', 'Edinburgh', 'Curator of paper-based work.'),
    mk('u5', 'Ines Carvalho', 'Artist', 'Architecture and installation', 'Lisbon', 'Site-specific installations.'),
    mk('u6', 'Studio Hush', 'Organisation representative', 'Performance', 'Berlin', 'Collective making low-sensory performance.'),
    mk('u7', 'Amara Diallo', 'Artist', 'Public art', 'London', 'Participatory public artworks.'),
  ]
}

function sponsors(): Sponsor[] {
  return [
    { id: 's1', name: 'Alder Family Foundation', email: 'grants@alder.example.org', type: 'Foundation', focus: ['Circular economy', 'Community arts'], regions: ['Europe', 'United Kingdom'], ticket: '$5,000 – $20,000', bio: 'Family foundation funding community-facing arts with an environmental angle.' },
    { id: 's2', name: 'Northline Textiles Co.', email: 'csr@northline.example.org', type: 'Company', focus: ['Reuse of production waste', 'Textiles'], regions: ['United Kingdom'], ticket: 'Materials and up to $3,000', bio: 'Fabric manufacturer offering offcuts and sponsorship in exchange for visible credit.' },
    { id: 's3', name: 'Margaret Whitcombe', email: 'office@whitcombe.example.org', type: 'Individual', focus: ['Contemporary textile art'], regions: ['London'], ticket: '$10,000+', bio: 'Private patron of contemporary textile art.' },
  ]
}

function project(
  id: string,
  ownerId: string,
  status: ProjectStatus,
  meta: Pick<ProjectRecord, 'oneLiner' | 'discipline' | 'location' | 'stage' | 'tags'>,
  ws: Workspace,
  updates: ProjectRecord['updates'] = [],
): ProjectRecord {
  return { id, ownerId, status, listed: true, ...meta, updates, ws }
}

function mini(title: string, tagline: string, ownerName: string, discipline: string, resources: ResSpec[], team: Collaborator[] = []) {
  return emptyWorkspace({
    title,
    tagline,
    concept: `${tagline}\n\nThe team is documenting the concept, working out the resources needed and looking for partners to make it real.`,
    owner: { name: ownerName, discipline },
    resources,
    team,
  })
}

export const rootSeed: Root = {
  users: users(),
  sponsors: sponsors(),
  session: { kind: null, id: '' },
  projects: [
    project(
      'p1', 'u1', 'Seeking support',
      { oneLiner: seed.project.tagline, discipline: 'Textile art', location: 'London', stage: 'Planning', tags: ['Sustainability', 'Installation', 'Community'] },
      { project: seed.project, resources: seed.resources, outreach: seed.outreach, plan: seed.plan, campaign: seed.campaign, proposals: seed.proposals, trunk: seed.trunk },
      [{ date: '2026-10-12', text: 'Artist and curator confirmed. Still looking for a venue and a sustainability consultant.' }],
    ),
    project(
      'p2', 'u1', 'Running',
      { oneLiner: 'A six-month residency where makers share one open loom studio.', discipline: 'Textile art', location: 'London', stage: 'Delivery', tags: ['Residency', 'Community'] },
      withTasks(mini('Community Loom Residency', 'A six-month residency where makers share one open loom studio.', 'Mai Tran', 'Curation', [['Studio space', 'Venue', 'Secured', 4000], ['Resident weavers', 'Skill', 'Secured', 3000], ['Residency funding', 'Funding', 'Secured', 9000, 9000]]), ['Done', 'Done', 'In progress', 'To do']),
      [{ date: '2026-10-01', text: 'Second cohort of weavers started.' }],
    ),
    project(
      'p3', 'u1', 'Closed',
      { oneLiner: 'Residents recorded and mapped the sounds of their streets.', discipline: 'Sound art', location: 'Bristol', stage: 'Completed', tags: ['Sound', 'Public art'] },
      withTasks(mini('Neighbourhood Sound Map', 'Residents recorded and mapped the sounds of their streets.', 'Mai Tran', 'Curation', [['Sound engineer', 'Skill', 'Secured', 1500], ['Grant', 'Funding', 'Secured', 6000, 6000]]), ['Done', 'Done', 'Done', 'Done', 'Done', 'Done']),
      [{ date: '2026-06-30', text: 'Project closed. Final report published.' }],
    ),
    project(
      'p4', 'u5', 'Seeking support',
      { oneLiner: 'A floating reading room that rises and falls with the tide.', discipline: 'Architecture and installation', location: 'Lisbon', stage: 'Documented', tags: ['Installation', 'Public space'] },
      mini('Tidal Library', 'A floating reading room that rises and falls with the tide.', 'Ines Carvalho', 'Architecture', [['Structural engineer', 'Expertise', 'Missing', 3500], ['Harbour permit partner', 'Venue', 'Missing', 2000], ['Build funding', 'Funding', 'Partially funded', 20000, 6000]]),
      [{ date: '2026-09-28', text: 'Site study completed with the port authority.' }],
    ),
    project(
      'p5', 'u6', 'Seeking support',
      { oneLiner: 'A festival of low-sensory performances for neurodivergent audiences.', discipline: 'Performance', location: 'Berlin', stage: 'Planning', tags: ['Festival', 'Accessibility'] },
      mini('Quiet Hours Festival', 'A festival of low-sensory performances for neurodivergent audiences.', 'Studio Hush', 'Performance', [['Accessible venue', 'Venue', 'Missing', 7000], ['Access consultant', 'Expertise', 'Missing', 2500], ['Festival funding', 'Funding', 'Partially funded', 25000, 5000]]),
    ),
    project(
      'p6', 'u7', 'Seeking support',
      { oneLiner: 'A community artwork where visitors swap seeds and stories.', discipline: 'Public art', location: 'London', stage: 'Concept', tags: ['Participatory', 'Environment'] },
      mini('Seed Exchange Wall', 'A community artwork where visitors swap seeds and stories.', 'Amara Diallo', 'Public art', [['Fabrication partner', 'Skill', 'Missing', 3000], ['Wall site', 'Venue', 'Missing', 1000], ['Materials funding', 'Funding', 'Missing', 4000]]),
    ),
    project(
      'p7', 'u2', 'Seeking support',
      { oneLiner: 'Outdoor screenings of short films about local trades.', discipline: 'Film', location: 'Manchester', stage: 'Planning', tags: ['Film', 'Heritage'] },
      mini('Courtyard Cinema', 'Outdoor screenings of short films about local trades.', 'Aiko Tanaka', 'Textile art', [['Projection equipment', 'Skill', 'Missing', 1800], ['Courtyard permission', 'Venue', 'Contacted', 500], ['Screening funding', 'Funding', 'Missing', 3500]], [{ id: 'c2', name: 'Mai Tran', role: 'Collaborator', discipline: 'Curation' }]),
    ),
    project(
      'p8', 'u3', 'Running',
      { oneLiner: 'A garden growing plants for natural dyes, tended by neighbours.', discipline: 'Community arts', location: 'Bristol', stage: 'Delivery', tags: ['Natural dye', 'Garden'] },
      withTasks(mini('Dye Garden Residency', 'A garden growing plants for natural dyes, tended by neighbours.', 'Daniel Okoye', 'Community education', [['Garden plot', 'Venue', 'Secured', 1200], ['Horticulture mentor', 'Expertise', 'Secured', 900], ['Garden funding', 'Funding', 'Secured', 8000, 8000]]), ['Done', 'In progress', 'To do']),
      [{ date: '2026-10-05', text: 'First harvest of madder root.' }],
    ),
    project(
      'p9', 'u4', 'Closed',
      { oneLiner: 'An exhibition of cities rebuilt from recycled paper.', discipline: 'Paper art', location: 'Edinburgh', stage: 'Completed', tags: ['Exhibition', 'Paper'] },
      withTasks(mini('Paper Cities', 'An exhibition of cities rebuilt from recycled paper.', 'Priya Nair', 'Curation', [['Gallery', 'Venue', 'Secured', 5000], ['Grant', 'Funding', 'Secured', 12000, 12000]]), ['Done', 'Done', 'Done', 'Done', 'Done', 'Done']),
      [{ date: '2026-05-20', text: 'Exhibition closed with 4,200 visitors.' }],
    ),
    project(
      'p10', 'u5', 'Running',
      { oneLiner: 'An oral-history audio trail along the river.', discipline: 'Sound art', location: 'Lisbon', stage: 'Delivery', tags: ['Audio', 'Heritage'] },
      withTasks(mini('River Voices', 'An oral-history audio trail along the river.', 'Ines Carvalho', 'Architecture', [['Audio producer', 'Skill', 'Secured', 2500], ['Trail partner', 'Venue', 'Secured', 800], ['Production funding', 'Funding', 'Partially funded', 7000, 4500]]), ['Done', 'Done', 'In progress', 'To do', 'To do']),
    ),
  ],
  supports: [
    { id: 'sp1', projectId: 'p1', byKind: 'sponsor', byId: 's2', kind: 'interest', message: 'We can provide fabric offcuts and would like to discuss a sponsorship credit.', status: 'Requested', date: '2026-10-20' },
    { id: 'sp2', projectId: 'p1', byKind: 'sponsor', byId: 's1', kind: 'in-kind', resourceId: 'r5', message: 'We can introduce a sustainability consultant from our network.', status: 'Requested', date: '2026-10-22' },
    { id: 'sp3', projectId: 'p8', byKind: 'sponsor', byId: 's1', kind: 'interest', message: 'Happy to support the garden for a second season.', status: 'Accepted', date: '2026-08-14' },
    { id: 'sp4', projectId: 'p10', byKind: 'sponsor', byId: 's2', kind: 'in-kind', resourceId: 'r2', message: 'Sponsoring audio equipment.', status: 'Accepted', date: '2026-07-02' },
    { id: 'sp5', projectId: 'p6', byKind: 'user', byId: 'u1', kind: 'interest', message: 'I can curate a launch event.', status: 'Accepted', date: '2026-09-10' },
  ],
  watchlist: [
    { sponsorId: 's1', projectId: 'p4' },
    { sponsorId: 's1', projectId: 'p6' },
  ],
  directory: seed.directory,
  consents: [],
  licences: [],
  marketIdeas: seed.marketIdeas,
  ideaRequests: [],
  notices: seed.notices,
}
