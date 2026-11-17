import { demoPins } from './demo-data.mjs';
export { demoPins } from './demo-data.mjs';

const buildingNames = { hunt: 'Hunt Library', wean: 'Wean Hall', gates: 'Gates Hillman', cohon: 'Cohon Center', baker: 'Baker Hall', tepper: 'Tepper Quad' };
const normalize = text => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const buildingIn = text => Object.keys(buildingNames).find(id => text.includes(id)) || (text.includes('sorrells') ? 'wean' : null);

export function searchPins(filters = {}, pins = demoPins) {
  const terms = normalize(filters.query || '').split(' ').filter(Boolean);
  return pins.filter(pin => (!filters.kind || pin.kind === filters.kind)
    && (!filters.buildingId || pin.buildingId === filters.buildingId)
    && (filters.floor === undefined || pin.floor === filters.floor)
    && (!terms.length || terms.every(term => normalize([pin.name, ...(pin.tags || [])].join(' ')).includes(term))));
}

/** Context accepts canonical pins, origin, rain, and optional async route/getCrowd.
 * All effects are returned as actions; this function never mutates the map.
 */
export async function askAssistant(input, context = {}) {
  const text = normalize(String(input || ''));
  const pins = context.pins ?? demoPins;
  const reply = (message, actions = [], results = [], extra = {}) => ({ text: message, actions, results, technique: 'Local intent matching', ...extra });
  if (!text) return reply('Try “robotics events”, “bathroom near Hunt”, or “a quiet place to study”.');
  if (/\b(evac|evacuate|emergency|fire)\b/.test(text)) return reply('This campus demo cannot assess an emergency. Follow posted building instructions and directions from campus responders.');
  const buildingId = buildingIn(text);
  const floorMatch = text.match(/\b(?:floor\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*floor)\b/);
  const floor = floorMatch ? Number(floorMatch[1] || floorMatch[2]) : undefined;
  const rain = /\b(rain|raining|rainy)\b/.test(text) || Boolean(context.rain);
  const calm = /\b(quiet|calm|crowd|crowds|crowded|study)\b/.test(text);
  const routeRequest = /\b(route|navigate|directions|getting|late|take me|go to)\b/.test(text);
  const stepFree = /\b(step free|wheelchair|accessible)\b/.test(text);
  let kind = /\b(bathroom|restroom|toilet)\b/.test(text) ? 'bathroom'
    : /\b(print|printer|printing)\b/.test(text) ? 'printer'
    : /\b(robotics|event|events|happening)\b/.test(text) ? 'event'
    : /\b(food|eat|lunch|dinner|coffee)\b/.test(text) ? 'food'
    : calm && !routeRequest ? 'study' : null;
  const actions = rain && !context.rain ? [{ type: 'set_scenario', payload: { rain: true } }] : [];
  if (routeRequest && buildingId && !kind) {
    const destination = { buildingId, ...(floor !== undefined ? { floor } : {}) };
    if (!context.origin) return reply(`Where are you starting from? I found ${buildingNames[buildingId]}${floor !== undefined ? `, floor ${floor}` : ''}. Choose a starting location to calculate a route.`, [{ type: 'fly_to', payload: destination }], [], { needsOrigin: true, destination });
    if (!context.route) return reply(`I found ${buildingNames[buildingId]}. Route calculation will be available when the navigation module is connected.`, [{ type: 'fly_to', payload: destination }]);
    try {
      const route = await context.route(context.origin, destination, { mode: calm ? 'calm' : 'fast', stepFree });
      if (!route) throw new Error('No route');
      return reply(`Here is the ${calm ? 'Calm' : 'Fast'} route to ${buildingNames[buildingId]}. ${stepFree ? 'Check the route provider’s accessibility verification before traveling.' : ''}`.trim(), [...actions, { type: 'draw_route', payload: { route } }]);
    } catch { return reply('I could not calculate that route. Try another destination or check the navigation connection.'); }
  }
  if (!kind) return reply('I can find events, bathrooms, printers, food, study spaces, and routes to campus buildings. Try one of the suggestions below.');
  let results = searchPins({ kind }, pins);
  if (kind === 'event' && text.includes('robotics')) results = results.filter(pin => normalize([pin.name, ...(pin.tags || [])].join(' ')).includes('robot'));
  if (kind === 'printer' && /\b(colour|color)\b/.test(text)) results = results.filter(pin => (pin.tags || []).some(tag => /^(colour|color)$/.test(tag)));
  // A building/floor constraint is exact; never invent a nearest-distance result.
  if (buildingId && kind !== 'study') results = results.filter(pin => pin.buildingId === buildingId);
  if (floor !== undefined && kind !== 'study') results = results.filter(pin => pin.floor === floor);
  if (kind === 'study') {
    try {
      results = await Promise.all(results.map(async pin => ({ ...pin, occupancy: context.getCrowd ? (await context.getCrowd(pin.buildingId))?.occupancy : pin.occupancy })));
    } catch { return reply('Crowd estimates are unavailable. Try searching for a library by name.'); }
    results.sort((a, b) => (a.occupancy ?? Infinity) - (b.occupancy ?? Infinity));
  }
  if (!results.length) return reply(`I don’t have a matching ${kind} in the available data${buildingId ? ` for ${buildingNames[buildingId]}` : ''}${floor !== undefined ? ` on floor ${floor}` : ''}. Try another building or a broader search.`, actions);
  const first = results[0];
  actions.push({ type: 'set_layer', payload: { layer: kind, visible: true } }, { type: 'fly_to', payload: { buildingId: first.buildingId, ...(first.floor !== undefined ? { floor: first.floor } : {}) } }, { type: 'highlight', payload: { pinIds: results.map(pin => pin.id) } }, { type: 'open_pin', payload: { pinId: first.id } });
  const synthetic = first.dataStatus === 'synthetic';
  return reply(`${kind === 'study' ? 'Try ' : 'I found '}${first.name}${first.floor !== undefined ? ` on floor ${first.floor}` : ''}.${kind === 'study' && first.occupancy !== undefined ? ` Estimated occupancy: ${first.occupancy}%.` : ''}${/\b(closest|nearest)\b/.test(text) ? ' This matches your location filter; distance ranking requires a connected route provider.' : ''}${synthetic ? ' This is a synthetic demo listing.' : ''}`, actions, results.slice(0, 4));
}
