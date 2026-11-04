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
    mk('u8', 'Kofi Mensah', 'Artist', 'Sound art', 'Accra', 'Field recordist and sound artist.'),
    mk('u9', 'Lucia Ferraro', 'Artist', 'Documentary photography', 'Naples', 'Documentary photographer and filmmaker.'),
  ]
}

function sponsors(): Sponsor[] {
  return [
    { id: 's1', name: 'Alder Family Foundation', email: 'grants@alder.example.org', type: 'Foundation', focus: ['Circular economy', 'Community arts'], regions: ['Europe', 'United Kingdom'], ticket: '$5,000 – $20,000', bio: 'Family foundation funding community-facing arts with an environmental angle.' },
    { id: 's2', name: 'Northline Textiles Co.', email: 'csr@northline.example.org', type: 'Company', focus: ['Reuse of production waste', 'Textiles'], regions: ['United Kingdom'], ticket: 'Materials and up to $3,000', bio: 'Fabric manufacturer offering offcuts and sponsorship in exchange for visible credit.' },
    { id: 's3', name: 'Margaret Whitcombe', email: 'office@whitcombe.example.org', type: 'Individual', focus: ['Contemporary textile art'], regions: ['London'], ticket: '$10,000+', bio: 'Private patron of contemporary textile art.' },
  ]
}


/** Type(s) and type-specific details for each demo project. Mandatory fields are filled. */
const TYPED: Record<string, { types: string[]; details: Record<string, unknown> }> = {
  p1: {
    types: ['installation', 'public'],
    details: {
      dimensions: '6 m × 4 m × 3 m per zone (three zones)',
      materials: ['Reclaimed textile offcuts', 'Natural dyes', 'Steel hanging frame'],
      siteRequirements: 'Double-height atrium with ceiling fixings and an adjoining room for workshops.',
      installDays: 5,
      site: 'Atrium of a host venue (to be confirmed)',
      permissionStatus: 'In discussion',
      communityPartners: ['Local schools', 'Repair cafés'],
      expectedParticipants: 200,
    },
  },
  p2: {
    types: ['residency'],
    details: { lengthWeeks: 26, cohortSize: 6, outcomes: 'Each weaver completes a body of work and leads a public workshop.', participantCriteria: 'Practising weavers living in or near London.' },
  },
  p3: {
    types: ['public'],
    details: { site: 'Streets and parks of central Bristol', permissionStatus: 'Granted', communityPartners: ['Residents associations'], expectedParticipants: 150 },
  },
  p4: {
    types: ['installation'],
    details: { dimensions: '12 m × 6 m floating platform', materials: ['Marine plywood', 'Recycled steel', 'Cork'], siteRequirements: 'Sheltered harbour berth with port authority permission.', installDays: 14 },
  },
  p5: {
    types: ['festival', 'performance'],
    details: {
      editionDates: 'Second weekend of May 2027',
      expectedAttendance: 1500,
      programmeOutline: 'Twelve low-sensory performances over three days with quiet rooms and relaxed screenings.',
      accessPlan: 'Step-free site, quiet spaces, visual guides and trained access staff.',
      durationMinutes: 60,
      castCrew: 25,
      audienceCapacity: 300,
      techNeeds: 'Dimmable lighting, low-volume PA, sensory-friendly staging.',
    },
  },
  p6: {
    types: ['public'],
    details: { site: 'Boundary wall of a community garden, London', permissionStatus: 'In discussion', communityPartners: ['Garden volunteers', 'Local library'], expectedParticipants: 500 },
  },
  p7: {
    types: ['film'],
    details: { runtimeMinutes: 40, format: 'Documentary', productionStage: 'Pre-production', treatment: 'A series of short portraits of local trades, screened outdoors in a courtyard.', rightsStatus: 'Original work' },
  },
  p8: {
    types: ['residency'],
    details: { lengthWeeks: 20, cohortSize: 12, outcomes: 'A working dye garden and a set of natural-dye workshops run by neighbours.', participantCriteria: 'Local residents, no experience needed.' },
  },
  p9: {
    types: ['exhibition'],
    details: { curatorialStatement: 'Cities rebuilt from recycled paper, asking what we keep and what we discard.', runDates: '3 Mar – 10 May 2026', venueRequirement: 'Gallery of at least 300 m²', artistCount: 9 },
  },
  p10: {
    types: ['public'],
    details: { site: 'River walk, Lisbon', permissionStatus: 'Granted', communityPartners: ['Riverside residents', 'Local archive'], expectedParticipants: 300 },
  },
  p11: {
    types: ['performance'],
    details: { durationMinutes: 75, castCrew: 14, audienceCapacity: 80, techNeeds: 'Waterproof field recorders, binaural headsets and a small flat-bottomed boat.' },
  },
  p12: {
    types: ['film'],
    details: { runtimeMinutes: 52, format: 'Documentary', productionStage: 'Shoot', treatment: 'Following three families through one olive harvest, told in their own voices.', rightsStatus: 'Original work' },
  },
  p13: {
    types: ['publication'],
    details: { pubFormat: 'Zine', pubLength: '96 pages', language: 'English and Yoruba', rightsHolder: 'Amara Diallo' },
  },
  p14: {
    types: ['festival'],
    details: { editionDates: 'First weekend of October 2027', expectedAttendance: 2500, programmeOutline: 'A city-wide open studio weekend with talks, demonstrations and a closing street party.', accessPlan: 'Printed and audio maps, step-free routes and a quiet hour each morning.' },
  },
  p15: {
    types: ['exhibition', 'installation'],
    details: {
      curatorialStatement: 'Fault lines asks how communities rebuild after upheaval, through six artists working with fractured materials.',
      runDates: '12 Sep – 22 Nov 2027',
      venueRequirement: 'Gallery of at least 400 m² with a double-height hall',
      artistCount: 6,
      dimensions: 'Central floor piece, 8 m × 8 m',
      materials: ['Broken ceramics', 'Gold lacquer', 'Steel'],
      siteRequirements: 'Reinforced floor and a clear 5 m ceiling height.',
      installDays: 10,
    },
  },
  p16: {
    types: ['residency'],
    details: { lengthWeeks: 12, cohortSize: 8, outcomes: 'Eight chefs and artists co-create a public supper series and a recipe zine.', participantCriteria: 'Emerging chefs and food artists based in Berlin.' },
  },
  p17: {
    types: ['public'],
    details: { site: 'Gable wall of a former mill, Manchester', permissionStatus: 'In discussion', communityPartners: ['Mill tenants association', 'Two local primary schools'], expectedParticipants: 1000 },
  },
  p18: {
    types: ['installation'],
    details: { dimensions: 'Ten kinetic sculptures, each about 2 m tall', materials: ['Recycled electronics', 'Motors', 'Salvaged wood'], siteRequirements: 'Indoor hall with power points.', installDays: 6 },
  },
  p19: { types: ['other'], details: {} },
}

function project(
  id: string,
  ownerId: string,
  status: ProjectStatus,
  meta: Pick<ProjectRecord, 'oneLiner' | 'discipline' | 'location' | 'stage' | 'tags'>,
  ws: Workspace,
  updates: ProjectRecord['updates'] = [],
): ProjectRecord {
  const t = TYPED[id] ?? { types: ['other'], details: {} }
  return { id, ownerId, status, listed: true, ...meta, updates, types: t.types, details: t.details, ws }
}

function mini(title: string, tagline: string, ownerName: string, discipline: string, resources: ResSpec[], team: Collaborator[] = []) {
  return emptyWorkspace({
    title,
    tagline,
    concept: `${tagline}\n\nThe project grew out of conversations with local makers and audiences about what is missing from the cultural calendar. The team has documented the concept, tested the core idea in a small way and mapped the skills, spaces and funding needed to deliver it properly. We are now looking for partners who share the ambition and can help turn the plan into a finished, accessible piece of work for the community.`,
    owner: { name: ownerName, discipline },
    resources,
    team,
  })
}

type Mood = [title: string, note: string, color: string]

/** A fuller demo project with a written concept and a mood board. */
function sample(opts: {
  title: string
  tagline: string
  concept: string
  owner: { name: string; discipline: string }
  resources: ResSpec[]
  mood?: Mood[]
  team?: Collaborator[]
}): Workspace {
  const ws = emptyWorkspace(opts)
  ws.project.mood = (opts.mood ?? []).map(([title, note, color], i) => ({ id: `m${i + 1}`, title, note, color }))
  return ws
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
    project(
      'p11', 'u8', 'Seeking support',
      { oneLiner: 'A walking sound performance across the tidal marshes at dawn.', discipline: 'Sound art', location: 'Accra', stage: 'Planning', tags: ['Sound', 'Landscape', 'Live'] },
      sample({
        title: 'Salt Marsh Chorus', tagline: 'A walking sound performance across the tidal marshes at dawn.',
        concept: 'Salt Marsh Chorus invites a small audience to walk the tidal marshes at first light while fourteen performers and a field of hidden speakers answer the landscape. Birdsong, tide and voices are recorded on site in the weeks before, then replayed and re-composed live. The project grew from three years of field recording with local fishers, and aims to make the marsh audible to the people who depend on it but rarely stop to listen.',
        owner: { name: 'Kofi Mensah', discipline: 'Sound art' },
        resources: [['Sound engineer', 'Skill', 'Missing', 2500], ['Boat and site access', 'Venue', 'Contacted', 1500], ['Production funding', 'Funding', 'Partially funded', 9000, 3000]],
        mood: [['Tide lines', 'Soft grey and silver horizon', '#8a9bb0'], ['Reed beds', 'Muted green and straw', '#8c9a5b'], ['First light', 'Pale gold over water', '#e3c27a']],
      }),
      [{ date: '2026-10-18', text: 'Completed the first week of field recordings.' }],
    ),
    project(
      'p12', 'u9', 'Seeking support',
      { oneLiner: 'A documentary following three families through one olive harvest.', discipline: 'Documentary film', location: 'Naples', stage: 'Delivery', tags: ['Documentary', 'Food', 'Family'] },
      sample({
        title: 'Hands of the Harvest', tagline: 'A documentary following three families through one olive harvest.',
        concept: 'Hands of the Harvest follows three families through a single olive harvest in the hills above Naples, from the first picking to the pressing. Shot over eight weeks, it listens to the people who carry the work, in their own words, as the climate and the market reshape a way of life older than the villages around it. We have filmed the first two weeks and need help to finish shooting and complete post-production.',
        owner: { name: 'Lucia Ferraro', discipline: 'Documentary photography' },
        resources: [['Sound recordist', 'Skill', 'Missing', 3000], ['Colourist and editor', 'Skill', 'Missing', 6000], ['Completion funding', 'Funding', 'Partially funded', 22000, 8000]],
        mood: [['Olive leaf', 'Silver green against blue sky', '#9aa78a'], ['Hands and tools', 'Warm close-ups, shallow focus', '#b98a5e'], ['Press room', 'Amber light, steel', '#c9a24d']],
      }),
    ),
    project(
      'p13', 'u7', 'Seeking support',
      { oneLiner: 'A bilingual zine collecting letters from the Niger Delta diaspora.', discipline: 'Publishing', location: 'London', stage: 'Concept', tags: ['Zine', 'Diaspora', 'Writing'] },
      sample({
        title: 'Letters from the Delta', tagline: 'A bilingual zine collecting letters from the Niger Delta diaspora.',
        concept: 'Letters from the Delta gathers handwritten and typed letters from people of the Niger Delta living abroad, written to a place, a person or a memory. Each letter appears in its original language alongside a translation, with illustrations commissioned from emerging artists. The 96-page zine will be printed in a small run, launched at a community evening, and archived online so the letters stay available to families and researchers.',
        owner: { name: 'Amara Diallo', discipline: 'Public art' },
        resources: [['Translator', 'Skill', 'Missing', 1800], ['Risograph printer', 'Venue', 'Missing', 2400], ['Printing funding', 'Funding', 'Missing', 4500]],
        mood: [['Airmail', 'Blue and red borders', '#5b78a6'], ['Handwriting', 'Ink on thin paper', '#3a3a3a']],
      }),
    ),
    project(
      'p14', 'u3', 'Seeking support',
      { oneLiner: 'A city-wide open studio weekend with demonstrations and a street party.', discipline: 'Community arts', location: 'Bristol', stage: 'Planning', tags: ['Festival', 'Studios', 'Open'] },
      sample({
        title: 'Open Studio Season', tagline: 'A city-wide open studio weekend with demonstrations and a street party.',
        concept: 'Open Studio Season opens the doors of over eighty studios across Bristol for one weekend each autumn. Visitors follow a printed and audio map between studios, watching makers at work, joining demonstrations and meeting the people behind the objects. The closing street party brings the neighbourhood together. This edition adds an accessible route, a quiet hour each morning and a micro-grant scheme for first-time participants.',
        owner: { name: 'Daniel Okoye', discipline: 'Community education' },
        resources: [['Festival producer', 'Skill', 'Missing', 5000], ['Street closure permits', 'Venue', 'Contacted', 1200], ['Festival funding', 'Funding', 'Partially funded', 30000, 12000]],
        mood: [['Studio doors', 'Hand-painted signs, bright colours', '#d9825b'], ['Map', 'Folded paper route map', '#e3c27a']],
      }),
    ),
    project(
      'p15', 'u4', 'Seeking support',
      { oneLiner: 'Six artists working with fractured materials to ask how communities rebuild.', discipline: 'Contemporary art', location: 'Edinburgh', stage: 'Documented', tags: ['Exhibition', 'Repair', 'Ceramics'] },
      sample({
        title: 'Fault Lines', tagline: 'Six artists working with fractured materials to ask how communities rebuild.',
        concept: 'Fault Lines brings six artists together to work with broken, cracked and repaired materials, from shattered ceramics mended with gold lacquer to steel that has buckled under load. The exhibition asks how communities rebuild after upheaval and what repair makes visible. A central floor piece anchors the show, surrounded by individual works, a reading room and a programme of conversations with people who have lived through rebuilding.',
        owner: { name: 'Priya Nair', discipline: 'Curation' },
        resources: [['Exhibition venue', 'Venue', 'Missing', 8000], ['Art handlers', 'Skill', 'Missing', 3500], ['Exhibition funding', 'Funding', 'Partially funded', 28000, 10000]],
        mood: [['Kintsugi', 'Gold seams through white porcelain', '#c9a24d'], ['Buckled steel', 'Cool grey, heavy shadow', '#6b7480'], ['Rubble', 'Dust and plaster tones', '#b8a58d']],
      }),
      [{ date: '2026-10-02', text: 'Four of the six artists are confirmed.' }],
    ),
    project(
      'p16', 'u6', 'Running',
      { oneLiner: 'Eight chefs and artists co-create a supper series and a recipe zine.', discipline: 'Food and performance', location: 'Berlin', stage: 'Delivery', tags: ['Residency', 'Food', 'Community'] },
      withTasks(sample({
        title: 'Midnight Kitchen Residency', tagline: 'Eight chefs and artists co-create a supper series and a recipe zine.',
        concept: 'Midnight Kitchen is a twelve-week residency in a borrowed restaurant kitchen where eight emerging chefs and food artists cook, test and perform new work after the evening service ends. Each week ends with a public supper where guests eat, talk and help shape the next dish. The residency culminates in a printed recipe zine documenting every experiment, shared freely with the neighbourhood and with future cohorts.',
        owner: { name: 'Studio Hush', discipline: 'Performance' },
        resources: [['Kitchen space', 'Venue', 'Secured', 3000], ['Mentor chefs', 'Expertise', 'Secured', 2000], ['Residency funding', 'Funding', 'Secured', 12000, 12000]],
        mood: [['Steam', 'Soft light through steam', '#d9d4c7'], ['Copper pans', 'Warm metal reflections', '#b87333']],
      }), ['Done', 'Done', 'In progress', 'To do']),
      [{ date: '2026-10-15', text: 'Week six supper sold out.' }],
    ),
    project(
      'p17', 'u2', 'Seeking support',
      { oneLiner: 'A giant mural painted by a thousand local hands on a former mill wall.', discipline: 'Public art', location: 'Manchester', stage: 'Planning', tags: ['Mural', 'Community', 'Heritage'] },
      sample({
        title: 'Mural of a Thousand Hands', tagline: 'A giant mural painted by a thousand local hands on a former mill wall.',
        concept: 'Mural of a Thousand Hands turns the gable wall of a former cotton mill into a community artwork painted by a thousand local people. Following a design workshop series with two primary schools and the mill tenants association, participants paint numbered sections of a pattern drawn from the mill’s textile archive. The finished mural will be revealed at a community day, with a guide for anyone wishing to repeat the method.',
        owner: { name: 'Aiko Tanaka', discipline: 'Textile art' },
        resources: [['Scaffolding and access', 'Venue', 'Missing', 4000], ['Mural paint and primer', 'Skill', 'Missing', 3000], ['Project funding', 'Funding', 'Partially funded', 14000, 5000]],
        mood: [['Cotton pattern', 'Repeating archive print', '#3b4a8c'], ['Brick', 'Weathered red wall', '#a8512e']],
      }),
    ),
    project(
      'p18', 'u8', 'Closed',
      { oneLiner: 'Ten kinetic sculptures built from recycled electronics.', discipline: 'Sculpture', location: 'Accra', stage: 'Completed', tags: ['Kinetic', 'Recycling', 'Technology'] },
      withTasks(sample({
        title: 'Silent Machines', tagline: 'Ten kinetic sculptures built from recycled electronics.',
        concept: 'Silent Machines is a set of ten kinetic sculptures built from salvaged electronics and motors, each moving slowly in response to the people around it. Built in a repair market workshop with local technicians, the sculptures ask what we owe to the machines we throw away. The exhibition ran for six weeks and the works were then donated to a school technology programme, with a short report published online.',
        owner: { name: 'Kofi Mensah', discipline: 'Sound art' },
        resources: [['Workshop access', 'Venue', 'Secured', 1500], ['Technicians', 'Skill', 'Secured', 2500], ['Grant', 'Funding', 'Secured', 8000, 8000]],
        mood: [['Circuit boards', 'Green boards and copper lines', '#4a7a5b'], ['Motors', 'Brushed steel and wire', '#7d868f']],
      }), ['Done', 'Done', 'Done', 'Done', 'Done', 'Done']),
      [{ date: '2026-07-15', text: 'Works donated to a school technology programme.' }],
    ),
    project(
      'p19', 'u9', 'Seeking support',
      { oneLiner: 'BUY CHEAP LUXURY WATCHES ONLINE!!! LIMITED OFFER CLICK NOW', discipline: 'Retail', location: 'Online', stage: 'Concept', tags: ['sale', 'discount'] },
      sample({
        title: 'Cheap Luxury Watches Gallery Sale',
        tagline: 'BUY CHEAP LUXURY WATCHES ONLINE!!! LIMITED OFFER CLICK NOW',
        concept: 'Get the best replica luxury watches at unbeatable prices, ship worldwide, 90 percent off, no questions asked. Visit our website now and enter the discount code to get free shipping. Limited offer ends today so click the link in the description and buy now before the stock runs out. Contact us on the messaging app for bulk orders and resellers, payment accepted by gift card only. This is a demo of a project that moderators should remove.',
        owner: { name: 'Lucia Ferraro', discipline: 'Documentary photography' },
        resources: [['Advertising budget', 'Funding', 'Missing', 5000]],
      }),
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
