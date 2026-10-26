import type { State, User } from './types'

export const demoUser: User = {
  id: 'u1',
  name: 'Mai Tran',
  email: 'mai@example.org',
  role: 'Curator',
  discipline: 'Curation',
  location: 'London',
  bio: 'Independent curator working with textiles and community programmes.',
  goals: ['Develop ideas', 'Find resources'],
  portfolio: [{ id: 'pf1', title: 'Threads of Memory (2024 group show)', url: 'https://example.org/threads' }],
}

const concept = `Every year, fashion and manufacturing discard tonnes of fabric. This project invites textile artists, a curator and a sustainability specialist to turn that waste into a large-scale installation and a community education programme.

Our direction: work with locally sourced offcuts, keep every material traceable, and make the process as visible as the finished work — through open studio days and workshops that teach repair and reuse.`

export const seed: State = {
  user: null,
  project: {
    title: 'Reimagining Textile Waste Through Art',
    tagline: 'An installation and community programme made from discarded fabric.',
    concept,
    directionAgreed: false,
    collaborators: [
      { id: 'c1', name: 'Mai Tran', role: 'Owner', discipline: 'Curator' },
      { id: 'c2', name: 'Aiko Tanaka', role: 'Editor', discipline: 'Textile artist' },
      { id: 'c3', name: 'Daniel Okoye', role: 'Collaborator', discipline: 'Community educator' },
      { id: 'c4', name: 'Priya Nair', role: 'Viewer', discipline: 'Advisor' },
    ],
    mood: [
      { id: 'm1', title: 'Salvaged denim', note: 'Faded indigo as a base palette', color: '#3b4a8c' },
      { id: 'm2', title: 'Visible mending', note: 'Sashiko stitching as a design language', color: '#c4663d' },
      { id: 'm3', title: 'Hanging forms', note: 'Suspended bundles, 6m tall in the atrium', color: '#5d7a49' },
      { id: 'm4', title: 'Dye bath', note: 'Natural dyes from kitchen waste', color: '#d3bc93' },
    ],
    frames: [
      { id: 'f1', caption: 'Visitors enter under a canopy of suspended offcuts' },
      { id: 'f2', caption: 'Central loom area where workshops take place' },
      { id: 'f3', caption: 'Wall of before/after repaired garments' },
    ],
    comments: [
      { id: 'k1', author: 'Mai Tran', text: 'Should the installation be one piece or three zones?', decision: false },
      { id: 'k2', author: 'Aiko Tanaka', text: 'Three zones lets us rotate materials. I can produce each in turn.', decision: false },
      { id: 'k3', author: 'Mai Tran', text: 'Decision: three zones — Gather, Transform, Reuse.', decision: true },
    ],
    versions: [
      { id: 'v1', label: 'v1 — first draft', date: '2026-09-02', concept: 'Textile waste as material for a single large installation.' },
      { id: 'v2', label: 'v2 — added education programme', date: '2026-09-18', concept: 'Textile waste as material for an installation plus workshops on repair and reuse.' },
    ],
  },
  resources: [
    { id: 'r1', name: 'Exhibition venue', type: 'Venue', status: 'Missing', budget: 6000, funded: 0 },
    { id: 'r2', name: 'Textile artist', type: 'Skill', status: 'Secured', budget: 4000, funded: 0 },
    { id: 'r3', name: 'Project curator', type: 'Skill', status: 'Secured', budget: 3500, funded: 0 },
    { id: 'r4', name: 'Production funding', type: 'Funding', status: 'Partially funded', budget: 18000, funded: 9000 },
    { id: 'r5', name: 'Sustainability consultant', type: 'Expertise', status: 'Missing', budget: 2500, funded: 0 },
  ],
  directory: [
    { id: 'e1', name: 'Creative Futures Fund', kind: 'Funding', tier: 'public', resourceType: 'Funding', discipline: 'Visual arts', location: 'United Kingdom', stage: 'Concept', expertise: 'Production grant', about: 'Grants for new work by independent artists. Rolling applications, decisions within 8 weeks.', amount: 10000 },
    { id: 'e2', name: 'Circular Arts Open Call', kind: 'Funding', tier: 'public', resourceType: 'Funding', discipline: 'Sustainability', location: 'Europe', stage: 'Planning', expertise: 'Open call', about: 'Open call for projects using reclaimed materials. Closes 30 November.', amount: 5000 },
    { id: 'e3', name: 'Green Culture Foundation', kind: 'Funding', tier: 'verified', resourceType: 'Funding', discipline: 'Sustainability', location: 'United Kingdom', stage: 'Planning', expertise: 'Foundation grant', about: 'Verified funder supporting climate-positive cultural programmes. Prefers partnerships with a venue.', amount: 8000, regions: ['United Kingdom', 'Ireland'], interests: ['Climate and culture', 'Circular materials'], collabTypes: ['Production grant', 'Co-funding with venue'] },
    { id: 'e4', name: 'Eastside Warehouse Gallery', kind: 'Organisation', tier: 'verified', resourceType: 'Venue', discipline: 'Visual arts', location: 'London', stage: 'Planning', expertise: 'Exhibition space, 400 m²', about: 'Verified gallery with double-height atrium and an education room. Open to co-produced shows.', amount: 5500, regions: ['London', 'South East England'], interests: ['Contemporary installation', 'Community education'], collabTypes: ['Co-production', 'Venue hire', 'Residency'] },
    { id: 'e5', name: 'Municipal Textile Museum', kind: 'Organisation', tier: 'public', resourceType: 'Venue', discipline: 'Textiles', location: 'Manchester', stage: 'Planning', expertise: 'Museum hall, archive access', about: 'Public museum with a textile archive. Hosts temporary community exhibitions.', amount: 4000 },
    { id: 'e6', name: 'Civic Hall Studio', kind: 'Organisation', tier: 'public', resourceType: 'Venue', discipline: 'Community arts', location: 'Bristol', stage: 'Concept', expertise: 'Multi-use hall', about: 'Low-cost hall for community-facing art projects and workshops.', amount: 2000 },
    { id: 'e7', name: 'Dr. Lena Okafor', kind: 'Person', tier: 'public', resourceType: 'Expertise', discipline: 'Sustainability', location: 'London', stage: 'Concept', expertise: 'Circular materials, waste audits', about: 'Sustainability consultant who has advised three arts organisations on material traceability.', amount: 2200 },
    { id: 'e8', name: 'Green Loop Consulting', kind: 'Organisation', tier: 'verified', resourceType: 'Expertise', discipline: 'Sustainability', location: 'Europe', stage: 'Planning', expertise: 'Impact reporting', about: 'Verified studio offering sustainability audits and impact reports for cultural projects.', amount: 3800, regions: ['Europe'], interests: ['Impact measurement', 'Circular economy'], collabTypes: ['Consultancy', 'Impact reporting'] },
    { id: 'e9', name: 'Marcus Reyes', kind: 'Person', tier: 'private', resourceType: 'Expertise', discipline: 'Materials science', location: 'London', stage: 'Concept', expertise: 'Fibre recycling', about: 'Materials scientist in a private network. Contact details are visible only with consent.', amount: 1500, contact: 'marcus.reyes@example.org' },
    { id: 'e10', name: 'Sofia Marin', kind: 'Person', tier: 'public', resourceType: 'Skill', discipline: 'Community arts', location: 'Bristol', stage: 'Concept', expertise: 'Workshop facilitation', about: 'Community educator with ten years of running repair and reuse workshops.', amount: 1800 },
    { id: 'e11', name: 'Helena Voss', kind: 'Person', tier: 'private', resourceType: 'Venue', discipline: 'Curation', location: 'London', stage: 'Planning', expertise: 'Venue introductions', about: 'Senior curator with a private network of venue directors. Introductions on request.', amount: 0, contact: 'helena.voss@example.org' },
    { id: 'e12', name: 'Yuki Aoki', kind: 'Person', tier: 'public', resourceType: 'Skill', discipline: 'Textiles', location: 'Manchester', stage: 'Concept', expertise: 'Natural dyeing', about: 'Textile artist specialising in natural dyes from food waste.', amount: 1200 },
    { id: 'e13', name: 'Alder Family Foundation', kind: 'Donor', tier: 'verified', resourceType: 'Funding', discipline: 'Sustainability', location: 'Europe', stage: 'Planning', expertise: 'Philanthropic foundation', about: 'Family foundation funding community-facing arts with an environmental angle. Multi-year partnerships considered.', amount: 15000, regions: ['Europe', 'United Kingdom'], interests: ['Circular economy', 'Community arts'], collabTypes: ['Production grant', 'Multi-year partnership'] },
    { id: 'e14', name: 'Margaret Whitcombe', kind: 'Donor', tier: 'private', resourceType: 'Funding', discipline: 'Visual arts', location: 'London', stage: 'Planning', expertise: 'Individual philanthropist', about: 'Private patron of contemporary textile art. Contact details are shared only with consent.', amount: 20000, contact: 'office@whitcombe.example.org' },
    { id: 'e15', name: 'Northline Textiles Co.', kind: 'Sponsor', tier: 'verified', resourceType: 'Funding', discipline: 'Textiles', location: 'Manchester', stage: 'Concept', expertise: 'Materials sponsorship', about: 'Fabric manufacturer offering offcuts and cash sponsorship in exchange for visible credit.', amount: 3000, regions: ['United Kingdom'], interests: ['Reuse of production waste'], collabTypes: ['Materials sponsorship', 'Cash sponsorship'] },
    { id: 'e16', name: 'Tomás Herrera', kind: 'Mentor', tier: 'public', resourceType: 'Expertise', discipline: 'Curation', location: 'Europe', stage: 'Concept', expertise: 'Curatorial mentoring', about: 'Independent curator mentoring early-stage exhibition projects.', amount: 800 },
  ],
  outreach: [],
  consents: [],
  plan: {
    generated: false,
    objectives: '',
    audience: '',
    outcomes: '',
    phases: [
      { id: 'p1', name: 'Research and material collection', startWeek: 0, weeks: 4 },
      { id: 'p2', name: 'Artist selection and production', startWeek: 3, weeks: 8 },
      { id: 'p3', name: 'Venue and partner confirmation', startWeek: 4, weeks: 6 },
      { id: 'p4', name: 'Exhibition installation', startWeek: 12, weeks: 3 },
      { id: 'p5', name: 'Public programme and workshops', startWeek: 15, weeks: 6 },
      { id: 'p6', name: 'Documentation and impact reporting', startWeek: 20, weeks: 4 },
    ],
    tasks: [],
    extraLines: [
      { id: 'b1', label: 'Materials and dyes', amount: 3000 },
      { id: 'b2', label: 'Public programme', amount: 3000 },
      { id: 'b3', label: 'Documentation', amount: 1500 },
    ],
  },
  trunk: [
    {
      id: 't1',
      title: 'Walking Archive of Lost Trades',
      summary: 'A mobile audio-and-object walk documenting disappearing local crafts. Not yet developed; looking for a sound artist.',
      stage: 'Concept',
      visibility: 'public',
      mode: 'collaboration',
      licence: { use: '', territory: '', term: '', attribution: '' },
      creator: 'Mai Tran',
      contributors: ['Mai Tran'],
      history: [{ date: '2026-08-11', text: 'Saved to Idea Trunk as public, open for collaboration' }],
    },
  ],
  campaign: null,
  proposals: [
    { id: 'pr1', trunkId: 't1', from: 'Jonas Weber (sound artist)', message: 'I would like to develop the audio layer and co-credit the work.', kind: 'collaboration', status: 'Pending' },
    { id: 'pr2', trunkId: 't1', from: 'Lumen Collective', message: 'We can prototype this as a pilot walk in our district.', kind: 'licence', status: 'Pending' },
  ],
  licences: [],
  marketIdeas: [
    { id: 'mi1', title: 'Tidal Library', summary: 'A floating reading room that rises and falls with the tide; storyboard and site study documented.', creator: 'Ines Carvalho', stage: 'Documented', mode: 'collaboration', fee: 0, docs: ['Concept', 'Storyboard'] },
    { id: 'mi2', title: 'Quiet Hours Festival', summary: 'A festival of low-sensory performances. Full programme and design documents available to license.', creator: 'Studio Hush', stage: 'Documented', mode: 'licensing', fee: 4000, docs: ['Concept', 'Proposal', 'Design documents'] },
    { id: 'mi3', title: 'Seed Exchange Wall', summary: 'A community artwork where visitors swap seeds and stories. Concept note and mood board.', creator: 'Amara Diallo', stage: 'Concept', mode: 'collaboration', fee: 0, docs: ['Concept'] },
  ],
  ideaRequests: [],
  notices: [
    { id: 'n1', text: 'Aiko Tanaka commented on "Three zones"', date: '2026-10-20', read: false },
    { id: 'n2', text: 'Daniel Okoye joined the project as Collaborator', date: '2026-10-19', read: false },
  ],
}
