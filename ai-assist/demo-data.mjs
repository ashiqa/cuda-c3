// Fictional fixtures for UI demos only. Not canonical campus facilities or events.
const fixtures = [
  { id: 'demo-robotics', kind: 'event', name: 'Robotics open studio', buildingId: 'gates', floor: 3, tags: ['robotics', 'technology'], details: 'Explore student-built robots and discuss sensing, controls, and autonomous systems with other builders.' },
  { id: 'demo-design', kind: 'event', name: 'Design after hours', buildingId: 'baker', floor: 1, tags: ['design', 'art'], details: 'Bring a sketchbook and trade feedback on works in progress with fellow designers.' },
  { id: 'demo-robotics-talk', kind: 'event', name: 'Robotics lightning talks', buildingId: 'wean', floor: 5, tags: ['robotics', 'technology'], details: 'Short presentations on robot perception, motion planning, and human–robot interaction.' },
  { id: 'demo-games', kind: 'event', name: 'Board games on the quad', buildingId: 'tepper', floor: 1, tags: ['games', 'social'], details: 'Meet other students for strategy games and casual play between classes.' },
  { id: 'demo-hunt-bathroom', kind: 'bathroom', name: 'Hunt Library restroom', buildingId: 'hunt', floor: 2, tags: ['restroom', 'bathroom'], details: 'Look for restroom signage near the second-floor library service areas.' },
  { id: 'demo-gates-bathroom', kind: 'bathroom', name: 'Gates restroom', buildingId: 'gates', floor: 3, tags: ['restroom', 'bathroom'], details: 'A restroom option near classroom and collaboration areas on floor 3.' },
  { id: 'demo-wean-bathroom', kind: 'bathroom', name: 'Wean restroom', buildingId: 'wean', floor: 4, tags: ['restroom', 'bathroom'], details: 'A restroom option on floor 4, convenient for a break while studying at Sorrells.' },
  { id: 'demo-cohon-bathroom', kind: 'bathroom', name: 'Cohon restroom', buildingId: 'cohon', floor: 1, tags: ['restroom', 'bathroom'], details: 'A first-floor option while visiting the student center.' },
  { id: 'demo-wean-printer', kind: 'printer', name: 'Wean colour printer', buildingId: 'wean', floor: 4, tags: ['colour', 'color', 'print'], details: 'Colour and black-and-white printing near Sorrells Library. Check your print settings before releasing a job.' },
  { id: 'demo-hunt-printer', kind: 'printer', name: 'Hunt colour printer', buildingId: 'hunt', floor: 1, tags: ['colour', 'color', 'print'], details: 'Printing near the study commons. Check the device options before submitting a colour job.' },
  { id: 'demo-gates-printer', kind: 'printer', name: 'Gates monochrome printer', buildingId: 'gates', floor: 3, tags: ['monochrome', 'print'], details: 'Black-and-white printing for lecture notes and assignments near collaboration spaces.' },
  { id: 'demo-baker-printer', kind: 'printer', name: 'Baker monochrome printer', buildingId: 'baker', floor: 1, tags: ['monochrome', 'print'], details: 'Black-and-white printing for handouts and coursework.' },
  { id: 'demo-hunt-study', kind: 'study', name: 'Hunt Library study space', buildingId: 'hunt', floor: 2, tags: ['quiet', 'study', 'library'], details: 'Reading tables and individual study spaces. A good starting point for focused work indoors.', occupancy: 57 },
  { id: 'demo-sorrells-study', kind: 'study', name: 'Sorrells Library', buildingId: 'wean', floor: 4, tags: ['study', 'library', 'sorrells'], details: 'Study close to engineering classrooms, library collections, and printing on Wean’s fourth floor.', occupancy: 78 },
  { id: 'demo-baker-study', kind: 'study', name: 'Baker reading corner', buildingId: 'baker', floor: 2, tags: ['quiet', 'study', 'reading'], details: 'A reading corner suited to reviewing notes between classes.', occupancy: 62 },
  { id: 'demo-tepper-study', kind: 'study', name: 'Tepper group tables', buildingId: 'tepper', floor: 1, tags: ['study', 'group'], details: 'Shared tables for discussing assignments and working with a small group.', occupancy: 71 },
  { id: 'demo-cohon-food', kind: 'food', name: 'Cohon Center food stop', buildingId: 'cohon', floor: 1, tags: ['food', 'lunch', 'eat'], details: 'Explore dining options in the student center, with tables nearby for a lunch break.' },
  { id: 'demo-gates-coffee', kind: 'food', name: 'Gates coffee corner', buildingId: 'gates', floor: 3, tags: ['food', 'coffee', 'eat'], details: 'A coffee break near computer science classrooms and collaboration spaces.' },
  { id: 'demo-tepper-lunch', kind: 'food', name: 'Tepper lunch table', buildingId: 'tepper', floor: 1, tags: ['food', 'lunch', 'eat'], details: 'A lunch stop near the business school and campus collaboration spaces.' },
  { id: 'demo-hunt-snack', kind: 'food', name: 'Hunt study-break snacks', buildingId: 'hunt', floor: 1, tags: ['food', 'snack', 'eat'], details: 'Take a short break from studying and look for nearby refreshments.' },
];

export const demoPins = fixtures.map(pin => ({ ...pin, dataStatus: 'synthetic' }));
