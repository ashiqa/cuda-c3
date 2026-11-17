import { demoPins } from './demo-data.mjs';
export { demoPins } from './demo-data.mjs';

const buildings = {
  hunt: ['Hunt Library', 'Library collections, reading areas, and study spaces.', ['hunt']],
  wean: ['Wean Hall', 'Engineering classrooms and Sorrells Library on floor 4.', ['wean', 'sorrells']],
  gates: ['Gates Hillman', 'Computer science classrooms, research, and collaboration spaces.', ['gates', 'hillman', 'ghc']],
  cohon: ['Cohon Center', 'Dining, recreation, and student gathering spaces.', ['cohon', 'cuc', 'university center']],
  baker: ['Baker Hall', 'Humanities classrooms, offices, and departmental spaces.', ['baker']],
  tepper: ['Tepper Quad', 'Business classrooms and collaboration spaces.', ['tepper']],
  cfa: ['College of Fine Arts', 'Art, design, architecture, music, and performance spaces.', ['cfa', 'fine arts']],
  porter: ['Porter Hall', 'Engineering classrooms and departmental spaces.', ['porter']],
  hamerschlag: ['Hamerschlag Hall', 'Engineering classrooms and research spaces.', ['hamerschlag']],
};
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (text, pattern) => pattern.test(text);
const buildingIn = text => Object.keys(buildings).find(id => buildings[id][2].some(alias => new RegExp(`\\b${alias}\\b`).test(text)));
const nameOf = id => buildings[id]?.[0] || id;
const contentOf = pin => normalize([pin.name, pin.details, ...(pin.tags || []), ...(pin.attributes || [])].join(' '));
const floorIn = text => {
  const match = text.match(/\b(?:floor\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*floor)\b/);
  return match ? Number(match[1] || match[2]) : undefined;
};
const kindIn = text => has(text, /\b(bathrooms?|restrooms?|toilets?|washrooms?|loo)\b/) ? 'bathroom'
  : has(text, /\b(print|printers?|printing|printouts?)\b/) ? 'printer'
  : has(text, /\b(robotics?|events?|happening|activities|something to do|things to do|talks?|workshops?|showcase)\b/) ? 'event'
  : has(text, /\b(food|eat|eating|hungry|lunch|dinner|coffee|cafes?|snacks?|pizza)\b/) ? 'food'
  : has(text, /\b(quiet|calm|crowds?|crowded|study|studying|libraries|library|read|reading|work|focus|seat|seats)\b/) ? 'study' : null;

export function searchPins(filters = {}, pins = demoPins) {
  const terms = normalize(filters.query).split(' ').filter(Boolean);
  return pins.filter(pin => (!filters.kind || pin.kind === filters.kind)
    && (!filters.buildingId || pin.buildingId === filters.buildingId)
    && (filters.floor === undefined || String(pin.floor) === String(filters.floor))
    && terms.every(term => contentOf(pin).includes(term)));
}

/** Pure query API: canonical pins and optional route/crowd providers are injected.
 * previousQuery and pendingDestination enable conversational follow-ups.
 */
export async function askAssistant(input, context = {}) {
  let text = normalize(input);
  const pins = context.pins ?? demoPins;
  const reply = (message, actions = [], results = [], extra = {}) => ({ text: message, actions, results, technique: 'Local intent matching', ...extra });
  if (!text) return reply('What would you like to find? Ask about a campus place, food, printing, events, or somewhere to study.');
  if (has(text, /\b(evac|evacuate|emergency|fire)\b/)) return reply('I cannot assess an emergency. Follow posted building instructions and directions from campus responders.');
  if (has(text, /^(hi|hello|hey|thanks|thank you)$/)) return reply(has(text, /thank/) ? 'You’re welcome! Where would you like to go next?' : 'Hi! I can help you find a study spot, printing, food, bathrooms, events, or a campus building. What are you looking for?');
  const routeRequest = has(text, /\b(routes?|navigate|directions?|getting|late|take me|go to|how (?:do|can) i get|walk to)\b/);
  const originalKind = kindIn(text);
  // Carry the previous category into a short location-only follow-up.
  if (!routeRequest && !originalKind && !context.pendingDestination && context.previousQuery && (buildingIn(text) || floorIn(text) !== undefined)) {
    const previousKind = kindIn(normalize(context.previousQuery));
    if (previousKind) text = `${text} ${previousKind}`;
  }
  const originMatch = text.match(/\bfrom\s+(.+?)(?=\s+to\b|$)/);
  const originId = buildingIn(originMatch?.[1] || '') || context.origin;
  const destinationText = originMatch ? text.replace(originMatch[0], '') : text;
  const buildingId = buildingIn(destinationText);
  const floor = floorIn(text);
  const calm = has(text, /\b(quiet|calm|crowds?|crowded)\b/);
  const rain = has(text, /\b(rain|raining|rainy)\b/);
  const actions = rain && !context.rain ? [{ type: 'set_scenario', payload: { rain: true } }] : [];
  const kind = kindIn(text);
  const routeFollowUp = context.pendingDestination && !originalKind && !routeRequest && buildingIn(text);
  if ((routeRequest && buildingId) || routeFollowUp) {
    const destination = routeFollowUp ? context.pendingDestination : { buildingId, ...(floor !== undefined ? { floor } : {}) };
    const origin = routeFollowUp ? buildingIn(text) : originId;
    const mode = routeFollowUp ? (context.pendingMode || 'fast') : calm ? 'calm' : 'fast';
    if (!origin) return reply(`I can help you get to ${nameOf(destination.buildingId)}${destination.floor !== undefined ? `, floor ${destination.floor}` : ''}. Where are you starting from? You can say “from Hunt”.`, [...actions, { type: 'fly_to', payload: destination }], [], { needsOrigin: true, destination, mode });
    if (!context.route) return reply(`${nameOf(destination.buildingId)}: ${buildings[destination.buildingId]?.[1] || 'Campus destination.'} Your starting point is ${nameOf(origin)}. Open the campus map to plan the walk; turn-by-turn directions aren’t connected here yet.`, [...actions, { type: 'fly_to', payload: destination }], [], { destination });
    try {
      const route = await context.route(origin, destination, { mode, stepFree: has(text, /\b(step free|wheelchair|accessible)\b/) });
      if (!route) throw Error('No route');
      return reply(`Here is the ${mode === 'calm' ? 'Calm' : 'Fast'} route from ${nameOf(origin)} to ${nameOf(destination.buildingId)}.`, [...actions, { type: 'draw_route', payload: { route } }], [], { destination });
    } catch { return reply('I could not calculate that route. Try another destination or starting point.'); }
  }
  if (!kind && buildingId) return reply(`${nameOf(buildingId)}: ${buildings[buildingId][1]} What would you like to find there?`, [{ type: 'fly_to', payload: { buildingId } }]);
  if (!kind) return reply('I didn’t catch the campus place or service you need. Try “Where can I print?”, “What events are happening?”, or “Find a quiet library”. For directions, include a destination such as “Take me to Gates”.');
  let results = searchPins({ kind, buildingId, floor }, pins);
  const topic = kind === 'event' ? ['robotics', 'design', 'games', 'music', 'art'].find(word => text.includes(word))
    : kind === 'food' ? ['coffee', 'pizza', 'snack'].find(word => text.includes(word)) : null;
  if (topic) results = results.filter(pin => contentOf(pin).includes(topic));
  if (kind === 'printer' && has(text, /\b(colour|color)\b/)) results = results.filter(pin => /\b(colour|color)\b/.test(contentOf(pin)));
  if (kind === 'study' && calm) {
    if (context.getCrowd) {
      try { results = await Promise.all(results.map(async pin => ({ ...pin, occupancy: (await context.getCrowd(pin.buildingId))?.occupancy }))); }
      catch { /* Keep useful place recommendations even when crowd data is unavailable. */ }
    }
    results.sort((a, b) => (a.occupancy ?? Infinity) - (b.occupancy ?? Infinity));
  }
  if (!results.length) {
    const alternatives = searchPins({ kind }, pins).slice(0, 3);
    return reply(`I couldn’t find ${topic ? `${topic} ` : ''}${kind === 'study' ? 'a study space' : `a ${kind}`}${buildingId ? ` in ${nameOf(buildingId)}` : ''}${floor !== undefined ? ` on floor ${floor}` : ''} matching that request.${alternatives.length ? ` Other options: ${alternatives.map(pin => `${pin.name} in ${nameOf(pin.buildingId)}`).join('; ')}.` : ' Try another service or building.'}`, actions);
  }
  results = results.slice(0, 4);
  const first = results[0];
  const location = `${nameOf(first.buildingId)}${first.floor !== undefined ? `, floor ${first.floor}` : ''}`;
  const detail = first.details || '';
  actions.push({ type: 'set_layer', payload: { layer: kind, visible: true } }, { type: 'fly_to', payload: { buildingId: first.buildingId, ...(first.floor !== undefined ? { floor: first.floor } : {}) } }, { type: 'highlight', payload: { pinIds: results.map(pin => pin.id) } }, { type: 'open_pin', payload: { pinId: first.id } });
  return reply(`${kind === 'study' ? 'Try' : 'I found'} ${first.name} — ${location}. ${detail}${has(text, /\b(closest|nearest)\b/) ? ' These are location matches; walking-distance estimates aren’t available yet.' : ''}`, actions, results);
}
