// Fictional fixtures for UI demos only. Not canonical campus facilities or events.
const fixtures = [
  { id: 'demo-robotics', kind: 'event', name: 'Robotics open studio', buildingId: 'gates', floor: 3, tags: ['robotics', 'technology'], details: 'Meet student builders and explore their robots. Sample event, not a real listing.' },
  { id: 'demo-design', kind: 'event', name: 'Design after hours', buildingId: 'baker', floor: 1, tags: ['design', 'art'], details: 'A fictional evening of sketching and exchanging ideas.' },
  { id: 'demo-robotics-talk', kind: 'event', name: 'Robotics lightning talks', buildingId: 'wean', floor: 5, tags: ['robotics', 'technology'], details: 'Five-minute research stories. Fictional event for discovery demos.' },
  { id: 'demo-games', kind: 'event', name: 'Board games on the quad', buildingId: 'tepper', floor: 1, tags: ['games', 'social'], details: 'A fictional casual game meetup; not a scheduled campus event.' },
  { id: 'demo-hunt-bathroom', kind: 'bathroom', name: 'Hunt Library restroom', buildingId: 'hunt', floor: 2, tags: ['restroom', 'bathroom'], details: 'Sample second-floor destination; location and accessibility are unverified.' },
  { id: 'demo-gates-bathroom', kind: 'bathroom', name: 'Gates restroom', buildingId: 'gates', floor: 3, tags: ['restroom', 'bathroom'], details: 'Fictional third-floor facility for testing building and floor filters.' },
  { id: 'demo-wean-bathroom', kind: 'bathroom', name: 'Wean restroom', buildingId: 'wean', floor: 4, tags: ['restroom', 'bathroom'], details: 'Sample facility; exact location and accessibility are unverified.' },
  { id: 'demo-cohon-bathroom', kind: 'bathroom', name: 'Cohon restroom', buildingId: 'cohon', floor: 1, tags: ['restroom', 'bathroom'], details: 'Fictional first-floor destination for discovery demos.' },
  { id: 'demo-wean-printer', kind: 'printer', name: 'Wean colour printer', buildingId: 'wean', floor: 4, tags: ['colour', 'color', 'print'], details: 'Sample colour-printing destination; availability is unverified.' },
  { id: 'demo-hunt-printer', kind: 'printer', name: 'Hunt colour printer', buildingId: 'hunt', floor: 1, tags: ['colour', 'color', 'print'], details: 'Fictional colour printer; no live queue or supply information.' },
  { id: 'demo-gates-printer', kind: 'printer', name: 'Gates monochrome printer', buildingId: 'gates', floor: 3, tags: ['monochrome', 'print'], details: 'Sample black-and-white printer; availability is unverified.' },
  { id: 'demo-baker-printer', kind: 'printer', name: 'Baker monochrome printer', buildingId: 'baker', floor: 1, tags: ['monochrome', 'print'], details: 'Fictional printing destination for building-filter tests.' },
  { id: 'demo-hunt-study', kind: 'study', name: 'Hunt Library study space', buildingId: 'hunt', floor: 2, tags: ['quiet', 'study', 'library'], details: 'A calmer alternative in the synthetic rain scenario.', occupancy: 57 },
  { id: 'demo-sorrells-study', kind: 'study', name: 'Sorrells Library', buildingId: 'wean', floor: 4, tags: ['study', 'library', 'sorrells'], details: 'Synthetic scenario: study demand rises during rain.', occupancy: 78 },
  { id: 'demo-baker-study', kind: 'study', name: 'Baker reading corner', buildingId: 'baker', floor: 2, tags: ['quiet', 'study', 'reading'], details: 'Fictional study nook with a synthetic occupancy estimate.', occupancy: 62 },
  { id: 'demo-tepper-study', kind: 'study', name: 'Tepper group tables', buildingId: 'tepper', floor: 1, tags: ['study', 'group'], details: 'Sample collaborative space; no seat reservations or live availability.', occupancy: 71 },
  { id: 'demo-cohon-food', kind: 'food', name: 'Cohon Center food stop', buildingId: 'cohon', floor: 1, tags: ['food', 'lunch', 'eat'], details: 'Sample dining destination; opening hours are unverified.' },
  { id: 'demo-gates-coffee', kind: 'food', name: 'Gates coffee corner', buildingId: 'gates', floor: 3, tags: ['food', 'coffee', 'eat'], details: 'Fictional coffee stop; no real menu or operating hours.' },
  { id: 'demo-tepper-lunch', kind: 'food', name: 'Tepper lunch table', buildingId: 'tepper', floor: 1, tags: ['food', 'lunch', 'eat'], details: 'Sample lunch destination for the assistant demo.' },
  { id: 'demo-hunt-snack', kind: 'food', name: 'Hunt study-break snacks', buildingId: 'hunt', floor: 1, tags: ['food', 'snack', 'eat'], details: 'Fictional snack stop; availability is unverified.' },
];

export const demoPins = fixtures.map(pin => ({ ...pin, dataStatus: 'synthetic' }));
